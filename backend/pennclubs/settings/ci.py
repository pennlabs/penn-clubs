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

# Cybersource Secure Acceptance Hosted Checkout settings (TEST environment)
CYBERSOURCE_SA_PROFILE_ID = "test-profile-id"
CYBERSOURCE_SA_ACCESS_KEY = "test-access-key"
CYBERSOURCE_SA_SECRET_KEY = "test-secret-key"
CYBERSOURCE_SA_URL = "https://testsecureacceptance.cybersource.com/pay"

# Frontend URL for redirects
FRONTEND_URL = "http://localhost:3000"
