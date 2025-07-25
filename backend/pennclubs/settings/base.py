"""
Django settings for Penn Clubs.

Generated by 'django-admin startproject' using Django 2.1.2.

For more information on this file, see
https://docs.djangoproject.com/en/2.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.1/ref/settings/
"""

import os

import dj_database_url


# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.11/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get(
    "SECRET_KEY", "884_o+gq8u$6!n$rqa76&tasf%#_mc7is2-!+(dxf^!8*ssh&4"
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["*"]


# Application definition

INSTALLED_APPS = [
    "daphne",
    "model_clone",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "simple_history",
    "accounts.apps.AccountsConfig",
    "clubs.apps.ClubsConfig",
    "options.apps.OptionsConfig",
    "social_django",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "simple_history.middleware.HistoryRequestMiddleware",
]

ROOT_URLCONF = "pennclubs.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]


# Database
# https://docs.djangoproject.com/en/1.11/ref/settings/#databases

DATABASES = {
    "default": dj_database_url.config(
        default="sqlite:///" + os.path.join(BASE_DIR, "db.sqlite3"), conn_max_age=20
    )
}


# Password validation
# https://docs.djangoproject.com/en/1.11/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation."
        "UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

CORS_ALLOW_ALL_ORIGINS = True
CORS_URLS_REGEX = r"^/api/external/.*"
CORS_ALLOW_METHODS = ["GET"]

# Authentication Backends

AUTHENTICATION_BACKENDS = (
    "clubs.backends.ZoomOAuth2",
    "accounts.backends.LabsUserBackend",
    "django.contrib.auth.backends.ModelBackend",
)

# Internationalization
# https://docs.djangoproject.com/en/1.11/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "America/New_York"

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.11/howto/static-files/

STATIC_URL = "/api/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "static")


# DLA Settings

PLATFORM_ACCOUNTS = {
    "REDIRECT_URI": os.environ.get(
        "LABS_REDIRECT_URI", "http://localhost:3000/api/accounts/callback/"
    ),
    "CLIENT_ID": "clientid",
    "CLIENT_SECRET": "supersecretclientsecret",
    "PLATFORM_URL": "https://platform-dev.pennlabs.org",
    "CUSTOM_ADMIN": False,
}


# Django REST Framework Settings

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
        "drf_excel.renderers.XLSXRenderer",
    ),
    "DEFAULT_SCHEMA_CLASS": "pennclubs.doc_settings.CustomAutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
        "accounts.authentication.PlatformAuthentication",
    ],
}

DEFAULT_AUTO_FIELD = "django.db.models.AutoField"


# Branding switch

BRANDING = os.environ.get("NEXT_PUBLIC_SITE_NAME", "clubs")
BRANDING_SITE_NAME = "Hub@Penn" if BRANDING == "fyh" else "Penn Clubs"
BRANDING_SITE_EMAIL = (
    "hub.provost@upenn.edu" if BRANDING == "fyh" else "info@pennclubs.com"
)


# Email Settings

FROM_EMAIL = (
    f"Hub at Penn <{BRANDING_SITE_EMAIL}>"
    if BRANDING == "fyh"
    else f"Penn Clubs <{BRANDING_SITE_EMAIL}>"
)
EMAIL_SUBJECT_PREFIX = f"[{BRANDING_SITE_NAME}] "
INVITE_URL = "https://{domain}/invite/{club}/{id}/{token}"
DEFAULT_DOMAIN = "hub.provost.upenn.edu" if BRANDING == "fyh" else "pennclubs.com"
DOMAINS = os.environ.get("DOMAINS", DEFAULT_DOMAIN).split(",")

VIEW_URL = "https://{domain}/club/{club}"
EDIT_URL = "https://{domain}/club/{club}/edit"
FLYER_URL = "https://{domain}/club/{club}/flyer"
QUESTION_URL = "https://{domain}/club/{club}/edit/questions"
RENEWAL_URL = "https://{domain}/club/{club}/renew"
APPLY_URL = "https://{domain}/club/{club}/apply"

OSA_EMAILS = ["vpul-orgs@pobox.upenn.edu"]


# File upload settings

MEDIA_URL = "/api/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "uploads")
MAX_FILE_SIZE = 1073741824  # Max file size
FILE_SIZE_ONE_GB = 1073741824  # 1GB


# Simple history settings

SIMPLE_HISTORY_FILEFIELD_TO_CHARFIELD = True


# Django Channels settings

ASGI_APPLICATION = "pennclubs.asgi.application"

# Social Auth settings

SOCIAL_AUTH_PIPELINE = (
    "social_core.pipeline.social_auth.social_details",
    "social_core.pipeline.social_auth.social_uid",
    "social_core.pipeline.social_auth.auth_allowed",
    "social_core.pipeline.social_auth.social_user",
    "social_core.pipeline.social_auth.associate_user",
    "social_core.pipeline.social_auth.load_extra_data",
)

SOCIAL_AUTH_DISCONNECT_PIPELINE = (
    "social_core.pipeline.disconnect.allowed_to_disconnect",
    "social_core.pipeline.disconnect.get_entries",
    "social_core.pipeline.disconnect.revoke_tokens",
    "social_core.pipeline.disconnect.disconnect",
)

SOCIAL_AUTH_ZOOM_OAUTH2_KEY = os.environ.get("SOCIAL_AUTH_ZOOM_OAUTH2_KEY")
SOCIAL_AUTH_ZOOM_OAUTH2_SECRET = os.environ.get("SOCIAL_AUTH_ZOOM_OAUTH2_SECRET")
SOCIAL_AUTH_ZOOM_OAUTH2_SCOPE = [
    "user:read",
    "user:write",
    "meeting:read",
    "meeting:write",
]
SOCIAL_AUTH_LOGIN_REDIRECT_URL = "/"
ZOOM_VERIFICATION_TOKEN = os.environ.get("ZOOM_VERIFICATION_TOKEN")


# Phone number field

PHONENUMBER_DB_FORMAT = "NATIONAL"
PHONENUMBER_DEFAULT_REGION = "US"

# Cybersource settings
CYBERSOURCE_CLIENT_VERSION = "0.15"

OSA_KEYS = None
