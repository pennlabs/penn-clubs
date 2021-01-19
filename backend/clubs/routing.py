from django.urls import path

from . import consumers


websocket_urlpatterns = [
    path(r"api/ws/chat/<slug:club_code>/", consumers.ChatConsumer),
    path(r"api/ws/event/<slug:event_id>/", consumers.LiveEventConsumer),
    path(r"api/ws/script/", consumers.ExecuteScriptConsumer),
]
