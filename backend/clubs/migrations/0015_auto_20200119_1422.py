# Generated by Django 3.0.2 on 2020-01-19 19:22

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("clubs", "0014_club_youtube"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="type",
            field=models.IntegerField(choices=[(1, "Recruitment")], default=1),
        ),
        migrations.AlterField(
            model_name="event",
            name="club",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="events",
                to="clubs.Club",
            ),
        ),
    ]
