import json
import datetime

from django.test import TestCase, Client

from clubs.models import Club, Membership, Tag, Event
from users.models import Person


class ClubTestCase(TestCase):
    def setUp(self):
        self.client = Client()

        self.user1 = Person.objects.create_user('bfranklin', 'bfranklin@seas.upenn.edu', 'test')
        self.user1.first_name = 'Benjamin'
        self.user1.last_name = 'Franklin'
        self.user1.save()

        self.user2 = Person.objects.create_user('tjefferson', 'tjefferson@seas.upenn.edu', 'test')
        self.user2.first_name = 'Thomas'
        self.user2.last_name = 'Jefferson'
        self.user2.save()

        self.user3 = Person.objects.create_user('gwashington', 'gwashington@wharton.upenn.edu', 'test')
        self.user3.first_name = 'George'
        self.user3.last_name = 'Washington'
        self.user3.save()

    def test_event_views(self):
        """
        Test listing events.
        """
        self.client.login(username=self.user1.username, password='test')

        # create club
        resp = self.client.post('/clubs/', {
            'name': 'Penn Labs',
            'description': 'We code stuff.',
            'tags': []
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # list events
        resp = self.client.get('/clubs/penn-labs/events/', content_type='application/json')
        self.assertIn(resp.status_code, [200], resp.content)

        start_date = datetime.datetime.now() - datetime.timedelta(days=3)
        end_date = start_date + datetime.timedelta(hours=2)

        # add event
        resp = self.client.post('/clubs/penn-labs/events/', {
            'name': 'Interest Meeting',
            'description': 'Interest Meeting on Friday!',
            'location': 'JMHH G06',
            'start_time': start_date.isoformat(),
            'end_time': end_date.isoformat()
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        self.assertEqual(Event.objects.count(), 1)

        # delete event
        resp = self.client.delete('/clubs/penn-labs/events/{}/'.format('interest-meeting'))
        self.assertIn(resp.status_code, [200, 204], resp.content)

    def test_member_views(self):
        """
        Test listing, adding, and removing members.
        """
        self.client.login(username=self.user1.username, password='test')

        # create club
        resp = self.client.post('/clubs/', {
            'name': 'Penn Labs',
            'description': 'We code stuff.',
            'tags': []
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # list members
        resp = self.client.get('/clubs/penn-labs/members/')
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode('utf-8'))
        self.assertEqual(data[0]['name'], self.user1.full_name)

        # add member should fail with insufficient permissions
        self.client.logout()

        resp = self.client.post('/clubs/penn-labs/members/', {
            'person': self.user2.pk,
            'role': Membership.ROLE_OWNER
        }, content_type='application/json')

        self.assertIn(resp.status_code, [400, 403], resp.content)

        # add member
        self.client.login(username=self.user1.username, password='test')

        resp = self.client.post('/clubs/penn-labs/members/', {
            'person': self.user2.pk,
            'role': Membership.ROLE_OFFICER
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        resp = self.client.post('/clubs/penn-labs/members/', {
            'person': self.user3.pk,
            'role': Membership.ROLE_MEMBER
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        self.assertEqual(Club.objects.get(pk='penn-labs').members.count(), 3)
        self.assertEqual(Membership.objects.get(person=self.user2, club='penn-labs').role, Membership.ROLE_OFFICER)

        # delete member should fail with insufficient permissions
        self.client.logout()
        self.client.login(username=self.user2.username, password='test')

        resp = self.client.delete('/clubs/penn-labs/members/{}/'.format(self.user1.username), content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # modify self to higher role should fail with insufficient permissions
        resp = self.client.patch('/clubs/penn-labs/members/{}/'.format(self.user2.username), {
            'role': Membership.ROLE_OWNER
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # promote member
        resp = self.client.patch('/clubs/penn-labs/members/{}/'.format(self.user3.username), {
            'title': 'Treasurer',
            'role': Membership.ROLE_OFFICER
        }, content_type='application/json')

        self.assertEqual(Membership.objects.get(person=self.user3, club='penn-labs').title, 'Treasurer')

        # delete member
        self.client.login(username=self.user1.username, password='test')

        resp = self.client.delete('/clubs/penn-labs/members/{}/'.format(self.user2.username), content_type='application/json')
        self.assertIn(resp.status_code, [200, 204], resp.content)

        # ensure cannot demote self if only owner
        resp = self.client.patch('/clubs/penn-labs/members/{}/'.format(self.user1.username), {
            'role': Membership.ROLE_OFFICER
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # ensure cannot delete self if only owner
        resp = self.client.delete('/clubs/penn-labs/members/{}/'.format(self.user1.username), content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_tag_views(self):
        # everyone can view the list of tags
        resp = self.client.get('/tags/')
        self.assertIn(resp.status_code, [200], resp.content)

        # ensure that unauthenticated users cannot create tags
        resp = self.client.post('/tags/', {
            'name': 'Some Tag'
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403, 405], resp.content)

        # ensure that unauthenticated users cannot delete tags
        resp = self.client.delete('/tags/some-tag/')
        self.assertIn(resp.status_code, [400, 403, 405], resp.content)

    def test_club_views(self):
        """
        Test creating, listing, modifying, and deleting a club.
        """
        tag1 = Tag.objects.create(name="Computer Science")
        tag2 = Tag.objects.create(name="Engineering")

        # passing no data should result in a bad request
        resp = self.client.post('/clubs/', {}, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # creating without auth should result in a error
        resp = self.client.post('/clubs/', {
            'name': 'Penn Labs',
            'description': 'We code stuff.',
            'email': 'contact@pennlabs.org',
            'tags': []
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

        self.client.login(username=self.user1.username, password='test')

        # test creating club
        resp = self.client.post('/clubs/', {
            'name': 'Penn Labs',
            'description': 'We code stuff.',
            'tags': [
                {
                    'name': tag1.name
                },
                {
                    'name': tag2.name
                }
            ]
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        self.assertEqual(Club.objects.count(), 1)
        self.assertEqual(Membership.objects.count(), 1)
        self.assertEqual(Club.objects.first().members.count(), 1)

        resp = self.client.get('/clubs/penn-labs/')
        self.assertIn(resp.status_code, [200], resp.content)

        data = json.loads(resp.content.decode('utf-8'))
        self.assertEqual(data['id'], 'penn-labs')
        self.assertEqual(data['name'], 'Penn Labs')
        self.assertEqual(data['description'], 'We code stuff.')
        self.assertTrue(data['tags'], data)
        self.assertEqual(data['members'][0]['name'], self.user1.full_name)

        # test modifying club
        resp = self.client.patch('/clubs/penn-labs/', {
            'description': 'We do stuff.',
            'tags': []
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        resp = self.client.get('/clubs/penn-labs/')
        self.assertIn(resp.status_code, [200], resp.content)

        data = json.loads(resp.content.decode('utf-8'))
        self.assertEqual(data['description'], 'We do stuff.')
        self.assertFalse(data['tags'])

        # test deleting club
        resp = self.client.delete('/clubs/penn-labs/')
        self.assertIn(resp.status_code, [200, 204], resp.content)

        self.assertEqual(Club.objects.count(), 0)
