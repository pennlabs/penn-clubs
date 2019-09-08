import tempfile

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from clubs.models import Club, Favorite, Membership, MembershipInvite, Tag


class SendInvitesTestCase(TestCase):
    def setUp(self):
        self.club1 = Club.objects.create(
            code='one',
            name='Club One',
            active=True,
            email='test@example.com'
        )

        self.club2 = Club.objects.create(
            code='two',
            name='Club Two',
            active=True,
            email='test2@example.com'
        )

        self.club3 = Club.objects.create(
            code='three',
            name='Club Three',
            active=True,
            email='test3@example.com'
        )

        self.user1 = get_user_model().objects.create_user('bfranklin', 'bfranklin@seas.upenn.edu', 'test')

        Membership.objects.create(
            club=self.club3,
            person=self.user1,
            role=Membership.ROLE_OWNER
        )

    def test_send_invites(self):
        with tempfile.NamedTemporaryFile() as tmp:
            call_command('send_invites', tmp.name)

        self.assertEqual(MembershipInvite.objects.count(), 2)
        self.assertEqual(list(MembershipInvite.objects.values_list('role', flat=True)), [Membership.ROLE_OWNER] * 2)
        self.assertEqual(len(mail.outbox), 2)

        for msg in mail.outbox:
            self.assertIn('Penn Clubs', msg.body)
            self.assertTrue('one' in msg.body or 'two' in msg.body)


class MergeDuplicatesTestCase(TestCase):
    def setUp(self):
        self.tag1 = Tag.objects.create(name='One')
        self.tag2 = Tag.objects.create(name='Two')

        self.club1 = Club.objects.create(
            code='one',
            name='Same Name',
            active=False
        )
        self.club1.tags.add(self.tag1)
        self.club2 = Club.objects.create(
            code='two',
            name='Same Name',
            github='https://github.com/pennlabs/'
        )
        self.club2.tags.add(self.tag2)

        self.user1 = get_user_model().objects.create_user('bfranklin', 'bfranklin@seas.upenn.edu', 'test')

        Favorite.objects.create(
            person=self.user1,
            club=self.club1
        )

        Favorite.objects.create(
            person=self.user1,
            club=self.club2
        )

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

        self.assertEqual(Favorite.objects.count(), 1)

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
