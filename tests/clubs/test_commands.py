from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from clubs.models import Club, Tag


class MergeDuplicatesTestCase(TestCase):
    def setUp(self):
        self.tag1 = Tag.objects.create(name='One')
        self.tag2 = Tag.objects.create(name='Two')

        self.club1 = Club.objects.create(
            id='one',
            name='Same Name',
            active=False
        )
        self.club1.tags.add(self.tag1)
        self.club2 = Club.objects.create(
            id='two',
            name='Same Name',
            github='https://github.com/pennlabs/'
        )
        self.club2.tags.add(self.tag2)

    def test_merge_duplicates_auto(self):
        """
        Test merging duplicates in automatic mode.
        """
        call_command('merge_duplicates', '--auto')

        self.assertEqual(Club.objects.count(), 1)
        self.assertEqual(Club.objects.first().tags.count(), 2)
        self.assertTrue(Club.objects.first().github)

    def test_merge_duplicate_clubs(self):
        """
        Test merging duplicate clubs.
        """
        call_command('merge_duplicates', 'one', 'two')

        self.assertEqual(Club.objects.count(), 1)
        self.assertEqual(Club.objects.first().tags.count(), 2)
        self.assertTrue(Club.objects.first().github)

    def test_merge_duplicate_tags(self):
        """
        Test merging duplicate tags.
        """
        call_command('merge_duplicates', '--tag', 'One', 'Two')

        self.assertEqual(Tag.objects.count(), 1)

    def test_wrong_arguments(self):
        """
        Test with wrong number of arguments.
        """

        with self.assertRaises(CommandError):
            call_command('merge_duplicates')

        with self.assertRaises(CommandError):
            call_command('merge_duplicates', '--tag')
