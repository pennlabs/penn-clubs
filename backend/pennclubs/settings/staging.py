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
ALLOWED_HOSTS = [BACKEND_DOMAIN]

SENTRY_URL = os.environ.get('SENTRY_URL', '')

sentry_sdk.init(
    dsn=SENTRY_URL,
    integrations=[DjangoIntegration()]
)

# Share cookie with frontend
SESSION_COOKIE_DOMAIN = '.' + FRONTEND_DOMAIN
CSRF_COOKIE_DOMAIN = '.' + FRONTEND_DOMAIN
CSRF_COOKIE_SAMESITE = None

# Django CORS Settings
CORS_ORIGIN_REGEX_WHITELIST = [
    rf'^https://[\w-]+.{FRONTEND_DOMAIN}$',
    rf'^https://{FRONTEND_DOMAIN}$',
]

CSRF_TRUSTED_ORIGINS = [
    '.' + FRONTEND_DOMAIN,
    FRONTEND_DOMAIN,
]

# Email client information
EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_PORT = 587
EMAIL_HOST_USER = os.getenv('EMAIL_USERNAME')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_PASSWORD')
EMAIL_USE_TLS = True

# Upload file storage
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_ACCESS_SECRET_ID = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
AWS_QUERYSTRING_AUTH = False

PLATFORM_ACCOUNTS.update(
    {
        'REDIRECT_URI': os.environ.get('LABS_REDIRECT_URI', f'http://{BACKEND_DOMAIN}/accounts/callback/'),
        'CLIENT_ID': 'clientid',
        'CLIENT_SECRET': 'supersecretclientsecret',
        'PLATFORM_URL': 'https://platform-dev.pennlabs.org',
        'CUSTOM_ADMIN': False,
    }
)
