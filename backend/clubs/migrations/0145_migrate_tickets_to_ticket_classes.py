from django.db import migrations
from django.db.models import Count, Max, Q


def forwards(apps, schema_editor):
    """
    Collapse the legacy one-row-per-ticket inventory into ``TicketClass`` rows.

    For every (showing, type) group of legacy tickets we create one
    ``TicketClass`` whose ``quantity`` is the number of legacy rows and whose
    ``remaining`` is the number of those rows that were never sold. A ticket is
    sold when ``owner`` or ``transaction_record`` is set (legacy ``owner`` used
    ``SET_NULL``, so a paid ticket can have no owner). Sold tickets are
    re-pointed at the new class and kept; unsold rows are deleted because
    inventory now lives on the class.

    Legacy tickets whose showing has been deleted (``showing`` was SET_NULL) have
    nothing to attach to and are removed as well.
    """
    Ticket = apps.get_model("clubs", "Ticket")
    TicketClass = apps.get_model("clubs", "TicketClass")

    groups = (
        Ticket.objects.filter(showing__isnull=False)
        .values("showing_id", "type")
        .annotate(
            quantity=Count("id"),
            remaining=Count(
                "id",
                filter=Q(owner__isnull=True, transaction_record__isnull=True),
            ),
            max_price=Max("price"),
        )
        .order_by("showing_id", "type")
    )

    for group in groups:
        legacy_tickets = Ticket.objects.filter(
            showing_id=group["showing_id"], type=group["type"]
        )
        sample = legacy_tickets.order_by("holding_expiration").first()
        ticket_class = TicketClass.objects.create(
            showing_id=group["showing_id"],
            name=group["type"],
            price=group["max_price"] or 0,
            quantity=group["quantity"],
            remaining=group["remaining"],
            transferable=sample.transferable,
            group_discount=sample.group_discount,
            group_size=sample.group_size,
            buyable=sample.buyable,
        )
        legacy_tickets.update(ticket_class=ticket_class)

    for ticket in Ticket.objects.filter(owner__isnull=False).select_related("owner"):
        ticket.owner_email = ticket.owner.email or ""
        ticket.save(update_fields=["owner_email"])

    for ticket in (
        Ticket.objects.filter(owner__isnull=True, transaction_record__isnull=False)
        .select_related("transaction_record")
    ):
        ticket.owner_email = ticket.transaction_record.buyer_email or ""
        ticket.save(update_fields=["owner_email"])

    # Unsold inventory rows are dropped because remaining now lives on the
    # class. Showing-less tickets cannot attach to a TicketClass. Historical
    # models do not carry the custom delete() guard, so showing-null paid
    # tickets are removed here as well.
    Ticket.objects.filter(
        Q(owner__isnull=True, transaction_record__isnull=True)
        | Q(showing__isnull=True)
    ).delete()


class Migration(migrations.Migration):
    """
    Step 2/3 of the ticketing-v3 data model change (data only). Not reversible:
    unsold legacy ticket rows are discarded.
    """

    dependencies = [
        ("clubs", "0144_ticketclass_ticket_new_fields"),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
