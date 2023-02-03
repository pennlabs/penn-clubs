from pennclubs.settings.base import *  # noqa: F401, F403

if "STAGING_DATABASE_URL" in os.environ and "DATABASE_NAME" in os.environ:
    DATABASES = {
        "default": dj_database_url.parse(os.environ.get("STAGING_DATABASE_URL")+"/"+os.environ.get("DATABASE_NAME"))
    }
else:
    raise Exception("ERROR: Using staging environment without setting environments")
    DATABASES = {}