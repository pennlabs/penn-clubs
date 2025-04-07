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
CSRF_TRUSTED_ORIGINS = ["https://localhost:3001", "http://localhost:3000"]

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

# Cybersource settings
CYBERSOURCE_URL = "https://testsecureacceptance.cybersource.com/pay"
CYBERSOURCE_PROFILE_ID = "E03ED013-DD02-4DDD-BACB-164104DD0DDC"
CYBERSOURCE_ACCESS_KEY = "cad16657592e319294169a644c201890"
CYBERSOURCE_SECRET_KEY = None  # populate this with secret key from dashboard

OSA_KEYS = ["gwashington"]
