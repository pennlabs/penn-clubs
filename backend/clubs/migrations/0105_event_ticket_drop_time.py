# Generated by Django 5.0.4 on 2024-04-21 04:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clubs", "0104_cart_checkout_context"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="ticket_drop_time",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]