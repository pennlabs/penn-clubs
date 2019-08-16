import json

from django.test import TestCase, Client

from clubs.models import Club, Membership, Tag
from users.models import Person


class ClubTestCase(TestCase):
    def setUp(self):
        self.client = Client()

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

        user = Person.objects.create_user('ezwang', 'ezwang@seas.upenn.edu', 'test')
        user.first_name = 'Eric'
        user.last_name = 'Wang'
        user.save()
        self.client.login(username='ezwang', password='test')

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
        self.assertEqual(data['members'][0]['name'], 'Eric Wang')

        # test modifying club
        resp = self.client.post('/clubs/penn-labs/', {
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
