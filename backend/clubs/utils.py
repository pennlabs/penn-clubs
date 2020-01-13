import re

import bleach
from django.db.models import CharField, F, Q, Value

from clubs.models import Club


def clean(text):
    """
    Uses bleach to sanitize HTML input with a larger group of exceptions.
    """
    return bleach.clean(
        text,
        tags=bleach.sanitizer.ALLOWED_TAGS
        + [
            "sub",
            "sup",
            "p",
            "del",
            "ins",
            "span",
            "div",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "img",
            "u",
            "br",
            "hr",
        ],
        attributes={
            **bleach.sanitizer.ALLOWED_ATTRIBUTES,
            **{"*": ["style"], "img": ["src", "alt"]},
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
                    1 + min((distances[index1], distances[index1 + 1], newDistances[-1]))
                )
        distances = newDistances
    return distances[-1]


def fuzzy_lookup_club(name):
    """
    Aggressively attempt to find a club matching the provided name.
    Returns None if the club with that name could not be found.
    """
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

    # lookup club by subtitle
    club = Club.objects.filter(subtitle__iexact=name)
    if club.exists():
        return min(club, key=lambda c: min_edit(c.name.lower(), name.lower()))

    # lookup club by subtitle contains
    club = Club.objects.filter(subtitle__icontains=name)
    if club.count() == 1:
        return club.first()

    # lookup club without dashes
    regex = "^{}$".format(re.escape(name.replace("-", " ").strip()).replace("\\ ", r"[\s-]"))
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
    modified_name = re.sub(r"the|club|penn", "", modified_name, flags=re.I).strip()
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
