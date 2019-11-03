from pennclubs.settings.base import *
import os


INSTALLED_APPS += [
    "django_extensions",
]

# Django CORS Settings
CORS_ORIGIN_REGEX_WHITELIST = [
    r"^http://(localhost|127\.0\.0\.1)(:\d+)?$"
]

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
PLATFORM_ACCOUNTS.update(
    {
        'REDIRECT_URI': os.environ.get('LABS_REDIRECT_URI', 'http://localhost:8000/accounts/callback/'),
        'CLIENT_ID': 'clientid',
        'CLIENT_SECRET': 'supersecretclientsecret',
        'PLATFORM_URL': 'https://platform-dev.pennlabs.org',
        'CUSTOM_ADMIN': False,
    }
)