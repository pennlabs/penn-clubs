import io
import logging
import re
from urllib.parse import urlparse

import bleach
import requests
from bs4 import BeautifulSoup, Comment, NavigableString
from django.conf import settings
from django.core.cache import caches
from django.core.cache.backends.base import BaseCache
from django.core.files.images import ImageFile
from django.db.models import CharField, F, Q, Value
from django.template.defaultfilters import slugify
from PIL import Image


logging.basicConfig()
logger = logging.getLogger(__name__)


def get_domain(request):
    """
    Return the current domain that the request is coming from,
    or the default domain specified in settings if this does not exist.
    """
    # make the beta/testing sites work
    domain = settings.DEFAULT_DOMAIN
    if request is not None:
        referer = request.META.get("HTTP_REFERER")
        if referer:
            host = urlparse(referer).netloc
            if host and host.endswith(domain):
                domain = host

    return domain


def html_to_text(html):
    """
    Cleans up HTML and converts into a text-only format,
    trying to preserve links and other objects.

    Removes any HTML comments in the text.

    Used for the text-only version of emails.
    """
    if html is None:
        return None

    def traverse(children):
        output = ""
        for child in children:
            # skip over html comments
            if isinstance(child, Comment):
                continue

            # format links, lists, and images
            if child.name:
                if child.name.startswith("h"):
                    continue
                elif child.name == "a":
                    if child.text.lower() == "here":
                        output += f"at {child['href']}"
                    else:
                        output += f"{child.text} ({child['href']})"
                    continue
                elif child.name in ["ol", "ul"]:
                    for item in child.children:
                        if item.name == "li":
                            output += f"- {traverse([item]).strip()}\n"
                        else:
                            output += traverse([item])
                    output += "\n"
                    continue
                elif child.name == "img":
                    if "alt" in child:
                        output += f"[{child['alt']}]"
                    continue

            # add strings and traverse children recursively
            if isinstance(child, NavigableString):
                text = re.sub(r"\n", r" ", str(child))
                output += re.sub(r"([\t ])[\t ]*", r"\1", text)
            elif child.children:
                child_contents = traverse(child.children)
                output += child_contents

            # add newlines for p and br elements
            if child.name == "p":
                output += "\n\n"
            if child.name == "br":
                output += "\n"
        return "\n".join(line.strip() for line in output.strip().split("\n"))

    soup = BeautifulSoup(html, "html.parser")
    return traverse(soup.children).strip()


# a list of allowed domains for embedding iframes
IFRAME_EMBED_ALLOWLIST = {
    "calendar.google.com",
    "docs.google.com",
    "drive.google.com",
    "facebook.com",
    "forms.gle",
    "google.com",
    "penniic.org",
    "streamable.com",
    "thedp.com",
    "twitframe.com",
    "xkcd.com",
    "youtube.com",
}


def allow_iframe(tag, name, value):
    if name in {"width", "height"}:
        return True
    if name == "src":
        parsed = urlparse(value)
        if not parsed.netloc:
            return False
        if parsed.scheme not in {"http", "https"}:
            return False
        domain = parsed.netloc
        if domain.startswith("www."):
            domain = domain[4:]
        if domain in IFRAME_EMBED_ALLOWLIST:
            return True
    return False


def clean(text):
    """
    Uses bleach to sanitize HTML input with a larger group of exceptions.
    """
    return bleach.clean(
        text,
        tags=bleach.sanitizer.ALLOWED_TAGS
        + [
            "br",
            "code",
            "del",
            "div",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "hr",
            "iframe",
            "img",
            "ins",
            "li",
            "ol",
            "p",
            "span",
            "sub",
            "sup",
            "u",
            "ul",
        ],
        attributes={
            **bleach.sanitizer.ALLOWED_ATTRIBUTES,
            **{"*": ["style"], "img": ["src", "alt"], "iframe": allow_iframe},
        },
        styles=["color", "background-color", "text-align", "font-size", "font-family"],
    )


def min_edit(s1, s2):
    """
    Return the Levenshtein distance between two strings.
    """
    if len(s1) > len(s2):
        s1, s2 = s2, s1
    distances = range(len(s1) + 1)
    for index2, char2 in enumerate(s2):
        newDistances = [index2 + 1]
        for index1, char1 in enumerate(s1):
            if char1 == char2:
                newDistances.append(distances[index1])
            else:
                newDistances.append(
                    1
                    + min((distances[index1], distances[index1 + 1], newDistances[-1]))
                )
        distances = newDistances
    return distances[-1]


def fuzzy_lookup_club(name):
    """
    Aggressively attempt to find a club matching the provided name.
    Returns None if the club with that name could not be found.
    """
    from clubs.models import Club

    name = name.strip()

    # empty string should match no club
    if not name:
        return None

    # lookup club by case insensitive name
    club = Club.objects.filter(name__iexact=name)
    if club.exists():
        # lookup club by case sensitive name
        if club.count() > 1:
            club = Club.objects.filter(name=name)
            if club:
                return club.first()
        else:
            return club.first()

    # lookup club by slug
    code = slugify(re.sub(r"\(.+?\)$", "", name).strip())
    club = Club.objects.filter(code=code)

    if club.count() == 1:
        return club.first()

    # lookup club by ampersand
    if "and" in name:
        mod_name = name.replace("and", "&")
        club = Club.objects.filter(name__icontains=mod_name)
        if club.exists():
            if club.count() == 1:
                return club.first()
            club = Club.objects.filter(name__iexact=mod_name)
            if club.exists():
                return club.first()

    if "&" in name:
        mod_name = name.replace("&", "and")
        club = Club.objects.filter(name__icontains=mod_name)
        if club.exists():
            if club.count() == 1:
                return club.first()
            club = Club.objects.filter(name__iexact=mod_name)
            if club.exists():
                return club.first()

    # lookup club by subtitle
    club = Club.objects.filter(subtitle__iexact=name)
    if club.exists():
        return min(club, key=lambda c: min_edit(c.name.lower(), name.lower()))

    # lookup club by subtitle contains
    club = Club.objects.filter(subtitle__icontains=name)
    if club.count() == 1:
        return club.first()

    # lookup by reverse subtitle contains
    club = (
        Club.objects.annotate(query=Value(name, output_field=CharField()))
        .filter(subtitle__iregex=".......")
        .filter(query__icontains=F("subtitle"))
    )
    if club.count() == 1:
        return club.first()

    # lookup club without dashes
    regex = "^{}$".format(
        re.escape(name.replace("-", " ").strip()).replace("\\ ", r"[\s-]")
    )
    club = Club.objects.filter(name__iregex=regex)
    if club.exists():
        return min(club, key=lambda c: min_edit(c.name.lower(), name.lower()))

    # lookup clubs without space considerations
    regex = r" ?".join(re.sub(r"\W+", "", name))
    club = Club.objects.filter(name__iregex=regex)
    if club.exists():
        return min(club, key=lambda c: min_edit(c.name.lower(), name.lower()))

    # strip out parentheses
    name = re.sub(r"\(.+?\)$", "", name).strip()
    club = Club.objects.filter(name__icontains=name)
    if club.exists():
        return min(club, key=lambda c: min_edit(c.name.lower(), name.lower()))

    # look up clubs with names inside the passed name
    club = Club.objects.annotate(query=Value(name, output_field=CharField())).filter(
        query__icontains=F("name")
    )

    if club.exists():
        return min(club, key=lambda c: min_edit(c.name.lower(), name.lower()))

    # strip out common words to see if we can get match
    modified_name = re.sub(r"university of pennsylvania", "", name, flags=re.I).strip()
    modified_name = re.sub(
        r"upenn|the|club|penn", "", modified_name, flags=re.I
    ).strip()
    club = Club.objects.filter(name__icontains=modified_name)

    if club.exists():
        return min(club, key=lambda c: min_edit(c.name.lower(), name.lower()))

    # try to get somewhat related club names and perform a distance comparison
    query = Q(pk__in=[])

    for word in name.split(" "):
        if word not in {"the", "of", "penn", "club"}:
            query |= Q(name__icontains=word.strip())

    close_clubs = Club.objects.filter(query)

    if close_clubs.exists():
        # try distance match unmodified
        clubs = [(min_edit(c.name.lower(), name.lower()), c) for c in close_clubs]
        distance, club = min(clubs, key=lambda x: x[0])
        if distance <= 2:
            return club

        # try distance match with removing prefix
        no_prefix_name = re.sub(r"^\w+\s?-", "", name, flags=re.I).strip().lower()
        clubs = [(min_edit(c.name.lower(), no_prefix_name), c) for c in close_clubs]
        distance, club = min(clubs, key=lambda x: x[0])
        if distance <= 2:
            return club

    return None


def resize_image(content, width=None, height=None):
    """
    Accepts a byte string representing an input image file.
    Returns a byte string representing the minified output image file.
    """
    img = Image.open(io.BytesIO(content))

    # ensure parameter is specified
    if height is None and width is None:
        raise ValueError(
            "You must specify either the maximum width or the maximum height!"
        )

    # preserve aspect ratio
    if height is not None:
        width = img.width * (height / img.height)
    elif width is not None:
        height = img.height * (width / img.width)

    # if image is already smaller, then don't bother resizing
    if img.width > width or img.height > height:
        img.thumbnail((width, height))

    # save final image
    with io.BytesIO() as output:
        img.convert("RGBA").save(output, format="PNG", optimize=True)
        return output.getvalue()


def get_django_minified_image(url, **kwargs):
    """
    Accepts a URL to an image and returns the minified ImageFile for that image.
    """
    resp = requests.get(url)
    new_image = resize_image(resp.content, **kwargs)
    return ImageFile(io.BytesIO(new_image), name="image.png")


class CacheManager:
    _cache = None
    _cache_fallback = None

    def __init__(self, *args, **kwargs):
        BaseCache.__init__(self, *args, **kwargs)
        self._cache = caches["main"]
        self._cache_fallback = caches["fallback"]

    def set(self, key, value, timeout=None):
        if timeout is None:
            timeout = self.default_timeout

        try:
            return self._cache.set(key, value, timeout)
        except Exception as e:
            logger.warning("Switching to fallback cache")
            logger.exception(e)
            return False

    def get(self, key, default=None):
        try:
            return self._cache.get(key, default)
        except Exception as e:
            logger.warning("Switching to fallback cache")
            logger.exception(e)
            return None

    def delete(self, key):
        try:
            return self._cache.delete(key)
        except Exception as e:
            logger.warning("Switching to fallback cache")
            logger.exception(e)
            return False

    def clear(self):
        try:
            return self._cache.clear()
        except Exception as e:
            logger.warning("Switching to fallback cache")
            logger.exception(e)
        finally:
            return None
