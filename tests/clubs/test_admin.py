import json
import datetime

from django.urls import reverse
from django.test import TestCase, Client

from users.models import Person


class AdminTestCase(TestCase):
    def setUp(self):
        self.client = Client()

        self.user1 = Person.objects.create_user('jadams', 'jadams@sas.upenn.edu', 'test')
        self.user1.first_name = 'John'
        self.user1.last_name = 'Adams'
        self.user1.is_staff = True
        self.user1.is_superuser = True
        self.user1.save()

    def test_admin_views(self):
        """
        Ensure that all admin pages are able to render correctly.
        """
        self.client.login(username=self.user1.username, password='test')

        for page in ['admin:index', 'admin:clubs_club_changelist', 'admin:clubs_tag_changelist', 'admin:clubs_membership_changelist']:
            resp = self.client.get(reverse(page))
            self.assertIn(resp.status_code, [200], resp.content)
