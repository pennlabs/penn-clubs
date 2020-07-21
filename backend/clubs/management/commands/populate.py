import requests
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError

from clubs.models import (
    Badge,
    Club,
    Major,
    Membership,
    Profile,
    QuestionAnswer,
    School,
    Tag,
    Testimonial,
    Year,
)


clubs = [
    {
        "code": "pppjo",
        "name": "Penn Pre-Professional Juggling Organization",
        "description": """The PPPJO is looking for intense jugglers seeking to juggle their way to the top.
Come with your juggling equipment (and business formal attire) to
hone your skills in time for recruiting season!""",
        "image": "https://i.imgur.com/WwUKiHP.png",
        "active": True,
        "approved": True,
        "size": Club.SIZE_MEDIUM,
        "application_required": Club.APPLICATION_REQUIRED_SOME,
        "founded": "1984-01-01",
        "accepting_members": True,
        "tags": [{"name": "Professional"}, {"name": "Athletics"}],
        "badges": [
            {"label": "Red Badge", "color": "ff0000"},
            {"label": "Green Badge", "color": "00ff00"},
            {"label": "Blue Badge", "color": "0000ff"},
        ],
        "testimonials": [
            {"text": "Great club!"},
            {"text": "Fantastic club!"},
            {"text": "Best club ever!"},
            {"text": "Don't start with the chainsaws!"},
        ],
        "questions": [
            {
                "question": "What kind of objects do you juggle?",
                "answer": "Anything ranging from bowling pins to Husqvarna 455 Rancher chain saws!",
                "is_anonymous": True,
                "approved": True,
            },
            {
                "question": "What kind of legal liability does your club have for injuries?",
                "answer": None,
                "is_anonymous": False,
                "approved": False,
            },
        ],
    },
    {
        "code": "lorem-ipsum",
        "name": "Penn Lorem Ipsum Club",
        "description": """<i>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua.</i>""",
        "founded": "2003-01-01",
        "size": Club.SIZE_LARGE,
        "active": True,
        "approved": True,
        "image": "https://i.imgur.com/TOj74YQ.png",
        "questions": [
            {
                "question": "Lorem ipsum dolor sit amet?",
                "answer": "Consectetur adipiscing elit!",
                "is_anonymous": False,
                "approved": True,
            }
        ],
    },
    {
        "code": "penn-memes",
        "name": "Penn Memes Club",
        "founded": "2019-01-01",
        "description": """We are exclusive to M&T students.""",
        "active": True,
        "approved": True,
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
        "approved": True,
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
        "approved": True,
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
        "approved": True,
        "tags": [{"name": "Social"}],
    },
    {
        "code": "long-club-with-a-very-long-club-name-that-goes-on-and-on-and-on",
        "name": "Club with a {}long club name".format("very " * 15),
        "description": "<p>{}</p><p> </p>".format("This is a very long description! " * 25) * 4,
        "active": True,
        "approved": True,
        "tags": [{"name": ("long " * 15) + "tag"}],
    },
    {
        "code": "empty-club",
        "name": "Empty Club",
        "description": "A club without any members.",
        "email": "example@example.com",
        "how_to_get_involved": "Anyone can join this club, just send us a membership request!",
        "active": True,
        "approved": True,
        "tags": [{"name": "Professional"}],
    },
]


class Command(BaseCommand):
    help = "Populates the development environment with dummy data."

    def handle(self, *args, **kwargs):
        if Club.objects.filter(name="Penn Labs").exists():
            raise CommandError("You probably do not want to run this script in production!")

        # create years
        [
            Year.objects.get_or_create(name=year)
            for year in ["Freshman", "Sophomore", "Junior", "Senior"]
        ]

        # create schools
        [
            School.objects.get_or_create(name=school)
            for school in [
                "The Wharton School",
                "School of Engineering and Applied Science",
                "School of Nursing",
                "School of Arts & Sciences",
            ]
        ]

        # create majors
        [
            Major.objects.get_or_create(name=major)
            for major in [
                "Computer Science",
                "Computer Engineering",
                "Digital Media Design",
                "Computer Engineering",
            ]
        ]

        # create clubs
        for info in clubs:
            partial = dict(info)
            custom_fields = [
                "code",
                "image",
                "tags",
                "badges",
                "testimonials",
                "questions",
            ]
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

            foreign_key_fields = [
                (Testimonial, "testimonials"),
                (QuestionAnswer, "questions"),
            ]
            for obj, name in foreign_key_fields:
                if name in info:
                    for new_obj in info[name]:
                        new_obj, _ = obj.objects.get_or_create(club=club, **new_obj)

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
            last = last.replace(" ", "")
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

        # dismiss welcome prompt for all users
        Profile.objects.all().update(has_been_prompted=True)

        # add memberships
        count = 0
        for club in Club.objects.exclude(code="empty-club")[:50]:
            for obj in user_objs[:count]:
                Membership.objects.get_or_create(club=club, person=obj)
            count += 1

        self.stdout.write("Finished populating database!")
