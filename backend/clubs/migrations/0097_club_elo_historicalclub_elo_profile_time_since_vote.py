# Generated by Django 5.0.3 on 2024-03-14 20:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clubs", "0096_delete_questionresponse"),
    ]

    operations = [
        migrations.AddField(
            model_name="club",
            name="elo",
            field=models.FloatField(default=1500),
        ),
        migrations.AddField(
            model_name="historicalclub",
            name="elo",
            field=models.FloatField(default=1500),
        ),
        migrations.AddField(
            model_name="profile",
            name="time_since_vote",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]