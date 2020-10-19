import datetime

import requests
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from options.models import Option

from clubs.models import (
    Advisor,
    Badge,
    Club,
    Event,
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
        "email": "example@example.com",
        "active": True,
        "approved": True,
        "size": Club.SIZE_MEDIUM,
        "application_required": Club.APPLICATION_REQUIRED_SOME,
        "founded": "1984-01-01",
        "accepting_members": True,
        "enables_subscription": True,
        "tags": [{"name": "Professional"}, {"name": "Athletics"}, {"name": "Undergraduate"}],
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
        "tags": [{"name": "Undergraduate"}],
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
        "email": "penn.memes@gmail.com",
        "founded": "2019-01-01",
        "description": """We are exclusive to M&T students.""",
        "active": True,
        "approved": True,
        "image": "https://i.imgur.com/BkNWXlo.png",
        "tags": [{"name": "Greek Life"}, {"name": "Graduate"}],
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
        "tags": [
            {"name": "Professional"},
            {"name": "Community Service"},
            {"name": "Undergraduate"},
        ],
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
        "tags": [{"name": "Social"}, {"name": "Undergraduate"}],
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
        "tags": [{"name": "Social"}, {"name": "Undergraduate"}],
    },
    {
        "code": "long-club-with-a-very-long-club-name-that-goes-on-and-on-and-on",
        "name": "Club with a {}long club name".format("very " * 15),
        "description": "<p>{}</p><p> </p>".format("This is a very long description! " * 25) * 4,
        "active": True,
        "approved": True,
        "tags": [{"name": ("long " * 15) + "tag"}, {"name": "Undergraduate"}],
    },
    {
        "code": "empty-club",
        "name": "Empty Club",
        "description": "A club without any members.",
        "email": "example@example.com",
        "how_to_get_involved": """Anyone can join this club, just send us a membership request!
 See www.google.com for more details. Alternatively, contact example@example.com.""",
        "active": True,
        "approved": True,
        "tags": [{"name": "Professional"}, {"name": "Undergraduate"}],
    },
    {
        "code": "tac",
        "name": "Testing Activities Council",
        "description": "We are an umbrella organization for many of the clubs on campus.",
        "email": "tac@example.com",
        "active": True,
        "approved": True,
        "tags": [{"name": "Umbrella Organization"}, {"name": "Undergraduate"}],
    },
]


class Command(BaseCommand):
    help = "Populates the development environment with dummy data."

    def handle(self, *args, **kwargs):
        if Club.objects.filter(name="Penn Labs").exists():
            raise CommandError("You probably do not want to run this script in production!")

        # create options
        bool_options = ["FAIR_OPEN", "FAIR_REGISTRATION_OPEN", "CLUB_REGISTRATION", "PRE_FAIR"]
        for option in bool_options:
            Option.objects.get_or_create(
                key=option,
                defaults={"value": "false", "value_type": Option.TYPE_BOOL, "public": True},
            )

        string_options = [("FAIR_NAME", "sac")]
        for key, value in string_options:
            Option.objects.get_or_create(
                key=key, defaults={"value": value, "value_type": Option.TYPE_TXT, "public": True}
            )

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

        image_cache = {}

        def get_image(url):
            if url not in image_cache:
                contents = requests.get(url).content
                image_cache[url] = contents
            else:
                contents = image_cache[url]
            return contents

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
                contents = get_image(info["image"])
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

        # create badges
        badge, _ = Badge.objects.get_or_create(
            label="TAC", description="Testing Activities Council", org=Club.objects.get(code="tac")
        )

        # create additional clubs
        tag_undergrad, _ = Tag.objects.get_or_create(name="Undergraduate")
        tag_generic, _ = Tag.objects.get_or_create(name="Generic")

        for i in range(1, 50):
            club, _ = Club.objects.get_or_create(
                code="z-club-{}".format(i),
                defaults={
                    "name": "Z-Club {}".format(i),
                    "description": "This is a generic test club.",
                    "approved": True,
                    "active": True,
                },
            )

            Advisor.objects.create(
                club=club,
                name="John Doe",
                title="Faculty Advisor",
                email="example@example.com",
                phone="+12158985000",
                public=True,
            )

            club.tags.add(tag_undergrad)
            club.tags.add(tag_generic)
            club.badges.add(badge)

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
                obj.is_staff = True
                obj.save()
                user_objs.append(obj)

        # make ben franklin a superuser
        ben = user_objs[0]
        ben.is_superuser = True
        ben.is_staff = True
        ben.save()

        # create test events
        event_image_url = "https://i.imgur.com/IBCoKE3.jpg"
        now = timezone.now()

        for i, club in enumerate(Club.objects.all()[:20]):
            event, created = Event.objects.get_or_create(
                club=club,
                code="test-event-for-club-{}".format(club),
                defaults={
                    "creator": ben,
                    "name": f"Test Event for {club.name}",
                    "description": "This is the description for this event.",
                    "start_time": now,
                    "end_time": now,
                },
            )
            if created:
                contents = get_image(event_image_url)
                event.image.save("image.png", ContentFile(contents))
            if i <= 10:
                event.start_time = now + datetime.timedelta(days=1) + datetime.timedelta(hours=i)
            else:
                event.start_time = now - datetime.timedelta(minutes=1)
            event.end_time = event.start_time + datetime.timedelta(hours=1)
            event.save(update_fields=["start_time", "end_time"])

        # dismiss welcome prompt for all users
        Profile.objects.all().update(has_been_prompted=True)

        # add memberships
        count = 0
        for club in Club.objects.exclude(code="empty-club")[:50]:
            for obj in user_objs[:count]:
                Membership.objects.get_or_create(club=club, person=obj)
            first_mship = club.membership_set.first()
            if first_mship is not None:
                first_mship.role = Membership.ROLE_OWNER
                first_mship.save()
            count += 1

        self.stdout.write("Finished populating database!")
