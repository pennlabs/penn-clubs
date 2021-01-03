from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter

import clubs.routing


application = ProtocolTypeRouter(
    {"websocket": AuthMiddlewareStack(URLRouter(clubs.routing.websocket_urlpatterns))}
)
