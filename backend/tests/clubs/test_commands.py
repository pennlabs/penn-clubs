import csv
import tempfile

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from clubs.models import Club, Favorite, Membership, MembershipInvite, Tag
from clubs.utils import fuzzy_lookup_club


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
        with tempfile.NamedTemporaryFile() as tmp:
            call_command("send_emails", "invite", tmp.name)

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

        with tempfile.NamedTemporaryFile() as tmp:
            with open(tmp.name, "w") as f:
                writer = csv.writer(f)
                for row in data:
                    writer.writerow(row)

            call_command("send_emails", "fair", tmp.name, "--only-sheet")

        self.assertEqual(len(mail.outbox), 3)

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
        self.club1 = Club.objects.create(code="one", name="Club One", email="one@example.com")
        self.club2 = Club.objects.create(code="two", name="Club Two", email="two@example.com")

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

        self.assertNotEqual(Club.objects.all().count(), 0)
        self.assertNotEqual(Tag.objects.all().count(), 0)


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
