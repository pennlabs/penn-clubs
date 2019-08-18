from pennclubs.settings.base import *


INSTALLED_APPS += [
    "django_extensions",
]

# Django CORS Settings
CORS_ORIGIN_REGEX_WHITELIST = [
    r"^http://(localhost|127\.0\.0\.1)(:\d+)?$"
]
