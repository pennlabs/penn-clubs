# Generated by Django 3.1.3 on 2020-12-04 15:40

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("clubs", "0057_clubvisit_visit_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="badge",
            name="visible",
            field=models.BooleanField(default=False),
        ),
    ]
