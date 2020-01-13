from pennclubs.settings.base import *  # noqa: F401, F403
from pennclubs.settings.base import BACKEND_DOMAIN, FRONTEND_DOMAIN, PLATFORM_ACCOUNTS


DEBUG = True

PLATFORM_ACCOUNTS.update({"REDIRECT_URI": f"https://{BACKEND_DOMAIN}/accounts/callback/"})

###############################################################
# SETTINGS TO ALLOW FRONTEND TO MAKE AJAX REQUESTS TO BACKEND #
###############################################################
# DO NOT USE IF DJANGO APP IS STANDALONE
# Django CORS Settings
CORS_ORIGIN_WHITELIST = [f"https://www.{FRONTEND_DOMAIN}", f"https://{FRONTEND_DOMAIN}"]

CSRF_TRUSTED_ORIGINS = [f"www.{FRONTEND_DOMAIN}", FRONTEND_DOMAIN]
