import io
import json
import sys
import traceback

from asgiref.sync import async_to_sync, sync_to_async
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from django.core.management import call_command

from clubs.models import Club
from clubs.views import get_scripts, parse_script_parameters


def log_errors(func):
    """
    Helper to print errors to stderr, since an issue with
    Django Debug Toolbar prevents exceptions
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


class ExecuteScriptConsumer(AsyncWebsocketConsumer):
    @log_errors
    async def connect(self):
        user = self.scope["user"]
        if user.has_perm("clubs.manage_club"):
            await self.accept()
        else:
            await self.close()

    @log_errors
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get("action")
        parameters = text_data_json.get("parameters", {})
        user = self.scope["user"]
        scripts = get_scripts()
        script = next((s for s in scripts if s["name"] == action), None)

        # check for valid script
        if script is None:
            await self.send(
                json.dumps({"output": f"Could not find script matching name: {action}"})
            )
            await self.close()
            return

        # check for web execute
        if not script["execute"]:
            await self.send(
                json.dumps(
                    {
                        "output": f"The script {action} cannot "
                        "be executed from the web interface."
                    }
                )
            )
            await self.close()
            return

        # check user permissions
        if not user.has_perm("clubs.manage_club"):
            await self.send(
                json.dumps(
                    {"output": "You do not have permission to execute this script."}
                )
            )
            await self.close()
            return

        # parse arguments
        args, kwargs = parse_script_parameters(script, parameters)

        # execute the script on a separate thread
        await self.send(
            json.dumps(
                {
                    "output": f"Executing script '{action}' "
                    f"with parameters: {args} {kwargs}\n"
                }
            )
        )
        await sync_to_async(self.execute_script, thread_sensitive=False)(
            action, args, kwargs
        )
        await self.send(json.dumps({"output": "Script execution finished!"}))
        await self.close()

    def execute_script(self, action, args, kwargs):
        class LiveIO(io.StringIO):
            def write(s, data):
                try:
                    async_to_sync(self.send)(json.dumps({"output": data}))
                except Exception:
                    # ignore send errors, allow script to continue execution
                    # better to drop output then to abort a script in the middle
                    pass

        with LiveIO() as out:
            try:
                call_command(action, *args, **kwargs, stdout=out, stderr=out)
            except Exception:
                async_to_sync(self.send)(json.dumps({"output": traceback.format_exc()}))


class LiveEventConsumer(AsyncWebsocketConsumer):
    @log_errors
    async def connect(self):
        event_id = self.scope["url_route"]["kwargs"]["event_id"]
        self.group_name = f"events-live-{event_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    @log_errors
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    @log_errors
    async def join_leave(self, event):
        await self.send(text_data=json.dumps({"update": True}))


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
            {
                "type": "chat_message",
                "message": f"{self.full_name} has joined the room",
            },
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
