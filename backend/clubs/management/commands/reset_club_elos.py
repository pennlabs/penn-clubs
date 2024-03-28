from django.core.management.base import BaseCommand

from clubs.models import Club


class Command(BaseCommand):
    help = "Reset all club rankings."

    def handle(self, *args, **kwargs):
        try:
            queryset = Club.objects.all()

            for club in queryset:
                club.elo = 1500
            Club.objects.bulk_update(queryset, ["elo"])

            self.stdout.write(
                self.style.SUCCESS("Successfully reset elos for all clubs!")
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    "An error was encountered while updating elos for all clubs!"
                )
            )
            self.stdout.write(e)
