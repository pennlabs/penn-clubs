from django.core.management.base import BaseCommand
from django.db.models import Q

from clubs.models import Club


class Command(BaseCommand):
    help = (
        "Set emails for all active clubs that do not have an email set. "
        "Mark newly set emails as private. "
        "Use the officer email if it exists."
    )

    def handle(self, *args, **kwargs):
        for club in Club.objects.filter(
            Q(active=True) & (Q(email="") | Q(email__isnull=True))
        ):
            mship = (
                club.membership_set.filter(~Q(person__email=""))
                .order_by("role", "created_at")
                .first()
            )
            if mship is not None:
                email = mship.person.email
                club.email = email
                club.email_public = False
                club._change_reason = "Add email to contact field"
                club.save(update_fields=["email", "email_public"])
                self.stdout.write(f"Added email {email} to {club.name}!")
            else:
                self.stdout.write(f"Could not add email to {club.name}!")
