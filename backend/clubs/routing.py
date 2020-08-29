from django.urls import path

from . import consumers


websocket_urlpatterns = [path(r"api/ws/chat/<slug:club_code>/", consumers.ChatConsumer)]
