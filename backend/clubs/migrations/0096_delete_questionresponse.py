# Generated by Django 5.0.2 on 2024-03-06 01:23

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("clubs", "0095_rm_field_add_count"),
    ]

    operations = [
        migrations.DeleteModel(
            name="QuestionResponse",
        ),
    ]