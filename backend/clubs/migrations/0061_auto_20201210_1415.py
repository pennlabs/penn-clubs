# Generated by Django 3.1.3 on 2020-12-10 19:15

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("clubs", "0060_auto_20201210_1251"),
    ]

    operations = [
        migrations.AddField(
            model_name="club",
            name="terms",
            field=models.CharField(blank=True, max_length=1024),
        ),
        migrations.AddField(
            model_name="historicalclub",
            name="terms",
            field=models.CharField(blank=True, max_length=1024),
        ),
    ]
