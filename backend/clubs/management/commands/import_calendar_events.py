from django.core.management.base import BaseCommand

from clubs.models import Club


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        for club in Club.objects.filter(ics_import_url__isnull=False).exclude(ics_import_url=""):
            club.add_ics_events()
