# Generated by Django 3.2.15 on 2022-11-18 19:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clubs", "0091_cart_ticket"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="historicalclub",
            options={
                "get_latest_by": ("history_date", "history_id"),
                "ordering": ("-history_date", "-history_id"),
                "verbose_name": "historical club",
                "verbose_name_plural": "historical clubs",
            },
        ),
        migrations.AlterField(
            model_name="historicalclub",
            name="history_date",
            field=models.DateTimeField(db_index=True),
        ),
    ]
