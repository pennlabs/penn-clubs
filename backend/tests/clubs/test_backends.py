import datetime

import pytz
from accounts.models import AccessToken, RefreshToken
from django.contrib import auth
from django.contrib.auth import get_user_model
from django.test import TestCase

from clubs.models import Club, Favorite, Membership, MembershipInvite


class BackendTestCase(TestCase):
    def setUp(self):
        self.User = get_user_model()
        self.remote_user = {
            "pennid": 123456789,
            "first_name": "First",
            "last_name": "Last",
            "username": "user",
            "email": "test@test.com",
            "affiliation": [],
            "product_permission": [],
            "token": {"access_token": "abc", "refresh_token": "123", "expires_in": 100},
        }

    def test_invalid_remote_user(self):
        user = auth.authenticate(remote_user=None)
        self.assertIsNone(user)

    def test_create_user(self):
        auth.authenticate(remote_user=self.remote_user)
        self.assertEqual(len(self.User.objects.all()), 1)
        user = self.User.objects.all()[0]
        self.assertEqual(user.username, "user")
        self.assertEqual(user.first_name, "First")
        self.assertEqual(user.last_name, "Last")
        self.assertEqual(user.email, "test@test.com")
        self.assertFalse(self.User.objects.all()[0].is_staff)
        self.assertEqual(len(AccessToken.objects.all()), 1)
        self.assertEqual(len(RefreshToken.objects.all()), 1)
        self.assertEqual(self.remote_user["token"]["access_token"], user.accesstoken.token)
        self.assertEqual(self.remote_user["token"]["refresh_token"], user.refreshtoken.token)

    def test_update_user(self):
        auth.authenticate(remote_user=self.remote_user)
        self.assertEqual(len(self.User.objects.all()), 1)
        self.remote_user["username"] = "changed_user"
        auth.authenticate(remote_user=self.remote_user)
        user = self.User.objects.all()[0]
        self.assertEqual(user.username, "changed_user")
        self.assertEqual(len(AccessToken.objects.all()), 1)
        self.assertEqual(len(RefreshToken.objects.all()), 1)
        self.assertEqual(self.remote_user["token"]["access_token"], user.accesstoken.token)
        self.assertEqual(self.remote_user["token"]["refresh_token"], user.refreshtoken.token)

    def test_login_user(self):
        student = self.User.objects.create_user(id=123456789, username="user", password="secret")
        user = auth.authenticate(remote_user=self.remote_user)
        self.assertEqual(user, student)
        self.assertEqual(len(self.User.objects.all()), 1)
        self.assertFalse(self.User.objects.all()[0].is_staff)

    def test_login_user_admin(self):
        self.remote_user["product_permission"] = ["example_admin"]
        student = self.User.objects.create_user(id=123456789, username="user", password="secret")
        user = auth.authenticate(remote_user=self.remote_user)
        self.assertEqual(user, student)
        self.assertEqual(len(self.User.objects.all()), 1)
        self.assertTrue(self.User.objects.all()[0].is_staff)

    def test_create_user_admin(self):
        self.remote_user["product_permission"] = ["example_admin"]
        auth.authenticate(remote_user=self.remote_user)
        self.assertEqual(len(self.User.objects.all()), 1)
        self.assertEqual(self.User.objects.all()[0].username, "user")
        self.assertTrue(self.User.objects.all()[0].is_staff)

    def test_give_admin_permission(self):
        user = auth.authenticate(remote_user=self.remote_user)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.remote_user["product_permission"] = ["example_admin"]
        user = auth.authenticate(remote_user=self.remote_user)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_remove_admin_permission(self):
        self.remote_user["product_permission"] = ["example_admin"]
        user = auth.authenticate(remote_user=self.remote_user)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.remote_user["product_permission"] = []
        user = auth.authenticate(remote_user=self.remote_user)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_update_from_pennkey(self):
        date = pytz.timezone("America/New_York").localize(datetime.datetime(2019, 1, 1))
        old_user = self.User.objects.create_user(id=1, username="user")
        clubs = []
        for x in ["a", "b", "c"]:
            clubs.append(
                Club.objects.create(code=x, name=x, subtitle=x, founded=date, description=x, size=1)
            )
        Membership.objects.create(person=old_user, club=clubs[0])
        Membership.objects.create(person=old_user, club=clubs[1])
        Favorite.objects.create(person=old_user, club=clubs[0])
        Favorite.objects.create(person=old_user, club=clubs[2])
        MembershipInvite.objects.create(creator=old_user, club=clubs[1])
        MembershipInvite.objects.create(creator=old_user, club=clubs[2])
        auth.authenticate(remote_user=self.remote_user)
        new_user = self.User.objects.all()[0]
        self.assertEqual(len(self.User.objects.all()), 1)
        self.assertEqual(len(new_user.membership_set.filter(club=clubs[0])), 1)
        self.assertEqual(len(new_user.membership_set.filter(club=clubs[1])), 1)
        self.assertEqual(len(new_user.membership_set.filter(club=clubs[2])), 0)
        self.assertEqual(len(new_user.favorite_set.filter(club=clubs[0])), 1)
        self.assertEqual(len(new_user.favorite_set.filter(club=clubs[1])), 0)
        self.assertEqual(len(new_user.favorite_set.filter(club=clubs[2])), 1)
        self.assertEqual(len(new_user.membershipinvite_set.filter(club=clubs[0])), 0)
        self.assertEqual(len(new_user.membershipinvite_set.filter(club=clubs[1])), 1)
        self.assertEqual(len(new_user.membershipinvite_set.filter(club=clubs[2])), 1)
        self.assertEqual(new_user.id, self.remote_user["pennid"])
        self.assertEqual(new_user.username, self.remote_user["username"])
        self.assertEqual(new_user.first_name, self.remote_user["first_name"])
