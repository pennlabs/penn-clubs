import datetime
import io
import json
import os
from collections import Counter
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core import mail
from django.core.cache import cache
from django.core.management import call_command
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone
from ics import Calendar

from clubs.filters import DEFAULT_PAGE_SIZE
from clubs.models import (
    Advisor,
    ApplicationQuestion,
    ApplicationSubmission,
    Asset,
    Badge,
    Club,
    ClubApplication,
    ClubApprovalResponseTemplate,
    ClubFair,
    ClubFairRegistration,
    Event,
    EventShowing,
    Favorite,
    Major,
    Membership,
    MembershipInvite,
    MembershipRequest,
    OwnershipRequest,
    QuestionAnswer,
    RegistrationQueueSettings,
    School,
    Tag,
    Testimonial,
    ZoomMeetingVisit,
)


class SearchTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        Club.objects.bulk_create(
            [
                Club(code=f"club-{i}", name=f"Club #{i}", active=True, approved=True)
                for i in range(0, 100)
            ]
        )

    def setUp(self):
        self.client = Client()

    def test_random_listing(self):
        self.perform_random_fetch(DEFAULT_PAGE_SIZE)

    def test_random_listing_odd_page(self):
        self.perform_random_fetch(17)

    def test_featured_listing(self):
        self.perform_random_fetch(DEFAULT_PAGE_SIZE, ordering="featured")

    def test_alphabetical_listing(self):
        self.perform_random_fetch(DEFAULT_PAGE_SIZE, ordering="name")

    def perform_random_fetch(self, page_size, ordering="random"):
        # fetch clubs using specified ordering
        resp = self.client.get(
            reverse("clubs-list"),
            {"ordering": ordering, "page": "1", "page_size": str(page_size)},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)
        data = resp.json()
        returned_count = data["count"]
        page_count = 1

        clubs = []
        pages = []

        while data["next"] is not None:
            old_results_len = len(data["results"])
            self.assertLessEqual(old_results_len, page_size)
            self.assertGreater(len(data["results"]), 0, pages)

            clubs.extend(data["results"])

            pages.append(sorted([club["code"] for club in data["results"]]))

            resp = self.client.get(data["next"], content_type="application/json")
            self.assertIn(resp.status_code, [200, 201], resp.content)
            data = resp.json()
            page_count += 1

            # if not last page, ensure page size is returned
            if data["next"] is not None:
                self.assertEqual(old_results_len, page_size)

        # add results from last page
        clubs.extend(data["results"])
        pages.append(sorted([club["code"] for club in data["results"]]))

        clubs = sorted([club["code"] for club in clubs])

        # calculate the base truth
        truth = sorted(Club.objects.values_list("code", flat=True))
        truth_counter = Counter(truth)
        clubs_counter = Counter(clubs)
        missing = truth_counter - clubs_counter
        extra = clubs_counter - truth_counter

        # ensure all clubs existing in the complete listing
        detail_text = "\n".join(str(list(sorted(page))) for page in pages)
        self.assertEqual(
            clubs,
            truth,
            f"\nMissing from results: {list(missing.elements())}\n"
            f"Extra in results: {list(sorted(extra.elements()))}\n"
            f"{page_count} pages * {page_size} per page, {returned_count} clubs\n"
            f"\n{detail_text}",
        )

        # ensure returned count is correct
        self.assertEqual(len(clubs), returned_count)


class ClubTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user1 = get_user_model().objects.create_user(
            "bfranklin", "bfranklin@seas.upenn.edu", "test"
        )
        cls.user1.first_name = "Benjamin"
        cls.user1.last_name = "Franklin"
        cls.user1.save()

        cls.user2 = get_user_model().objects.create_user(
            "tjefferson", "tjefferson@seas.upenn.edu", "test"
        )
        cls.user2.first_name = "Thomas"
        cls.user2.last_name = "Jefferson"
        cls.user2.save()

        cls.user3 = get_user_model().objects.create_user(
            "gwashington", "gwashington@wharton.upenn.edu", "test"
        )
        cls.user3.first_name = "George"
        cls.user3.last_name = "Washington"
        cls.user3.save()

        cls.user4 = get_user_model().objects.create_user(
            "barnold", "barnold@wharton.upenn.edu", "test"
        )
        cls.user4.first_name = "Benedict"
        cls.user4.last_name = "Arnold"
        cls.user4.save()

        cls.user5 = get_user_model().objects.create_user(
            "jadams", "jadams@sas.upenn.edu", "test"
        )
        cls.user5.first_name = "John"
        cls.user5.last_name = "Adams"
        cls.user5.is_staff = True
        cls.user5.is_superuser = True
        cls.user5.save()

        Tag.objects.create(name="Graduate")
        Tag.objects.create(name="Undergraduate")

        queue_settings = RegistrationQueueSettings.get()
        queue_settings.reapproval_queue_open = True
        queue_settings.new_approval_queue_open = True
        queue_settings.save()

    def setUp(self):
        cache.clear()  # clear the cache between tests

        self.client = Client()

        self.club1 = Club.objects.create(
            code="test-club",
            name="Test Club",
            approved=True,
            email="example@example.com",
        )

        self.event1 = Event.objects.create(
            code="test-event",
            club=self.club1,
            name="Test Event",
            url="https://zoom.us/j/4880003126",
        )

        self.event_showing1 = EventShowing.objects.create(
            event=self.event1,
            start_time=timezone.now() + timezone.timedelta(days=2),
            end_time=timezone.now() + timezone.timedelta(days=3),
        )

        self.question1 = QuestionAnswer.objects.create(
            club=self.club1,
            question="What is your name?",
            answer=None,
            approved=False,
            author=self.user1,
        )

        self.question2 = QuestionAnswer.objects.create(
            club=self.club1,
            question="What is your favorite color?",
            answer="Blue",
            approved=True,
            author=self.user2,
            responder=self.user1,
        )

        self.advisor_admin = Advisor.objects.create(
            name="Anonymous Avi",
            phone="+12025550133",
            club=self.club1,
            visibility=Advisor.ADVISOR_VISIBILITY_ADMIN,
        )

        self.advisor_students = Advisor.objects.create(
            name="Reclusive Rohan",
            phone="+12025550133",
            club=self.club1,
            visibility=Advisor.ADVISOR_VISIBILITY_STUDENTS,
        )

        self.advisor_public = Advisor.objects.create(
            name="Jocular Julian",
            phone="+12025550133",
            club=self.club1,
            visibility=Advisor.ADVISOR_VISIBILITY_ALL,
        )

    def test_directory(self):
        """
        Test retrieving the club directory.
        """
        resp = self.client.get(reverse("clubs-directory"))
        self.assertIn(resp.status_code, [200, 201], resp.content)
        self.assertEqual(len(resp.data), 1)

    def test_advisor_visibility(self):
        """
        Tests each tier of advisor visibility.
        """
        # Anonymous view
        self.client.logout()
        resp = self.client.get(reverse("clubs-detail", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [200, 201], resp.content)
        self.assertEqual(len(resp.data["advisor_set"]), 1)
        self.assertEqual(resp.data["advisor_set"][0]["name"], "Jocular Julian")

        # Student view
        self.client.login(username=self.user1.username, password="test")
        resp = self.client.get(reverse("clubs-detail", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [200, 201], resp.content)
        self.assertEqual(len(resp.data["advisor_set"]), 2)
        sorted_advisors = sorted(
            [advisor["name"] for advisor in resp.data["advisor_set"]]
        )
        self.assertEqual(sorted_advisors, ["Jocular Julian", "Reclusive Rohan"])

        # Admin view
        self.client.login(username=self.user5.username, password="test")
        resp = self.client.get(reverse("clubs-detail", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [200, 201], resp.content)
        self.assertEqual(len(resp.data["advisor_set"]), 3)
        sorted_advisors = sorted(
            [advisor["name"] for advisor in resp.data["advisor_set"]]
        )
        self.assertEqual(
            sorted_advisors, ["Anonymous Avi", "Jocular Julian", "Reclusive Rohan"]
        )

    def test_advisor_viewset(self):
        # Make sure we can't view advisors via the viewset if not authed
        self.client.logout()
        resp = self.client.get(reverse("club-advisors-list", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [400, 403], resp.content)
        self.assertIn("detail", resp.data)

        self.client.login(username=self.user1.username, password="test")
        resp = self.client.get(reverse("club-advisors-list", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [400, 403], resp.content)
        self.assertIn("detail", resp.data)

        self.client.login(username=self.user5.username, password="test")
        resp = self.client.get(reverse("club-advisors-list", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [200, 201], resp.content)
        self.assertEqual(len(resp.data), 3)

    def test_club_upload(self):
        """
        Test uploading a club logo.
        """
        self.client.login(username=self.user5.username, password="test")

        # empty image throws an error
        resp = self.client.post(reverse("clubs-upload", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # successful image upload
        resp = self.client.post(
            reverse("clubs-upload", args=(self.club1.code,)), {"file": io.BytesIO(b"")}
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure image url is set
        resp = self.client.get(reverse("clubs-detail", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [200, 204], resp.content)
        data = json.loads(resp.content.decode("utf-8"))
        self.assertTrue(data["image_url"])

        # ensure cleanup doesn't throw error
        self.club1.delete()

    def test_club_file_upload(self):
        """
        Test uploading a file to the club.
        """
        self.client.login(username=self.user5.username, password="test")

        # successful file upload
        resp = self.client.post(
            reverse("clubs-upload-file", args=(self.club1.code,)),
            {"file": io.BytesIO(b"")},
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure cleanup doesn't throw error
        self.club1.delete()

    def test_club_qr(self):
        """
        Test generating a club fair QR code image.
        """
        self.client.login(username=self.user5.username, password="test")

        resp = self.client.get(reverse("clubs-qr", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [200, 201], resp.content)

    def test_club_subscription(self):
        """
        Test retrieving the list of club subscribers.
        """
        self.client.login(username=self.user5.username, password="test")

        resp = self.client.get(reverse("clubs-subscription", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [200, 201], resp.content)

    def test_clubs_notes_about(self):
        """
        Test retrieving the list of notes about a club.
        """
        self.client.login(username=self.user5.username, password="test")

        resp = self.client.get(reverse("clubs-notes-about", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [200, 201], resp.content)

    def test_event_upload(self):
        """
        Test uploading an event image.
        """
        self.client.login(username=self.user5.username, password="test")

        # successful image upload
        resp = self.client.post(
            reverse("club-events-upload", args=(self.club1.code, self.event1.id)),
            {"image": io.BytesIO(b"")},
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure cleanup doesn't throw error
        self.event1.delete()

    def test_user_views(self):
        """
        Test retrieving and updating user settings.
        """
        self.client.login(username=self.user5.username, password="test")

        # add a membership
        Membership.objects.create(person=self.user5, club=self.club1)

        # add a favorite
        Favorite.objects.create(person=self.user5, club=self.club1)

        # add some schools
        School.objects.create(name="Wharton", is_graduate=False)
        School.objects.create(name="Engineering", is_graduate=False)

        # retrieve user
        resp = self.client.get(reverse("settings-detail"))
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # update user
        resp = self.client.patch(reverse("settings-detail"))
        self.assertIn(resp.status_code, [200, 201], resp.content)
        data = json.loads(resp.content.decode("utf-8"))

        for field in ["username", "email"]:
            self.assertIn(field, data)

        # update user with fields
        # user field should not be updated
        given_year = timezone.now().year
        resp = self.client.patch(
            reverse("settings-detail"),
            {
                "user": self.user1.id,
                "graduation_year": given_year,
                "school": [{"name": "Wharton"}, {"name": "Engineering"}],
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure fields have been updated
        resp = self.client.get(reverse("settings-detail"))
        self.assertIn(resp.status_code, [200, 201], resp.content)
        data = json.loads(resp.content.decode("utf-8"))
        self.assertEqual(data["graduation_year"], given_year)
        self.assertEqual(
            set([s["name"] for s in data["school"]]), {"Wharton", "Engineering"}
        )

    def test_superuser_views(self):
        """
        Test performing club/membership operations as a superuser.
        """
        self.client.login(username=self.user5.username, password="test")

        # create club as superuser
        resp = self.client.post(
            reverse("clubs-list"),
            {
                "name": "Penn Labs",
                "description": "We code stuff.",
                "tags": [{"name": "Graduate"}],
                "email": "example@example.com",
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # add member as superuser
        self.client.login(username=self.user5.username, password="test")

        resp = self.client.post(
            reverse("club-members-list", args=("penn-labs",)),
            {"person": self.user2.pk, "role": Membership.ROLE_OFFICER},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # remove member as superuser
        resp = self.client.delete(
            reverse("club-members-detail", args=("penn-labs", self.user2.username))
        )
        self.assertIn(resp.status_code, [200, 204], resp.content)

        # delete club as superuser
        resp = self.client.delete(reverse("clubs-detail", args=("penn-labs",)))
        self.assertIn(resp.status_code, [200, 204], resp.content)

    def test_subscribe_views(self):
        """
        Test listing/adding/deleting subscriptions.
        """
        self.client.login(username=self.user1.username, password="test")

        # add subscription
        resp = self.client.post(reverse("subscribes-list"), {"club": self.club1.code})
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # attempt to add existing subscription
        resp = self.client.post(reverse("subscribes-list"), {"club": self.club1.code})
        self.assertIn(resp.status_code, [400], resp.content)

        # list subscriptions
        resp = self.client.get(reverse("subscribes-list"))
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode("utf-8"))
        self.assertTrue(data)

        # delete subscription
        resp = self.client.delete(reverse("subscribes-detail", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [200, 204], resp.content)

    def test_favorite_views(self):
        """
        Test listing/adding/deleting favorites.
        """
        self.client.login(username=self.user1.username, password="test")

        # add favorite
        resp = self.client.post(reverse("favorites-list"), {"club": self.club1.code})
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # attempt to add existing favorite
        resp = self.client.post(reverse("favorites-list"), {"club": self.club1.code})
        self.assertIn(resp.status_code, [400], resp.content)

        # list favorites
        resp = self.client.get(reverse("favorites-list"))
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode("utf-8"))
        self.assertTrue(data)

        # other people shouldn't see your favorites
        self.client.login(username=self.user4.username, password="test")
        resp = self.client.get(reverse("favorites-list"))
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode("utf-8"))
        self.assertFalse(data)

        # delete favorite
        self.client.login(username=self.user1.username, password="test")
        resp = self.client.delete(reverse("favorites-detail", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [200, 204], resp.content)

    def test_event_list(self):
        """
        Test listing club events.
        """
        self.client.login(username=self.user5.username, password="test")

        e2_start = timezone.now() - timezone.timedelta(days=3)
        e2_end = timezone.now() - timezone.timedelta(days=2)
        ev2 = Event.objects.create(
            code="test-event-2",
            club=self.club1,
            name="Past Test Event 2",
            type=Event.FAIR,
        )
        _ = EventShowing.objects.create(
            event=ev2,
            start_time=e2_start,
            end_time=e2_end,
        )
        ev3 = Event.objects.create(
            code="test-event-3",
            club=self.club1,
            name="Present Test Event 3",
            type=Event.FAIR,
        )
        _ = EventShowing.objects.create(
            event=ev3,
            start_time=timezone.now() - timezone.timedelta(days=3),
            end_time=timezone.now() + timezone.timedelta(days=2),
        )

        self.event1.type = Event.FAIR
        self.event1.save()

        # test global event
        global_event = Event.objects.create(
            code="test-event-4",
            club=None,
            name="Test Global Event",
            type=Event.OTHER,
        )
        _ = EventShowing.objects.create(
            event=global_event,
            start_time=timezone.now() + timezone.timedelta(days=2),
            end_time=timezone.now() + timezone.timedelta(days=3),
        )

        # list events without a club to namespace.
        now = timezone.now()
        resp = self.client.get(
            reverse("events-list"),
            {"latest_end_time__gte": now},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200], resp.content)
        self.assertEqual(len(resp.data), 3, resp.content)

        # list events with a filter
        resp = self.client.get(
            reverse("events-list"),
            {
                "earliest_start_time__gte": e2_start.isoformat(),
                "latest_end_time__lte": e2_end.isoformat(),
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200], resp.content)
        self.assertEqual(1, len(resp.data), resp.data)

    def test_event_update_fair(self):
        Membership.objects.create(
            person=self.user1, club=self.club1, role=Membership.ROLE_OWNER
        )

        self.client.login(username=self.user1.username, password="test")

        # cannot change non-fair event to fair event
        resp = self.client.patch(
            reverse("club-events-detail", args=(self.club1.code, self.event1.pk)),
            {"type": Event.FAIR},
            content_type="application/json",
        )
        self.assertFalse(200 <= resp.status_code < 300, resp.data)

        e2 = Event.objects.create(
            code="test-event-2",
            club=self.club1,
            name="Past Test Event 2",
            type=Event.FAIR,
        )

        _ = EventShowing.objects.create(
            event=e2,
            start_time=timezone.now() - timezone.timedelta(days=3),
            end_time=timezone.now() + timezone.timedelta(days=2),
        )

        # cannot change fair event to non-fair event
        resp = self.client.patch(
            reverse("club-events-detail", args=(self.club1.code, e2.pk)),
            {"type": Event.RECRUITMENT},
            content_type="application/json",
        )
        self.assertFalse(200 <= resp.status_code < 300, resp.data)

        # test can change other properties
        resp = self.client.patch(
            reverse("club-events-detail", args=(self.club1.code, e2.pk)),
            {"name": "New name for event"},
            content_type="application/json",
        )
        self.assertTrue(200 <= resp.status_code < 300, resp.data)

        # can only change link for non activities fair
        e2.type = Event.OTHER
        e2.save()

        # test google zoom link parsing
        resp = self.client.patch(
            reverse("club-events-detail", args=(self.club1.code, e2.pk)),
            {"url": "https://www.google.com/url?q=https://upenn.zoom.us/j/123456789"},
            content_type="application/json",
        )
        self.assertTrue(200 <= resp.status_code < 300, resp.data)
        e2.refresh_from_db()
        self.assertEqual(e2.url, "https://upenn.zoom.us/j/123456789")

        # revert that
        e2.type = Event.FAIR
        e2.save()

        # ensure we can't delete the event as a normal user
        resp = self.client.delete(
            reverse("club-events-detail", args=(self.club1.code, e2.pk))
        )
        self.assertIn(resp.status_code, [400, 401, 403], resp.data)
        self.assertTrue(Event.objects.filter(pk=e2.pk).exists())

    def test_event_favorited_users(self):
        """
        Test retrieving the correct set of events from the ICS endpoint.
        """
        # create 6 clubs
        Club.objects.bulk_create(
            [
                Club(code=f"club-{i}", name=f"Club #{i}", active=True, approved=True)
                for i in range(1, 7)
            ]
        )
        # add 4 clubs to user 1's favorite set
        Favorite.objects.bulk_create(
            [
                Favorite(person=self.user1, club=Club.objects.get(code=f"club-{i + 1}"))
                for i in range(4)
            ]
        )

        # add 2, different clubs to user 2's favorite set
        Favorite.objects.bulk_create(
            [
                Favorite(
                    person=self.user2, club=Club.objects.get(code=f"club-{i + 4 + 1}")
                )
                for i in range(2)
            ]
        )

        st = timezone.now() + timezone.timedelta(days=2)
        et = timezone.now() + timezone.timedelta(days=3)
        # add one event for every club
        _ = Event.objects.bulk_create(
            [
                Event(
                    code=f"{i}",
                    name=f"Test Event for #{i}",
                    club=Club.objects.get(code=f"club-{i}"),
                )
                for i in range(1, 7)
            ]
        )

        # Add showings for the events
        EventShowing.objects.bulk_create(
            [
                EventShowing(
                    event=Event.objects.get(code=f"{i}"),
                    start_time=st,
                    end_time=et,
                )
                for i in range(1, 7)
            ]
        )

        # add an event outside the 30-day window
        bad_event = Event.objects.create(
            code="test-event-6",
            name="Test Bad Event for Club 1",
            club=Club.objects.get(code="club-1"),
        )
        EventShowing.objects.create(
            event=bad_event,
            start_time=timezone.now() - timezone.timedelta(days=33),
            end_time=timezone.now() - timezone.timedelta(days=32),
        )

        # get user1's favorite set and compare results
        self.client.login(username=self.user1.username, password="test")

        resp = self.client.get(
            reverse("favorites-calendar", args=(self.user1.profile.uuid_secret,))
        )

        self.assertIn(resp.status_code, [200, 201], resp.content)

        cal = Calendar(resp.content.decode("utf8"))
        actual = sorted([ev.name for ev in cal.events])
        expected = sorted(
            [f"Club #{k + 1} - Test Event for #{k + 1}" for k in range(4)]
        )
        self.assertEqual(actual, expected)

    def test_retrieve_ics_url(self):
        """
        Test retrieving the ICS URL from the endpoint.
        """
        self.client.login(username=self.user1.username, password="test")

        resp = self.client.get(reverse("user-uuid"))
        self.assertIn(resp.status_code, [200], resp.content)
        self.assertIn("url", resp.data, resp.content)

    def test_event_create_update_delete(self):
        """
        Test creating, updating, and deleting a club event as a normal user.
        """
        self.client.login(username=self.user4.username, password="test")
        self.assertFalse(self.user4.is_superuser)

        # add user as officer
        Membership.objects.create(
            person=self.user4, club=self.club1, role=Membership.ROLE_OFFICER
        )

        # add event
        resp = self.client.post(
            reverse("club-events-list", args=(self.club1.code,)),
            {
                "name": "Interest Meeting",
                "description": "Interest Meeting on Friday!",
                "location": "JMHH G06",
                "type": Event.RECRUITMENT,
                "start_time": timezone.now().isoformat(),
                "end_time": (timezone.now() + timezone.timedelta(hours=1)).isoformat(),
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)
        id = json.loads(resp.content)["id"]

        # ensure event exists
        self.assertEqual(Event.objects.filter(name="Interest Meeting").count(), 1)
        self.assertEqual(Event.objects.get(name="Interest Meeting").creator, self.user4)

        # update event
        resp = self.client.patch(
            reverse("club-events-detail", args=(self.club1.code, id)),
            {
                "name": "Awesome Interest Meeting",
                "description": "Interest meeting is actually on Sunday!",
                "location": "JMHH 256",
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure event is updated
        self.assertEqual(Event.objects.get(id=id).name, "Awesome Interest Meeting")

        # delete event
        resp = self.client.delete(
            reverse("club-events-detail", args=(self.club1.code, id))
        )
        self.assertIn(resp.status_code, [200, 204], resp.content)

    def test_recurring_event_create(self):
        self.client.login(username=self.user4.username, password="test")
        self.assertFalse(self.user4.is_superuser)

        # add user as officer
        Membership.objects.create(
            person=self.user4, club=self.club1, role=Membership.ROLE_OFFICER
        )

        # set event start and end dates
        start_time = timezone.now() - datetime.timedelta(days=3)
        end_time = start_time + datetime.timedelta(hours=2)
        end_date = start_time + datetime.timedelta(days=15)
        offset = 7

        # add recurring event
        resp = self.client.post(
            reverse("club-events-list", args=(self.club1.code,)),
            {
                "name": "Interest Recurring Meeting",
                "description": "Interest Meeting on every Friday!",
                "location": "JMHH G06",
                "type": Event.RECRUITMENT,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "offset": offset,
                "end_date": end_date.isoformat(),
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)
        self.assertEqual(resp.data["name"], "Interest Recurring Meeting")

        # ensure event exists
        events = Event.objects.filter(name="Interest Recurring Meeting")
        self.assertEqual(events.count(), 1)

        # ensure recurring event showings exist
        showings = EventShowing.objects.filter(event=events.first())
        self.assertEqual(showings.count(), 3)

        for i, showing in enumerate(showings.order_by("start_time")):
            expected_start_time = start_time + datetime.timedelta(days=offset * i)
            expected_end_time = end_time + datetime.timedelta(days=offset * i)
            self.assertEqual(showing.event, events.first())
            self.assertEqual(showing.start_time, expected_start_time)
            self.assertEqual(showing.end_time, expected_end_time)

    def test_testimonials(self):
        """
        Test creating, listing, and deleting testimonials.
        """
        self.client.login(username=self.user5.username, password="test")

        # add some testimonials
        for i in range(3):
            resp = self.client.post(
                reverse("club-testimonials-list", args=(self.club1.code,)),
                {"text": f"This is testimonial #{i}!"},
                content_type="application/json",
            )
            self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure testimonials exist
        testimonials = Testimonial.objects.filter(club__code=self.club1.code)
        self.assertEqual(testimonials.count(), 3)

        # list testimonials
        resp = self.client.get(
            reverse("club-testimonials-list", args=(self.club1.code,))
        )
        self.assertEqual(resp.status_code, 200, resp.content)

        # delete testimonials
        for testimonial in testimonials:
            resp = self.client.delete(
                reverse(
                    "club-testimonials-detail", args=(self.club1.code, testimonial.id)
                )
            )
            self.assertIn(resp.status_code, [200, 204], resp.content)

    def test_member_views(self):
        """
        Test listing, adding, and removing members.
        """
        self.client.login(username=self.user5.username, password="test")

        # create club
        resp = self.client.post(
            reverse("clubs-list"),
            {
                "name": "Penn Labs",
                "description": "We code stuff.",
                "tags": [{"name": "Graduate"}],
                "email": "example@example.com",
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # list members
        resp = self.client.get(reverse("club-members-list", args=("penn-labs",)))
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode("utf-8"))
        self.assertEqual(data[0]["name"], self.user5.get_full_name())

        # add member should fail with insufficient permissions
        self.client.logout()

        resp = self.client.post(
            reverse("club-members-list", args=("penn-labs",)),
            {"person": self.user2.pk, "role": Membership.ROLE_OWNER},
            content_type="application/json",
        )

        self.assertIn(resp.status_code, [400, 403], resp.content)

        # add member
        self.client.login(username=self.user5.username, password="test")

        resp = self.client.post(
            reverse("club-members-list", args=("penn-labs",)),
            {"person": self.user2.pk, "role": Membership.ROLE_OFFICER},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        resp = self.client.post(
            reverse("club-members-list", args=("penn-labs",)),
            {"person": self.user3.pk, "role": Membership.ROLE_MEMBER},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        self.assertEqual(Club.objects.get(code="penn-labs").members.count(), 3)
        self.assertEqual(
            Membership.objects.get(person=self.user2, club__code="penn-labs").role,
            Membership.ROLE_OFFICER,
        )

        # list member
        resp = self.client.get(reverse("club-members-list", args=("penn-labs",)))
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode("utf-8"))
        for item in data:
            self.assertIn("name", item)
            self.assertIn("email", item)
            self.assertIn("role", item)

        # list member as outsider, with all users having show profiles off
        for mship in Membership.objects.filter(club__code="penn-labs"):
            prof = mship.person.profile
            prof.show_profile = False
            prof.save()

        self.client.logout()
        resp = self.client.get(reverse("club-members-list", args=("penn-labs",)))
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode("utf-8"))
        # ensure emails are hidden
        for item in data:
            self.assertFalse(item.get("email", None))

        # delete member should fail with insufficient permissions
        self.client.login(username=self.user2.username, password="test")

        resp = self.client.delete(
            reverse("club-members-detail", args=("penn-labs", self.user5.username)),
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # delete member should fail for people not in club
        self.client.login(username=self.user4.username, password="test")
        resp = self.client.delete(
            reverse("club-members-detail", args=("penn-labs", self.user5.username)),
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # cannot add self to a club that you're not in
        resp = self.client.post(
            reverse("club-members-list", args=("penn-labs",)),
            {"person": self.user4.pk, "role": Membership.ROLE_MEMBER},
        )
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # modify self to higher role should fail with insufficient permissions
        self.client.login(username=self.user2.username, password="test")
        resp = self.client.patch(
            reverse("club-members-detail", args=("penn-labs", self.user2.username)),
            {"role": Membership.ROLE_OWNER},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # promote member
        resp = self.client.patch(
            reverse("club-members-detail", args=("penn-labs", self.user3.username)),
            {"title": "Treasurer", "role": Membership.ROLE_OFFICER},
            content_type="application/json",
        )

        self.assertEqual(
            Membership.objects.get(person=self.user3, club__code="penn-labs").title,
            "Treasurer",
        )

        # delete member
        self.client.login(username=self.user5.username, password="test")

        resp = self.client.delete(
            reverse("club-members-detail", args=("penn-labs", self.user2.username)),
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 204], resp.content)

        # ensure cannot demote self if only owner and not superuser
        self.user5.is_superuser = False
        self.user5.save()

        resp = self.client.patch(
            reverse("club-members-detail", args=("penn-labs", self.user5.username)),
            {"role": Membership.ROLE_OFFICER},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # ensure cannot delete self if only owner
        resp = self.client.delete(
            reverse("club-members-detail", args=("penn-labs", self.user5.username)),
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_membership_auth(self):
        Membership.objects.create(club=self.club1, person=self.user1)
        self.client.login(username=self.user1.username, password="test")
        bad_tries = [{"title": "Supreme Leader"}, {"role": Membership.ROLE_OFFICER}]
        for bad in bad_tries:
            resp = self.client.patch(
                reverse(
                    "club-members-detail", args=(self.club1.code, self.user1.username)
                ),
                bad,
                content_type="application/json",
            )
            self.assertIn(resp.status_code, [400, 403], resp.content)

        good_tries = [
            {"active": True},
            {"active": False},
        ]
        for good in good_tries:
            resp = self.client.patch(
                reverse(
                    "club-members-detail", args=(self.club1.code, self.user1.username)
                ),
                good,
                content_type="application/json",
            )
            self.assertIn(resp.status_code, [200, 201], resp.content)

        resp = self.client.delete(
            reverse("club-members-detail", args=(self.club1.code, self.user1.username))
        )
        self.assertIn(resp.status_code, [200, 204], resp.content)

    def test_tag_views(self):
        # everyone can view the list of tags
        resp = self.client.get(reverse("tags-list"))
        self.assertIn(resp.status_code, [200], resp.content)

        # ensure that unauthenticated users cannot create tags
        resp = self.client.post(reverse("tags-list"), {"name": "Some Tag"})
        self.assertIn(resp.status_code, [400, 403, 405], resp.content)

        # ensure that unauthenticated users cannot delete tags
        resp = self.client.delete(reverse("tags-detail", args=(1,)))
        self.assertIn(resp.status_code, [400, 403, 405], resp.content)

    def test_club_create_empty(self):
        """
        Test creating a club with empty fields.
        """
        self.client.login(username=self.user4.username, password="test")

        resp = self.client.post(
            reverse("clubs-list"),
            {
                "code": "penn-labs",
                "name": "Penn Labs",
                "description": "This is an example description.",
                "tags": [{"name": "Graduate"}],
                "email": "example@example.com",
                "facebook": "",
                "twitter": "",
                "instagram": "",
                "website": "",
                "linkedin": "",
                "github": "",
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # continue these tests as not a superuser but still logged in
        self.assertFalse(self.user4.is_superuser)

        # club should start inactive
        club = Club.objects.get(code="penn-labs")
        self.assertFalse(club.active)

        # fetching the club should work
        resp = self.client.get(reverse("clubs-detail", args=(club.code,)))
        self.assertIn(resp.status_code, [200], resp.content)
        self.assertIn("code", resp.data)
        self.assertEqual(resp.data["code"], "penn-labs")

        # continue without user, make sure club is not visible
        self.client.logout()
        resp = self.client.get(reverse("clubs-list"))
        self.assertIn(resp.status_code, [200], resp.content)
        codes = [club["code"] for club in resp.data]
        self.assertNotIn(club.code, codes)

    def test_club_create_new_approval_queue_closed(self):
        """
        Test creating a club when the new approval queue is closed, but the
        reapproval queue is open.
        """
        self.client.login(username=self.user4.username, password="test")

        # Close new approval queue
        queue_settings = RegistrationQueueSettings.get()
        queue_settings.new_approval_queue_open = False
        queue_settings.save()

        resp = self.client.post(
            reverse("clubs-list"),
            {
                "code": "new-club",
                "name": "New Club",
                "description": "This is a new club.",
                "tags": [{"name": "Undergraduate"}],
                "email": "newclub@example.com",
            },
            content_type="application/json",
        )

        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertIn("The approval queue is not currently open.", str(resp.content))
        self.assertFalse(Club.objects.filter(code="new-club").exists())

    def test_club_approve(self):
        """
        Test approving an existing unapproved club.
        """
        self.client.login(username=self.user5.username, password="test")

        # mark club as unapproved
        self.club1.approved = None
        self.club1.save(update_fields=["approved"])

        # approve club
        resp = self.client.patch(
            reverse("clubs-detail", args=(self.club1.code,)),
            {"approved": True},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure database correctly updated
        self.club1.refresh_from_db()
        self.assertTrue(self.club1.approved)
        self.assertIsNotNone(self.club1.approved_on)
        self.assertIsNotNone(self.club1.approved_by)

    def test_club_display_after_deactivation_for_permissioned_vs_non_permissioned(self):
        """
        Test club retrieval after deactivation script runs. Non-permissioned users
        should see the last approved version of the club. Permissioned users (e.g.
        admins, club members) should see the most up-to-date version.
        """
        # club is approved before deactivation
        self.assertTrue(self.club1.approved)

        call_command("deactivate", "--force")

        club = self.club1
        club.refresh_from_db()

        # after deactivation, club should not be approved and should not have approver
        self.assertIsNone(club.approved)
        self.assertIsNone(club.approved_by)

        # non-permissioned users should see the last approved version
        non_admin_resp = self.client.get(reverse("clubs-detail", args=(club.code,)))
        self.assertEqual(non_admin_resp.status_code, 200)
        non_admin_data = non_admin_resp.json()
        self.assertTrue(non_admin_data["approved"])

        # permissioned users should see the club as it is in the DB
        self.client.login(username=self.user5.username, password="test")
        admin_resp = self.client.get(reverse("clubs-detail", args=(club.code,)))
        self.assertEqual(admin_resp.status_code, 200)
        admin_data = admin_resp.json()
        self.assertIsNone(admin_data["approved"])
        self.client.logout()

        cache.clear()

        # reversing the order of operations shouldn't change anything
        self.client.login(username=self.user5.username, password="test")
        admin_resp = self.client.get(reverse("clubs-detail", args=(club.code,)))
        self.assertEqual(admin_resp.status_code, 200)
        admin_data = admin_resp.json()
        self.assertIsNone(admin_data["approved"])
        self.client.logout()

        non_admin_resp = self.client.get(reverse("clubs-detail", args=(club.code,)))
        self.assertEqual(non_admin_resp.status_code, 200)
        non_admin_data = non_admin_resp.json()
        self.assertTrue(non_admin_data["approved"])

        # club object itself shouldn't have changed
        club.refresh_from_db()
        self.assertFalse(club.active)
        self.assertIsNone(club.approved)

    def test_club_create_url_sanitize(self):
        """
        Test creating clubs with malicious URLs.
        """
        self.client.login(username=self.user5.username, password="test")

        exploit_string = "javascript:alert(1)"

        resp = self.client.post(
            reverse("clubs-list"),
            {
                "name": "Bad Club",
                "tags": [],
                "facebook": exploit_string,
                "twitter": exploit_string,
                "instagram": exploit_string,
                "website": exploit_string,
                "linkedin": exploit_string,
                "github": exploit_string,
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_create_description_sanitize_good(self):
        """
        Ensure that descriptions are properly sanitized.
        """
        test_good_string = """<p>Here\'s some <b>bold</b>, <i>italic</i>,
<u>underline</u>, and a <a href=\"http://example.com\">link</a>.<br></p>
<ul>
    <li>One</li>
    <li>Two</li>
    <li>Three</li>
</ul>
<ol>
    <li>One</li>
    <li>Two</li>
    <li>Three</li>
</ol>
<img src=\"/test.png\">"""

        self.client.login(username=self.user5.username, password="test")

        resp = self.client.post(
            reverse("clubs-list"),
            {
                "name": "Penn Labs",
                "tags": [{"name": "Undergraduate"}],
                "description": test_good_string,
                "email": "example@example.com",
            },
            content_type="application/json",
        )
        cache.clear()
        self.assertIn(resp.status_code, [200, 201], resp.content)

        resp = self.client.get(reverse("clubs-detail", args=("penn-labs",)))
        self.assertIn(resp.status_code, [200], resp.content)

        data = json.loads(resp.content.decode("utf-8"))
        self.assertEqual(data["description"], test_good_string)

    def test_club_create_description_sanitize_bad(self):
        """
        Ensure that descriptions are properly sanitized.
        """
        test_bad_string = '<script>alert(1);</script><img src="javascript:alert(1)">'

        self.client.login(username=self.user5.username, password="test")

        resp = self.client.post(
            reverse("clubs-list"),
            {
                "name": "Penn Labs",
                "tags": [{"name": "Graduate"}],
                "description": test_bad_string,
                "email": "example@example.com",
            },
            content_type="application/json",
        )
        cache.clear()
        self.assertIn(resp.status_code, [200, 201], resp.content)

        resp = self.client.get(reverse("clubs-detail", args=("penn-labs",)))
        self.assertIn(resp.status_code, [200], resp.content)

        data = json.loads(resp.content.decode("utf-8"))
        self.assertNotIn("<script>", data["description"])
        self.assertNotIn("javascript:", data["description"])

    def test_club_create_no_input(self):
        """
        Passing in no data should result in a bad request.
        """
        self.client.login(username=self.user5.username, password="test")

        resp = self.client.post(
            reverse("clubs-list"), {}, content_type="application/json"
        )
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_create_nonexistent_tag(self):
        """
        Creating a club with nonexistent tags should throw an error.
        """
        self.client.login(username=self.user5.username, password="test")

        resp = self.client.post(
            reverse("clubs-list"),
            {
                "name": "Penn Labs",
                "description": "We code stuff.",
                "email": "contact@pennlabs.org",
                "tags": [{"name": "totally definitely nonexistent tag"}],
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400, 404], resp.content)

    def test_club_create_no_auth(self):
        """
        Creating a club without authentication should result in an error.
        """
        resp = self.client.post(
            reverse("clubs-list"),
            {
                "name": "Penn Labs",
                "description": "We code stuff.",
                "email": "contact@pennlabs.org",
                "facebook": "966590693376781",
                "twitter": "@Penn",
                "instagram": "@uofpenn",
                "tags": [],
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_create(self):
        """
        Test properly creating a club.
        """
        tag1 = Tag.objects.create(name="Wharton")
        tag2 = Tag.objects.create(name="Engineering")

        badge1 = Badge.objects.create(label="SAC Funded", purpose="org")
        school1 = School.objects.create(name="Engineering", is_graduate=False)
        School.objects.create(name="Wharton", is_graduate=False)

        self.client.login(username=self.user5.username, password="test")

        resp = self.client.post(
            reverse("clubs-list"),
            {
                "name": "Penn Labs",
                "description": "We code stuff.",
                "badges": [{"label": "SAC Funded"}],
                "tags": [
                    {"name": tag1.name},
                    {"name": tag2.name},
                    {"name": "Graduate"},
                ],
                "target_schools": [{"id": school1.id}],
                "email": "example@example.com",
                "facebook": "https://www.facebook.com/groups/966590693376781/"
                + "?ref=nf_target&fref=nf",
                "twitter": "https://twitter.com/Penn",
                "instagram": "https://www.instagram.com/uofpenn/?hl=en",
                "website": "https://pennlabs.org",
                "linkedin": "https://www.linkedin.com"
                "/school/university-of-pennsylvania/",
                "youtube": "https://youtu.be/dQw4w9WgXcQ",
                "github": "https://github.com/pennlabs",
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure club was actually created
        club_obj = Club.objects.filter(name="Penn Labs").first()
        self.assertTrue(club_obj)
        self.assertEqual(Membership.objects.filter(club=club_obj).count(), 1)
        self.assertEqual(club_obj.members.count(), 1)
        self.assertEqual(club_obj.target_schools.count(), 1)

        # ensure lookup returns the correct information
        resp = self.client.get(reverse("clubs-detail", args=("penn-labs",)))
        self.assertIn(resp.status_code, [200], resp.content)

        data = json.loads(resp.content.decode("utf-8"))
        self.assertEqual(data["code"], "penn-labs")
        self.assertEqual(data["name"], "Penn Labs")
        self.assertEqual(data["description"], "We code stuff.")
        self.assertTrue(data["tags"], data)
        self.assertEqual(data["members"][0]["name"], self.user5.get_full_name())

        for link in [
            "facebook",
            "twitter",
            "instagram",
            "website",
            "github",
            "youtube",
        ]:
            self.assertIn(link, data)

        self.assertEqual(club_obj.badges.count(), 1)
        self.assertEqual(club_obj.badges.all()[0].label, badge1.label)

    def test_club_create_duplicate(self):
        """
        Creating a duplicate club should result in an 400 error.
        """
        self.client.login(username=self.user5.username, password="test")

        resp = self.client.post(
            reverse("clubs-list"),
            {"name": "Test Club", "tags": []},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_list_search(self):
        """
        Test simple club filtering.
        """
        resp = self.client.get(reverse("clubs-list") + "?search=test")
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode("utf-8"))
        self.assertTrue(data)

    def test_club_list_filter(self):
        """
        Test complex club filtering.
        """
        with open(os.devnull, "w") as f:
            call_command("populate", stdout=f)

        prof_tag_id = Tag.objects.filter(name="Professional").first().id
        athl_tag_id = Tag.objects.filter(name="Athletics").first().id

        # query will be in the format /clubs/?format=json&<query>
        # output should be an exact match in terms of clubs returned
        queries = [
            {"query": "tags=Professional,Athletics", "results": ["pppjo"]},
            {"query": f"tags={prof_tag_id},{athl_tag_id}", "results": ["pppjo"]},
            {
                "query": "tags__or=Professional,Athletics",
                "results": ["harvard-rejects", "empty-club", "pppjo"],
            },
            {"query": "founded__lt=2000", "results": ["pppjo"]},
            {"query": "tags=Professional&founded__lt=2000", "results": ["pppjo"]},
            {"query": "accepting_members=true", "results": ["pppjo", "empty-club"]},
            {
                "query": f"size__or={Club.SIZE_MEDIUM},{Club.SIZE_LARGE}",
                "results": ["pppjo", "lorem-ipsum"],
            },
            {
                "query": f"application_required={Club.OPEN_MEMBERSHIP}",
                "results": ["pppjo"],
            },
        ]

        for query in queries:
            resp = self.client.get(
                f"{reverse('clubs-list')}?format=json&{query['query']}"
            )
            self.assertIn(resp.status_code, [200], resp.content)
            data = json.loads(resp.content.decode("utf-8"))
            codes = [club["code"] for club in data]
            self.assertEqual(set(codes), set(query["results"]), (query, resp.content))

    def test_club_detail_diff(self):
        """
        Test that diff returns the correct old and new club for a club in approval queue
        """

        # create club that requires approval
        new_club = Club.objects.create(
            code="new-club",
            name="New Club",
            description="We're the spirits of open source.",
            approved=None,
            active=True,
            email="example@example.com",
        )

        # add officer to club
        Membership.objects.create(
            person=self.user4, club=new_club, role=Membership.ROLE_OFFICER
        )

        # login to officer user
        self.client.login(username=self.user4.username, password="test")

        # New club should not have any old data
        resp = self.client.get(reverse("clubs-club-detail-diff", args=(new_club.code,)))
        data = json.loads(resp.content.decode("utf-8"))

        self.assertEqual(data["new-club"]["name"]["new"], "New Club")
        self.assertEqual(data["new-club"]["name"]["old"], None)

        self.assertEqual(
            data["new-club"]["description"]["new"], "We're the spirits of open source."
        )
        self.assertEqual(data["new-club"]["description"]["old"], None)

        self.assertEqual(data["new-club"]["image"]["new"], "")
        self.assertEqual(data["new-club"]["image"]["old"], None)

        # approve club
        new_club.approved = True
        new_club.save(update_fields=["approved"])
        new_club.refresh_from_db()
        self.assertTrue(new_club.approved)

        # trigger reapproval by changing name
        resp = self.client.patch(
            reverse("clubs-detail", args=(new_club.code,)),
            {"name": "New Club 2"},
            content_type="application/json",
        )

        # Ensure change successful
        self.assertIn(resp.status_code, [200, 201], resp.content)

        resp = self.client.get(reverse("clubs-club-detail-diff", args=(new_club.code,)))
        data = json.loads(resp.content.decode("utf-8"))

        new_club.refresh_from_db()
        self.assertFalse(new_club.approved)
        self.assertEqual(data["new-club"]["name"]["new"], "New Club 2")

        # approve club
        new_club.approved = True
        new_club.save(update_fields=["approved"])
        new_club.refresh_from_db()
        self.assertTrue(new_club.approved)

        # changing description should not trigger reapproval.
        # Might later be changed back to trigger reapproval
        resp = self.client.patch(
            reverse("clubs-detail", args=(new_club.code,)),
            {"description": "We are open source, expect us."},
            content_type="application/json",
        )

        # Ensure change successful
        self.assertIn(resp.status_code, [200, 201], resp.content)
        new_club.refresh_from_db()
        self.assertTrue(new_club.approved)

        resp = self.client.get(reverse("clubs-club-detail-diff", args=(new_club.code,)))
        data = json.loads(resp.content.decode("utf-8"))
        self.assertEqual(
            data["new-club"],
            "No changes that require approval made since last approval",
        )

        # change club name twice before approval
        resp = self.client.patch(
            reverse("clubs-detail", args=(new_club.code,)),
            {"name": "New Club 3"},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)
        resp = self.client.patch(
            reverse("clubs-detail", args=(new_club.code,)),
            {"name": "New Club 4"},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # Ensure club is marked as not approved
        new_club.refresh_from_db()
        self.assertFalse(new_club.approved)

        resp = self.client.get(reverse("clubs-club-detail-diff", args=(new_club.code,)))
        data = json.loads(resp.content.decode("utf-8"))

        # should have latest unapproved name
        self.assertEqual(
            data["new-club"]["name"]["new"],
            "New Club 4",
        )
        # should have latest approved name
        self.assertEqual(
            data["new-club"]["name"]["old"],
            "New Club 2",
        )
        # should have latest description, since description doesn't require reapproval
        self.assertEqual(
            data["new-club"]["description"]["new"],
            "We are open source, expect us.",
        )
        # should have latest description
        self.assertEqual(
            data["new-club"]["description"]["old"],
            "We are open source, expect us.",
        )
        # difference will just return current description
        self.assertEqual(
            data["new-club"]["description"]["diff"],
            "We are open source, expect us.",
        )

        resp = self.client.patch(
            reverse("clubs-detail", args=(new_club.code,)),
            {"description": "We are not open, do not expect us."},
            content_type="application/json",
        )

        self.assertIn(resp.status_code, [200, 201], resp.content)

        resp = self.client.get(reverse("clubs-club-detail-diff", args=(new_club.code,)))
        data = json.loads(resp.content.decode("utf-8"))

        self.assertEqual(
            data["new-club"]["description"]["diff"],
            """We are <ins style="text-decoration: none; background-color: #dafdd5; """
            """opacity: 1;">not </ins>open<ins style="text-decoration: none; backg"""
            """round-color: #dafdd5; opacity: 1;">,</ins> <del style="text-decorati"""
            """on: none; background-color: #ffbdbd; opacity: 0.8;">source,</del><in"""
            """s style="text-decoration: none; background-color: #dafdd5; opacity: """
            """1;">do not</ins> expect us.""",
        )

        # attempt to get diff of approved club
        new_club.approved = True
        new_club.save(update_fields=["approved"])
        new_club.refresh_from_db()
        self.assertTrue(new_club.approved)
        resp3 = self.client.get(
            reverse("clubs-club-detail-diff", args=(new_club.code,))
        )
        new_data1 = json.loads(resp3.content.decode("utf-8"))
        self.assertEqual(
            new_data1["new-club"],
            "No changes that require approval made since last approval",
        )

    def test_club_modify_wrong_auth(self):
        """
        Outsiders should not be able to modify a club.
        """
        self.client.login(username=self.user4.username, password="test")
        resp = self.client.patch(
            reverse("clubs-detail", args=(self.club1.code,)),
            {"description": "We do stuff.", "tags": []},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_modify_insufficient_auth(self):
        """
        Ordinary members should not be able to modify the club.
        """
        Membership.objects.create(
            club=Club.objects.get(code=self.club1.code), person=self.user2
        )
        self.client.login(username=self.user2.username, password="test")
        resp = self.client.patch(
            reverse("clubs-detail", args=(self.club1.code,)),
            {"description": "We do stuff.", "tags": []},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_retrieve(self):
        """
        Ordinary members should be able to retrieve the club.
        """
        Membership.objects.create(
            club=Club.objects.get(code=self.club1.code), person=self.user2
        )
        self.client.login(username=self.user2.username, password="test")
        resp = self.client.get(reverse("clubs-detail", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [200], resp.content)

    def test_club_children(self):
        """
        Any user should be able to view clubs children tree.
        """
        self.client.login(username=self.user3.username, password="test")
        resp = self.client.get(reverse("clubs-children", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [200], resp.content)

    def test_club_modify(self):
        """
        Owners and officers should be able to modify the club.
        """
        tag3 = Tag.objects.create(name="College")

        Membership.objects.create(
            person=self.user1, club=self.club1, role=Membership.ROLE_OWNER
        )

        self.client.login(username=self.user1.username, password="test")

        resp = self.client.patch(
            reverse("clubs-detail", args=(self.club1.code,)),
            {
                "description": "We do stuff.",
                "tags": [{"name": tag3.name}, {"name": "Graduate"}],
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure that changes were made
        resp = self.client.get(reverse("clubs-detail", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [200], resp.content)

        data = json.loads(resp.content.decode("utf-8"))
        self.assertEqual(data["description"], "We do stuff.")
        self.assertEqual(len(data["tags"]), 2)

    def test_club_archive_no_auth(self):
        """
        Unauthenticated users should not be able to archive a club.
        """
        resp = self.client.delete(reverse("clubs-detail", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_archive(self):
        """
        Owners should be able to archive the club.
        """
        self.client.login(username=self.user5.username, password="test")

        # archive club
        resp = self.client.delete(reverse("clubs-detail", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [200, 204], resp.content)

        # ensure archived was correctly recorded
        club = Club.objects.filter(archived=True).first()
        self.assertTrue(club is not None)
        self.assertEqual(club.code, self.club1.code)
        self.assertTrue(club.archived)
        self.assertEqual(club.archived_by, self.user5)

        # ensure club was taken off clubs endpoint
        resp = self.client.get(reverse("clubs-list"))
        self.assertIn(resp.status_code, [200], resp.content)
        codes = [club["code"] for club in resp.data]
        self.assertNotIn(self.club1.code, codes)

        # unarchive club
        self.club1.archived = False
        self.club1.archived_by = None
        self.club1.archived_on = None
        self.club1.save()

        # ensure club was put back on clubs endpoint
        resp = self.client.get(reverse("clubs-list"))
        self.assertIn(resp.status_code, [200], resp.content)
        codes = [club["code"] for club in resp.data]
        self.assertIn(self.club1.code, codes)

    def test_club_deactivate(self):
        """
        Owners should be able to deactivate the club.
        """
        self.client.login(username=self.user5.username, password="test")

        resp = self.client.patch(
            reverse("clubs-detail", args=(self.club1.code,)),
            {"active": False},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 204], resp.content)

        # ensure club was deactivated
        self.assertFalse(Club.objects.get(name="Test Club").active)

    def test_club_deactivate_insufficient_auth(self):
        """
        Officers should not be able to deactivate the club.
        """
        Membership.objects.create(
            club=self.club1, person=self.user2, role=Membership.ROLE_MEMBER
        )
        self.client.login(username=self.user2.username, password="test")
        resp = self.client.patch(
            reverse("clubs-detail", args=(self.club1.code,)),
            {"active": False},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_bypass_for_invite(self):
        """
        Test the bypass feature for retrieving a single club that is inactive.
        This is required in order for the invitation page to work correctly.
        """
        # ensure that this all works without an active club
        self.club1.active = False
        self.club1.approved = None
        self.club1.save()

        # login to a non superuser
        self.client.login(username=self.user4.username, password="test")
        self.assertFalse(self.user4.is_superuser)

        resp = self.client.get(
            reverse("clubs-detail", args=(self.club1.code,)) + "?bypass=true"
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)
        self.assertIn("code", resp.data)

    def test_club_invite(self):
        """
        Test the email invitation feature.
        """
        # ensure that this all works without an active club
        self.club1.active = False
        self.club1.approved = None
        self.club1.save()

        # login to a superuser
        self.client.login(username=self.user5.username, password="test")

        resp = self.client.post(
            reverse("club-invite", args=(self.club1.code,)),
            {
                "emails": "one@pennlabs.org, two@pennlabs.org, three@pennlabs.org",
                "role": Membership.ROLE_OFFICER,
                "title": "Member",
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)
        data = json.loads(resp.content.decode("utf-8"))

        # ensure membership invite was created
        invites = MembershipInvite.objects.filter(club__code=self.club1.code)
        self.assertEqual(invites.count(), 3, data)
        self.assertEqual(
            list(invites.values_list("role", flat=True)),
            [Membership.ROLE_OFFICER] * 3,
            data,
        )
        self.assertEqual(len(mail.outbox), 3, mail.outbox)

        # ensure we can get all memberships
        ids_and_tokens = MembershipInvite.objects.filter(
            club__code=self.club1.code
        ).values_list("id", "token")
        for id, token in ids_and_tokens:
            resp = self.client.get(
                reverse("club-invites-detail", args=(self.club1.code, id))
            )
            self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure invite can be redeemed
        self.client.login(username=self.user5.username, password="test")

        resp = self.client.patch(
            reverse(
                "club-invites-detail", args=(self.club1.code, ids_and_tokens[0][0])
            ),
            {"token": ids_and_tokens[0][1], "public": True},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        flt = Membership.objects.filter(club=self.club1, person=self.user5)
        self.assertTrue(flt.exists())
        self.assertTrue(flt.first().public)

        # ensure invite cannot be reclaimed
        resp = self.client.patch(
            reverse(
                "club-invites-detail", args=(self.club1.code, ids_and_tokens[0][0])
            ),
            {"token": ids_and_tokens[0][1]},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400, 403, 404], resp.content)

        # ensure invite can be deleted
        self.client.login(username=self.user5.username, password="test")
        resp = self.client.delete(
            reverse("club-invites-detail", args=(self.club1.code, ids_and_tokens[1][0]))
        )
        self.assertIn(resp.status_code, [200, 204], resp.content)

        # ensure a second invite can be claimed without toggling on public status
        # when user is not a superuser
        self.client.login(username=self.user4.username, password="test")
        self.assertFalse(self.user4.is_superuser)

        # ensure fetching invite information works
        resp = self.client.get(
            reverse("club-invites-detail", args=(self.club1.code, ids_and_tokens[2][0]))
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)
        self.assertIn("id", resp.data)

        # ensure redeeming invite works
        resp = self.client.patch(
            reverse(
                "club-invites-detail", args=(self.club1.code, ids_and_tokens[2][0])
            ),
            {"token": ids_and_tokens[2][1], "public": False},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        flt = Membership.objects.filter(club=self.club1, person=self.user4)
        self.assertTrue(flt.exists())
        self.assertFalse(flt.first().public)

    def test_club_invite_email_check(self):
        self.client.login(username=self.user5.username, password="test")

        resp = self.client.post(
            reverse("club-invite", args=(self.club1.code,)),
            {
                "emails": "test@example.upenn.edu",
                "role": Membership.ROLE_OFFICER,
                "title": "Member",
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        invite = MembershipInvite.objects.filter(club__code=self.club1.code).first()

        self.client.login(username=self.user1.username, password="test")

        resp = self.client.patch(
            reverse("club-invites-detail", args=(self.club1.code, invite.id)),
            {"token": invite.token},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        self.assertTrue(len(mail.outbox), 2)

    def test_club_invite_email_resend(self):
        self.client.login(username=self.user5.username, password="test")

        resp = self.client.post(
            reverse("club-invite", args=(self.club1.code,)),
            {
                "emails": "test@example.upenn.edu",
                "role": Membership.ROLE_MEMBER,
                "title": "Member",
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        invite = MembershipInvite.objects.filter(club__code=self.club1.code).first()

        resp = self.client.put(
            reverse("club-invites-resend", args=(self.club1.code, invite.id)),
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

    def test_send_invite_with_acceptance_email(self):
        self.client.login(username=self.user1.username, password="test")

        # Create a club application
        now = timezone.now()
        application = ClubApplication.objects.create(
            name="Ordinary Name",
            club=self.club1,
            application_start_time=now,
            application_end_time=now + timezone.timedelta(days=1),
            result_release_time=now + timezone.timedelta(days=2),
            is_wharton_council=False,
        )
        application.save()

        applicants = [self.user1, self.user2, self.user3, self.user4, self.user5]
        statuses = [
            ApplicationSubmission.ACCEPTED,
            ApplicationSubmission.ACCEPTED,
            ApplicationSubmission.REJECTED_AFTER_INTERVIEW,
            ApplicationSubmission.REJECTED_AFTER_WRITTEN,
            ApplicationSubmission.PENDING,
        ]

        # Create submissions for each applicant
        ApplicationSubmission.objects.bulk_create(
            [
                ApplicationSubmission(
                    user=applicant,
                    application=application,
                    committee=None,
                    status=status,
                    reason="a reason",
                )
                for applicant, status in zip(applicants, statuses)
            ]
        )

        # Send acceptance & invitation emails
        resp = self.client.post(
            reverse(
                "club-applications-send-emails",
                kwargs={"club_code": self.club1.code, "pk": application.pk},
            ),
            {
                "allow_resend": True,
                "dry_run": False,
                "email_type": {"id": "acceptance", "name": "Acceptance"},
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # Check that invitations were created
        invite1 = MembershipInvite.objects.filter(
            club=application.club, email=self.user1.email
        ).first()
        invite2 = MembershipInvite.objects.filter(
            club=application.club, email=self.user2.email
        ).first()
        self.assertIsNotNone(invite1)
        self.assertIsNotNone(invite2)

        expiry_date = now + timezone.timedelta(days=5)

        # Compare the expiry dates excluding microseconds
        self.assertLessEqual(
            abs(invite1.expires_at - expiry_date), timezone.timedelta(minutes=5)
        )

        self.assertLessEqual(
            abs(invite2.expires_at - expiry_date), timezone.timedelta(minutes=5)
        )

        # Check that applicants not accepted are not invited
        self.assertFalse(
            MembershipInvite.objects.filter(
                club=application.club, email=self.user3.email
            ).exists()
        )
        self.assertFalse(
            MembershipInvite.objects.filter(
                club=application.club, email=self.user4.email
            ).exists()
        )
        self.assertFalse(
            MembershipInvite.objects.filter(
                club=application.club, email=self.user5.email
            ).exists()
        )

    def test_club_application_duplicate_committees(self):
        """
        Test that duplicate committees are not allowed
        """
        self.client.login(username=self.user5.username, password="test")

        # Creating new application with duplicate committees
        resp = self.client.post(
            reverse("club-applications-list", args=(self.club1.code,)),
            data={
                "name": "Test Application",
                "application_start_time": timezone.now() + timezone.timedelta(days=1),
                "application_end_time": timezone.now() + timezone.timedelta(days=2),
                "result_release_time": timezone.now() + timezone.timedelta(days=3),
                "committees": [{"name": "Committee 1"}, {"name": "Committee 1"}],
            },
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Committee names must be unique", str(resp.content))

        # Patching existing application with duplicate committees
        application = ClubApplication.objects.create(
            name="Test Application",
            club=self.club1,
            application_start_time=timezone.now() + timezone.timedelta(days=1),
            application_end_time=timezone.now() + timezone.timedelta(days=2),
            result_release_time=timezone.now() + timezone.timedelta(days=3),
            is_wharton_council=False,
        )

        resp = self.client.patch(
            reverse("club-applications-detail", args=(self.club1.code, application.id)),
            {"committees": [{"name": "Committee 1"}, {"name": "Committee 1"}]},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Committee names must be unique", str(resp.content))

    def test_club_invite_insufficient_auth(self):
        self.client.login(username=self.user2.username, password="test")
        Membership.objects.create(person=self.user2, club=self.club1)

        resp = self.client.post(
            reverse("club-invite", args=(self.club1.code,)),
            {"emails": "one@pennlabs.org, two@pennlabs.org, three@pennlabs.org"},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_invite_insufficient_permissions(self):
        self.client.login(username=self.user2.username, password="test")
        Membership.objects.create(
            person=self.user2, club=self.club1, role=Membership.ROLE_OFFICER
        )

        resp = self.client.post(
            reverse("club-invite", args=(self.club1.code,)),
            {
                "emails": "one@pennlabs.org, two@pennlabs.org, three@pennlabs.org",
                "role": Membership.ROLE_OWNER,
                "title": "Supreme Leader",
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_has_badges(self):
        badge = Badge(label="SAC Funded", description="", visible=True)
        badge.save()
        self.club1.badges.add(badge)
        resp = self.client.get(reverse("clubs-detail", args=(self.club1.code,)))
        club = json.loads(resp.content)
        badge_json = club["badges"][0]
        self.assertEqual(badge.label, badge_json["label"])

    def test_create_note(self):
        self.client.login(username=self.user2.username, password="test")

        # Try to create note without permissions
        resp = self.client.post(
            reverse("clubs-detail", args=(self.club1.code,)) + "notes/",
            {
                "creator": self.user2.username,
                "creating_club": self.club1.code,
                "subject_club": self.club1.code,
                "title": "Note1",
                "content": "Content",
                "creating_club_permission": 20,
                "outside_club_permission": 0,
            },
            content_type="application/json",
        )

        self.assertIn(resp.status_code, [400, 403], resp.content)

        Membership.objects.create(
            person=self.user2, club=self.club1, role=Membership.ROLE_OFFICER
        )

        # Creating note after given permissions
        resp = self.client.post(
            reverse("clubs-detail", args=(self.club1.code,)) + "notes/",
            {
                "creator": self.user2.username,
                "creating_club": self.club1.code,
                "subject_club": self.club1.code,
                "title": "Note1",
                "content": "Content",
                "creating_club_permission": 20,
                "outside_club_permission": 0,
            },
            content_type="application/json",
        )

        self.assertIn(resp.status_code, [200, 201], resp.content)

        # Still cannot create note above permission level
        resp = self.client.post(
            reverse("clubs-detail", args=(self.club1.code,)) + "notes/",
            {
                "creator": self.user2.username,
                "creating_club": self.club1.code,
                "subject_club": self.club1.code,
                "title": "Note1",
                "content": "Content",
                "creating_club_permission": 0,
                "outside_club_permission": 0,
            },
            content_type="application/json",
        )

        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_report_selects_one_field(self):
        res = self.client.get(
            reverse("clubs-list"), {"format": "xlsx", "fields": "name"}
        )
        self.assertEqual(200, res.status_code)
        self.assertEqual(1, len(res.data))
        self.assertTrue(isinstance(res.data[0], dict))
        self.assertEqual(1, len(res.data[0]))

    def test_club_report_selects_few_fields(self):
        res = self.client.get(
            reverse("clubs-list"), {"format": "xlsx", "fields": "name,code"}
        )
        self.assertEqual(200, res.status_code)
        self.assertEqual(1, len(res.data))
        self.assertTrue(isinstance(res.data[0], dict))
        self.assertEqual(2, len(res.data[0]))

    def test_club_report_selects_all_fields(self):
        res = self.client.get(reverse("clubs-list"), {"format": "xlsx"})
        self.assertEqual(200, res.status_code)
        self.assertEqual(1, len(res.data))
        self.assertTrue(isinstance(res.data[0], dict))
        self.assertTrue(len(res.data[0]) > 2)

    def test_club_members_report(self):
        # login for extended member information
        self.client.login(username=self.user5.username, password="test")

        # add a membership
        Membership.objects.create(person=self.user5, club=self.club1)

        # generate the report
        resp = self.client.get(
            reverse("club-members-list", args=("test-club",)), {"format": "xlsx"}
        )
        self.assertEqual(200, resp.status_code)
        self.assertEqual(1, len(resp.data))

    def test_club_subscriptions_report(self):
        resp = self.client.get(
            reverse("clubs-subscription", args=("test-club",)), {"format": "xlsx"}
        )
        self.assertEqual(200, resp.status_code)

    def test_club_questions(self):
        resp = self.client.get(reverse("club-questions-list", args=("test-club",)))
        self.assertEqual(200, resp.status_code)

        # ensure only approved questions are shown
        self.assertEqual(1, len(resp.data))

    def test_club_question_answer(self):
        # add officer to club
        Membership.objects.create(
            person=self.user5, club=self.club1, role=Membership.ROLE_OFFICER
        )

        # login to an account
        self.client.login(username=self.user4.username, password="test")

        # fetch question list from server
        resp = self.client.get(reverse("club-questions-list", args=("test-club",)))
        self.assertEqual(200, resp.status_code)
        old_count = len(resp.data)

        # generate a question
        resp = self.client.post(
            reverse("club-questions-list", args=("test-club",)),
            {"question": "Is this club cool?", "is_anonymous": False},
        )
        question_id = json.loads(resp.content.decode("utf-8"))["id"]
        self.assertIn(resp.status_code, [200, 201])

        # fetch question list from server
        resp = self.client.get(reverse("club-questions-list", args=("test-club",)))
        self.assertEqual(200, resp.status_code)

        # ensure question appears in response
        self.assertEqual(len(resp.data), old_count + 1, resp.data)

        # ensure email was sent out notifying officer of question
        self.assertEqual(len(mail.outbox), 1, mail.outbox)

        # ensure that unliking a question answer that is not yet liked does nothing
        resp = self.client.post(
            reverse(
                "club-questions-unlike",
                args=(
                    "test-club",
                    question_id,
                ),
            )
        )
        self.assertEqual(200, resp.status_code)
        resp = self.client.get(reverse("club-questions-list", args=("test-club",)))
        data = json.loads(resp.content.decode("utf-8"))
        for question in data:
            self.assertEqual(0, question["likes"])

        # test if question answer was liked successfully
        resp = self.client.post(
            reverse(
                "club-questions-like",
                args=(
                    "test-club",
                    question_id,
                ),
            )
        )
        self.assertEqual(200, resp.status_code)
        resp = self.client.get(reverse("club-questions-list", args=("test-club",)))
        data = json.loads(resp.content.decode("utf-8"))
        for question in data:
            if question["id"] == question_id:
                self.assertEqual(1, question["likes"])
                self.assertTrue(question["user_liked"])
            else:
                self.assertEqual(0, question["likes"])

        # ensures liking a question answer twice does not increase the number of likes
        resp = self.client.post(
            reverse(
                "club-questions-like",
                args=(
                    "test-club",
                    question_id,
                ),
            )
        )
        self.assertEqual(200, resp.status_code)
        resp = self.client.get(reverse("club-questions-list", args=("test-club",)))
        data = json.loads(resp.content.decode("utf-8"))
        for question in data:
            if question["id"] == question_id:
                self.assertEqual(1, question["likes"])

        # check if question answer was unliked successfully
        resp = self.client.post(
            reverse(
                "club-questions-unlike",
                args=(
                    "test-club",
                    question_id,
                ),
            )
        )
        self.assertEqual(200, resp.status_code)
        resp = self.client.get(reverse("club-questions-list", args=("test-club",)))
        data = json.loads(resp.content.decode("utf-8"))
        for question in data:
            self.assertEqual(0, question["likes"])

    def test_club_sensitive_field_renew(self):
        """
        When editing sensitive fields like the name, description, and club image,
        require the club to be reapproved.
        """
        club = self.club1

        # ensure club is approved
        self.assertTrue(club.approved)

        # add officer to club
        Membership.objects.create(
            person=self.user4, club=club, role=Membership.ROLE_OFFICER
        )

        # login to officer user
        self.client.login(username=self.user4.username, password="test")

        # Close reapproval queue
        queue_settings = RegistrationQueueSettings.get()
        queue_settings.reapproval_queue_open = False
        queue_settings.save()

        for field in {"name"}:
            # edit sensitive field
            resp = self.client.patch(
                reverse("clubs-detail", args=(club.code,)),
                {field: "New Club Name/Description"},
                content_type="application/json",
            )
            self.assertIn(resp.status_code, [400], resp.content)

            # ensure club is marked as approved (request didn't go through)
            club.refresh_from_db()
            self.assertTrue(club.approved)

        # ensure that explicit reapproval requests without sensitive fields are
        # still not allowed
        club.approved = False
        club.save(update_fields=["approved"])
        resp = self.client.patch(
            reverse("clubs-detail", args=(club.code,)),
            {"approved": None},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [400], resp.content)
        club.approved = True
        club.save(update_fields=["approved"])

        # ensure that non-reapproval requests are still allowed
        resp = self.client.patch(
            reverse("clubs-detail", args=(club.code,)),
            {"address": "1234 Walnut St."},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)
        # Re-open reapproval queue
        queue_settings.reapproval_queue_open = True
        queue_settings.save()

        # store result of approval history query
        resp = self.client.get(reverse("clubs-history", args=(club.code,)))
        self.assertIn(resp.status_code, [200], resp.content)
        previous_history = json.loads(resp.content.decode("utf-8"))
        self.assertTrue(previous_history[0]["approved"])

        for field in {"name"}:
            # edit sensitive field
            resp = self.client.patch(
                reverse("clubs-detail", args=(club.code,)),
                {field: "New Club Name/Description"},
                content_type="application/json",
            )
            self.assertIn(resp.status_code, [200, 201], resp.content)
            resp = self.client.get(reverse("clubs-history", args=(club.code,)))
            # find the approval history
            resp = self.client.get(reverse("clubs-history", args=(club.code,)))
            self.assertIn(resp.status_code, [200], resp.content)
            history = json.loads(resp.content.decode("utf-8"))
            self.assertEqual(len(history), len(previous_history) + 1)
            self.assertFalse(history[0]["approved"])

            # ensure club is marked as not approved
            club.refresh_from_db()
            self.assertFalse(club.approved)

            # reset to approved
            club.approved = True
            club.save(update_fields=["approved"])

        # login to superuser account
        self.client.login(username=self.user5.username, password="test")

        # ensure editing works with skipping approval
        resp = self.client.patch(
            reverse("clubs-detail", args=(club.code,)),
            {field: "New Club Name/Description #2"},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure club is still marked as approved
        club.refresh_from_db()
        self.assertTrue(club.approved)

    def test_club_detail_endpoints_unauth(self):
        """
        Ensure that club based endpoints are not usable by unauthenticated users.
        """
        club = self.club1

        # subscription endpoint should fail
        resp = self.client.get(
            reverse("clubs-subscription", args=(club.code,)),
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [401, 403], resp.content)

        # membership requests should fail
        resp = self.client.get(
            reverse("club-membership-requests-list", args=(club.code,)),
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [401, 403], resp.content)

        # uploading image should fail
        resp = self.client.post(
            reverse("clubs-upload", args=(club.code,)), content_type="application/json"
        )
        self.assertIn(resp.status_code, [401, 403], resp.content)

        # uploading file should fail
        resp = self.client.post(
            reverse("clubs-upload-file", args=(club.code,)),
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [401, 403], resp.content)

    def test_club_detail_endpoints_insufficient_auth(self):
        """
        Ensure that the club based endpoints are not usable by users with
        insufficient auth.
        """
        # login to account
        self.client.login(username=self.user4.username, password="test")

        club = self.club1

        # ensure account is not a member
        self.assertFalse(club.membership_set.filter(person=self.user4).exists())

        # subscription endpoint should fail
        resp = self.client.get(
            reverse("clubs-subscription", args=(club.code,)),
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [401, 403], resp.content)

        # membership requests should fail
        resp = self.client.get(
            reverse("club-membership-requests-list", args=(club.code,)),
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [401, 403], resp.content)

        # uploading image should fail
        resp = self.client.post(
            reverse("clubs-upload", args=(club.code,)), content_type="application/json"
        )
        self.assertIn(resp.status_code, [401, 403], resp.content)

        # uploading file should fail
        resp = self.client.post(
            reverse("clubs-upload-file", args=(club.code,)),
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [401, 403], resp.content)

    def test_club_renew(self):
        # run deactivate script
        with open(os.devnull, "w") as f:
            call_command("deactivate", "--force", stdout=f)

        # count already sent emails
        mail_count = len(mail.outbox)

        # choose a club
        club = self.club1

        # add a badge to the club
        badge = Badge.objects.create(
            label="Test Badge", description="This is a test badge!"
        )
        club.badges.add(badge)

        # add officer to club
        Membership.objects.create(
            person=self.user4, club=club, role=Membership.ROLE_OFFICER
        )

        # login to officer account
        self.client.login(username=self.user4.username, password="test")

        # mark the club as active (student side renewal)
        resp = self.client.patch(
            reverse("clubs-detail", args=(club.code,)),
            {"active": True},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure a confirmation email was sent
        self.assertEqual(len(mail.outbox), mail_count + 1, mail.outbox)

        # reinit the count
        mail_count = len(mail.outbox)

        # add approve privileges to account
        content_type = ContentType.objects.get_for_model(Club)
        self.user3.user_permissions.add(
            Permission.objects.get(codename="approve_club", content_type=content_type)
        )
        self.user3.user_permissions.add(
            Permission.objects.get(
                codename="see_pending_clubs", content_type=content_type
            )
        )

        # ensure user is not superuser
        self.assertFalse(self.user3.is_superuser)

        # login to account with approve club privilege
        self.client.login(username=self.user3.username, password="test")

        # approve the club
        resp = self.client.patch(
            reverse("clubs-detail", args=(club.code,)),
            {"approved": True, "approved_comment": "This is a great club!"},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure email is sent out to let club know
        self.assertEqual(len(mail.outbox), mail_count + 1, mail.outbox)

        # update mail count
        mail_count = len(mail.outbox)

        # mark club has unapproved
        club.approved = None
        club.save(update_fields=["approved"])

        # reject the club
        resp = self.client.patch(
            reverse("clubs-detail", args=(club.code,)),
            {"approved": False, "approved_comment": "This is a bad club!"},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure email is sent out to let club know
        self.assertEqual(len(mail.outbox), mail_count + 1, mail.outbox)

        # approve the club without comment
        club.approved = None
        club.save(update_fields=["approved"])

        resp = self.client.patch(
            reverse("clubs-detail", args=(club.code,)),
            {"approved": True, "approved_comment": ""},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure badge still exists
        self.assertTrue(club.badges.filter(pk=badge.pk).count(), 1)

        # mark club as unapproved
        club.approved = None
        club.save(update_fields=["approved"])

        # login as user without approve permissions
        self.assertFalse(self.user2.has_perm("clubs.approve_club"))
        Membership.objects.create(
            person=self.user2, club=club, role=Membership.ROLE_OFFICER
        )

        self.client.login(username=self.user2.username, password="test")

        # try approving the club
        resp = self.client.patch(
            reverse("clubs-detail", args=(club.code,)),
            {"approved": True, "approved_comment": "I'm approving my own club!"},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [401, 403], resp.content)

    def test_club_analytics(self):
        # choose a club
        club = self.club1

        # add officer to club
        Membership.objects.create(
            person=self.user4, club=club, role=Membership.ROLE_OFFICER
        )

        # login to officer account
        self.client.login(username=self.user4.username, password="test")

        # hit analytics endpoint
        resp = self.client.get(reverse("clubs-analytics", args=(club.code,)))
        self.assertIn(resp.status_code, [200], resp.content)

    def test_report_saving(self):
        # login as superuser
        self.client.login(username=self.user5.username, password="test")
        self.assertTrue(self.user5.is_superuser)

        # fetch reports
        resp = self.client.get(reverse("reports-list"))
        self.assertIn(resp.status_code, [200], resp.content)

        name = "Test Report 123"

        # add new report twice
        for i in range(2):
            resp = self.client.post(
                reverse("reports-list"),
                {
                    "name": name,
                    "description": "This is a test report!",
                    "parameters": json.dumps({"format": "xlsx", "fields": "code,name"}),
                    "public": False,
                },
            )
            self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure only one version of report exists at end
        resp = self.client.get(reverse("reports-list"))
        self.assertIn(resp.status_code, [200], resp.content)

        data = resp.json()
        report_names = [rep["name"] for rep in data if rep["name"] == name]
        self.assertEqual(report_names, [name])

    def test_list_options(self):
        # test normal operating conditions
        resp = self.client.get(reverse("options"))
        self.assertIn(resp.status_code, [200], resp.content)

        # test with club fair
        now = timezone.now()
        fair = ClubFair.objects.create(
            name="SAC Fair",
            start_time=now - datetime.timedelta(days=1),
            end_time=now + datetime.timedelta(days=1),
            registration_end_time=now - datetime.timedelta(weeks=1),
        )

        resp = self.client.get(reverse("options"))
        self.assertIn(resp.status_code, [200], resp.content)
        self.assertTrue(resp.data["FAIR_OPEN"])
        self.assertFalse(resp.data["PRE_FAIR"])

        # test pre fair status
        fair.start_time = now + datetime.timedelta(days=2)
        fair.end_time = now + datetime.timedelta(days=3)
        fair.save()

        resp = self.client.get(reverse("options"))
        self.assertIn(resp.status_code, [200], resp.content)
        self.assertTrue(resp.data["PRE_FAIR"])
        self.assertFalse(resp.data["FAIR_OPEN"])

    def test_club_fair_registration(self):
        # create a fair
        now = timezone.now()
        fair = ClubFair.objects.create(
            name="SAC Fair",
            organization="Student Activities Council",
            start_time=now + datetime.timedelta(days=7),
            end_time=now + datetime.timedelta(days=14),
            registration_start_time=now - datetime.timedelta(days=1),
            registration_end_time=now + datetime.timedelta(days=1),
            virtual=True,
            questions=json.dumps(
                [
                    {
                        "name": "fav_color",
                        "label": "What is your favorite color?",
                        "type": "radio",
                        "choices": [
                            {"id": "red", "label": "Red"},
                            {"id": "blue", "label": "Blue"},
                        ],
                    }
                ]
            ),
        )

        # add the SAC badge to the club
        badge, _ = Badge.objects.get_or_create(label="SAC")
        self.club1.badges.add(badge)

        # add a file to the club
        Asset.objects.create(name="constitution.pdf", club=self.club1)

        # add officer to club
        Membership.objects.create(
            person=self.user4, club=self.club1, role=Membership.ROLE_OFFICER
        )

        # login to officer account
        self.client.login(username=self.user4.username, password="test")

        # register for the fair
        resp = self.client.post(
            reverse("clubfairs-register", args=(fair.id,)),
            {"status": True, "club": self.club1.code, "answers": ["red"]},
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)
        self.assertTrue(resp.data["success"], resp.content)

        # ensure registration was processed
        self.assertTrue(
            ClubFairRegistration.objects.filter(club=self.club1, fair=fair).exists()
        )

    def test_bulk_edit(self):
        """
        Test the club bulk editing endpoint.
        """
        # login to superuser account
        self.client.login(username=self.user5.username, password="test")

        # perform bulk add
        tag = Tag.objects.create(name="Bulk Tag")
        tag2 = Tag.objects.create(name="Bulk Tag #2")

        resp = self.client.post(
            reverse("clubs-bulk"),
            {
                "action": "add",
                "clubs": "\n".join(Club.objects.values_list("code", flat=True)),
                "tags": [{"id": tag.id}, {"id": tag2.id}],
            },
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)
        self.assertTrue("success" in resp.data, resp.content)

        # enure tags were added
        self.assertEqual(tag.club_set.count(), Club.objects.count())
        self.assertEqual(tag2.club_set.count(), Club.objects.count())

    def test_email_preview(self):
        """
        Ensure that the email preview page can load without any issues.
        """
        resp = self.client.get(reverse("email-preview"))
        self.assertEqual(resp.status_code, 200, resp.content)

    def test_list_email_invites(self):
        """
        Ensure that listing the email invitations endpoint works without any issues.
        """
        # login to account
        self.client.login(username=self.user4.username, password="test")

        resp = self.client.get(reverse("email-invites"))
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertIsInstance(resp.data, list)

    def test_user_profile(self):
        """
        Test the user profile endpoint.
        """
        # ensure profile endpoint is public
        profile = self.user4.profile
        profile.show_profile = True
        profile.save()

        # create some clubs
        Club.objects.bulk_create(
            [
                Club(
                    name=f"Public Membership Club {i}",
                    code=f"pub-mem-club-{i}",
                    approved=True,
                    email="test-pub-{i}@example.com",
                )
                for i in range(10)
            ]
        )

        # create an unapproved club, this should not show up
        Club.objects.create(
            name="Unapproved 10",
            code="pub-mem-club-10",
            approved=None,
            active=True,
            email="test-pub-10@example.com",
        )

        # add some public and private memberships
        for i in range(11):
            Membership.objects.create(
                club=Club.objects.get(code=f"pub-mem-club-{i}"),
                person=self.user4,
                active=True,
                public=i < 5 or i == 10,
            )

        resp = self.client.get(
            reverse("users-detail", kwargs={"username": self.user4.username})
        )
        self.assertEqual(resp.status_code, 200, resp.content)

        # ensure fields exist
        self.assertEqual(resp.data["username"], self.user4.username)
        self.assertIn("clubs", resp.data, resp.content)

        # ensure correct club codes
        actual_club_codes = set(c["code"] for c in resp.data["clubs"])
        expected_club_codes = set(f"pub-mem-club-{i}" for i in range(5))
        self.assertEqual(actual_club_codes, expected_club_codes)

        # make sure there are no duplicate clubs
        self.assertEqual(
            len(actual_club_codes), len(resp.data["clubs"]), resp.data["clubs"]
        )

    def test_alumni_page(self):
        """
        Ensure alumni page can be seen
        """
        now = timezone.now()
        for i, user in enumerate([self.user1, self.user2, self.user3]):
            profile = user.profile
            profile.graduation_year = now.year - 3
            profile.save()
            Membership.objects.create(
                person=user, club=self.club1, public=i <= 1, active=False
            )

        # fetch alumni page
        resp = self.client.get(reverse("clubs-alumni", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [403], resp.content)

        self.client.login(username=self.user4.username, password="test")
        resp = self.client.get(reverse("clubs-alumni", args=(self.club1.code,)))
        self.assertIn(resp.status_code, [200], resp.content)
        data = resp.json()

        # ensure grouped by years
        self.assertIn(str(now.year - 3), data, resp.content)

        # ensure private memberships not shown
        self.assertEqual(len(data[str(now.year - 3)]), 2, resp.content)

    def test_execute_script(self):
        self.client.login(username=self.user5.username, password="test")

        resp = self.client.get(reverse("scripts"))
        self.assertIn(resp.status_code, [200], resp.content)
        self.assertIsInstance(resp.data, list, resp.content)

        resp = self.client.post(reverse("scripts"), {"action": "find_broken_images"})
        self.assertIn(resp.status_code, [200], resp.content)
        self.assertIn("output", resp.data, resp.content)

    def test_permission_lookup(self):
        permissions = [
            "clubs.approve_club",
            "clubs.delete_club",
            "clubs.generate_reports",
            f"clubs.manage_club:{self.club1.code}",
            f"clubs.delete_club:{self.club1.code}",
        ]

        # check permissions checker endpoint
        def check():
            resp = self.client.get(
                reverse("users-permission"), {"perm": ",".join(permissions)}
            )
            self.assertIn(resp.status_code, [200], resp.content)

            data = resp.json()
            self.assertIn("permissions", data)

            for perm in permissions:
                self.assertIn(perm, data["permissions"])

            return data["permissions"]

        # check as unauthenticated user
        data = check()

        # ensure unauthenticated user does not have access to anything
        for perm in permissions:
            self.assertFalse(data[perm], perm)

        # add officer to club
        Membership.objects.create(
            person=self.user4, club=self.club1, role=Membership.ROLE_OFFICER
        )

        # add special permission to user
        content_type = ContentType.objects.get_for_model(Club)
        perm = Permission.objects.get(
            codename="approve_club", content_type=content_type
        )
        self.user4.user_permissions.add(perm)

        # login to officer account
        self.client.login(username=self.user4.username, password="test")
        self.assertTrue(
            Membership.objects.filter(club=self.club1, person=self.user4).exists()
        )

        # check as authenticated user
        data = check()

        # ensure officer account has manage club permissions
        self.assertTrue(data[f"clubs.manage_club:{self.club1.code}"], data)

        # ensure added permission has taken effect
        self.assertTrue(data["clubs.approve_club"], data)

        # login to superuser account
        self.client.login(username=self.user5.username, password="test")
        if not self.user5.is_superuser:
            self.user5.is_staff = True
            self.user5.is_superuser = True
            self.user5.save()

        # check as superuser
        data = check()

        # ensure superuser has access to everything
        for perm in permissions:
            self.assertTrue(data[perm], perm)

    def test_zoom_add_meeting(self):
        # setup fair event
        self.event1.type = Event.FAIR
        self.event1.url = None
        self.event1.save()

        # try creating meeting as officer of club
        Membership.objects.create(
            person=self.user4, club=self.club1, role=Membership.ROLE_OFFICER
        )
        self.client.login(username=self.user4.username, password="test")
        self.assertFalse(self.user4.is_superuser)

        output_url = "https://www.example.com/"
        ret = MagicMock()
        ret.status_code = 200
        ret.json.return_value = {"join_url": output_url}

        with patch("clubs.views.zoom_api_call", return_value=ret):
            resp = self.client.post(
                "{}?format=json&event={}".format(
                    reverse("users-zoom-meeting"), self.event1.id
                ),
                content_type="application/json",
            )
        self.assertIn(resp.status_code, [200, 201], resp.content)
        self.assertTrue(resp.data["success"], resp.content)
        self.event1.refresh_from_db()
        self.assertEqual(self.event1.url, output_url)

    def test_zoom_general_meeting_info(self):
        """
        Test the endpoint to retrieve all live information for a fair.
        """
        now = timezone.now()
        start_time = now - datetime.timedelta(days=1)
        end_time = now + datetime.timedelta(days=1)
        fair = ClubFair.objects.create(
            name="Example Fair",
            start_time=start_time,
            end_time=end_time,
            registration_end_time=now - datetime.timedelta(weeks=1),
        )
        ClubFairRegistration.objects.create(
            registrant=self.user1, club=self.event1.club, fair=fair
        )

        self.event1.type = Event.FAIR
        self.event1.save()

        self.event_showing1.start_time = start_time
        self.event_showing1.end_time = end_time
        self.event_showing1.save()

        ZoomMeetingVisit.objects.bulk_create(
            ZoomMeetingVisit(
                event=self.event1,
                person=[self.user1, self.user2, self.user3, self.user4, self.user5][i],
                join_time=start_time + datetime.timedelta(hours=1),
                leave_time=start_time
                + datetime.timedelta(hours=1)
                + datetime.timedelta(minutes=i),
                meeting_id="",
                participant_id="",
            )
            for i in range(5)
        )

        self.client.login(username=self.user1.username, password="test")

        resp = self.client.get(reverse("clubfairs-live", args=(fair.id,)))
        self.assertIn(resp.status_code, [200], resp.content)
        self.assertIn(self.event1.id, resp.data, resp.content)
        self.assertEqual(
            resp.data[self.event1.id]["participant_count"], 0, resp.content
        )
        self.assertEqual(resp.data[self.event1.id]["already_attended"], 5, resp.content)
        self.assertEqual(
            resp.data[self.event1.id]["median"],
            datetime.timedelta(minutes=2).total_seconds(),
            resp.content,
        )

    def test_event_add_meeting(self):
        """
        Test manually adding a meeting link without the Zoom page, but having their
        account linked. This should go through.
        """
        self.event1.type = Event.FAIR
        self.event1.url = None
        self.event1.save()

        Membership.objects.create(
            person=self.user4, club=self.club1, role=Membership.ROLE_OFFICER
        )
        self.client.login(username=self.user4.username, password="test")
        self.assertFalse(self.user4.is_superuser)

        resp = self.client.patch(
            reverse("club-events-detail", args=(self.club1.code, self.event1.pk)),
            {"url": "https://upenn.zoom.us/j/123456789"},
            content_type="application/json",
        )
        self.event1.refresh_from_db()
        self.assertIn("url", resp.data, resp.content)
        self.assertTrue(self.event1.url, resp.content)

    def test_club_approval_response_templates(self):
        """
        Test operations and permissions for club approval response templates.
        """

        # Log in as superuser
        self.client.login(username=self.user5.username, password="test")

        # Create a new template
        resp = self.client.post(
            reverse("templates-list"),
            {
                "title": "Test template",
                "content": "This is a new template",
            },
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201)

        # Create another template
        template = ClubApprovalResponseTemplate.objects.create(
            author=self.user5,
            title="Another template",
            content="This is another template",
        )

        # List templates
        resp = self.client.get(reverse("templates-list"))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()), 2)

        # Update a template
        resp = self.client.patch(
            reverse("templates-detail", args=[template.id]),
            {"title": "Updated title"},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # Verify update
        template.refresh_from_db()
        self.assertEqual(template.title, "Updated title")

        # Delete the template
        resp = self.client.delete(reverse("templates-detail", args=[template.id]))
        self.assertEqual(resp.status_code, 204)

        # Verify the template has been deleted
        self.assertIsNone(
            ClubApprovalResponseTemplate.objects.filter(id=template.id).first()
        )

        # Test non-superuser access restrictions
        self.client.logout()
        self.client.login(
            username=self.user4.username, password="test"
        )  # non-superuser

        # Non-superuser shouldn't be able to create a template
        resp = self.client.post(
            reverse("templates-list"),
            {"title": "Template", "content": "This should not exist"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_ownership_requests_create_and_view(self):
        """
        Test the ownership requests creation and viewing permissions
        """

        Membership.objects.create(
            person=self.user1, club=self.club1, role=Membership.ROLE_OWNER
        )

        # Requester can create ownership request and email is sent
        self.client.login(username=self.user2.username, password="test")
        resp = self.client.post(
            reverse("ownership-requests-list"),
            {"club": self.club1.code},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertEqual(
            OwnershipRequest.objects.filter(
                club=self.club1, requester=self.user2
            ).count(),
            1,
        )

        # Requester can check own ownership requests
        resp = self.client.get(reverse("ownership-requests-list"))
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(len(resp.json()), 1, resp.content)

        # Requester can check own ownership request to a club
        resp = self.client.get(
            reverse("ownership-requests-detail", args=(self.club1.code,))
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json()["club"], self.club1.code, resp.content)

        # Requester cannot check club's ownership requests
        resp = self.client.get(
            reverse("club-ownership-requests-list", args=(self.club1.code,))
        )
        self.assertEqual(resp.status_code, 403, resp.content)

        # Owner can check club's ownership requests
        self.client.login(username=self.user1.username, password="test")
        resp = self.client.get(
            reverse("club-ownership-requests-list", args=(self.club1.code,))
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(len(resp.json()), 1, resp.content)

        # Owner can check club's ownership requests for specific user
        resp = self.client.get(
            reverse(
                "club-ownership-requests-detail",
                kwargs={
                    "club_code": self.club1.code,
                    "requester__username": self.user2.username,
                },
            )
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json()["club"], self.club1.code, resp.content)

    def test_ownership_requests_withdraw(self):
        """
        Test the ownership requests withdraw feature
        """

        Membership.objects.create(
            person=self.user1, club=self.club1, role=Membership.ROLE_OWNER
        )

        # Create ownership request
        self.client.login(username=self.user2.username, password="test")
        resp = self.client.post(
            reverse("ownership-requests-list"),
            {"club": self.club1.code},
            content_type="application/json",
        )

        OwnershipRequest.objects.filter(club=self.club1, requester=self.user2).update(
            created_at=timezone.now() - timezone.timedelta(days=8)
        )

        # Requester can withdraw
        self.client.login(username=self.user2.username, password="test")
        resp = self.client.delete(
            reverse("ownership-requests-detail", args=(self.club1.code,))
        )
        self.assertIn(resp.status_code, [200, 204], resp.content)
        self.assertEqual(
            OwnershipRequest.objects.filter(
                club=self.club1, requester=self.user2, withdrawn=True
            ).count(),
            1,
        )

        resp = self.client.get(
            reverse("ownership-requests-detail", args=(self.club1.code,))
        )
        self.assertEqual(resp.status_code, 404, resp.content)

        # Owner and superuser cannot see withdrawn requests

        self.client.login(username=self.user1.username, password="test")
        resp = self.client.get(
            reverse("club-ownership-requests-list", args=(self.club1.code,))
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(len(resp.json()), 0, resp.content)

        # Recreate ownership request
        self.client.login(username=self.user2.username, password="test")
        resp = self.client.post(
            reverse("ownership-requests-list"),
            {"club": self.club1.code},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201, resp.content)

        # Owner can see recreated ownership requests

        self.client.login(username=self.user1.username, password="test")
        resp = self.client.get(
            reverse("club-ownership-requests-list", args=(self.club1.code,))
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(len(resp.json()), 1, resp.content)

    def test_ownership_requests_accept(self):
        """
        Test the ownership requests accept feature
        """

        Membership.objects.create(
            person=self.user1, club=self.club1, role=Membership.ROLE_OWNER
        )

        # Create ownership request
        self.client.login(username=self.user2.username, password="test")
        resp = self.client.post(
            reverse("ownership-requests-list"),
            {"club": self.club1.code},
            content_type="application/json",
        )

        # Requester cannot accept requests
        resp = self.client.post(
            reverse(
                "club-ownership-requests-accept",
                kwargs={
                    "club_code": self.club1.code,
                    "requester__username": self.user2.username,
                },
            )
        )
        self.assertEqual(resp.status_code, 403, resp.content)

        # Owner can accept requests
        self.client.login(username=self.user1.username, password="test")

        resp = self.client.post(
            reverse(
                "club-ownership-requests-accept",
                kwargs={
                    "club_code": self.club1.code,
                    "requester__username": self.user2.username,
                },
            )
        )
        self.assertEqual(resp.status_code, 200, resp.content)

        self.assertEqual(
            OwnershipRequest.objects.filter(
                club=self.club1, requester=self.user2
            ).count(),
            0,
        )

        self.assertEqual(
            Membership.objects.filter(
                club=self.club1, person=self.user2, role=Membership.ROLE_OWNER
            ).count(),
            1,
        )

    def test_ownership_requests_destroy(self):
        """
        Test the ownership requests destroy (denial of request) feature
        """

        Membership.objects.create(
            person=self.user1, club=self.club1, role=Membership.ROLE_OWNER
        )

        # Create ownership request
        self.client.login(username=self.user2.username, password="test")
        resp = self.client.post(
            reverse("ownership-requests-list"),
            {"club": self.club1.code},
            content_type="application/json",
        )

        # Requester cannot destroy requests
        resp = self.client.delete(
            reverse(
                "club-ownership-requests-detail",
                kwargs={
                    "club_code": self.club1.code,
                    "requester__username": self.user2.username,
                },
            )
        )
        self.assertEqual(resp.status_code, 403, resp.content)

        # Owner can destroy requests
        self.client.login(username=self.user1.username, password="test")

        resp = self.client.delete(
            reverse(
                "club-ownership-requests-detail",
                kwargs={
                    "club_code": self.club1.code,
                    "requester__username": self.user2.username,
                },
            )
        )
        self.assertIn(resp.status_code, [200, 204], resp.content)

        self.assertEqual(
            OwnershipRequest.objects.filter(
                club=self.club1, requester=self.user2
            ).count(),
            0,
        )

        self.assertEqual(
            Membership.objects.filter(
                club=self.club1, person=self.user2, role=Membership.ROLE_OWNER
            ).count(),
            0,
        )

    def test_ownership_requests_list_all(self):
        """
        Test the ownership requests list all requests feature
        """

        self.client.login(username=self.user5.username, password="test")
        resp = self.client.get(
            reverse("club-ownership-requests-all", args=("anystring",))
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(len(resp.json()), 0, resp.content)

        OwnershipRequest.objects.create(
            club=self.club1,
            requester=self.user2,
        )
        OwnershipRequest.objects.filter(
            club=self.club1,
            requester=self.user2,
        ).update(created_at=timezone.now() - timezone.timedelta(days=1))

        OwnershipRequest.objects.create(
            club=self.club1,
            requester=self.user3,
        )
        OwnershipRequest.objects.filter(
            club=self.club1,
            requester=self.user3,
        ).update(created_at=timezone.now() - timezone.timedelta(days=100))

        OwnershipRequest.objects.create(
            club=self.club1,
            requester=self.user4,
        )
        OwnershipRequest.objects.filter(
            club=self.club1,
            requester=self.user4,
        ).update(created_at=timezone.now() - timezone.timedelta(days=10))

        self.client.login(username=self.user5.username, password="test")
        resp = self.client.get(
            reverse("club-ownership-requests-all", args=("anystring",))
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(len(resp.json()), 3, resp.content)

        # Check oldest requests first
        self.assertEqual(resp.json()[0]["username"], self.user3.username, resp.content)
        self.assertEqual(resp.json()[1]["username"], self.user4.username, resp.content)
        self.assertEqual(resp.json()[2]["username"], self.user2.username, resp.content)

    def test_membership_requests_create_and_view(self):
        """
        Test the membership requests creation and viewing permissions
        """

        Membership.objects.create(
            person=self.user1, club=self.club1, role=Membership.ROLE_OWNER
        )

        self.client.login(username=self.user2.username, password="test")
        resp = self.client.post(
            reverse("membership-requests-list"),
            {"club": self.club1.code},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertEqual(
            MembershipRequest.objects.filter(
                club=self.club1, requester=self.user2
            ).count(),
            1,
        )
        self.assertEqual(len(mail.outbox), 1, mail.outbox)

        # Requester can check own membership requests
        resp = self.client.get(reverse("membership-requests-list"))
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(len(resp.json()), 1, resp.content)

        # Requester can check own membership request to a club
        resp = self.client.get(
            reverse("membership-requests-detail", args=(self.club1.code,))
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json()["club"], self.club1.code, resp.content)

        # Requester cannot check club's membership requests
        resp = self.client.get(
            reverse("club-membership-requests-list", args=(self.club1.code,))
        )
        self.assertEqual(resp.status_code, 403, resp.content)

        # Owner can check club's membership requests
        self.client.login(username=self.user1.username, password="test")
        resp = self.client.get(
            reverse("club-membership-requests-list", args=(self.club1.code,))
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(len(resp.json()), 1, resp.content)

        # Owner can check club's membership requests for specific user
        resp = self.client.get(
            reverse(
                "club-membership-requests-detail",
                kwargs={
                    "club_code": self.club1.code,
                    "requester__username": self.user2.username,
                },
            )
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json()["club"], self.club1.code, resp.content)

    def test_membership_requests_withdraw(self):
        """
        Test the membership requests withdraw feature
        """

        Membership.objects.create(
            person=self.user1, club=self.club1, role=Membership.ROLE_OWNER
        )

        self.client.login(username=self.user2.username, password="test")
        resp = self.client.post(
            reverse("membership-requests-list"),
            {"club": self.club1.code},
            content_type="application/json",
        )

        # Requester can withdraw
        resp = self.client.delete(
            reverse("membership-requests-detail", args=(self.club1.code,))
        )
        self.assertIn(resp.status_code, [200, 204], resp.content)
        self.assertEqual(
            MembershipRequest.objects.filter(
                club=self.club1, requester=self.user2, withdrawn=True
            ).count(),
            1,
        )

        # Requester cannot see withdrawn request
        resp = self.client.get(
            reverse("membership-requests-detail", args=(self.club1.code,))
        )
        self.assertEqual(resp.status_code, 404, resp.content)

        # Owner cannot see withdrawn request
        self.client.login(username=self.user1.username, password="test")
        resp = self.client.get(
            reverse("club-membership-requests-list", args=(self.club1.code,))
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(len(resp.json()), 0, resp.content)

        # Recreate membership request
        self.client.login(username=self.user2.username, password="test")
        resp = self.client.post(
            reverse("membership-requests-list"),
            {"club": self.club1.code},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertEqual(
            MembershipRequest.objects.filter(
                club=self.club1, requester=self.user2
            ).count(),
            1,
        )

        # Email are not resent
        self.assertEqual(len(mail.outbox), 1, mail.outbox)

        # Owner can see recreated membership request
        self.client.login(username=self.user1.username, password="test")
        resp = self.client.get(
            reverse("club-membership-requests-list", args=(self.club1.code,))
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(len(resp.json()), 1, resp.content)

    def test_membership_requests_accept(self):
        """
        Test the membership requests accept feature
        """

        Membership.objects.create(
            person=self.user1, club=self.club1, role=Membership.ROLE_OWNER
        )

        self.client.login(username=self.user2.username, password="test")
        resp = self.client.post(
            reverse("membership-requests-list"),
            {"club": self.club1.code},
            content_type="application/json",
        )

        # Requester cannot accept membership requests
        resp = self.client.post(
            reverse(
                "club-membership-requests-accept",
                kwargs={
                    "club_code": self.club1.code,
                    "requester__username": self.user2.username,
                },
            )
        )
        self.assertEqual(resp.status_code, 403, resp.content)

        # Owner can accept membership requests
        self.client.login(username=self.user1.username, password="test")

        resp = self.client.post(
            reverse(
                "club-membership-requests-accept",
                kwargs={
                    "club_code": self.club1.code,
                    "requester__username": self.user2.username,
                },
            )
        )
        self.assertEqual(resp.status_code, 200, resp.content)

        self.assertEqual(
            MembershipRequest.objects.filter(
                club=self.club1, requester=self.user2
            ).count(),
            0,
        )

        self.assertEqual(
            Membership.objects.filter(
                club=self.club1,
                person=self.user2,
            ).count(),
            1,
        )

    def test_membership_requests_destroy(self):
        """
        Test the membership requests destroy (denial of request) feature
        """

        Membership.objects.create(
            person=self.user1, club=self.club1, role=Membership.ROLE_OWNER
        )

        self.client.login(username=self.user2.username, password="test")
        resp = self.client.post(
            reverse("membership-requests-list"),
            {"club": self.club1.code},
            content_type="application/json",
        )

        # Requester cannot destroy membership requests
        resp = self.client.delete(
            reverse(
                "club-membership-requests-detail",
                kwargs={
                    "club_code": self.club1.code,
                    "requester__username": self.user2.username,
                },
            )
        )
        self.assertEqual(resp.status_code, 403, resp.content)

        # Owner can accept membership requests
        self.client.login(username=self.user1.username, password="test")

        resp = self.client.delete(
            reverse(
                "club-membership-requests-detail",
                kwargs={
                    "club_code": self.club1.code,
                    "requester__username": self.user2.username,
                },
            )
        )
        self.assertIn(resp.status_code, [200, 204], resp.content)

        self.assertEqual(
            MembershipRequest.objects.filter(
                club=self.club1, requester=self.user2
            ).count(),
            0,
        )

        self.assertEqual(
            Membership.objects.filter(
                club=self.club1,
                person=self.user2,
            ).count(),
            0,
        )

    def test_email_blast(self):
        Membership.objects.create(
            club=self.club1, person=self.user1, role=Membership.ROLE_OWNER, active=True
        )
        Membership.objects.create(
            club=self.club1,
            person=self.user2,
            role=Membership.ROLE_OFFICER,
            active=True,
        )
        Membership.objects.create(
            club=self.club1, person=self.user3, role=Membership.ROLE_MEMBER, active=True
        )
        Membership.objects.create(
            club=self.club1,
            person=self.user4,
            role=Membership.ROLE_OFFICER,
            active=False,
        )

        # Need staff perms to send blasts
        self.client.login(username=self.user1.username, password="test")
        resp = self.client.post(
            reverse("clubs-email-blast"),
            {"target": "leaders", "content": "test"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 403)

        self.client.login(username=self.user5.username, password="test")

        # All fields are required
        resp = self.client.post(
            reverse("clubs-email-blast"),
            {"content": "test"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)

        resp = self.client.post(
            reverse("clubs-email-blast"),
            {"target": "leaders"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)

        resp = self.client.post(
            reverse("clubs-email-blast"),
            {"target": "leaders", "content": "test"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("Blast sent to 1 recipients", resp.data["detail"])
        self.assertEqual(len(mail.outbox), 1)
        resp = self.client.post(
            reverse("clubs-email-blast"),
            {"target": "officers", "content": "test"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("Blast sent to 2 recipients", resp.data["detail"])
        self.assertEqual(len(mail.outbox), 2)

        resp = self.client.post(
            reverse("clubs-email-blast"),
            {"target": "all", "content": "test"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("Blast sent to 3 recipients", resp.data["detail"])
        self.assertEqual(len(mail.outbox), 3)

    def test_application_submission_requires_complete_profile(self):
        """
        Test that users must have a complete profile (graduation year, school, major)
        before submitting a club application.
        """
        # Create a club application
        now = timezone.now()
        application = ClubApplication.objects.create(
            name="Test Application",
            club=self.club1,
            application_start_time=now - timezone.timedelta(days=1),
            application_end_time=now + timezone.timedelta(days=1),
            result_release_time=now + timezone.timedelta(days=2),
        )

        # Create a test question for the application
        question = application.questions.create(
            question_type=ApplicationQuestion.FREE_RESPONSE,
            prompt="Test question",
            word_limit=100,
        )

        # Login as user with incomplete profile
        self.client.login(username=self.user2.username, password="test")

        # Ensure user profile is incomplete
        profile = self.user2.profile
        profile.graduation_year = None
        profile.school.clear()
        profile.major.clear()
        profile.save()

        # Try to submit a response
        resp = self.client.post(
            reverse("users-question-response"),
            {
                "application": application.id,
                "questionIds": [str(question.id)],
                "committee": None,
                question.id: {"text": "Life is good we are done"},
            },
            content_type="application/json",
        )

        # Should get a 400 error with specific message
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertFalse(resp.data["success"], resp.content)
        self.assertIn("graduation year", resp.data["detail"].lower())
        self.assertIn("major", resp.data["detail"].lower())
        self.assertIn("school", resp.data["detail"].lower())

        # Make sure no submission was created
        self.assertEqual(
            ApplicationSubmission.objects.filter(
                user=self.user2, application=application
            ).count(),
            0,
        )

        # Complete the profile
        school = School.objects.create(
            name="Rajiv Gandhi School of Cope", is_graduate=False
        )
        major = Major.objects.create(name="Coping")
        profile.graduation_year = now.year + 1
        profile.school.add(school)
        profile.major.add(major)
        profile.save()

        # Try submitting again
        resp = self.client.post(
            reverse("users-question-response"),
            {
                "application": application.id,
                "questionIds": [str(question.id)],
                "committee": None,
                question.id: {"text": "Life is good we are done"},
            },
            content_type="application/json",
        )

        # Should succeed
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertTrue(
            isinstance(resp.data, list) or resp.data.get("success", True), resp.content
        )

        # Verify submission was created
        self.assertEqual(
            ApplicationSubmission.objects.filter(
                user=self.user2, application=application
            ).count(),
            1,
        )


class HealthTestCase(TestCase):
    def test_health(self):
        url = reverse("health")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data, {"message": "OK"})


class RegistrationQueueSettingsTestCase(TestCase):
    """
    Test the registration queue settings view.
    """

    def setUp(self):
        self.client = Client()

        self.user = get_user_model().objects.create_user(
            "user", "user@example.com", "password"
        )
        self.superuser = get_user_model().objects.create_user(
            "super", "super@example.com", "password", is_superuser=True
        )

    def test_get_settings_permissions(self):
        # unauthenticated users can't access
        resp = self.client.get(reverse("queue-settings"))
        self.assertEqual(resp.status_code, 403, resp.content)

        # non-superusers can't access
        self.client.login(username="user", password="password")
        resp = self.client.get(reverse("queue-settings"))
        self.assertEqual(resp.status_code, 403, resp.content)

        # superusers can access
        self.client.login(username="super", password="password")
        resp = self.client.get(reverse("queue-settings"))
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertIn("reapproval_queue_open", data)
        self.assertIn("new_approval_queue_open", data)

    def test_update_settings(self):
        # non-superusers can't update
        self.client.login(username="user", password="password")
        resp = self.client.patch(
            reverse("queue-settings"),
            json.dumps(
                {"reapproval_queue_open": False, "new_approval_queue_open": False}
            ),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 403, resp.content)

        # superusers can update
        self.client.login(username="super", password="password")
        resp = self.client.patch(
            reverse("queue-settings"),
            json.dumps(
                {"reapproval_queue_open": False, "new_approval_queue_open": False}
            ),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertFalse(data["reapproval_queue_open"])
        self.assertFalse(data["new_approval_queue_open"])

        resp = self.client.get(reverse("queue-settings"))
        data = resp.json()
        self.assertFalse(data["reapproval_queue_open"])
        self.assertFalse(data["new_approval_queue_open"])


class EventShowingTestCase(TestCase):
    """
    Test the EventShowing API endpoints not related to ticketing.
    """

    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.user1 = User.objects.create_user(
            "officer@example.com", "officer@example.com", "password"
        )
        cls.user2 = User.objects.create_user(
            "member@example.com", "member@example.com", "password"
        )
        cls.user3 = User.objects.create_user(
            "random@example.com", "random@example.com", "password"
        )

    def setUp(self):
        self.client = Client()

        # Create a test club
        self.club = Club.objects.create(
            code="showing-test-club",
            name="Showing Test Club",
            approved=True,
            email="showing@example.com",
        )

        # Add user1 as an officer and user2 as a member
        Membership.objects.create(
            person=self.user1, club=self.club, role=Membership.ROLE_OFFICER
        )
        Membership.objects.create(
            person=self.user2, club=self.club, role=Membership.ROLE_MEMBER
        )

        # Create a test event
        self.event = Event.objects.create(
            code="showing-test-event",
            club=self.club,
            name="Showing Test Event",
            creator=self.user1,
        )

        # Create a test event showing
        self.showing = EventShowing.objects.create(
            event=self.event,
            start_time=timezone.now() + timezone.timedelta(days=2),
            end_time=timezone.now() + timezone.timedelta(days=3),
            location="Test Location",
        )

    def test_list_showings(self):
        """
        Test that anyone can list event showings.
        """
        # Test unauthenticated user
        self.client.logout()
        response = self.client.get(reverse("event-showings-list", args=[self.event.id]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["location"], "Test Location")

        # Test member
        self.client.login(username=self.user2.username, password="password")
        response = self.client.get(reverse("event-showings-list", args=[self.event.id]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["location"], "Test Location")

        # Test officer
        self.client.login(username=self.user1.username, password="password")
        response = self.client.get(reverse("event-showings-list", args=[self.event.id]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["location"], "Test Location")

    def test_retrieve_showing(self):
        """
        Test that anyone can retrieve a specific event showing.
        """
        response = self.client.get(
            reverse("event-showings-detail", args=[self.event.id, self.showing.id])
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["location"], "Test Location")

    def test_create_showing_permissions(self):
        """
        Test permissions for creating event showings.
        """
        new_showing_data = {
            "start_time": (timezone.now() + timezone.timedelta(days=5)).isoformat(),
            "end_time": (timezone.now() + timezone.timedelta(days=6)).isoformat(),
            "location": "New Location",
        }

        # Test unauthenticated user
        self.client.logout()
        response = self.client.post(
            reverse("club-events-showings-list", args=[self.club.code, self.event.id]),
            new_showing_data,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

        # Test member
        self.client.login(username=self.user2.username, password="password")
        response = self.client.post(
            reverse("club-events-showings-list", args=[self.club.code, self.event.id]),
            new_showing_data,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

        # Test officer
        self.client.login(username=self.user1.username, password="password")
        response = self.client.post(
            reverse("club-events-showings-list", args=[self.club.code, self.event.id]),
            new_showing_data,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["location"], "New Location")
        self.assertEqual(EventShowing.objects.count(), 2)

    def test_update_showing_permissions(self):
        """
        Test permissions for updating event showings.
        """
        update_data = {"location": "Updated Location"}

        # Test unauthenticated user
        self.client.logout()
        response = self.client.patch(
            reverse(
                "club-events-showings-detail",
                args=[self.club.code, self.event.id, self.showing.id],
            ),
            update_data,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

        # Test member
        self.client.login(username=self.user2.username, password="password")
        response = self.client.patch(
            reverse(
                "club-events-showings-detail",
                args=[self.club.code, self.event.id, self.showing.id],
            ),
            update_data,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

        # Test officer
        self.client.login(username=self.user1.username, password="password")
        response = self.client.patch(
            reverse(
                "club-events-showings-detail",
                args=[self.club.code, self.event.id, self.showing.id],
            ),
            update_data,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["location"], "Updated Location")

        # Verify database was updated
        self.showing.refresh_from_db()
        self.assertEqual(self.showing.location, "Updated Location")

    def test_delete_showing_permissions(self):
        """
        Test permissions for deleting event showings.
        """
        # Test unauthenticated user
        self.client.logout()
        response = self.client.delete(
            reverse(
                "club-events-showings-detail",
                args=[self.club.code, self.event.id, self.showing.id],
            )
        )
        self.assertEqual(response.status_code, 403)

        # Test member
        self.client.login(username=self.user2.username, password="password")
        response = self.client.delete(
            reverse(
                "club-events-showings-detail",
                args=[self.club.code, self.event.id, self.showing.id],
            )
        )
        self.assertEqual(response.status_code, 403)

        # Create a new showing for the officer test
        new_showing = EventShowing.objects.create(
            event=self.event,
            start_time=timezone.now() + timezone.timedelta(days=2),
            end_time=timezone.now() + timezone.timedelta(days=3),
            location="Test Location for Delete",
        )

        # Test officer
        self.client.login(username=self.user1.username, password="password")
        response = self.client.delete(
            reverse(
                "club-events-showings-detail",
                args=[self.club.code, self.event.id, new_showing.id],
            )
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(EventShowing.objects.filter(id=new_showing.id).count(), 0)

    def test_validation_event_time(self):
        """
        Test that start_time must be before end_time.
        """
        self.client.login(username=self.user1.username, password="password")
        invalid_showing_data = {
            "start_time": (timezone.now() + timezone.timedelta(days=6)).isoformat(),
            "end_time": (timezone.now() + timezone.timedelta(days=5)).isoformat(),
            "location": "Invalid Timing",
        }

        response = self.client.post(
            reverse("club-events-showings-list", args=[self.club.code, self.event.id]),
            invalid_showing_data,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "event start time must be before the end time", str(response.data).lower()
        )
