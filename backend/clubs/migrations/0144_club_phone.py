from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clubs", "0143_split_club_reject_permission"),
    ]

    operations = [
        migrations.AddField(
            model_name="club",
            name="phone",
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AddField(
            model_name="historicalclub",
            name="phone",
            field=models.CharField(blank=True, max_length=30),
        ),
    ]
