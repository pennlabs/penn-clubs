"""
Test cases related to models and their fields in the clubs models.py.
"""

import datetime
from smtplib import SMTPAuthenticationError, SMTPServerDisconnected
from unittest import mock

import pytz
from django.contrib.auth import get_user_model
from django.test import TestCase

from clubs.models import (
    Advisor,
    Badge,
    Club,
    Event,
    Favorite,
    Membership,
    Note,
    Tag,
    Year,
    send_mail_helper,
)


class YearTestCase(TestCase):
    def test_offset_conversion(self):
        titles = [
            "Freshman",
            "Sophomore",
            "Junior",
            "Senior",
            "First-year",
            "Second-year",
        ]
        for title in titles:
            Year.objects.create(name=title)

        this_year = datetime.datetime.now().year

        # ensure graduation years are in a reasonable range
        for title in titles:
            year = Year.objects.get(name=title).year
            self.assertLessEqual(abs(year - this_year), 10)


class ClubTestCase(TestCase):
    def setUp(self):
        date = pytz.timezone("America/New_York").localize(datetime.datetime(2019, 1, 1))
        self.club1 = Club.objects.create(
            code="a", name="a", subtitle="a", founded=date, description="a", size=1
        )
        self.club2 = Club.objects.create(
            code="b", name="b", subtitle="b", founded=date, description="b", size=1
        )
        self.club2.parent_orgs.add(self.club1)

    def test_str(self):
        self.assertEqual(str(self.club1), self.club1.name)

    def test_parent_children(self):
        self.assertEqual(self.club2.parent_orgs.first(), self.club1)
        self.assertEqual(self.club1.children_orgs.first(), self.club2)

    def test_get_officer_emails(self):
        # Create test users with various email formats
        user1 = get_user_model().objects.create_user(
            "user1", "user1@example.com", "password"
        )
        user2 = get_user_model().objects.create_user(
            "user2", "   user2@example.com  ", "password"
        )  # whitespace
        user3 = get_user_model().objects.create_user(
            "user3", "", "password"
        )  # empty email
        user4 = get_user_model().objects.create_user(
            "user4", "user4@example.com", "password"
        )

        # Create memberships for the test users
        Membership.objects.create(
            person=user1, club=self.club1, role=Membership.ROLE_OFFICER
        )
        Membership.objects.create(
            person=user2, club=self.club1, role=Membership.ROLE_OWNER
        )
        Membership.objects.create(
            person=user3, club=self.club1, role=Membership.ROLE_OFFICER
        )
        Membership.objects.create(
            person=user4, club=self.club1, role=Membership.ROLE_OFFICER, active=False
        )  # alumni

        # Test with valid club email
        self.club1.email = "club@example.com"
        self.club1.save()

        officer_emails = self.club1.get_officer_emails()
        expected_emails = ["club@example.com", "user1@example.com", "user2@example.com"]
        self.assertEqual(officer_emails, expected_emails)

        # Ensure alumni are not included
        self.assertNotIn("user4@example.com", officer_emails)

        # Test with invalid club email
        self.club1.email = "invalid-email"
        self.club1.save()

        officer_emails = self.club1.get_officer_emails()
        expected_emails = ["user1@example.com", "user2@example.com"]
        self.assertEqual(officer_emails, expected_emails)

        # Test with empty club email
        self.club1.email = ""
        self.club1.save()
        officer_emails = self.club1.get_officer_emails()
        self.assertEqual(officer_emails, expected_emails)


class ProfileTestCase(TestCase):
    def test_profile_creation(self):
        """
        Ensure that a Profile object is created when the user is created.
        """
        self.person = get_user_model().objects.create_user(
            "test", "test@example.com", "test"
        )
        self.assertTrue(self.person.profile)


class EventTestCase(TestCase):
    def setUp(self):
        date = pytz.timezone("America/New_York").localize(datetime.datetime(2019, 1, 1))
        self.club = Club.objects.create(
            code="a", name="a", subtitle="a", founded=date, description="a", size=1
        )
        self.event = Event.objects.create(
            name="a", club=self.club, start_time=date, end_time=date, description="a"
        )

    def test_str(self):
        self.assertEqual(str(self.event), self.event.name)


class FavoriteTestCase(TestCase):
    def setUp(self):
        date = pytz.timezone("America/New_York").localize(datetime.datetime(2019, 1, 1))
        self.person = get_user_model().objects.create_user(
            "test", "test@example.com", "test"
        )
        self.club = Club.objects.create(
            code="a", name="a", subtitle="a", founded=date, description="a", size=1
        )
        self.favorite = Favorite.objects.create(club=self.club, person=self.person)

    def test_str(self):
        self.assertTrue(str(self.favorite))


class MembershipTestCase(TestCase):
    def setUp(self):
        date = pytz.timezone("America/New_York").localize(datetime.datetime(2019, 1, 1))
        self.person = get_user_model().objects.create_user(
            "test", "test@example.com", "test"
        )
        self.club = Club.objects.create(
            code="a", name="a", subtitle="a", founded=date, description="a", size=1
        )
        self.membership = Membership.objects.create(club=self.club, person=self.person)

    def test_str(self):
        self.assertTrue(str(self.membership))


class TagTestCase(TestCase):
    def setUp(self):
        self.tag = Tag.objects.create(name="super interesting tag")

    def test_str(self):
        self.assertEqual(str(self.tag), self.tag.name)


class BadgeTestCase(TestCase):
    def setUp(self):
        self.badge = Badge.objects.create(
            label="SAC Funded", description="SAC Funded Club"
        )

    def test_str(self):
        self.assertTrue(str(self.badge), self.badge.label)


class AdvisorTestCase(TestCase):
    def setUp(self):
        date = pytz.timezone("America/New_York").localize(datetime.datetime(2019, 1, 1))
        club = Club.objects.create(
            code="a", name="a", subtitle="a", founded=date, description="a", size=1
        )
        self.advisor = Advisor.objects.create(
            name="Eric Wang", phone="+12025550133", club=club, public=Advisor.PUBLIC_ALL
        )

    def test_str(self):
        self.assertEqual(str(self.advisor), self.advisor.name)


class NoteTestCase(TestCase):
    def setUp(self):
        date = pytz.timezone("America/New_York").localize(datetime.datetime(2019, 1, 1))
        self.person = get_user_model().objects.create_user(
            "test", "test@example.com", "test"
        )
        self.club1 = Club.objects.create(
            code="a", name="a", subtitle="a", founded=date, description="a", size=1
        )
        self.club2 = Club.objects.create(
            code="b", name="b", subtitle="b", founded=date, description="b", size=1
        )
        self.note1 = Note.objects.create(
            creator=self.person,
            creating_club=self.club1,
            subject_club=self.club2,
            title="Note1",
            content="content",
            creating_club_permission=10,
            outside_club_permission=0,
        )

    def test_club_relation(self):
        self.assertEqual(self.note1.creating_club, self.club1)
        self.assertEqual(self.note1, self.club1.note_by_club.first())
        self.assertEqual(self.note1.subject_club, self.club2)
        self.assertEqual(self.note1, self.club2.note_of_club.first())


class UtilsTestCase(TestCase):
    def test_send_mail_retry_logic(self):
        with mock.patch("django.core.mail.EmailMultiAlternatives.send") as mocked_send:
            mocked_send.side_effect = [
                SMTPServerDisconnected("Server disconnected"),
                SMTPAuthenticationError(535, "Authentication failed"),
                True,
            ]

            success = send_mail_helper(
                name="base",  # use existing template
                subject="Test Subject",
                emails=["test@example.com"],
                context={},
                num_retries=2,
            )

            self.assertTrue(success)
            self.assertEqual(mocked_send.call_count, 3)

        with mock.patch("django.core.mail.EmailMultiAlternatives.send") as mocked_send:
            mocked_send.side_effect = SMTPServerDisconnected()
            with self.assertRaises(SMTPServerDisconnected):
                send_mail_helper(
                    name="base",  # use existing template
                    subject="Test Subject",
                    emails=["test@example.com"],
                    context={},
                    num_retries=2,
                )

            self.assertEqual(mocked_send.call_count, 3)
