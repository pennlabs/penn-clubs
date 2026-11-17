from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("clubs", "0146_ticket_remove_legacy_fields_cart_cartitem"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="cart",
            constraint=models.UniqueConstraint(
                condition=models.Q(("owner__isnull", False)),
                fields=("showing", "owner"),
                name="unique_cart_per_showing_owner",
            ),
        ),
        migrations.AddConstraint(
            model_name="cart",
            constraint=models.UniqueConstraint(
                condition=models.Q(("owner__isnull", True)),
                fields=("showing", "session_key"),
                name="unique_cart_per_showing_session",
            ),
        ),
    ]
