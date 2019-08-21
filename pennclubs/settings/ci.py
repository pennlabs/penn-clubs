from pennclubs.settings.base import *

TEST_RUNNER = 'xmlrunner.extra.djangotestrunner.XMLTestRunner'
TEST_OUTPUT_VERBOSE = 2
TEST_OUTPUT_DIR = 'test-results'

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
