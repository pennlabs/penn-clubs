# Generated by Django 3.1.2 on 2020-10-17 15:49

import phonenumber_field.modelfields
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("clubs", "0045_auto_20201011_2221"),
    ]

    operations = [
        migrations.AlterField(
            model_name="advisor",
            name="phone",
            field=phonenumber_field.modelfields.PhoneNumberField(
                max_length=128, region=None
            ),
        ),
    ]
