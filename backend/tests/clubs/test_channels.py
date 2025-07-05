from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.test import TestCase

from pennclubs.asgi import application


class WebsocketTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user1 = get_user_model().objects.create_user(
            "bfranklin", "bfranklin@seas.upenn.edu", "test"
        )
        cls.user1.is_superuser = True
        cls.user1.save()

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
