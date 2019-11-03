import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

from pennclubs.settings.production import *


DEBUG = True

PLATFORM_ACCOUNTS.update(
    {
        'REDIRECT_URI': os.environ.get('LABS_REDIRECT_URI', f'https://{BACKEND_DOMAIN}/accounts/callback/'),
        'CLIENT_ID': 'clientid',
        'CLIENT_SECRET': 'supersecretclientsecret',
        'PLATFORM_URL': 'https://platform-dev.pennlabs.org',
        'CUSTOM_ADMIN': False,
    }
)
