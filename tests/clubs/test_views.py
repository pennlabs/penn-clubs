import json
import datetime

from django.test import TestCase, Client
from django.contrib.auth import get_user_model

from clubs.models import Club, Membership, Tag, Event


class ClubTestCase(TestCase):
    def setUp(self):
        self.client = Client()

        self.user1 = get_user_model().objects.create_user('bfranklin', 'bfranklin@seas.upenn.edu', 'test')
        self.user1.first_name = 'Benjamin'
        self.user1.last_name = 'Franklin'
        self.user1.save()

        self.user2 = get_user_model().objects.create_user('tjefferson', 'tjefferson@seas.upenn.edu', 'test')
        self.user2.first_name = 'Thomas'
        self.user2.last_name = 'Jefferson'
        self.user2.save()

        self.user3 = get_user_model().objects.create_user('gwashington', 'gwashington@wharton.upenn.edu', 'test')
        self.user3.first_name = 'George'
        self.user3.last_name = 'Washington'
        self.user3.save()

        self.user4 = get_user_model().objects.create_user('barnold', 'barnold@wharton.upenn.edu', 'test')
        self.user4.first_name = 'Benedict'
        self.user4.last_name = 'Arnold'
        self.user4.save()

        self.user5 = get_user_model().objects.create_user('jadams', 'jadams@sas.upenn.edu', 'test')
        self.user5.first_name = 'John'
        self.user5.last_name = 'Adams'
        self.user5.is_staff = True
        self.user5.is_superuser = True
        self.user5.save()

    def test_superuser_views(self):
        self.client.login(username=self.user1.username, password='test')

        # create club
        resp = self.client.post('/clubs/', {
            'name': 'Penn Labs',
            'description': 'We code stuff.',
            'tags': []
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # add member as superuser
        self.client.login(username=self.user5.username, password='test')

        resp = self.client.post('/clubs/penn-labs/members/', {
            'person': self.user2.pk,
            'role': Membership.ROLE_OFFICER
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # remove member as superuser
        resp = self.client.delete('/clubs/penn-labs/members/{}/'.format(self.user2.username))
        self.assertIn(resp.status_code, [200, 204], resp.content)

        # delete club as superuser
        resp = self.client.delete('/clubs/penn-labs/')
        self.assertIn(resp.status_code, [200, 204], resp.content)

    def test_favorite_views(self):
        """
        Test listing/adding/deleting favorites.
        """
        self.client.login(username=self.user1.username, password='test')

        # create club
        resp = self.client.post('/clubs/', {
            'name': 'Penn Labs',
            'description': 'We code stuff.',
            'tags': []
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # add favorite
        resp = self.client.post('/favorites/', {
            'club': 'penn-labs'
        })
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # list favorites
        resp = self.client.get('/favorites/')
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode('utf-8'))
        self.assertTrue(data)

        # other people shouldn't see your favorites
        self.client.login(username=self.user4.username, password='test')
        resp = self.client.get('/favorites/')
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode('utf-8'))
        self.assertFalse(data)

        # delete favorite
        self.client.login(username=self.user1.username, password='test')
        resp = self.client.delete('/favorites/penn-labs/')
        self.assertIn(resp.status_code, [200, 204], resp.content)

    def test_event_views(self):
        """
        Test listing/adding/deleting events.
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
        self.assertEqual(Event.objects.first().creator, self.user1)

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
        self.assertEqual(data[0]['name'], self.user1.get_full_name())

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

        # list member
        resp = self.client.get('/clubs/penn-labs/members/')
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode('utf-8'))
        for item in data:
            self.assertIn('name', item)
            self.assertIn('email', item)
            self.assertIn('role', item)

        # list member as outsider
        self.client.logout()
        resp = self.client.get('/clubs/penn-labs/members/')
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode('utf-8'))
        for item in data:
            self.assertNotIn('email', item)

        # delete member should fail with insufficient permissions
        self.client.login(username=self.user2.username, password='test')

        resp = self.client.delete('/clubs/penn-labs/members/{}/'.format(self.user1.username), content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # delete member should fail for people not in club
        self.client.login(username=self.user4.username, password='test')
        resp = self.client.delete('/clubs/penn-labs/members/{}/'.format(self.user1.username), content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # cannot add self to a club that you're not in
        resp = self.client.post('/clubs/penn-labs/members/', {
            'person': self.user4.pk,
            'role': Membership.ROLE_MEMBER
        })
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # modify self to higher role should fail with insufficient permissions
        self.client.login(username=self.user2.username, password='test')
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
        tag3 = Tag.objects.create(name="Wharton")

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

        club_obj = Club.objects.filter(name='Penn Labs').first()
        self.assertTrue(club_obj)
        self.assertEqual(Membership.objects.filter(club=club_obj).count(), 1)
        self.assertEqual(club_obj.members.count(), 1)

        # creating again should raise an error
        resp = self.client.post('/clubs/', {
            'name': 'Penn Labs',
            'description': 'We code stuff.',
            'tags': []
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400], resp.content)

        resp = self.client.get('/clubs/penn-labs/')
        self.assertIn(resp.status_code, [200], resp.content)

        data = json.loads(resp.content.decode('utf-8'))
        self.assertEqual(data['id'], 'penn-labs')
        self.assertEqual(data['name'], 'Penn Labs')
        self.assertEqual(data['description'], 'We code stuff.')
        self.assertTrue(data['tags'], data)
        self.assertEqual(data['members'][0]['name'], self.user1.get_full_name())

        # test listing club
        resp = self.client.get('/clubs/?q=penn')
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode('utf-8'))
        self.assertTrue(data)

        # outsiders should not be able to modify club
        self.client.login(username=self.user4.username, password='test')
        resp = self.client.patch('/clubs/penn-labs/', {
            'description': 'We do stuff.',
            'tags': []
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # ordinary members should not be able to modify club
        Membership.objects.create(
            club=Club.objects.get(pk='penn-labs'),
            person=self.user2
        )
        self.client.login(username=self.user2.username, password='test')
        resp = self.client.patch('/clubs/penn-labs/', {
            'description': 'We do stuff.',
            'tags': []
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # they can retrieve club info though
        resp = self.client.get('/clubs/penn-labs/')
        self.assertIn(resp.status_code, [200], resp.content)

        # test modifying club
        self.client.login(username=self.user1.username, password='test')
        resp = self.client.patch('/clubs/penn-labs/', {
            'description': 'We do stuff.',
            'tags': [
                {
                    'name': tag3.name
                }
            ]
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        resp = self.client.get('/clubs/penn-labs/')
        self.assertIn(resp.status_code, [200], resp.content)

        data = json.loads(resp.content.decode('utf-8'))
        self.assertEqual(data['description'], 'We do stuff.')
        self.assertEqual(len(data['tags']), 1)

        # test deleting club
        resp = self.client.delete('/clubs/penn-labs/')
        self.assertIn(resp.status_code, [200, 204], resp.content)

        self.assertFalse(Club.objects.filter(name='Penn Labs').exists())
