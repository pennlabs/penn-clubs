"""
Test management commands that are under the clubs app here.
These management commands can be executed with "./manage.py <command>".
"""

import csv
import datetime
import io
import os
import tempfile
import uuid
from unittest import mock

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core import mail
from django.core.cache import caches
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from django.test.utils import override_settings
from django.urls import reverse
from django.utils import timezone
from ics import Calendar
from ics import Event as ICSEvent

from clubs.models import (
    Club,
    ClubApplication,
    ClubFair,
    Event,
    EventGroup,
    Favorite,
    Membership,
    MembershipInvite,
    Subscribe,
    Tag,
    get_mail_type_annotation,
)
from clubs.utils import fuzzy_lookup_club


def mocked_requests_get(time):
    """
    Mock an ICS calendar http request with a single event,
    starting at the specified start time.
    """

    def fake_request(url, *args):
        class MockResponse:
            def __init__(self, content, status_code):
                self.text = content.serialize()
                self.status_code = status_code

            def text(self):
                return self.text

        cal = Calendar()
        event = ICSEvent()
        event.name = "A test event"
        event.description = "A test description"
        event.begin = time
        event.end = time + datetime.timedelta(minutes=60)
        cal.events.add(event)
        if url == "http://xyz.com/test.ics":
            return MockResponse(cal, 200)

        return MockResponse(None, 404)

    return fake_request


SAMPLE_ICS = """
BEGIN:VCALENDAR
PRODID:-//Mozilla.org/NONSGML Mozilla Calendar V1.1//EN
VERSION:2.0
BEGIN:VTIMEZONE
TZID:Europe/Berlin
X-LIC-LOCATION:Europe/Berlin
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
CREATED:20140107T092011Z
LAST-MODIFIED:20140107T121503Z
DTSTAMP:20140107T121503Z
UID:20f78720-d755-4de7-92e5-e41af487e4db
SUMMARY:Just a Test
DTSTART;TZID=Europe/Berlin:20140102T110000
DTEND;TZID=Europe/Berlin:20140102T120000
X-MOZ-GENERATION:4
DESCRIPTION:This is a sample \\n two line description file.
END:VEVENT
END:VCALENDAR
"""


class ImportCalendarTestCase(TestCase):
    def setUp(self):
        self.club1 = Club.objects.create(
            code="one",
            name="Club One",
            active=True,
            email="test@example.com",
            ics_import_url="http://xyz.com/test.ics",
        )

    def test_import_common_calendars(self):
        """
        Test importing a common standard ICS calendar from the internet.
        """
        self.club1.ics_import_url = "https://www.officeholidays.com/ics/usa"
        self.club1.save()

        call_command("import_calendar_events")

        self.assertGreaterEqual(self.club1.all_events.count(), 25)

    def test_import_nonstandard_ics(self):
        """
        Test importing a random nonstandard ICS file from
        a arbitrary file downloaded from the internet.
        """
        with mock.patch(
            "requests.get", return_value=mock.Mock(text=SAMPLE_ICS, status_code=200)
        ):
            call_command("import_calendar_events")

        ev_group = self.club1.event_groups.prefetch_related("events").first()

        self.assertIsNotNone(ev_group.events.first())
        self.assertEqual(ev_group.name, "Just a Test")

    def test_import_calendar_events(self):
        """
        Test importing a standard ICS file generated from the ICS python library.
        """
        # mock the ICS calendar http request
        now = timezone.now()
        with mock.patch("requests.get", side_effect=mocked_requests_get(now)) as m:
            call_command("import_calendar_events")

            m.assert_called_with(self.club1.ics_import_url)

        desired_group = self.club1.event_groups.prefetch_related("events").first()
        desired_event = desired_group.events.first()

        # ensure event exists with right values
        self.assertIsNotNone(desired_group)
        self.assertIsNotNone(desired_group.events.first())
        self.assertEqual(desired_group.name, "A test event")
        self.assertEqual(desired_group.description, "A test description")

        # ensure difference between calendar date and imported date is
        # less than one second
        self.assertLessEqual(
            abs(desired_event.start_time - now), datetime.timedelta(seconds=1)
        )
        self.assertLessEqual(
            desired_event.end_time - (now + datetime.timedelta(minutes=60)),
            datetime.timedelta(seconds=1),
        )

        # run the script again, make sure still only one event
        with mock.patch("requests.get", side_effect=mocked_requests_get(now)) as m:
            call_command("import_calendar_events")

            m.assert_called_with(self.club1.ics_import_url)

        # ensure that only one event exists
        self.assertEqual(self.club1.all_events.count(), 1)

        # screw up the uuid
        desired_event.ics_uuid = uuid.uuid4()

        # run the script again, make sure still only one event
        with mock.patch("requests.get", side_effect=mocked_requests_get(now)) as m:
            call_command("import_calendar_events")

            m.assert_called_with(self.club1.ics_import_url)

        # ensure that only one event exists
        self.assertEqual(self.club1.all_events.count(), 1)


class SendInvitesTestCase(TestCase):
    def setUp(self):
        self.club1 = Club.objects.create(
            code="one", name="Club One", active=True, email="test@example.com"
        )

        self.club2 = Club.objects.create(
            code="two", name="Club Two", active=True, email="test2@example.com"
        )

        self.club3 = Club.objects.create(
            code="three", name="Club Three", active=True, email="test3@example.com"
        )

        self.club4 = Club.objects.create(
            code="four", name="Club Four", active=False, email="test4@example.com"
        )

        self.user1 = get_user_model().objects.create_user(
            "bfranklin", "bfranklin@seas.upenn.edu", "test"
        )

        Membership.objects.create(
            club=self.club3, person=self.user1, role=Membership.ROLE_OWNER
        )

    def test_send_invites(self):
        with tempfile.TemporaryDirectory() as d:
            tmpname = os.path.join(d, "temp.csv")
            with open(tmpname, "w"):
                pass
            call_command("send_emails", "invite", tmpname)

        self.assertEqual(MembershipInvite.objects.count(), 2)
        self.assertEqual(
            list(MembershipInvite.objects.values_list("role", flat=True)),
            [Membership.ROLE_OWNER] * 2,
        )
        self.assertEqual(len(mail.outbox), 2)

        for msg in mail.outbox:
            self.assertIn("Penn Clubs", msg.body)
            self.assertTrue("one" in msg.body or "two" in msg.body)

    def test_send_fair(self):
        data = [
            ["Club One", "sheet1@example.com"],
            ["Club Two", "sheet2@example.com"],
            ["Club Three", "sheet3@example.com"],
        ]

        with tempfile.TemporaryDirectory() as d:
            tmpname = os.path.join(d, "temp.csv")
            with open(tmpname, "w") as f:
                writer = csv.writer(f)
                for row in data:
                    writer.writerow(row)

            call_command("send_emails", "physical_fair", tmpname, "--only-sheet")

        self.assertEqual(len(mail.outbox), 3)

    def test_send_hap_intro(self):
        data = [
            ["email", "name"],
            ["example@example.com", "Resource One"],
            ["example@example.com", "Resource Two"],
            ["example2@example.com", "Resource Three"],
        ]

        for template in {"hap_intro", "hap_intro_remind"}:
            old_count = len(mail.outbox)

            with tempfile.TemporaryDirectory() as d:
                tmpname = os.path.join(d, "temp.csv")
                with open(tmpname, "w") as f:
                    writer = csv.writer(f)
                    for row in data:
                        writer.writerow(row)
                with self.settings(BRANDING="fyh"):
                    call_command("send_emails", template, tmpname)

            self.assertEqual(len(mail.outbox), old_count + 2)

    def test_send_virtual_fair(self):
        now = timezone.now()
        fair = ClubFair.objects.create(
            name="Test Club Fair",
            organization="Activities Council",
            contact="example@example.com",
            registration_end_time=now - datetime.timedelta(10),
            start_time=now + datetime.timedelta(1),
            end_time=now + datetime.timedelta(3),
        )

        for club in Club.objects.filter(code__in=["one", "two", "three"]):
            fair.participating_clubs.add(club)

        # send initial virtual fair email
        call_command("send_emails", "virtual_fair")

        self.assertEqual(len(mail.outbox), 3)

        # send urgent fair reminder email
        call_command("send_emails", "urgent_virtual_fair")

        # test post fair email
        call_command("send_emails", "post_virtual_fair")

    def test_proper_annotations(self):
        """
        Ensure that all email templates have type annotation metadata.
        """
        bad_templates = []
        for site in ["clubs", "fyh"]:
            with self.settings(BRANDING=site):
                prefix = {"fyh": "fyh_emails"}.get(settings.BRANDING, "emails")
                path = os.path.join(settings.BASE_DIR, "templates", prefix)
                for file in os.listdir(path):
                    if file.endswith(".html"):
                        template_name = file.rsplit(".", 1)[0]
                        if get_mail_type_annotation(template_name) is None:
                            if template_name not in {"base"}:
                                bad_templates.append(f"{prefix}/{template_name}")

        if bad_templates:
            bad_templates = "\n".join(f" - {temp}" for temp in bad_templates)
            self.fail(
                "There are templates that do not have type annotations. \n"
                "Leaving out type annotations will cause issues with email previews. \n"
                "Please ensure that all templates below have type annotations: \n\n"
                f"{bad_templates}"
            )

    def test_daily_notifications(self):
        # add group and user for approval queue
        group, _ = Group.objects.get_or_create(name="Approvers")
        user = self.user1
        user.email = "test-approve-notif@example.com"
        user.save()
        group.user_set.add(user)

        # create some users for application notification
        user2 = get_user_model().objects.create_user(
            "tjefferson", "test-application-notif@example.com", "test"
        )

        user3 = get_user_model().objects.create_user(
            "jmadsion", "test-no-notif@example.com", "test"
        )
        user3.profile.graduation_year = 1999
        user3.profile.save()

        user4 = get_user_model().objects.create_user(
            "gwashington", "test-no-notif@example.com", "test"
        )
        Membership.objects.create(club=self.club1, person=user4)

        for usr in [user2, user3, user4]:
            Subscribe.objects.create(club=self.club1, person=usr)

        now = datetime.datetime(2021, 1, 5, 12, tzinfo=datetime.timezone.utc)

        ClubApplication.objects.create(
            name="Test Application",
            club=self.club1,
            application_start_time=now - datetime.timedelta(days=1),
            application_end_time=now + datetime.timedelta(days=3),
            result_release_time=now + datetime.timedelta(weeks=1),
            external_url="https://pennlabs.org/",
        )

        # ensure that there are some groups pending approval
        self.assertTrue(
            Club.objects.filter(approved__isnull=True, active=True).exists()
        )

        # ensure test runs on a weekday
        errors = io.StringIO()
        with mock.patch(
            "django.utils.timezone.now",
            return_value=now,
        ):
            with mock.patch("django.conf.settings.REAPPROVAL_QUEUE_OPEN", False):
                call_command("daily_notifications", stderr=errors)
            self.assertFalse(any(m.to == [self.user1.email] for m in mail.outbox))
            with mock.patch("django.conf.settings.REAPPROVAL_QUEUE_OPEN", True):
                call_command("daily_notifications", stderr=errors)
        # ensure approval email was sent out
        self.assertTrue(any(m.to == [self.user1.email] for m in mail.outbox))

        # ensure application email was sent out
        self.assertTrue(any(m.to == [user2.email] for m in mail.outbox))

        # ensure no unnecessary app emails were sent out
        self.assertFalse(any(m.to == [user3.email] for m in mail.outbox))

        # ensure no error messages are printed
        self.assertFalse(errors.getvalue())

    def test_fuzzy_lookup(self):
        # test failed matches
        self.assertFalse(fuzzy_lookup_club("Club Thirteen"))
        self.assertFalse(fuzzy_lookup_club(""))

        Club.objects.create(code="italian-1", name="Italians at Penn")
        Club.objects.create(code="italian-2", name="Penn Italian Community")
        Club.objects.create(code="italian-3", name="Penn Italian Club")

        # test exact club name
        for name, code in Club.objects.all().values_list("name", "code"):
            self.assertEqual(fuzzy_lookup_club(name).code, code)

        # closest match should be one of three
        self.assertIn(
            fuzzy_lookup_club("italian").code, ["italian-1", "italian-2", "italian-3"]
        )

        # test partial club name
        Club.objects.create(
            code="league", name="University of Pennsylvania League of Legends Club"
        )
        self.assertEqual(fuzzy_lookup_club("league of legends").code, "league")

        # test partial match both strings
        Club.objects.create(code="counterparts", name="Counterparts A Cappella")
        self.assertEqual(fuzzy_lookup_club("Penn Counterparts").code, "counterparts")

        # test remove prefix
        Club.objects.create(code="pasa", name="Penn African Student Association")
        self.assertEqual(
            fuzzy_lookup_club("PASA - Penn African Students Association").code, "pasa"
        )

        # don't overmatch on suffix
        Club.objects.create(code="dental-1", name="Indian Students Dental Association")
        self.assertFalse(fuzzy_lookup_club("Korean Students Dental Association"))

        # don't overmatch on keywords
        Club.objects.create(code="dental-2", name="Arab Student Society")
        self.assertFalse(fuzzy_lookup_club("Arab Student Dental Society"))

        # don't overmatch on prefix
        Club.objects.create(code="dental-3", name="Chinese Students Association")
        self.assertFalse(fuzzy_lookup_club("Chinese Christian Fellowship"))

        # ensure subtitle matching works
        subtitle = "Penn Asian American Graduate Student Association"
        Club.objects.create(code="dental-4", name="PAAGSA", subtitle=subtitle)
        self.assertEqual(fuzzy_lookup_club(subtitle).code, "dental-4")

        # ensure dashes don't matter
        Club.objects.create(code="dental-5", name="Penn In Hand")
        self.assertEqual(fuzzy_lookup_club("Penn-In-Hand").code, "dental-5")

        # more advanced tests for dashes
        Club.objects.create(code="dental-6", name="Penn-In Face")
        self.assertEqual(fuzzy_lookup_club("Penn In-Face").code, "dental-6")


class SendReminderTestCase(TestCase):
    def setUp(self):
        self.club1 = Club.objects.create(
            code="one", name="Club One", email="one@example.com", active=True
        )
        self.club2 = Club.objects.create(
            code="two", name="Club Two", email="two@example.com", active=True
        )

        self.user1 = get_user_model().objects.create_user(
            "bfranklin", "bfranklin@seas.upenn.edu", "test"
        )

        Membership.objects.create(
            club=self.club1, person=self.user1, role=Membership.ROLE_OWNER
        )

    def test_send_reminders(self):
        call_command("remind")

        # ensure one update email is sent out and one owner invite is created
        self.assertEqual(MembershipInvite.objects.count(), 1)
        self.assertEqual(len(mail.outbox), 2)

        for msg in mail.outbox:
            self.assertIn("Penn Clubs", msg.body)


class PopulateTestCase(TestCase):
    def test_populate(self):
        # populate database with test data
        call_command("populate")

        # make sure script can handle duplicate runs
        call_command("populate")

        # ensure objects are created
        self.assertNotEqual(Club.objects.all().count(), 0)
        self.assertNotEqual(Tag.objects.all().count(), 0)

        # ensure ranking works properly
        call_command("rank")


class RankTestCase(TestCase):
    def test_rank(self):
        # create some clubs
        Club.objects.bulk_create(
            [
                Club(
                    code=f"club-{i}",
                    name=f"Test Club #{i}",
                    description="This is a sentence. " * i,
                    active=True,
                    subtitle="This is a subtitle.",
                )
                for i in range(1, 101)
            ]
        )

        # create some tags
        tag1 = Tag.objects.create(name="Undergraduate")
        tag2 = Tag.objects.create(name="Graduate")
        tag3 = Tag.objects.create(name="Professional")

        # add objects to club
        for club in Club.objects.all()[:10]:
            club.tags.add(tag1)
            club.tags.add(tag2)
            club.tags.add(tag3)

        now = timezone.now()

        # add an event
        EventGroup.objects.create(
            code="test-event-1",
            name="Test Event 1",
            club=Club.objects.first(),
            description="This is a test event!",
        )
        Event.objects.create(
            code="test-event-1-1",
            start_time=now,
            end_time=now + datetime.timedelta(hours=2),
        )

        # run the rank command
        call_command("rank")

        for club in Club.objects.all():
            self.assertGreater(club.rank, 0)


class RenewalTestCase(TestCase):
    def test_renewal(self):
        # populate database with test data
        with open(os.devnull, "w") as f:
            call_command("populate", stdout=f)

        # run deactivate script
        call_command("deactivate", "all", "--force")

        # ensure all clubs are deactivated
        active_statuses = Club.objects.all().values_list("active", flat=True)
        self.assertFalse(any(active_statuses))

        # ensure all clubs have approval removed
        approval_statuses = Club.objects.all().values_list("approved", flat=True)
        self.assertFalse(any(approval_statuses))

        # ensure emails are sent out
        self.assertGreater(len(mail.outbox), 0)

        # ensure correct number of emails were sent
        clubs_with_emails = 0
        for club in Club.objects.all():
            if club.email:
                clubs_with_emails += 1
                continue

            if club.membership_set.filter(role__lte=Membership.ROLE_OFFICER).exists():
                clubs_with_emails += 1

        self.assertGreaterEqual(len(mail.outbox), clubs_with_emails)

        # for at least one of the emails, there are multiple recipients
        for email in mail.outbox:
            tos = email.to
            self.assertIsInstance(tos, list)
            for to in tos:
                self.assertIsInstance(to, str)
            if len(tos) > 1:
                break
        else:
            self.fail(
                "Expected there to be an email with more than one recipient, "
                "but did not exist!"
            )

        # send out reminder emails
        current_email_count = len(mail.outbox)

        call_command("deactivate", "remind", "--force")

        self.assertGreater(len(mail.outbox), current_email_count)

    @override_settings(
        CACHES={  # don't want to clear prod cache while testing
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            }
        }
    )
    def test_deactivate_invalidates_cache(self):
        # Clear the cache before starting the test
        caches["default"].clear()

        with open(os.devnull, "w") as f:
            call_command("populate", stdout=f)

        club = Club.objects.first()

        # make request to the club detail view to cache it
        self.client.get(reverse("clubs-detail", args=(club.code,)))

        # club should now be cached
        cache_key = f"clubs:{club.id}-anon"
        self.assertIsNotNone(caches["default"].get(cache_key))

        call_command("deactivate", "all", "--force")

        # club should no longer be cached
        self.assertIsNone(caches["default"].get(cache_key))

        # club should be deactivated and inactive
        club.refresh_from_db()
        self.assertFalse(club.active)
        self.assertIsNone(club.approved)


class MergeDuplicatesTestCase(TestCase):
    def setUp(self):
        self.tag1 = Tag.objects.create(name="One")
        self.tag2 = Tag.objects.create(name="Two")

        self.club1 = Club.objects.create(code="one", name="Same Name", active=False)
        self.club1.tags.add(self.tag1)
        self.club2 = Club.objects.create(
            code="two", name="Same Name", github="https://github.com/pennlabs/"
        )
        self.club2.tags.add(self.tag2)

        self.user1 = get_user_model().objects.create_user(
            "bfranklin", "bfranklin@seas.upenn.edu", "test"
        )

        Favorite.objects.create(person=self.user1, club=self.club1)

        Favorite.objects.create(person=self.user1, club=self.club2)

    def test_merge_duplicates_auto(self):
        """
        Test merging duplicates in automatic mode.
        """
        call_command("merge_duplicates", "--auto")

        self.assertEqual(Club.objects.count(), 1)
        self.assertEqual(Club.objects.first().tags.count(), 2)
        self.assertTrue(Club.objects.first().github)

    def test_merge_duplicate_clubs(self):
        """
        Test merging duplicate clubs.
        """
        call_command("merge_duplicates", "one", "two")

        self.assertEqual(Club.objects.count(), 1)
        self.assertEqual(Club.objects.first().tags.count(), 2)
        self.assertTrue(Club.objects.first().github)

        self.assertEqual(Favorite.objects.count(), 1)

    def test_merge_duplicate_tags(self):
        """
        Test merging duplicate tags.
        """
        call_command("merge_duplicates", "--tag", "One", "Two")

        self.assertEqual(Tag.objects.count(), 1)

    def test_wrong_arguments(self):
        """
        Test with wrong number of arguments.
        """

        with self.assertRaises(CommandError):
            call_command("merge_duplicates")

        with self.assertRaises(CommandError):
            call_command("merge_duplicates", "--tag")


class ExpireMembershipInvitesTest(TestCase):
    def setUp(self):
        # Create users
        self.user1 = get_user_model().objects.create_user(
            "bfranklin", "bfranklin@seas.upenn.edu", "test"
        )
        self.user2 = get_user_model().objects.create_user(
            "tjefferson", "test-application-notif@example.com", "test"
        )

        # Create club1
        self.club1 = Club.objects.create(
            code="one", name="Club One", active=True, email="test@example.com"
        )

        # Create expired MembershipInvite
        self.expired_invite = MembershipInvite.objects.create(
            email=self.user2.email,
            club=self.club1,
            creator=self.user1,
            active=True,
            expires_at=timezone.now() - datetime.timedelta(days=1),
        )

        # Create active MembershipInvite
        self.active_invite = MembershipInvite.objects.create(
            email=self.user1.email,
            club=self.club1,
            creator=self.user1,
            active=True,
            expires_at=timezone.now() + datetime.timedelta(days=1),
        )

    def test_expire_membership_invites(self):
        call_command("expire_membership_invites")

        self.expired_invite.refresh_from_db()
        self.active_invite.refresh_from_db()

        self.assertFalse(self.expired_invite.active)
        self.assertTrue(self.active_invite.active)


class GraduateUsersTestCase(TestCase):
    def setUp(self):
        self.club = Club.objects.create(code="test", name="Test Club", active=True)
        self.user1 = get_user_model().objects.create_user(
            "bfranklin", "bfranklin@seas.upenn.edu", "test"
        )
        self.user2 = get_user_model().objects.create_user(
            "tjefferson", "tjefferson@seas.upenn.edu", "test"
        )

        # Set graduation years
        self.user1.profile.graduation_year = timezone.now().year - 1
        self.user1.profile.save()
        self.user2.profile.graduation_year = timezone.now().year + 1
        self.user2.profile.save()

        # Create active memberships
        Membership.objects.create(person=self.user1, club=self.club, active=True)
        Membership.objects.create(person=self.user2, club=self.club, active=True)

    def test_graduate_users(self):
        # Ensure both memberships are active initially
        self.assertEqual(Membership.objects.filter(active=True).count(), 2)

        # Run the command
        call_command("graduate_users")

        # Check that only the graduated user's membership is inactive
        self.assertEqual(Membership.objects.filter(active=True).count(), 1)
        self.assertFalse(Membership.objects.get(person=self.user1).active)
        self.assertTrue(Membership.objects.get(person=self.user2).active)

    def test_graduate_users_output(self):
        # Capture command output
        out = io.StringIO()
        call_command("graduate_users", stdout=out)

        # Check the output
        self.assertIn(
            "Updated the membership status of 1 student club relationships!",
            out.getvalue(),
        )


class OsaPermsUpdatesTestCase(TestCase):
    def setUp(self):
        self.user1 = get_user_model().objects.create_user("gwashington")

    def test_osa_perms_updates(self):
        # Test error when OSA_KEYS is not set
        with mock.patch("django.conf.settings.OSA_KEYS", None):
            with self.assertRaises(ValueError):
                call_command("osa_perms_updates")
            self.assertFalse(self.user1.is_superuser)

        with mock.patch("django.conf.settings.OSA_KEYS", ["gwashington"]):
            # Test error when Approvers group is not found
            with self.assertRaises(ValueError):
                call_command("osa_perms_updates")
            self.assertFalse(self.user1.is_superuser)

            # Create Approvers group
            Group.objects.create(name="Approvers")
            call_command("osa_perms_updates")
            self.user1.refresh_from_db()
            self.assertTrue(self.user1.groups.filter(name="Approvers").exists())
            self.assertTrue(self.user1.is_staff)
            self.assertTrue(self.user1.is_superuser)
            self.assertTrue(self.user1.has_perm("approve_club"))
            self.assertTrue(self.user1.has_perm("see_pending_clubs"))
