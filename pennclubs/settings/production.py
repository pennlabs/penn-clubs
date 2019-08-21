import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from pennclubs.settings.base import *

SECRET_KEY = os.environ.get('SECRET_KEY')

DEBUG = False

# Disable Django's own staticfiles handling in favour of WhiteNoise, for
# greater consistency between gunicorn and `./manage.py runserver`. See:
# http://whitenoise.evans.io/en/stable/django.html#using-whitenoise-in-development
MIDDLEWARE.remove('django.middleware.security.SecurityMiddleware')
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
] + MIDDLEWARE

# Fix MySQL Emoji support
DATABASES['default']['OPTIONS'] = {'charset': 'utf8mb4'}

# Honour the 'X-Forwarded-Proto' header for request.is_secure()
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Allow production host headers
ALLOWED_HOSTS = ['clubs.pennlabs.org', 'clubs-backend.apps.pennlabs.org', 'api.pennclubs.com']

SENTRY_URL = os.environ.get('SENTRY_URL', '')

sentry_sdk.init(
    dsn=SENTRY_URL,
    integrations=[DjangoIntegration()]
)

# Share cookie with frontend
SESSION_COOKIE_DOMAIN = ".pennclubs.com"
CSRF_COOKIE_DOMAIN = ".pennclubs.com"

# Django CORS Settings
CORS_ORIGIN_REGEX_WHITELIST = [
    r"^https://[\w-]+.pennlabs.org$",
    r"^https://pennlabs.org$",
    r"^https://[\w-]+.pennclubs.com$",
    r"^https://pennclubs.com$",
    r"^https://[\w-]+.upenn.club$",
    r"^https://upenn.club$"
]

CSRF_TRUSTED_ORIGINS = [
    ".pennlabs.org",
    ".pennclubs.com",
    "pennclubs.com",
    ".upenn.club",
    "upenn.club"
]
