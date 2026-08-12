from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase

from pennclubs.asgi import application


class WebsocketTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user1 = get_user_model().objects.create_user(
            "bfranklin", "bfranklin@seas.upenn.edu", "test"
        )
        cls.user1.user_permissions.add(
            Permission.objects.get(
                codename="run_management_scripts", content_type__app_label="clubs"
            )
        )
        cls.manager = get_user_model().objects.create_user(
            "manager", "manager@seas.upenn.edu", "test"
        )
        cls.manager.user_permissions.add(
            Permission.objects.get(
                codename="manage_club", content_type__app_label="clubs"
            )
        )

    async def test_script_execution_unauth(self):
        """
        Ensure that unauthenticated users cannot use this endpoint.
        """
        comm = WebsocketCommunicator(application, "/api/ws/script/")
        connected, subprotocol = await comm.connect()
        self.assertFalse(connected)

    async def test_script_execution(self):
        """
        Ensure that authenticated users can only execute appropriate scripts.
        """
        comm = WebsocketCommunicator(application, "/api/ws/script/")
        comm.scope["user"] = self.user1
        connected, subprotocol = await comm.connect()
        self.assertTrue(connected)

        await comm.send_json_to({"action": "help"})
        resp = await comm.receive_json_from()
        self.assertIn("output", resp)

    async def test_manage_club_does_not_authorize_script_execution(self):
        # this is a regression test
        comm = WebsocketCommunicator(application, "/api/ws/script/")
        comm.scope["user"] = self.manager
        connected, subprotocol = await comm.connect()
        self.assertFalse(connected)
