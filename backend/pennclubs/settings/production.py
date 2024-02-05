import os

import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

from pennclubs.settings.base import *  # noqa: F401, F403
from pennclubs.settings.base import BRANDING, DOMAINS


DEBUG = False

# Honour the 'X-Forwarded-Proto' header for request.is_secure()
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Allow production host headers
ALLOWED_HOSTS = DOMAINS

# Make sure SECRET_KEY is set to a secret in production
SECRET_KEY = os.environ.get("SECRET_KEY", None)

# Sentry settings
SENTRY_URL = os.environ.get("SENTRY_URL")
if SENTRY_URL:
    sentry_sdk.init(
        dsn=SENTRY_URL, integrations=[DjangoIntegration()], send_default_pii=False
    )

# DLA settings
PLATFORM_ACCOUNTS = {
    "ADMIN_PERMISSION": "hub_admin" if BRANDING == "fyh" else "penn_clubs_admin"
}

# Email client information
EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = 587
EMAIL_HOST_USER = os.getenv("EMAIL_USERNAME")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_USE_TLS = True

# Upload file storage
DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_ACCESS_SECRET_ID = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME")
AWS_QUERYSTRING_AUTH = False
AWS_DEFAULT_ACL = "public-read"

# Redis settings
REDIS_HOST = os.getenv("REDIS_HOST")

# Django Channels settings
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [(REDIS_HOST, 6379)]},
    },
}

# Caching settings
CACHES = {
    "default": {
        "BACKEND": "penn-clubs.backend.clubs.utils.CacheManager",
        "TIMEOUT": 60 * 60,
    },
    "main": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"redis://{REDIS_HOST}:6379/1",
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
        "KEY_PREFIX": "django",
    },
    "fallback": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "unique",
    },
}
