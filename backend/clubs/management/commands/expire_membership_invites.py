import traceback

from django.core.management.base import BaseCommand
from django.utils import timezone

from clubs.models import MembershipInvite


class Command(BaseCommand):
    help = "Mark stale membership invites as expired."

    def handle(self, *args, **kwargs):
        try:
            now = timezone.now()
            MembershipInvite.objects.filter(active=True, expires_at__lte=now).update(
                active=False
            )

            self.stdout.write(
                self.style.SUCCESS("Successfully marked all stale invites as expired!")
            )
        except Exception:
            self.stdout.write(
                self.style.ERROR(
                    "An error was encountered while expiring stale membership invites!"
                )
            )
            self.stdout.write(self.style.ERROR(traceback.format_exc()))
