import os
from pathlib import Path

from dotenv import load_dotenv

from pennclubs.settings.base import *  # noqa: F401, F403
from pennclubs.settings.base import INSTALLED_APPS, MIDDLEWARE


# Load .env file from backend directory
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(env_path)


# Enable debug mode
DEBUG = True

# Development extensions
INSTALLED_APPS += ["django_extensions", "debug_toolbar"]

MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE
INTERNAL_IPS = ["127.0.0.1"]

# Allow http callback for DLA
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# ngrok Configuration
# Set NGROK_URL in your .env file to the https URL provided by ngrok (e.g., https://abc.ngrok-free.app)
# Used only for CyberSource hosted checkout callbacks.
NGROK_URL = os.getenv("NGROK_URL")

# Frontend URL for redirects (keep localhost for OAuth/session cookies)
FRONTEND_URL = "http://localhost:3000"

# CyberSource receipt callback base URL (ngrok if provided, otherwise localhost)
CYBERSOURCE_CALLBACK_BASE = NGROK_URL or FRONTEND_URL

# Allow requests from frontend (includes ngrok URLs)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if NGROK_URL:
    CSRF_TRUSTED_ORIGINS.append(NGROK_URL)
    # NOTE: We do NOT update PLATFORM_ACCOUNTS["REDIRECT_URI"] here.
    # The OAuth provider only whitelists localhost:3000.


# CORS settings for development - allow all origins
CORS_ALLOW_ALL_ORIGINS = True
CORS_URLS_REGEX = r"^/api/.*"  # Apply to all API endpoints in development
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]
CORS_ALLOW_CREDENTIALS = True

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

# Cybersource Secure Acceptance Hosted Checkout settings (TEST environment)
# Configure these in
# CyberSource Business Center > Payment Configuration > Secure Acceptance
CYBERSOURCE_SA_PROFILE_ID = os.getenv("CYBERSOURCE_SA_PROFILE_ID")
CYBERSOURCE_SA_ACCESS_KEY = os.getenv("CYBERSOURCE_SA_ACCESS_KEY")
CYBERSOURCE_SA_SECRET_KEY = os.getenv("CYBERSOURCE_SA_SECRET_KEY")
CYBERSOURCE_SA_URL = "https://testsecureacceptance.cybersource.com/pay"

OSA_KEYS = ["gwashington"]
