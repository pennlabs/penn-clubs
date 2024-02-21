import os

from pennclubs.settings.base import *  # noqa: F401, F403
from pennclubs.settings.base import INSTALLED_APPS, MIDDLEWARE


# Enable debug mode
DEBUG = True

# Development extensions
INSTALLED_APPS += ["django_extensions", "debug_toolbar"]

MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE
INTERNAL_IPS = ["127.0.0.1"]

# Allow http callback for DLA
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# Allow requests from frontend
CSRF_TRUSTED_ORIGINS = ["http://localhost:3000"]

# Use console email backend during development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Django Extensions Shell Plus
SHELL_PLUS_PRE_IMPORTS = [
    ("clubs.utils", "fuzzy_lookup_club"),
]

# Django Channels settings
CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}

# Caching settings
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
