import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Step 1/3 of the ticketing-v3 data model change: add ``TicketClass`` and the
    new nullable ``Ticket`` columns alongside the legacy columns so that the data
    migration in 0145 can populate them before 0146 drops the old fields.
    """

    dependencies = [
        ("clubs", "0143_split_club_reject_permission"),
    ]

    operations = [
        migrations.CreateModel(
            name="TicketClass",
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
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("quantity", models.PositiveIntegerField()),
                ("remaining", models.PositiveIntegerField()),
                ("transferable", models.BooleanField(default=True)),
                (
                    "group_discount",
                    models.DecimalField(
                        blank=True, decimal_places=2, default=0, max_digits=3
                    ),
                ),
                ("group_size", models.PositiveIntegerField(blank=True, null=True)),
                ("buyable", models.BooleanField(default=True)),
                (
                    "showing",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ticket_classes",
                        to="clubs.eventshowing",
                    ),
                ),
            ],
            options={
                "unique_together": {("showing", "name")},
            },
        ),
        migrations.AddField(
            model_name="ticket",
            name="ticket_class",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="tickets",
                to="clubs.ticketclass",
            ),
        ),
        migrations.AddField(
            model_name="ticket",
            name="owner_email",
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AddField(
            model_name="ticket",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True, default=django.utils.timezone.now
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="ticket",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
    ]
