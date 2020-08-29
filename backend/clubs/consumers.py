import json
import sys
import traceback

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings

from clubs.models import Club


def log_errors(func):
    """
    Helper to print errors to stderr, since an issue with Django Debug Toolbar prevents exceptions
    from threads from being logged to the console.
    """

    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            if settings.DEBUG:
                traceback.print_exc(file=sys.stderr)
            raise e

    return wrapper


class ChatConsumer(AsyncWebsocketConsumer):
    @database_sync_to_async
    def get_membership_info(self, user, code):
        club = Club.objects.get(code=code)
        membership_role = club.membership_set.filter(person=user).first()
        if membership_role is not None:
            return membership_role.role
        return None

    @log_errors
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["club_code"]
        self.group_room_name = f"chat_{self.room_name}"
        user = self.scope["user"]
        self.membership_role = await self.get_membership_info(user, self.room_name)
        self.full_name = user.get_full_name()

        await self.channel_layer.group_add(self.group_room_name, self.channel_name)

        await self.accept()

        await self.channel_layer.group_send(
            self.group_room_name,
            {"type": "chat_message", "message": f"{self.full_name} has joined the room"},
        )

    @log_errors
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_room_name, self.channel_name)

        await self.channel_layer.group_send(
            self.group_room_name,
            {"type": "chat_message", "message": f"{self.full_name} has left the room"},
        )

    @log_errors
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        user = self.scope["user"]

        await self.channel_layer.group_send(
            self.group_room_name,
            {
                "type": "chat_message",
                "message": message,
                "username": user.username,
                "full_name": self.full_name,
                "membership": self.membership_role,
            },
        )

    @log_errors
    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))
