import datetime

import pytz
import requests
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from options.models import Option

from clubs.models import (
    Advisor,
    ApplicationCommittee,
    ApplicationMultipleChoice,
    ApplicationQuestion,
    ApplicationSubmission,
    Badge,
    Cart,
    Club,
    ClubApplication,
    ClubFair,
    ClubFairRegistration,
    Event,
    EventShowing,
    Major,
    Membership,
    Profile,
    QuestionAnswer,
    School,
    StudentType,
    Tag,
    Testimonial,
    Ticket,
    Year,
)


clubs = [
    {
        "code": "pppjo",
        "name": "Penn Pre-Professional Juggling Organization",
        "description": """The PPPJO is looking for intense jugglers seeking to juggle
their way to the top. Come with your juggling equipment (and business formal attire) to
hone your skills in time for recruiting season!""",
        "image": "https://i.imgur.com/WwUKiHP.png",
        "email": "example@example.com",
        "active": True,
        "approved": True,
        "size": Club.SIZE_MEDIUM,
        "application_required": Club.OPEN_MEMBERSHIP,
        "recruiting_cycle": Club.RECRUITING_OPEN,
        "founded": "1984-01-01",
        "accepting_members": True,
        "enables_subscription": True,
        "tags": [
            {"name": "Professional"},
            {"name": "Athletics"},
            {"name": "Undergraduate"},
        ],
        "badges": [
            {
                "label": "Red Badge",
                "color": "ff0000",
                "visible": True,
                "purpose": "org",
            },
            {
                "label": "Green Badge",
                "color": "00ff00",
                "visible": True,
                "purpose": "org",
            },
            {
                "label": "Blue Badge",
                "color": "0000ff",
                "visible": True,
                "purpose": "org",
            },
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
                "answer": "Anything ranging from bowling pins to "
                "Husqvarna 455 Rancher chain saws!",
                "is_anonymous": True,
                "approved": True,
            },
            {
                "question": "What kind of legal liability does "
                "your club have for injuries?",
                "answer": None,
                "is_anonymous": False,
                "approved": False,
            },
        ],
    },
    {
        "code": "lorem-ipsum",
        "name": "Penn Lorem Ipsum Club",
        "description": """<i>Lorem ipsum dolor sit amet, consectetur adipiscing elit,
sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</i>""",
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
        "description": """We're Penn's largest club with over 20,000 active members!
We're always looking for enthusiastic students to join our organization,
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
        "description": "<p>{}</p><p> </p>".format(
            "This is a very long description! " * 25
        )
        * 4,
        "active": True,
        "approved": True,
        "tags": [{"name": ("long " * 15) + "tag"}, {"name": "Undergraduate"}],
    },
    {
        "code": "empty-club",
        "name": "Empty Club",
        "description": "A club without any members.",
        "email": "example@example.com",
        "how_to_get_involved": """Anyone can join this club, just send us a membership
request! See www.google.com for more details. Alternatively, contact
example@example.com.""",
        "active": True,
        "approved": True,
        "accepting_members": True,
        "tags": [{"name": "Professional"}, {"name": "Undergraduate"}],
    },
    {
        "code": "tac",
        "name": "Testing Activities Council",
        "description": "We are an umbrella organization "
        "for many of the clubs on campus.",
        "email": "tac@example.com",
        "active": True,
        "approved": True,
        "tags": [{"name": "Umbrella Organization"}, {"name": "Undergraduate"}],
    },
]

fair_registration_text = """
<p>
    Every year, the
    <a href="https://sacfunded.net/" target="_blank">
    Student Activities Council
    </a>
    hosts a Fall Activities Fair. This year, the SAC Fair will be held
    virtually during the first few days of school. In addition to Penn
    Clubs, which now has an anonymous Q &amp; A feature, clubs will be
    designated one of three days to host a live Zoom session for a
    couple of hours. All submitted zoom links will be featured on Penn
    Clubs.
</p>
<p>
    Like the in-person SAC Fair, clubs are encouraged to have a few
    members present on Zoom to introduce their club to prospective
    members and to answer questions.
</p>
<p>
    If you would like to particpate in the SAC fair, check
    the box below. If you check the box below, your club information
    will be shared with the Student Activites Council and more details
    will be sent to you at a later date.
</p>
<p>
    Note that this SAC Fair is for <b>Undergraduate Organizations</b>
    only. If you are not an undergraduate organization, please do not
    sign up for the SAC fair.
</p>
"""


class Command(BaseCommand):
    help = "Populates the development environment with dummy data."

    def handle(self, *args, **kwargs):
        if Club.objects.filter(name="Penn Labs").exists():
            raise CommandError(
                "You probably do not want to run this script in production!"
            )

        # create options
        bool_options = ["CLUB_REGISTRATION"]
        for option in bool_options:
            Option.objects.get_or_create(
                key=option,
                defaults={
                    "value": "false",
                    "value_type": Option.TYPE_BOOL,
                    "public": True,
                },
            )

        # create years
        [
            Year.objects.get_or_create(name=year)
            for year in ["Freshman", "Sophomore", "Junior", "Senior"]
        ]

        # create schools
        [
            School.objects.get_or_create(name=school, defaults={"is_graduate": False})
            for school in [
                "The Wharton School",
                "School of Engineering and Applied Science",
                "School of Nursing",
                "School of Arts & Sciences",
            ]
        ]

        School.objects.get_or_create(
            name="Perelman School of Medicine", defaults={"is_graduate": True}
        )

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
        existing = set(
            Major.objects.filter(name__in=major_names).values_list("name", flat=True)
        )
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
            label="TAC",
            description="Testing Activities Council",
            purpose="org",
            org=Club.objects.get(code="tac"),
            visible=True,
        )

        badge2, _ = Badge.objects.get_or_create(
            label="SAC",
            description="Student Activities Council",
            purpose="org",
            visible=True,
        )

        # create additional clubs
        tag_undergrad, _ = Tag.objects.get_or_create(name="Undergraduate")
        tag_generic, _ = Tag.objects.get_or_create(name="Generic")

        wharton_badge, _ = Badge.objects.get_or_create(
            label="Wharton Council",
            purpose="Dummy badge to mock Wharton-affiliated clubs",
            visible=True,
        )

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

            if 10 <= i <= 15:
                # Make some clubs Wharton-affiliated
                club.badges.add(wharton_badge)

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
                [
                    club.student_types.add(type)
                    for type in StudentType.objects.filter(id__lte=i)
                ]
            club.recruiting_cycle = Club.RECRUITING_CYCLES[
                (i - 1) % len(Club.RECRUITING_CYCLES)
            ][0]
            club.save()

            Advisor.objects.get_or_create(
                club=club,
                name="John Doe",
                title="Faculty Advisor",
                department="Accounting Department",
                email="example@example.com",
                phone="+12158985000",
                defaults={"visibility": Advisor.ADVISOR_VISIBILITY_STUDENTS},
            )

            club.tags.add(tag_undergrad)
            club.tags.add(tag_generic)
            club.badges.add(badge)
            club.badges.add(badge2)

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

        # test image files
        event_image_url = "https://i.imgur.com/IBCoKE3.jpg"
        profile_image_url = "https://i.imgur.com/xLGqpfN.png"

        # make ben franklin a superuser
        ben = user_objs[0]
        ben.is_superuser = True
        ben.is_staff = True
        ben.profile.image.save("ben.png", ContentFile(get_image(profile_image_url)))
        ben.profile.school.add(*School.objects.order_by("name")[:2])
        ben.profile.major.add(*Major.objects.order_by("name")[:3])
        ben.save()

        # create test events
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
            },
        )

        # Create a showing for the event
        EventShowing.objects.get_or_create(
            event=event,
            defaults={
                "start_time": now,
                "end_time": now + datetime.timedelta(hours=1),
            },
        )

        # create a global event for testing
        global_event, _ = Event.objects.get_or_create(
            club=None,
            code="test-global-event",
            defaults={
                "creator": ben,
                "name": "Test Global Event",
                "description": "This is a global event that "
                "does not belong to any club.",
            },
        )

        # Create a showing for the global event
        EventShowing.objects.get_or_create(
            event=global_event,
            defaults={
                "start_time": now + datetime.timedelta(days=1),
                "end_time": now
                + datetime.timedelta(days=1)
                + datetime.timedelta(hours=1),
            },
        )

        # create a club fair one month from now
        fair, _ = ClubFair.objects.update_or_create(
            name="Sample Fair",
            defaults={
                "organization": "Student Activities Council",
                "contact": "sac@sacfunded.net",
                "start_time": now + datetime.timedelta(days=30),
                "end_time": now + datetime.timedelta(days=33),
                "registration_end_time": now + datetime.timedelta(days=15),
                "information": """
<p>
    This information is shown to students participating in the fair!
    <b>Formatting is supported here!</b>
</p>
<p>
    This information is shown on the main fair page
    to students participating in the fair.
</p>""",
                "registration_information": """
<p>
    This information is shown when registering!
    Display registration information here.
    <b>Formatting is supported here!</b>
</p>
<p>
    Place additional registration instructions in this section.
    This section will only be visible to club officers registering for the fair.
</p>
"""
                + fair_registration_text,
            },
        )

        fair_cat_badge, _ = Badge.objects.get_or_create(
            label="General Category",
            purpose="fair",
            defaults={"description": "Grouping for Sample Fair", "fair": fair},
        )

        for club in Club.objects.filter(code__startswith="z-club-"):
            ClubFairRegistration.objects.get_or_create(
                fair=fair, registrant=ben, club=club
            )
            club.badges.add(fair_cat_badge)

        fair.create_events()

        # Create a special event with multiple showings
        multi_showing_club = Club.objects.get(code="pppjo")
        multi_showing_event, _ = Event.objects.get_or_create(
            club=multi_showing_club,
            code="multi-showing-event",
            defaults={
                "creator": ben,
                "name": "Multi-Showing Event",
                "description": "This event has multiple showings.",
            },
        )

        # Create multiple showings for the event on consecutive days
        for i in range(3):
            EventShowing.objects.get_or_create(
                event=multi_showing_event,
                start_time=now + datetime.timedelta(days=i),
                defaults={
                    "end_time": now + datetime.timedelta(days=i, hours=2),
                    "location": f"Location {i + 1}",
                },
            )

        if created:
            contents = get_image(event_image_url)
            event.image.save("image.png", ContentFile(contents))

        # create a club application
        club = Club.objects.get(code="empty-club")
        ClubApplication.objects.get_or_create(
            name="Test Application",
            club=club,
            defaults={
                "application_start_time": now - datetime.timedelta(weeks=10),
                "application_end_time": now - datetime.timedelta(weeks=9),
                "result_release_time": now - datetime.timedelta(weeks=8),
                "external_url": "https://pennclubs.com/",
            },
        )
        club = Club.objects.get(code="pppjo")
        ClubApplication.objects.get_or_create(
            name="Test Application",
            club=club,
            defaults={
                "application_start_time": now - datetime.timedelta(days=1),
                "application_end_time": now + datetime.timedelta(days=3),
                "result_release_time": now + datetime.timedelta(weeks=1),
                "external_url": "https://pennlabs.org/apply/",
            },
        )

        # create club applications that are wharton common app
        eastern = pytz.timezone("America/New_York")
        application_start_time = datetime.datetime(2021, 9, 4, 0, 0, tzinfo=eastern)
        application_end_time = datetime.datetime(2021, 11, 20, 2, 0, tzinfo=eastern)
        result_release_time = datetime.datetime(2021, 12, 4, 0, 0, tzinfo=eastern)
        prompt_one = (
            "Tell us about a time you took initiative or demonstrated leadership"
        )
        prompt_two = "Tell us about a time you faced a challenge and how you solved it"
        prompt_three = "Tell us about a time you collaborated well in a team"
        for code in ["pppjo", "harvard-rejects", "penn-memes"]:
            club = Club.objects.get(code=code)
            name = f"{club.name} Application"
            application = ClubApplication.objects.create(
                name=name,
                club=club,
                application_start_time=application_start_time,
                application_end_time=application_end_time,
                result_release_time=result_release_time,
                is_wharton_council=True,
            )
            link = (
                f"http://localhost:3000/club/{club.code}/application/{application.pk}"
            )
            application.external_url = link
            application.save()
            prompt = "Choose one of the following prompts for your personal statement"
            prompt_question = ApplicationQuestion.objects.create(
                question_type=ApplicationQuestion.MULTIPLE_CHOICE,
                application=application,
                prompt=prompt,
            )
            ApplicationMultipleChoice.objects.create(
                value=prompt_one, question=prompt_question
            )
            ApplicationMultipleChoice.objects.create(
                value=prompt_two, question=prompt_question
            )
            ApplicationMultipleChoice.objects.create(
                value=prompt_three, question=prompt_question
            )
            ApplicationQuestion.objects.create(
                question_type=ApplicationQuestion.FREE_RESPONSE,
                prompt="Answer the prompt you selected",
                word_limit=150,
                application=application,
            )

        application = ClubApplication.objects.last()
        ApplicationCommittee.objects.create(name="one", application=application)
        ApplicationCommittee.objects.create(name="two", application=application)
        ApplicationCommittee.objects.create(name="three", application=application)
        ApplicationCommittee.objects.create(name="four", application=application)
        status_counter = 0
        for user in get_user_model().objects.all():
            status = ApplicationSubmission.STATUS_TYPES[
                status_counter % len(ApplicationSubmission.STATUS_TYPES)
            ][0]
            ApplicationSubmission.objects.create(
                status=status,
                user=user,
                application=application,
                committee=None,
            )
            status_counter += 1
            for committee in application.committees.all():
                ApplicationSubmission.objects.create(
                    status=status,
                    user=user,
                    application=application,
                    committee=committee,
                )

        # 10am today
        even_base = now.replace(hour=14, minute=0, second=0, microsecond=0)

        # 2pm today
        odd_base = now.replace(hour=18, minute=0, second=0, microsecond=0)

        for j in range(-14, 15):
            for i, club in enumerate(Club.objects.all()[:10]):
                # When even we start at 10am and overlap,
                # when odd we start at 3pm and no overlap
                if j % 2 == 0:
                    start_time = (
                        even_base
                        + datetime.timedelta(days=j)
                        + datetime.timedelta(minutes=30 * i)
                    )
                    end_time = (
                        even_base
                        + datetime.timedelta(days=j)
                        + datetime.timedelta(hours=1, minutes=30 * i)
                    )
                else:
                    start_time = (
                        odd_base
                        + datetime.timedelta(days=j)
                        + datetime.timedelta(hours=i)
                    )
                    end_time = (
                        odd_base
                        + datetime.timedelta(days=j)
                        + datetime.timedelta(hours=i + 1)
                    )

                event, created = Event.objects.get_or_create(
                    club=club,
                    code="test-event-for-club-{}-{}".format(club, j),
                    defaults={
                        "creator": ben,
                        "name": f"Test Event #{j} for {club.name}",
                        "description": "This is the description for this event.",
                    },
                )

                # Create a showing for the event
                EventShowing.objects.get_or_create(
                    event=event,
                    defaults={
                        "start_time": start_time,
                        "end_time": end_time,
                    },
                )

                if created:
                    contents = get_image(event_image_url)
                    event.image.save("image.png", ContentFile(contents))

        # dismiss welcome prompt for all users
        Profile.objects.all().update(has_been_prompted=True)

        # add graduation years for half of the users
        prof_objs = Profile.objects.order_by("user__username")
        for i, obj in enumerate(prof_objs[: prof_objs.count() / 2]):
            obj.graduation_year = now.year + (i % 4)
            obj.save()

        # add memberships
        count = 0
        for club in Club.objects.exclude(code="empty-club")[:50]:
            for obj in user_objs[:count]:
                Membership.objects.get_or_create(
                    club=club,
                    person=obj,
                    defaults={"active": True, "public": count % 2 == 0},
                )
            first_mship = club.membership_set.first()
            if first_mship is not None:
                first_mship.role = Membership.ROLE_OWNER
                first_mship.save()
            count += 1

        # Add tickets
        hr = Club.objects.get(code="harvard-rejects")

        hr_events = Event.objects.filter(club=hr)

        for idx, event in enumerate(hr_events[:3]):
            # Get the first showing for this event
            showing = EventShowing.objects.filter(event=event).first()
            if not showing:
                # Create a showing if none exists
                showing = EventShowing.objects.create(
                    event=event,
                    start_time=now + datetime.timedelta(days=idx),
                    end_time=now + datetime.timedelta(days=idx, hours=2),
                )

            # Switch up person every so often
            person = ben if idx < 2 else user_objs[1]

            # Create some unowned tickets
            Ticket.objects.bulk_create(
                [
                    Ticket(showing=showing, type="Regular", price=10.10)
                    for _ in range(10)
                ]
            )

            Ticket.objects.bulk_create(
                [
                    Ticket(showing=showing, type="Premium", price=100.10)
                    for _ in range(5)
                ]
            )

            # Create some owned tickets and tickets in cart
            for i in range((idx + 1) * 10):
                if i % 5:
                    Ticket.objects.create(
                        showing=showing, owner=person, type="Regular", price=i
                    )
                else:
                    c, _ = Cart.objects.get_or_create(owner=person)
                    c.tickets.add(
                        Ticket.objects.create(showing=showing, type="Premium", price=i)
                    )

        self.stdout.write("Finished populating database!")
