# Generated by Django 5.0.4 on 2024-08-30 20:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clubs", "0112_clubfair_virtual"),
    ]

    operations = [
        migrations.AddField(
            model_name="badge",
            name="message",
            field=models.TextField(blank=True, null=True),
        ),
    ]
