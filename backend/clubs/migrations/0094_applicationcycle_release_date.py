# Generated by Django 3.2.18 on 2024-01-11 14:39

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("clubs", "0093_auto_20240106_1153"),
    ]

    operations = [
        migrations.AddField(
            model_name="applicationcycle",
            name="release_date",
            field=models.DateTimeField(null=True),
        ),
    ]
