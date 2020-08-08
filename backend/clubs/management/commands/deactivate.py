from django.core.management.base import BaseCommand

from clubs.models import Club


class Command(BaseCommand):
    help = "Deactivates all clubs in the database. This should be used at \
            the end of the school year when clubs must be renewed."

    def handle(self, *args, **kwargs):
        print(
            "\033[93m"
            + "You are about to set all club status to inactive and will have"
            + "to begin the renewal process. This should only happen at the end"
            + " of the school year. Are you postive this is what you want"
            + " to do? Type 'deactivate all clubs' to continue."
            + "\033[0m"
        )

        correct = "deactivate all clubs"
        print("Input:", end=" ")
        while input().strip() != correct:
            print("Input:", end=" ")

        # deactivate all clubs
        for club in Club.objects.all():
            club.active = False

        print("Clubs deactivated")
