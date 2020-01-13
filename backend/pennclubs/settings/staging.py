from pennclubs.settings.base import *  # noqa: F401, F403
from pennclubs.settings.base import DOMAIN, PLATFORM_ACCOUNTS


DEBUG = True

PLATFORM_ACCOUNTS.update({"REDIRECT_URI": f"https://{DOMAIN}/accounts/callback/"})
