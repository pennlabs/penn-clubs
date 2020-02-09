import requests
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError

from clubs.models import Badge, Club, Membership, Profile, Tag


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
        "code": "penn-memes",
        "name": "Penn Memes Club",
        "description": """We are exclusive to M&T students.""",
        "active": True,
        "image": "https://i.imgur.com/BkNWXlo.png",
        "tags": [{"name": "Greek Life"}],
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
    {
        "code": "pppp",
        "name": "Penn Program for Potential Procrastinators",
        "description": """Ever considered yourself a possible procrastinator,
but never actually were able to get the motivation to determine for sure?
Then join PPPP, Penn's premier potential procrastinating society! We are seeking
unmotivated individuals who, in theory, are interested in joining our group, but can't
quite get themselves to start working on our application. Start applying today so that
you can procrastinate on the application and ultimately miss the deadline!""",
        "active": True,
        "tags": [{"name": "Social"}],
    },
]


class Command(BaseCommand):
    help = "Populates the development environment with dummy data."

    def handle(self, *args, **kwargs):
        if Club.objects.filter(name="Penn Labs").exists():
            raise CommandError("You probably do not want to run this script in production!")

        # create clubs
        for info in clubs:
            partial = dict(info)
            custom_fields = ["code", "image", "tags", "badges"]
            for field in custom_fields:
                if field in partial:
                    del partial[field]
            club, _ = Club.objects.get_or_create(code=info["code"], defaults=partial)

            if "image" in info:
                contents = requests.get(info["image"]).content
                club.image.save("image.png", ContentFile(contents))
                club.save()

            m2m_fields = [(Tag, "tags"), (Badge, "badges")]

            for obj, name in m2m_fields:
                if name in info:
                    for new_obj in info[name]:
                        new_obj, _ = obj.objects.get_or_create(**new_obj)
                        getattr(club, name).add(new_obj)

        # create users
        count = 0
        schools = ["seas", "nursing", "wharton", "sas"]
        users = [
            "Benjamin Franklin",
            "George Washington",
            "John Adams",
            "Thomas Jefferson",
            "James Madison",
            "James Monroe",
            "John Quincy Adams",
            "Andrew Jackson",
        ]
        user_objs = []
        for user in users:
            first, last = user.split(" ", 1)
            username = "{}{}".format(first[0], last).lower()
            email = "{}@{}.upenn.edu".format(username, schools[count % len(schools)])
            count += 1
            User = get_user_model()
            if User.objects.filter(username=username).exists():
                user_objs.append(User.objects.get(username=username))
            else:
                obj = User.objects.create_user(username, email, "test")
                obj.first_name = first
                obj.last_name = last
                obj.save()
                user_objs.append(obj)

        # make ben franklin a superuser
        ben = user_objs[0]
        ben.is_superuser = True
        ben.is_staff = True
        ben.save()

        # dismiss welcome prompt
        Profile.objects.all().update(has_been_prompted=True)

        # add memberships
        count = 0
        for club in Club.objects.all():
            for obj in user_objs[:count]:
                Membership.objects.get_or_create(club=club, person=obj)
            count += 1
