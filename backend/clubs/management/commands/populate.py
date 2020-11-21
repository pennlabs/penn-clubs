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
    StudentType,
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
        "application_required": Club.APPLICATION_AND_INTERVIEW,
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
        "address": "The Wharton School",
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
        major_names = [
            f"{prefix} {major}".strip()
            for major in [
                "Accounting",
                "Basket Weaving",
                "Biology",
                "Chemistry",
                "Computer Design",
                "Computer Engineering",
                "Computer Science",
                "Digital Media Design",
                "Finance",
                "Marketing",
                "Statistics",
            ]
            for prefix in [
                "",
                "Airborne",
                "Applied",
                "Atomic",
                "Fancy",
                "Nuclear",
                "Quantum",
                "Theoretical",
                "Underwater",
            ]
        ]
        existing = set(Major.objects.filter(name__in=major_names).values_list("name", flat=True))
        Major.objects.bulk_create(
            [Major(name=name) for name in major_names if name not in existing]
        )

        # create student types
        [
            StudentType.objects.get_or_create(name=types)
            for types in [
                "Transfer Student",
                "Full-Time Student",
                "Online Student",
                "International Student",
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
            club, created = Club.objects.get_or_create(
                code="z-club-{}".format(i),
                defaults={
                    "name": "Z-Club {}".format(i),
                    "description": "This is a generic test club.",
                    "approved": True,
                    "active": True,
                    "email": "example@example.com",
                },
            )

            if created:
                club.available_virtually = i % 2 == 0
                club.appointment_needed = i % 3 == 0
                club.signature_events = (
                    f"Z-Club {i} offers {i % 8 + 1} signature events every year."
                )

                for school in School.objects.all():
                    club.target_schools.add(school)

                for major in Major.objects.all():
                    club.target_majors.add(major)

                Testimonial.objects.bulk_create(
                    [
                        Testimonial(club=club, text=f"Z-Club {i} is a {adj} club!")
                        for adj in ["great", "fantastic", "awesome", "amazing"]
                    ]
                )

            if i < 5:
                [club.student_types.add(type) for type in StudentType.objects.filter(id__lte=i)]
            club.recruiting_cycle = Club.RECRUITING_CYCLES[(i - 1) % len(Club.RECRUITING_CYCLES)][0]
            club.save()

            Advisor.objects.get_or_create(
                club=club,
                name="John Doe",
                title="Faculty Advisor",
                department="Accounting Department",
                email="example@example.com",
                phone="+12158985000",
                defaults={"public": True},
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

        # Create an event for right now so cypress can test current events
        live_event_club = Club.objects.all()[0]
        event, created = Event.objects.get_or_create(
            club=live_event_club,
            code="test-event-for-club-now",
            defaults={
                "creator": ben,
                "name": f"Test Event now for {live_event_club.name}",
                "description": "This is the description for this event.",
                "start_time": now,
                "end_time": now + datetime.timedelta(hours=1),
            },
        )

        if created:
            contents = get_image(event_image_url)
            event.image.save("image.png", ContentFile(contents))

        # 10am today
        even_base = timezone.now().replace(hour=14, minute=0, second=0, microsecond=0)

        # 2pm today
        odd_base = timezone.now().replace(hour=18, minute=0, second=0, microsecond=0)

        for j in range(-14, 15):
            for i, club in enumerate(Club.objects.all()[:10]):
                # When even we start at 10am and overlap, when odd we start at 3pm and no overlap
                if j % 2 == 0:
                    start_time = (
                        even_base + datetime.timedelta(days=j) + datetime.timedelta(minutes=30 * i)
                    )
                    end_time = (
                        even_base
                        + datetime.timedelta(days=j)
                        + datetime.timedelta(hours=1, minutes=30 * i)
                    )
                else:
                    start_time = odd_base + datetime.timedelta(days=j) + datetime.timedelta(hours=i)
                    end_time = (
                        odd_base + datetime.timedelta(days=j) + datetime.timedelta(hours=i + 1)
                    )

                event, created = Event.objects.get_or_create(
                    club=club,
                    code="test-event-for-club-{}-{}".format(club, j),
                    defaults={
                        "creator": ben,
                        "name": f"Test Event #{j} for {club.name}",
                        "description": "This is the description for this event.",
                        "start_time": start_time,
                        "end_time": end_time,
                    },
                )

                if created:
                    contents = get_image(event_image_url)
                    event.image.save("image.png", ContentFile(contents))

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
