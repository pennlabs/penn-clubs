import os

from pennclubs.settings.base import *  # noqa: F401, F403
from pennclubs.settings.base import PLATFORM_ACCOUNTS


DEBUG = True

TEST_RUNNER = "xmlrunner.extra.djangotestrunner.XMLTestRunner"
TEST_OUTPUT_VERBOSE = 2
TEST_OUTPUT_DIR = "test-results"

# Use dummy cache for testing
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

del PLATFORM_ACCOUNTS["REDIRECT_URI"]

# Use a dummy backend for sending emails
EMAIL_BACKEND = "django.core.mail.backends.dummy.EmailBackend"

# Allow http callback for DLA
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# Cybersource settings
CYBERSOURCE_CONFIG = {
    "authentication_type": "http_signature",
    "merchantid": "testrest",
    "merchant_keyid": "08c94330-f618-42a3-b09d-e1e43be5efda",
    "merchant_secretkey": "yBJxy6LjM2TmcPGu+GaJrHtkke25fPpUX+UY6/L/1tE=",
    "run_environment": "apitest.cybersource.com",
}
CYBERSOURCE_TARGET_ORIGIN = "https://localhost:3001"
