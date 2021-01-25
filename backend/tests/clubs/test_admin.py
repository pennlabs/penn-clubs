from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse

from clubs.models import Club, Tag


class AdminTestCase(TestCase):
    def setUp(self):
        self.client = Client()

        self.user1 = get_user_model().objects.create_user(
            "jadams", "jadams@sas.upenn.edu", "test"
        )
        self.user1.first_name = "John"
        self.user1.last_name = "Adams"
        self.user1.is_staff = True
        self.user1.is_superuser = True
        self.user1.save()

        self.user2 = get_user_model().objects.create_user(
            "bfranklin", "bfranklin@seas.upenn.edu", "test"
        )
        self.user2.first_name = "Benjamin"
        self.user2.last_name = "Franklin"
        self.user2.save()

        self.tag1 = Tag.objects.create(name="Engineering")
        self.club1 = Club.objects.create(code="penn-labs", name="Penn Labs")
        self.club1.tags.add(self.tag1)

    def test_admin_views(self):
        """
        Ensure that all admin pages are able to render correctly.
        """
        self.client.login(username=self.user1.username, password="test")

        for page in [
            "admin:index",
            "admin:clubs_club_changelist",
            "admin:clubs_favorite_changelist",
            "admin:clubs_tag_changelist",
            "admin:clubs_membership_changelist",
            "admin:clubs_membershipinvite_changelist",
            "admin:clubs_advisor_changelist",
        ]:
            resp = self.client.get(reverse(page))
            self.assertIn(resp.status_code, [200], resp.content)
