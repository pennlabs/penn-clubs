import datetime

import pytz
from django.contrib.auth import get_user_model
from django.test import TestCase

from clubs.models import Advisor, Badge, Club, Event, Favorite, Membership, Tag


class ClubTestCase(TestCase):
    def setUp(self):
        date = pytz.timezone('America/New_York').localize(datetime.datetime(2019, 1, 1))
        self.club = Club.objects.create(code='a', name='a', subtitle='a', founded=date, description='a', size=1)

    def test_str(self):
        self.assertEqual(str(self.club), self.club.name)


class EventTestCase(TestCase):
    def setUp(self):
        date = pytz.timezone('America/New_York').localize(datetime.datetime(2019, 1, 1))
        self.club = Club.objects.create(code='a', name='a', subtitle='a', founded=date, description='a', size=1)
        self.event = Event.objects.create(name='a', club=self.club, start_time=date, end_time=date, description='a')

    def test_str(self):
        self.assertEqual(str(self.event), self.event.name)


class FavoriteTestCase(TestCase):
    def setUp(self):
        date = pytz.timezone('America/New_York').localize(datetime.datetime(2019, 1, 1))
        self.person = get_user_model().objects.create_user('test', 'test@example.com', 'test')
        self.club = Club.objects.create(code='a', name='a', subtitle='a', founded=date, description='a', size=1)
        self.favorite = Favorite.objects.create(club=self.club, person=self.person)

    def test_str(self):
        self.assertTrue(str(self.favorite))


class MembershipTestCase(TestCase):
    def setUp(self):
        date = pytz.timezone('America/New_York').localize(datetime.datetime(2019, 1, 1))
        self.person = get_user_model().objects.create_user('test', 'test@example.com', 'test')
        self.club = Club.objects.create(code='a', name='a', subtitle='a', founded=date, description='a', size=1)
        self.membership = Membership.objects.create(club=self.club, person=self.person)

    def test_str(self):
        self.assertTrue(str(self.membership))


class TagTestCase(TestCase):
    def setUp(self):
        self.tag = Tag.objects.create(name='super interesting tag')

    def test_str(self):
        self.assertEqual(str(self.tag), self.tag.name)


class BadgeTestCase(TestCase):
    def setUp(self):
        self.badge = Badge.objects.create(label='SAC Funded', description='SAC Funded Club')

    def test_str(self):
        self.assertTrue(str(self.badge), self.badge.label)


class AdvisorTestCase(TestCase):
    def setUp(self):
        date = pytz.timezone('America/New_York').localize(datetime.datetime(2019, 1, 1))
        club = Club.objects.create(code='a', name='a', subtitle='a', founded=date, description='a', size=1)
        self.advisor = Advisor.objects.create(name='Eric Wang', phone='+12025550133', club=club)

    def test_str(self):
        self.assertEqual(str(self.advisor), self.advisor.name)
