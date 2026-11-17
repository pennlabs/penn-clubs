import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Step 3/3 of the ticketing-v3 data model change: drop the legacy per-ticket
    inventory/hold columns, make ``Ticket.ticket_class`` required, and replace
    the single-per-user ``Cart`` with per-showing carts holding ``CartItem``
    quantities (supporting guest sessions).

    Existing carts are ephemeral and are dropped rather than migrated.
    """

    dependencies = [
        ("clubs", "0145_migrate_tickets_to_ticket_classes"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="ticket",
            name="ticket_class",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="tickets",
                to="clubs.ticketclass",
            ),
        ),
        migrations.AlterField(
            model_name="ticket",
            name="transaction_record",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="tickets",
                to="clubs.tickettransactionrecord",
            ),
        ),
        migrations.RemoveField(model_name="ticket", name="buyable"),
        migrations.RemoveField(model_name="ticket", name="carts"),
        migrations.RemoveField(model_name="ticket", name="group_discount"),
        migrations.RemoveField(model_name="ticket", name="group_size"),
        migrations.RemoveField(model_name="ticket", name="holder"),
        migrations.RemoveField(model_name="ticket", name="holding_expiration"),
        migrations.RemoveField(model_name="ticket", name="price"),
        migrations.RemoveField(model_name="ticket", name="showing"),
        migrations.RemoveField(model_name="ticket", name="transferable"),
        migrations.RemoveField(model_name="ticket", name="type"),
        migrations.DeleteModel(name="Cart"),
        migrations.CreateModel(
            name="Cart",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("session_key", models.CharField(blank=True, max_length=40)),
                (
                    "pending_transaction_uuid",
                    models.UUIDField(blank=True, db_index=True, null=True, unique=True),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "owner",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="carts",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "showing",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="carts",
                        to="clubs.eventshowing",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="CartItem",
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
                ("quantity", models.PositiveIntegerField()),
                (
                    "cart",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="clubs.cart",
                    ),
                ),
                (
                    "ticket_class",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="cart_items",
                        to="clubs.ticketclass",
                    ),
                ),
            ],
            options={
                "unique_together": {("cart", "ticket_class")},
            },
        ),
    ]
