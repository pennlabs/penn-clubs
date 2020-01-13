from django.test import TestCase

from clubs.apps import ClubsConfig


class AppsTestCase(TestCase):
    def test_apps(self):
        self.assertEqual(ClubsConfig.name, "clubs")
