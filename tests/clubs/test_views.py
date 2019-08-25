import datetime
import io
import json

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone

from clubs.models import Club, Event, Favorite, Membership, MembershipInvite, Tag


class ClubTestCase(TestCase):
    def setUp(self):
        self.client = Client()

        self.club1 = Club.objects.create(
            id='test-club',
            name='Test Club'
        )

        self.event1 = Event.objects.create(
            id='test-event',
            club=self.club1,
            name='Test Event',
            start_time=timezone.now(),
            end_time=timezone.now()
        )

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

    def test_club_upload(self):
        """
        Test uploading a club logo.
        """
        self.client.login(username=self.user5.username, password='test')

        # empty image throws an error
        resp = self.client.post(reverse('clubs-upload', args=(self.club1.id,)))
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # successful image upload
        resp = self.client.post(reverse('clubs-upload', args=(self.club1.id,)), {
            'file': io.BytesIO(b'')
        })
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure image url is set
        resp = self.client.get(reverse('clubs-detail', args=(self.club1.id,)))
        self.assertIn(resp.status_code, [200, 204], resp.content)
        data = json.loads(resp.content.decode('utf-8'))
        self.assertTrue(data['image_url'])

        # ensure cleanup doesn't throw error
        self.club1.delete()

    def test_event_upload(self):
        """
        Test uploading an event image.
        """
        self.client.login(username=self.user5.username, password='test')

        # successful image upload
        resp = self.client.post(reverse('club-events-upload', args=(self.club1.id, self.event1.id)), {
            'file': io.BytesIO(b'')
        })
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure cleanup doesn't throw error
        self.event1.delete()

    def test_user_views(self):
        """
        Test retrieving and updating user settings.
        """
        self.client.login(username=self.user5.username, password='test')

        # add a membership
        Membership.objects.create(
            person=self.user5,
            club=self.club1
        )

        # add a favorite
        Favorite.objects.create(
            person=self.user5,
            club=self.club1
        )

        # retrieve user
        resp = self.client.get(reverse('users-detail'))
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # update user
        resp = self.client.patch(reverse('users-detail'))
        self.assertIn(resp.status_code, [200, 201], resp.content)
        data = json.loads(resp.content.decode('utf-8'))

        for field in ['username', 'email']:
            self.assertIn(field, data)

    def test_superuser_views(self):
        """
        Test performing club/membership operations as a superuser.
        """
        self.client.login(username=self.user5.username, password='test')

        # create club as superuser
        resp = self.client.post(reverse('clubs-list'), {
            'name': 'Penn Labs',
            'description': 'We code stuff.',
            'tags': []
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # add member as superuser
        self.client.login(username=self.user5.username, password='test')

        resp = self.client.post(reverse('club-members-list', args=('penn-labs',)), {
            'person': self.user2.pk,
            'role': Membership.ROLE_OFFICER
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # remove member as superuser
        resp = self.client.delete(reverse('club-members-detail', args=('penn-labs', self.user2.username)))
        self.assertIn(resp.status_code, [200, 204], resp.content)

        # delete club as superuser
        resp = self.client.delete(reverse('clubs-detail', args=('penn-labs',)))
        self.assertIn(resp.status_code, [200, 204], resp.content)

    def test_favorite_views(self):
        """
        Test listing/adding/deleting favorites.
        """
        self.client.login(username=self.user1.username, password='test')

        # add favorite
        resp = self.client.post(reverse('favorites-list'), {
            'club': self.club1.id
        })
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # attempt to add existing favorite
        resp = self.client.post(reverse('favorites-list'), {
            'club': self.club1.id
        })
        self.assertIn(resp.status_code, [400], resp.content)

        # list favorites
        resp = self.client.get(reverse('favorites-list'))
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode('utf-8'))
        self.assertTrue(data)

        # other people shouldn't see your favorites
        self.client.login(username=self.user4.username, password='test')
        resp = self.client.get(reverse('favorites-list'))
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode('utf-8'))
        self.assertFalse(data)

        # delete favorite
        self.client.login(username=self.user1.username, password='test')
        resp = self.client.delete(reverse('favorites-detail', args=(self.club1.id,)))
        self.assertIn(resp.status_code, [200, 204], resp.content)

    def test_event_list(self):
        """
        Test listing club events.
        """
        self.client.login(username=self.user5.username, password='test')

        # list events
        resp = self.client.get(reverse('club-events-list', args=(self.club1.id,)), content_type='application/json')
        self.assertIn(resp.status_code, [200], resp.content)

    def test_event_create_delete(self):
        """
        Test creating and deleting a club event.
        """
        self.client.login(username=self.user5.username, password='test')

        start_date = datetime.datetime.now() - datetime.timedelta(days=3)
        end_date = start_date + datetime.timedelta(hours=2)

        # add event
        resp = self.client.post(reverse('club-events-list', args=(self.club1.id,)), {
            'name': 'Interest Meeting',
            'description': 'Interest Meeting on Friday!',
            'location': 'JMHH G06',
            'start_time': start_date.isoformat(),
            'end_time': end_date.isoformat()
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure event exists
        self.assertEqual(Event.objects.filter(name='Interest Meeting').count(), 1)
        self.assertEqual(Event.objects.get(name='Interest Meeting').creator, self.user5)

        # delete event
        resp = self.client.delete(reverse('club-events-detail', args=(self.club1.id, 'interest-meeting')))
        self.assertIn(resp.status_code, [200, 204], resp.content)

    def test_member_views(self):
        """
        Test listing, adding, and removing members.
        """
        self.client.login(username=self.user1.username, password='test')

        # create club
        resp = self.client.post(reverse('clubs-list'), {
            'name': 'Penn Labs',
            'description': 'We code stuff.',
            'tags': []
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # list members
        resp = self.client.get(reverse('club-members-list', args=('penn-labs',)))
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode('utf-8'))
        self.assertEqual(data[0]['name'], self.user1.get_full_name())

        # add member should fail with insufficient permissions
        self.client.logout()

        resp = self.client.post(reverse('club-members-list', args=('penn-labs',)), {
            'person': self.user2.pk,
            'role': Membership.ROLE_OWNER
        }, content_type='application/json')

        self.assertIn(resp.status_code, [400, 403], resp.content)

        # add member
        self.client.login(username=self.user1.username, password='test')

        resp = self.client.post(reverse('club-members-list', args=('penn-labs',)), {
            'person': self.user2.pk,
            'role': Membership.ROLE_OFFICER
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        resp = self.client.post(reverse('club-members-list', args=('penn-labs',)), {
            'person': self.user3.pk,
            'role': Membership.ROLE_MEMBER
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        self.assertEqual(Club.objects.get(pk='penn-labs').members.count(), 3)
        self.assertEqual(Membership.objects.get(person=self.user2, club='penn-labs').role, Membership.ROLE_OFFICER)

        # list member
        resp = self.client.get(reverse('club-members-list', args=('penn-labs',)))
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode('utf-8'))
        for item in data:
            self.assertIn('name', item)
            self.assertIn('email', item)
            self.assertIn('role', item)

        # list member as outsider
        self.client.logout()
        resp = self.client.get(reverse('club-members-list', args=('penn-labs',)))
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode('utf-8'))
        for item in data:
            self.assertNotIn('email', item)

        # delete member should fail with insufficient permissions
        self.client.login(username=self.user2.username, password='test')

        resp = self.client.delete(reverse('club-members-detail', args=('penn-labs', self.user1.username)),
                                  content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # delete member should fail for people not in club
        self.client.login(username=self.user4.username, password='test')
        resp = self.client.delete(reverse('club-members-detail', args=('penn-labs', self.user1.username)),
                                  content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # cannot add self to a club that you're not in
        resp = self.client.post(reverse('club-members-list', args=('penn-labs',)), {
            'person': self.user4.pk,
            'role': Membership.ROLE_MEMBER
        })
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # modify self to higher role should fail with insufficient permissions
        self.client.login(username=self.user2.username, password='test')
        resp = self.client.patch(reverse('club-members-detail', args=('penn-labs', self.user2.username)), {
            'role': Membership.ROLE_OWNER
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # promote member
        resp = self.client.patch(reverse('club-members-detail', args=('penn-labs', self.user3.username)), {
            'title': 'Treasurer',
            'role': Membership.ROLE_OFFICER
        }, content_type='application/json')

        self.assertEqual(Membership.objects.get(person=self.user3, club='penn-labs').title, 'Treasurer')

        # delete member
        self.client.login(username=self.user1.username, password='test')

        resp = self.client.delete(reverse('club-members-detail', args=('penn-labs', self.user2.username)),
                                  content_type='application/json')
        self.assertIn(resp.status_code, [200, 204], resp.content)

        # ensure cannot demote self if only owner
        resp = self.client.patch(reverse('club-members-detail', args=('penn-labs', self.user1.username)), {
            'role': Membership.ROLE_OFFICER
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

        # ensure cannot delete self if only owner
        resp = self.client.delete(reverse('club-members-detail', args=('penn-labs', self.user1.username)),
                                  content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_membership_auth(self):
        Membership.objects.create(
            club=self.club1,
            person=self.user1
        )
        self.client.login(username=self.user1.username, password='test')
        bad_tries = [{'title': 'Supreme Leader'}, {'role': Membership.ROLE_OFFICER}, {'active': False}]
        for bad in bad_tries:
            resp = self.client.patch(reverse('club-members-detail', args=(self.club1.id, self.user1.username)),
                                     bad,
                                     content_type='application/json')
            self.assertIn(resp.status_code, [400, 403], resp.content)

        good_tries = [{'public': True}, {'public': False}]
        for good in good_tries:
            resp = self.client.patch(reverse('club-members-detail', args=(self.club1.id, self.user1.username)),
                                     good,
                                     content_type='application/json')
            self.assertIn(resp.status_code, [200, 201], resp.content)

        resp = self.client.delete(reverse('club-members-detail', args=(self.club1.id, self.user1.username)))
        self.assertIn(resp.status_code, [200, 204], resp.content)

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

    def test_club_create_empty(self):
        """
        Test creating a club with empty fields.
        """
        self.client.login(username=self.user5.username, password='test')

        resp = self.client.post(reverse('clubs-list'), {
            'name': 'Penn Labs',
            'description': '',
            'tags': [],
            'facebook': '',
            'twitter': '',
            'instagram': '',
            'website': '',
            'linkedin': '',
            'github': ''
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

    def test_club_create_url_sanitize(self):
        """
        Test creating clubs with malicious URLs.
        """
        self.client.login(username=self.user5.username, password='test')

        exploit_string = 'javascript:alert(1)'

        resp = self.client.post(reverse('clubs-list'), {
            'name': 'Bad Club',
            'tags': [],
            'facebook': exploit_string,
            'twitter': exploit_string,
            'instagram': exploit_string,
            'website': exploit_string,
            'linkedin': exploit_string,
            'github': exploit_string
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_create_description_sanitize_good(self):
        """
        Ensure that descriptions are properly sanitized.
        """
        test_good_string = """<p>Here\'s some <b>bold</b>, <i>italic</i>, <u>underline</u>, and a <a href=\"http://example.com\">link</a>.<br></p>
<ul>
    <li>One</li>
    <li>Two</li>
    <li>Three</li>
</ul>
<ol>
    <li>One</li>
    <li>Two</li>
    <li>Three</li>
</ol>
<img src=\"/test.png\">"""

        self.client.login(username=self.user5.username, password='test')
        resp = self.client.post(reverse('clubs-list'), {
            'name': 'Penn Labs',
            'tags': [],
            'description': test_good_string
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        resp = self.client.get(reverse('clubs-detail', args=('penn-labs',)))
        self.assertIn(resp.status_code, [200], resp.content)

        data = json.loads(resp.content.decode('utf-8'))
        self.assertEqual(data['description'], test_good_string)

    def test_club_create_description_sanitize_bad(self):
        """
        Ensure that descriptions are properly sanitized.
        """
        test_bad_string = '<script>alert(1);</script><img src="javascript:alert(1)">'

        self.client.login(username=self.user5.username, password='test')
        resp = self.client.post(reverse('clubs-list'), {
            'name': 'Penn Labs',
            'tags': [],
            'description': test_bad_string
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        resp = self.client.get(reverse('clubs-detail', args=('penn-labs',)))
        self.assertIn(resp.status_code, [200], resp.content)

        data = json.loads(resp.content.decode('utf-8'))
        self.assertNotIn('<script>', data['description'])
        self.assertNotIn('javascript:', data['description'])

    def test_club_create_no_input(self):
        """
        Passing in no data should result in a bad request.
        """
        self.client.login(username=self.user5.username, password='test')

        resp = self.client.post(reverse('clubs-list'), {}, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_create_no_auth(self):
        """
        Creating a club without authentication should result in an error.
        """
        resp = self.client.post(reverse('clubs-list'), {
            'name': 'Penn Labs',
            'description': 'We code stuff.',
            'email': 'contact@pennlabs.org',
            'tags': []
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_create(self):
        """
        Test properly creating a club.
        """
        tag1 = Tag.objects.create(name='Wharton')
        tag2 = Tag.objects.create(name='Engineering')

        self.client.login(username=self.user5.username, password='test')

        resp = self.client.post(reverse('clubs-list'), {
            'name': 'Penn Labs',
            'description': 'We code stuff.',
            'tags': [
                {
                    'name': tag1.name
                },
                {
                    'name': tag2.name
                }
            ],
            'facebook': 'https://www.facebook.com/groups/966590693376781/?ref=nf_target&fref=nf',
            'twitter': 'https://twitter.com/Penn',
            'instagram': 'https://www.instagram.com/uofpenn/?hl=en',
            'website': 'https://pennlabs.org',
            'linkedin': 'https://www.linkedin.com/school/university-of-pennsylvania/',
            'github': 'https://github.com/pennlabs'
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure club was actually created
        club_obj = Club.objects.filter(name='Penn Labs').first()
        self.assertTrue(club_obj)
        self.assertEqual(Membership.objects.filter(club=club_obj).count(), 1)
        self.assertEqual(club_obj.members.count(), 1)

        # ensure lookup returns the correct information
        resp = self.client.get(reverse('clubs-detail', args=('penn-labs',)))
        self.assertIn(resp.status_code, [200], resp.content)

        data = json.loads(resp.content.decode('utf-8'))
        self.assertEqual(data['id'], 'penn-labs')
        self.assertEqual(data['name'], 'Penn Labs')
        self.assertEqual(data['description'], 'We code stuff.')
        self.assertTrue(data['tags'], data)
        self.assertEqual(data['members'][0]['name'], self.user5.get_full_name())

        for link in ['facebook', 'twitter', 'instagram', 'website', 'github']:
            self.assertIn(link, data)

    def test_club_create_duplicate(self):
        """
        Creating a duplicate club should result in an 400 error.
        """
        self.client.login(username=self.user5.username, password='test')

        resp = self.client.post(reverse('clubs-list'), {
            'name': 'Test Club',
            'tags': []
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_list_search(self):
        """
        Test simple club filtering.
        """
        resp = self.client.get(reverse('clubs-list') + '?search=test')
        self.assertIn(resp.status_code, [200], resp.content)
        data = json.loads(resp.content.decode('utf-8'))
        self.assertTrue(data)

    def test_club_modify_wrong_auth(self):
        """
        Outsiders should not be able to modify a club.
        """
        self.client.login(username=self.user4.username, password='test')
        resp = self.client.patch(reverse('clubs-detail', args=(self.club1.id,)), {
            'description': 'We do stuff.',
            'tags': []
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_modify_insufficient_auth(self):
        """
        Ordinary members should not be able to modify the club.
        """
        Membership.objects.create(
            club=Club.objects.get(pk=self.club1.id),
            person=self.user2
        )
        self.client.login(username=self.user2.username, password='test')
        resp = self.client.patch(reverse('clubs-detail', args=(self.club1.id,)), {
            'description': 'We do stuff.',
            'tags': []
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_retrieve(self):
        """
        Ordinary members should be able to retrieve the club.
        """
        Membership.objects.create(
            club=Club.objects.get(pk=self.club1.id),
            person=self.user2
        )
        self.client.login(username=self.user2.username, password='test')
        resp = self.client.get(reverse('clubs-detail', args=(self.club1.id,)))
        self.assertIn(resp.status_code, [200], resp.content)

    def test_club_modify(self):
        """
        Owners and officers should be able to modify the club.
        """
        tag3 = Tag.objects.create(name='College')

        self.client.login(username=self.user5.username, password='test')
        resp = self.client.patch(reverse('clubs-detail', args=(self.club1.id,)), {
            'description': 'We do stuff.',
            'tags': [
                {
                    'name': tag3.name
                }
            ]
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure that changes were made
        resp = self.client.get(reverse('clubs-detail', args=(self.club1.id,)))
        self.assertIn(resp.status_code, [200], resp.content)

        data = json.loads(resp.content.decode('utf-8'))
        self.assertEqual(data['description'], 'We do stuff.')
        self.assertEqual(len(data['tags']), 1)

    def test_club_modify_no_id(self):
        """
        The club ID cannot be modified after creation (breaks ForeignKeys).
        """
        self.client.login(username=self.user5.username, password='test')
        resp = self.client.patch(reverse('clubs-detail', args=(self.club1.id,)), {
            'id': 'one-two-three',
            'name': 'One Two Three'
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure id is still the same
        resp = self.client.get(reverse('clubs-detail', args=(self.club1.id,)))
        self.assertIn(resp.status_code, [200], resp.content)

    def test_club_delete_no_auth(self):
        """
        Unauthenticated users should not be able to delete a club.
        """
        resp = self.client.delete(reverse('clubs-detail', args=(self.club1.id,)))
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_delete(self):
        """
        Owners should be able to delete the club.
        """
        self.client.login(username=self.user5.username, password='test')

        resp = self.client.delete(reverse('clubs-detail', args=(self.club1.id,)))
        self.assertIn(resp.status_code, [200, 204], resp.content)

        # ensure club was deleted
        self.assertFalse(Club.objects.filter(name='Test Club').exists())

    def test_club_deactivate(self):
        """
        Owners should be able to deactivate the club.
        """
        self.client.login(username=self.user5.username, password='test')

        resp = self.client.patch(reverse('clubs-detail', args=(self.club1.id,)), {
            'active': False
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 204], resp.content)

        # ensure club was deactivated
        self.assertFalse(Club.objects.get(name='Test Club').active)

    def test_club_deactivate_insufficient_auth(self):
        """
        Officers should not be able to deactivate the club.
        """
        Membership.objects.create(
            club=self.club1,
            person=self.user2,
            role=Membership.ROLE_OFFICER
        )
        self.client.login(username=self.user2.username, password='test')
        resp = self.client.patch(reverse('clubs-detail', args=(self.club1.id,)), {
            'active': False
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_invite(self):
        """
        Test the email invitation feature.
        """
        self.client.login(username=self.user5.username, password='test')

        resp = self.client.post(reverse('club-invite', args=(self.club1.id,)), {
            'emails': 'one@pennlabs.org, two@pennlabs.org, three@pennlabs.org',
            'role': Membership.ROLE_OFFICER
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)
        data = json.loads(resp.content.decode('utf-8'))

        # ensure membership invite was created
        invites = MembershipInvite.objects.filter(club__pk=self.club1.id)
        self.assertEqual(invites.count(), 3, data)
        self.assertEqual(invites.values_list('role', flat=True), [Membership.ROLE_OFFICER] * 3, data)
        self.assertEqual(len(mail.outbox), 3, mail.outbox)

        # ensure we can get all memberships
        ids_and_tokens = MembershipInvite.objects.filter(club__pk=self.club1.id).values_list('id', 'token')
        for id, token in ids_and_tokens:
            resp = self.client.get(reverse('club-invites-detail', args=(self.club1.id, id)))
            self.assertIn(resp.status_code, [200, 201], resp.content)

        # ensure invite can be redeemed
        self.client.login(username=self.user5.username, password='test')

        resp = self.client.patch(reverse('club-invites-detail', args=(self.club1.id, ids_and_tokens[0][0])), {
            'token': ids_and_tokens[0][1]
        }, content_type='application/json')
        self.assertIn(resp.status_code, [200, 201], resp.content)

        self.assertTrue(Membership.objects.filter(club=self.club1, person=self.user5).exists())

        # ensure invite cannot be reclaimed

        resp = self.client.patch(reverse('club-invites-detail', args=(self.club1.id, ids_and_tokens[0][0])), {
            'token': ids_and_tokens[0][1]
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403, 404], resp.content)

        # ensure invite can be deleted
        self.client.login(username=self.user5.username, password='test')
        resp = self.client.delete(reverse('club-invites-detail', args=(self.club1.id, ids_and_tokens[1][0])))
        self.assertIn(resp.status_code, [200, 204], resp.content)

    def test_club_invite_insufficient_auth(self):
        self.client.login(username=self.user2.username, password='test')
        Membership.objects.create(
            person=self.user2,
            club=self.club1
        )

        resp = self.client.post(reverse('club-invite', args=(self.club1.id,)), {
            'emails': 'one@pennlabs.org, two@pennlabs.org, three@pennlabs.org'
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)

    def test_club_invite_insufficient_permissions(self):
        self.client.login(username=self.user2.username, password='test')
        Membership.objects.create(
            person=self.user2,
            club=self.club1,
            role=Membership.ROLE_OFFICER
        )

        resp = self.client.post(reverse('club-invite', args=(self.club1.id,)), {
            'emails': 'one@pennlabs.org, two@pennlabs.org, three@pennlabs.org',
            'role': Membership.ROLE_OWNER,
            'title': 'Supreme Leader'
        }, content_type='application/json')
        self.assertIn(resp.status_code, [400, 403], resp.content)
