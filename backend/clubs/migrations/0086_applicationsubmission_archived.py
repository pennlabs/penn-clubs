# Generated by Django 3.2.6 on 2021-09-12 22:17

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("clubs", "0085_alter_clubapplication_external_url"),
    ]

    operations = [
        migrations.AddField(
            model_name="applicationsubmission",
            name="archived",
            field=models.BooleanField(default=False),
        ),
    ]
