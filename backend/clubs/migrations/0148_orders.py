import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Add Order and OrderItem on top of the cart schema.

    Checkout is unchanged: Cart.pending_transaction_uuid stays, because the
    current checkout still finds a cart by that id. Later migrations remove it.
    """

    dependencies = [
        ("clubs", "0147_unique_cart_per_showing"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="tickettransactionrecord",
            name="total_amount",
            field=models.DecimalField(decimal_places=2, max_digits=10),
        ),
        migrations.CreateModel(
            name="Order",
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
                    "status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending"),
                            ("PROCESSING", "Processing"),
                            ("PAID", "Paid"),
                            ("EXPIRED", "Expired"),
                            ("CANCELLED", "Cancelled"),
                            ("NEEDS_REVIEW", "Needs review"),
                        ],
                        default="PENDING",
                        max_length=20,
                    ),
                ),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("total", models.DecimalField(decimal_places=2, max_digits=10)),
                ("buyer_first_name", models.CharField(max_length=100)),
                ("buyer_last_name", models.CharField(max_length=100)),
                ("buyer_email", models.EmailField(max_length=254)),
                ("decline_count", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "owner",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="orders",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "showing",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="orders",
                        to="clubs.eventshowing",
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="tickettransactionrecord",
            name="order",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="transaction_record",
                to="clubs.order",
            ),
        ),
        migrations.CreateModel(
            name="OrderItem",
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
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("line_total", models.DecimalField(decimal_places=2, max_digits=10)),
                (
                    "order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="clubs.order",
                    ),
                ),
                (
                    "ticket_class",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="order_items",
                        to="clubs.ticketclass",
                    ),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="order",
            constraint=models.UniqueConstraint(
                condition=models.Q(
                    ("owner__isnull", False),
                    ("status__in", ["PENDING", "PROCESSING"]),
                ),
                fields=("showing", "owner"),
                name="unique_open_order_per_showing_owner",
            ),
        ),
        migrations.AddConstraint(
            model_name="order",
            constraint=models.UniqueConstraint(
                condition=models.Q(
                    ("owner__isnull", True),
                    ("status__in", ["PENDING", "PROCESSING"]),
                ),
                fields=("showing", "session_key"),
                name="unique_open_order_per_showing_session",
            ),
        ),
        migrations.AlterUniqueTogether(
            name="orderitem",
            unique_together={("order", "ticket_class")},
        ),
    ]
