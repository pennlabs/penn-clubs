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
        dsn=SENTRY_URL,
        integrations=[DjangoIntegration(cache_spans=True)],
        send_default_pii=False,
        enable_tracing=True,
        traces_sample_rate=0.1,
        profiles_sample_rate=1.0,
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
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME")
AWS_DEFAULT_ACL = "public-read"
AWS_QUERYSTRING_AUTH = False

STORAGES = {
    "default": {"BACKEND": "storages.backends.s3boto3.S3Boto3Storage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

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
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"redis://{REDIS_HOST}:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,  # ignore Redis connection errors
            "SOCKET_CONNECT_TIMEOUT": 1,
            "SOCKET_TIMEOUT": 1,
        },
        "KEY_PREFIX": "django",
    }
}

# Cybersource settings
CYBERSOURCE_CONFIG = {
    "authentication_type": "http_signature",
    "merchantid": os.getenv("MERCHANT_ID"),
    "merchant_keyid": os.getenv("MERCHANT_KEYID"),
    "merchant_secretkey": os.getenv("MERCHANT_SECRETKEY"),
    "run_environment": "api.cybersource.com",
}
CYBERSOURCE_TARGET_ORIGIN = "https://pennclubs.com"
