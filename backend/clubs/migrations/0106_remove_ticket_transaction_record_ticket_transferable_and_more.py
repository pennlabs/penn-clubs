# Generated by Django 5.0.4 on 2024-04-21 21:38

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("clubs", "0105_event_ticket_drop_time"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RemoveField(
            model_name="ticket",
            name="transaction_record",
        ),
        migrations.AddField(
            model_name="ticket",
            name="transferable",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="tickettransactionrecord",
            name="ticket",
            field=models.ForeignKey(
                default="",
                on_delete=django.db.models.deletion.PROTECT,
                related_name="transaction_records",
                to="clubs.ticket",
            ),
            preserve_default=False,
        ),
        migrations.CreateModel(
            name="TicketTransferRecord",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "receiver",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="received_transfers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "sender",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="sent_transfers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "ticket",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="transfer_records",
                        to="clubs.ticket",
                    ),
                ),
            ],
        ),
    ]
