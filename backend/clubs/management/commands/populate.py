import requests
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from clubs.models import Badge, Club, Tag


clubs = [
    {
        "code": "pppjo",
        "name": "Penn Pre-Professional Juggling Organization",
        "description": """The PPPJO is looking for intense jugglers seeking to juggle their way to the top.
Come with your juggling equipment (and business formal attire) to
hone your skills in time for recruiting season!""",
        "image": "https://i.imgur.com/WwUKiHP.png",
        "active": True,
        "tags": [{"name": "Professional"}, {"name": "Athletics"}],
        "badges": [
            {"label": "Red Badge", "color": "ff0000"},
            {"label": "Green Badge", "color": "00ff00"},
            {"label": "Blue Badge", "color": "0000ff"},
        ],
    },
    {
        "code": "lorem-ipsum",
        "name": "Penn Lorem Ipsum Club",
        "description": """<i>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua.</i>""",
        "active": True,
        "image": "https://i.imgur.com/TOj74YQ.png",
    },
    {
        "code": "harvard-rejects",
        "name": "Harvard Rejects Club",
        "description": """We’re Penn’s largest club with over 20,000 active members!
We’re always looking for enthusiastic students to join our organization,
so please feel free to reach out to us at upenn.edu/harvard to join!""",
        "image": "https://i.imgur.com/IxgjBmA.png",
        "active": True,
        "tags": [{"name": "Professional"}, {"name": "Community Service"}],
    },
    {
        "code": "penn-wharton-transfers",
        "name": "Penn Wharton Transfers Club",
        "description": """Dual Degree and drop Engineering?
Internal Transfer from the college?
Drop out and re-apply as an MBA?
Whatever your path to Wharton-hood is, we want you (if you make it to round three)!""",
        "image": "https://i.imgur.com/nADYD8u.png",
        "active": False,
        "tags": [{"name": "Social"}],
    },
]


class Command(BaseCommand):
    help = "Populates the development environment with dummy data."

    def handle(self, *args, **kwargs):
        if not settings.DEBUG:
            raise CommandError("You probably do not want to run this script in production!")

        for info in clubs:
            partial = dict(info)
            custom_fields = ["code", "image", "tags", "badges"]
            for field in custom_fields:
                if field in partial:
                    del partial[field]
            club, _ = Club.objects.get_or_create(code=info["code"], defaults=partial)
            contents = requests.get(info["image"]).content
            club.image.save("image.png", ContentFile(contents))
            club.save()

            m2m_fields = [(Tag, "tags"), (Badge, "badges")]

            for obj, name in m2m_fields:
                if name in info:
                    for new_obj in info[name]:
                        new_obj, _ = obj.objects.get_or_create(**new_obj)
                        getattr(club, name).add(new_obj)
