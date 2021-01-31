import traceback

from django.core.management.base import BaseCommand

from clubs.models import Club


class Command(BaseCommand):
    help = "Imports ICS Calendar events for each club at a set frequency."
    web_execute = True

    def handle(self, *args, **kwargs):
        count = 0
        for club in Club.objects.filter(ics_import_url__isnull=False).exclude(
            ics_import_url=""
        ):
            try:
                club.add_ics_events()
                count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"Could not import ICS events for {club.code}: {e}"
                    )
                )
                self.stdout.write(self.style.ERROR(traceback.format_exc()))
        self.stdout.write(self.style.SUCCESS(f"Imported {count} ICS calendars!"))
