# Generated by Django 5.0.4 on 2024-04-28 17:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clubs", "0107_ticket_attended"),
    ]

    operations = [
        migrations.AddField(
            model_name="ticket",
            name="buyable",
            field=models.BooleanField(default=True),
        ),
    ]