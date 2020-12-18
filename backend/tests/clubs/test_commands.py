"""
Test management commands that are under the clubs app here.
These management commands can be executed with "./manage.py <command>".
"""

import csv
import datetime
import os
import tempfile
from unittest import mock

from dateutil.tz import tzutc
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from django.utils import timezone
from ics import Calendar
from ics import Event as ICSEvent

from clubs.models import Club, ClubFair, Event, Favorite, Membership, MembershipInvite, Tag
from clubs.utils import fuzzy_lookup_club


def mocked_requests_get(*args):
    class MockResponse:
        def __init__(self, content, status_code):
            self.text = str(content)
            self.status_code = status_code

        def text(self):
            return self.text

    cal = Calendar()
    event = ICSEvent()
    event.name = "A test event"
    event.description = "A test description"
    event.begin = datetime.datetime(2020, 1, 2, 3, 4, 5)
    event.end = datetime.datetime(2020, 1, 2, 3, 4, 5) + datetime.timedelta(minutes=60)
    cal.events.add(event)
    if args[0] == "http://xyz.com/test.ics":
        return MockResponse(cal, 200)

    return MockResponse(None, 404)


class ImportCalendarTestCase(TestCase):
    def setUp(self):
        self.club1 = Club.objects.create(
            code="one",
            name="Club One",
            active=True,
            email="test@example.com",
            ics_import_url="http://xyz.com/test.ics",
        )

    @mock.patch("requests.get", side_effect=mocked_requests_get)
    def test_import_calendar_events(self, mock_get):
        call_command("import_calendar_events")

        desired = self.club1.events.get(id=1)

        self.assertEqual(desired.name, "A test event")
        self.assertEqual(desired.description, "A test description")
        self.assertEqual(desired.start_time, datetime.datetime(2020, 1, 2, 3, 4, 5, tzinfo=tzutc()))
        self.assertEqual(
            desired.end_time,
            datetime.datetime(2020, 1, 2, 3, 4, 5, tzinfo=tzutc()) + datetime.timedelta(minutes=60),
        )

        self.assertIn(mock.call("http://xyz.com/test.ics"), mock_get.call_args_list)


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

        Membership.objects.create(club=self.club3, person=self.user1, role=Membership.ROLE_OWNER)

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

    def test_daily_notifications(self):
        call_command("daily_notifications")

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
        self.assertIn(fuzzy_lookup_club("italian").code, ["italian-1", "italian-2", "italian-3"])

        # test partial club name
        Club.objects.create(code="league", name="University of Pennsylvania League of Legends Club")
        self.assertEqual(fuzzy_lookup_club("league of legends").code, "league")

        # test partial match both strings
        Club.objects.create(code="counterparts", name="Counterparts A Cappella")
        self.assertEqual(fuzzy_lookup_club("Penn Counterparts").code, "counterparts")

        # test remove prefix
        Club.objects.create(code="pasa", name="Penn African Student Association")
        self.assertEqual(fuzzy_lookup_club("PASA - Penn African Students Association").code, "pasa")

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

        Membership.objects.create(club=self.club1, person=self.user1, role=Membership.ROLE_OWNER)

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
        Event.objects.create(
            code="test-event-1",
            name="Test Event 1",
            club=Club.objects.first(),
            start_time=now,
            end_time=now + datetime.timedelta(hours=2),
            description="This is a test event!",
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
                "Expected there to be an email with more than one recipient, but did not exist!"
            )

        # send out reminder emails
        current_email_count = len(mail.outbox)

        call_command("deactivate", "remind", "--force")

        self.assertGreater(len(mail.outbox), current_email_count)


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
