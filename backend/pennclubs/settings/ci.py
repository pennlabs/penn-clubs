import os

from pennclubs.settings.base import *  # noqa: F401, F403
from pennclubs.settings.base import PLATFORM_ACCOUNTS


DEBUG = True

TEST_RUNNER = "xmlrunner.extra.djangotestrunner.XMLTestRunner"
TEST_OUTPUT_VERBOSE = 2
TEST_OUTPUT_DIR = "test-results"

# Use dummy cache for testing
CACHES = {"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"}}

del PLATFORM_ACCOUNTS["REDIRECT_URI"]

# Use a dummy backend for sending emails
EMAIL_BACKEND = "django.core.mail.backends.dummy.EmailBackend"

# Allow http callback for DLA
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
