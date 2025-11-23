"""
Test cases related to models and their fields in the clubs models.py.
"""

import datetime
from smtplib import SMTPAuthenticationError, SMTPServerDisconnected
from unittest import mock

import pytz
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from clubs.models import (
    Advisor,
    Badge,
    Club,
    Event,
    EventShowing,
    Favorite,
    Membership,
    Note,
    OwnershipRequest,
    RegistrationQueueSettings,
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
        self.event = Event.objects.create(name="a", club=self.club, description="a")

    def test_str(self):
        self.assertEqual(str(self.event), self.event.name)


class EventShowingTestCase(TestCase):
    def setUp(self):
        date = pytz.timezone("America/New_York").localize(datetime.datetime(2019, 1, 1))
        self.club = Club.objects.create(
            code="a", name="a", subtitle="a", founded=date, description="a", size=1
        )
        self.event = Event.objects.create(name="a", club=self.club, description="a")
        self.showing = EventShowing.objects.create(
            event=self.event, start_time=date, end_time=date
        )

    def test_str(self):
        expected_str = f"{self.showing.event.name} showing at {self.showing.start_time}"
        self.assertEqual(str(self.showing), expected_str)


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
            name="Eric Wang",
            phone="+12025550133",
            club=club,
            visibility=Advisor.ADVISOR_VISIBILITY_ALL,
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


class OwnershipRequestTestCase(TestCase):
    """Test cases for OwnershipRequest model methods"""

    @classmethod
    def setUpTestData(cls):
        cls.user1 = get_user_model().objects.create_user(
            "user1", "user1@example.com", "test"
        )
        cls.user2 = get_user_model().objects.create_user(
            "user2", "user2@example.com", "test"
        )
        cls.club1 = Club.objects.create(
            code="club1", name="Club 1", active=True, approved=True
        )

    def test_can_user_request_ownership_no_previous_request(self):
        """Test can_user_request_ownership with no previous request"""
        can_request, reason, recent_request = (
            OwnershipRequest.can_user_request_ownership(self.user2, self.club1)
        )
        self.assertTrue(can_request)
        self.assertEqual(reason, "No recent request found")
        self.assertIsNone(recent_request)

    def test_can_user_request_ownership_pending_request(self):
        """Test can_user_request_ownership with pending request"""
        pending_request = OwnershipRequest.objects.create(
            club=self.club1, requester=self.user2, status=OwnershipRequest.PENDING
        )

        can_request, reason, recent_request = (
            OwnershipRequest.can_user_request_ownership(self.user2, self.club1)
        )
        self.assertFalse(can_request)
        self.assertEqual(reason, "Request already pending")
        self.assertEqual(recent_request, pending_request)

    def test_can_user_request_ownership_withdrawn_request(self):
        """Test can_user_request_ownership with withdrawn request"""
        withdrawn_request = OwnershipRequest.objects.create(
            club=self.club1, requester=self.user2, status=OwnershipRequest.WITHDRAWN
        )

        can_request, reason, recent_request = (
            OwnershipRequest.can_user_request_ownership(self.user2, self.club1)
        )
        self.assertTrue(can_request)
        self.assertEqual(reason, "Previous request was withdrawn")
        self.assertEqual(recent_request, withdrawn_request)

    def test_can_user_request_ownership_accepted_request(self):
        """Test can_user_request_ownership with accepted request"""
        accepted_request = OwnershipRequest.objects.create(
            club=self.club1, requester=self.user2, status=OwnershipRequest.ACCEPTED
        )

        can_request, reason, recent_request = (
            OwnershipRequest.can_user_request_ownership(self.user2, self.club1)
        )
        self.assertFalse(can_request)
        self.assertEqual(reason, "Request already handled within 6 months")
        self.assertEqual(recent_request, accepted_request)

    def test_can_user_request_ownership_denied_request(self):
        """Test can_user_request_ownership with denied request"""
        denied_request = OwnershipRequest.objects.create(
            club=self.club1, requester=self.user2, status=OwnershipRequest.DENIED
        )

        can_request, reason, recent_request = (
            OwnershipRequest.can_user_request_ownership(self.user2, self.club1)
        )
        self.assertFalse(can_request)
        self.assertEqual(reason, "Request already handled within 6 months")
        self.assertEqual(recent_request, denied_request)

    def test_can_user_request_ownership_old_request(self):
        """Test can_user_request_ownership with request older than 6 months"""
        old_request = OwnershipRequest.objects.create(
            club=self.club1, requester=self.user2, status=OwnershipRequest.ACCEPTED
        )
        # Set created_at to 7 months ago
        old_request.created_at = timezone.now() - datetime.timedelta(days=210)
        old_request.save()

        can_request, reason, recent_request = (
            OwnershipRequest.can_user_request_ownership(self.user2, self.club1)
        )
        self.assertTrue(can_request)
        self.assertEqual(reason, "No recent request found")
        self.assertIsNone(recent_request)

    def test_get_recent_request_within_6_months(self):
        """Test get_recent_request finds request within 6 months"""
        request = OwnershipRequest.objects.create(
            club=self.club1, requester=self.user2, status=OwnershipRequest.PENDING
        )

        recent_request = OwnershipRequest.get_recent_request(self.user2, self.club1)
        self.assertEqual(recent_request, request)

    def test_get_recent_request_older_than_6_months(self):
        """Test get_recent_request ignores request older than 6 months"""
        old_request = OwnershipRequest.objects.create(
            club=self.club1, requester=self.user2, status=OwnershipRequest.PENDING
        )
        # Set created_at to 7 months ago
        old_request.created_at = timezone.now() - datetime.timedelta(days=210)
        old_request.save()

        recent_request = OwnershipRequest.get_recent_request(self.user2, self.club1)
        self.assertIsNone(recent_request)

    def test_get_recent_request_multiple_requests(self):
        """Test get_recent_request returns most recent request"""
        # Create older request
        old_request = OwnershipRequest.objects.create(
            club=self.club1, requester=self.user2, status=OwnershipRequest.PENDING
        )
        old_request.created_at = timezone.now() - datetime.timedelta(days=10)
        old_request.save()

        # Create newer request
        new_request = OwnershipRequest.objects.create(
            club=self.club1, requester=self.user2, status=OwnershipRequest.PENDING
        )
        new_request.created_at = timezone.now() - datetime.timedelta(days=5)
        new_request.save()

        recent_request = OwnershipRequest.get_recent_request(self.user2, self.club1)
        self.assertEqual(recent_request, new_request)

    def test_get_recent_request_no_requests(self):
        """Test get_recent_request with no requests"""
        recent_request = OwnershipRequest.get_recent_request(self.user2, self.club1)
        self.assertIsNone(recent_request)

    def test_ownership_request_str_representation(self):
        """Test string representation of OwnershipRequest"""
        request = OwnershipRequest.objects.create(
            club=self.club1, requester=self.user2, status=OwnershipRequest.PENDING
        )

        expected_str = (
            f"<OwnershipRequest: {self.user2.username} for {self.club1.code}>"
        )
        self.assertEqual(str(request), expected_str)

    def test_ownership_request_default_status(self):
        """Test that new requests default to PENDING status"""
        request = OwnershipRequest.objects.create(club=self.club1, requester=self.user2)

        self.assertEqual(request.status, OwnershipRequest.PENDING)

    def test_ownership_request_multiple_requests_same_user_club(self):
        """Test that multiple requests can exist for same user/club"""
        # Create first request
        request1 = OwnershipRequest.objects.create(
            club=self.club1, requester=self.user2, status=OwnershipRequest.ACCEPTED
        )

        # Create second request (should be allowed due to removed unique constraint)
        request2 = OwnershipRequest.objects.create(
            club=self.club1, requester=self.user2, status=OwnershipRequest.PENDING
        )

        # Both requests should exist
        self.assertEqual(
            OwnershipRequest.objects.filter(
                club=self.club1, requester=self.user2
            ).count(),
            2,
        )

        # They should be different objects
        self.assertNotEqual(request1.id, request2.id)

    def test_ownership_request_6month_boundary(self):
        """Test the exact 6-month boundary (180 days)"""
        # Create request approximately 180 days ago
        request = OwnershipRequest.objects.create(
            club=self.club1, requester=self.user2, status=OwnershipRequest.ACCEPTED
        )
        request.created_at = timezone.now() - datetime.timedelta(
            days=179, hours=23, minutes=59
        )
        request.save()

        # Should still be considered "recent" (within 6 months)
        can_request, reason, recent_request = (
            OwnershipRequest.can_user_request_ownership(self.user2, self.club1)
        )
        self.assertFalse(can_request)
        self.assertEqual(reason, "Request already handled within 6 months")

        # Move it to 181 days ago
        request.created_at = timezone.now() - datetime.timedelta(days=181)
        request.save()

        # Should now be considered "old" (outside 6 months)
        can_request, reason, recent_request = (
            OwnershipRequest.can_user_request_ownership(self.user2, self.club1)
        )
        self.assertTrue(can_request)
        self.assertEqual(reason, "No recent request found")


class RegistrationQueueSettingsTestCase(TestCase):
    def setUp(self):
        queue_settings = RegistrationQueueSettings.get()
        queue_settings.reapproval_queue_open = True
        queue_settings.new_approval_queue_open = True
        queue_settings.save()

    def test_apply_scheduled_flips(self):
        queue_settings = RegistrationQueueSettings.get()
        past_date = timezone.now() - datetime.timedelta(hours=1)
        future_date = timezone.now() + datetime.timedelta(hours=1)

        queue_settings.reapproval_date_of_next_flip = past_date
        queue_settings.new_approval_date_of_next_flip = future_date
        queue_settings.save()

        # reapproval flip should be applied bc in the past
        # new approval flip should not be applied bc in the future
        queue_settings.check_and_apply_scheduled_flips()
        updated_settings = RegistrationQueueSettings.get()
        self.assertFalse(updated_settings.reapproval_queue_open)
        self.assertEqual(updated_settings.reapproval_date_of_next_flip, None)

        self.assertTrue(updated_settings.new_approval_queue_open)
        self.assertEqual(updated_settings.new_approval_date_of_next_flip, future_date)
