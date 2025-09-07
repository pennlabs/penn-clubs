# ruff: noqa E402 Imports have dependencies in Django
import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

# Allow settings to be overridden in dev/test
if not os.environ.get("DJANGO_SETTINGS_MODULE"):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pennclubs.settings.production")

import django

django.setup()

from blacknoise import BlackNoise
from django.core.asgi import get_asgi_application

import clubs.routing
from pennclubs.settings.base import STATIC_ROOT, STATIC_URL

asgi_application = BlackNoise(get_asgi_application())
asgi_application.add(STATIC_ROOT, STATIC_URL)

application = ProtocolTypeRouter(
    {
        "http": asgi_application,
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(URLRouter(clubs.routing.websocket_urlpatterns))
        ),
    }
)
