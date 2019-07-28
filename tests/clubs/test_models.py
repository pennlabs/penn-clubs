import datetime
import pytz
from django.test import TestCase
from clubs.models import Club, Event, Tag


class ClubTestCase(TestCase):
    def setUp(self):
        date = pytz.timezone('America/New_York').localize(datetime.datetime(2019, 1, 1))
        self.club = Club.objects.create(id='a', name='a', subtitle='a', founded=date, description='a', size=1)

    def test_str(self):
        self.assertEqual(str(self.club), self.club.name)


class EventTestCase(TestCase):
    def setUp(self):
        date = pytz.timezone('America/New_York').localize(datetime.datetime(2019, 1, 1))
        self.club = Club.objects.create(id='a', name='a', subtitle='a', founded=date, description='a', size=1)
        self.event = Event.objects.create(name='a', club=self.club, start_time=date, end_time=date, description='a')

    def test_str(self):
        self.assertEqual(str(self.event), self.event.name)


class TagTestCase(TestCase):
    def setUp(self):
        self.tag = Tag.objects.create(name="super interesting tag")

    def test_str(self):
        self.assertEqual(str(self.tag), self.tag.name)
