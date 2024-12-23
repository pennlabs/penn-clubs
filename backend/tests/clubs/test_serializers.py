from datetime import timedelta
from unittest import mock

from django.conf import settings
from django.contrib.auth.models import Permission, User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from clubs.models import Club, Membership
from clubs.serializers import ClubSerializer


class ClubSerializerTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(username="testuser", password="12345")
        self.club = Club.objects.create(name="Test Club", code="test", approved=True)

        # Set renewal period in settings to current time
        now = timezone.now()
        self.renewal_start = now - timedelta(days=30)
        self.renewal_end = now + timedelta(days=30)
        settings.RENEWAL_PERIOD = (self.renewal_start, self.renewal_end)

        self.serializer = ClubSerializer()

    def test_privileged_user_sees_current_version(self):
        self.user.user_permissions.add(
            Permission.objects.get(codename="see_pending_clubs")
        )
        request = self.factory.get(reverse("clubs-detail", args=[self.club.code]))
        request.user = self.user

        self.serializer.context["request"] = Request(request)
        result = self.serializer.to_representation(self.club)
        self.assertEqual(result["name"], "Test Club")

    def test_member_sees_current_version(self):
        Membership.objects.create(person=self.user, club=self.club)
        request = self.factory.get(reverse("clubs-detail", args=[self.club.code]))
        request.user = self.user

        self.serializer.context["request"] = Request(request)
        result = self.serializer.to_representation(self.club)
        self.assertEqual(result["name"], "Test Club")

    def test_approved_club_visible_to_all(self):
        request = self.factory.get(reverse("clubs-detail", args=[self.club.code]))
        request.user = self.user

        self.serializer.context["request"] = Request(request)
        result = self.serializer.to_representation(self.club)
        self.assertEqual(result["name"], "Test Club")

    def test_bypass_flag_shows_current_version(self):
        request = self.factory.get(
            f"{reverse('clubs-detail', args=[self.club.code])}?bypass=true"
        )
        request.user = self.user

        self.serializer.context["request"] = Request(request)
        result = self.serializer.to_representation(self.club)
        self.assertEqual(result["name"], "Test Club")

    def test_non_privileged_user_during_renewal_period(self):
        # Simulate deactivation at the beginning of the renewal period
        self.club.save()
        self.club.approved = False
        self.club.save()

        # Insert a previously approved version into the club's history
        past_time = timezone.now() - timedelta(days=180)
        with mock.patch("django.utils.timezone.now", return_value=past_time):
            self.club.name = "Past Approved Version"
            self.club.approved = True
            self.club.approved_on = past_time
            self.club.save()

        self.club.name = "Current Unapproved Version"
        self.club.approved = False
        self.club.approved_on = None
        self.club.save()

        request = self.factory.get("/fake-url/")
        request.user = self.user
        serializer = ClubSerializer(context={"request": Request(request)})

        result = serializer.to_representation(self.club)
        self.assertEqual(result["name"], "Past Approved Version")
        self.assertNotEqual(result["name"], "Current Unapproved Version")

    def test_non_privileged_user_outside_renewal_period_ghost_club(self):
        self.club.approved = False
        self.club.ghost = True
        self.club.save()

        current_date = self.renewal_end + timedelta(days=1)
        with mock.patch("django.utils.timezone.now", return_value=current_date):
            approved_date = self.renewal_start + timedelta(days=1)
            with mock.patch("django.utils.timezone.now", return_value=approved_date):
                self.club.name = "Current Cycle Approved Version"
                self.club.approved = True
                self.club.approved_on = approved_date
                self.club.save()

            self.club.name = "Current Unapproved Version"
            self.club.approved = False
            self.club.approved_on = None
            self.club.save()

            request = self.factory.get(reverse("clubs-detail", args=[self.club.code]))
            request.user = self.user

            self.serializer.context["request"] = Request(request)
            result = self.serializer.to_representation(self.club)
            self.assertEqual(result["name"], "Current Cycle Approved Version")
            self.assertNotEqual(result["name"], "Current Unapproved Version")

    def test_non_privileged_user_no_approved_version(self):
        self.club.approved = False
        self.club.save()

        request = self.factory.get(reverse("clubs-detail", args=[self.club.code]))
        request.user = self.user
        self.serializer.context["request"] = Request(request)

        with self.assertRaises(ValidationError) as context:
            self.serializer.to_representation(self.club)

        self.assertEqual(context.exception.detail[0], "Club not found")
        self.assertEqual(context.exception.get_codes()[0], "not_found")

    def test_non_privileged_user_outside_renewal_period_non_ghost_club(self):
        self.club.approved = False
        self.club.ghost = False
        self.club.save()

        current_date = self.renewal_end + timedelta(days=1)
        with mock.patch("django.utils.timezone.now", return_value=current_date):
            request = self.factory.get(reverse("clubs-detail", args=[self.club.code]))
            request.user = self.user

            self.serializer.context["request"] = Request(request)
            with self.assertRaises(ValidationError) as context:
                self.serializer.to_representation(self.club)

            self.assertEqual(context.exception.detail[0], "Club not found")
            self.assertEqual(context.exception.get_codes()[0], "not_found")  #
