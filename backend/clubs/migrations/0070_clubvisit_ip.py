# Generated by Django 3.1.5 on 2021-01-10 09:10

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("clubs", "0069_auto_20210107_0918"),
    ]

    operations = [
        migrations.AddField(
            model_name="clubvisit",
            name="ip",
            field=models.GenericIPAddressField(blank=True, null=True),
        ),
    ]
