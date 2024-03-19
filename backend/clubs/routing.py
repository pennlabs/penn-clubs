from django.urls import path

from . import consumers


websocket_urlpatterns = [
    path(r"api/ws/chat/<slug:club_code>/", consumers.ChatConsumer.as_asgi()),
    path(r"api/ws/event/<slug:event_id>/", consumers.LiveEventConsumer.as_asgi()),
    path(r"api/ws/script/", consumers.ExecuteScriptConsumer.as_asgi()),
]
