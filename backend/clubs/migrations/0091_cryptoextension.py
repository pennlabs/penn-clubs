from django.conf import settings
from django.contrib.postgres.operations import CryptoExtension
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("clubs", "0090_adminnote"),
    ]

    operations = [
        CryptoExtension()
    ]
