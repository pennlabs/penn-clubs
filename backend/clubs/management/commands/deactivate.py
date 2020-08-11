from django.core.management.base import BaseCommand

from clubs.models import Club


class Command(BaseCommand):
    help = "Deactivates all clubs in the database. This should be used at \
            the beginning of the school year when clubs must be renewed."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            dest="force",
            action="store_true",
            help="Do not prompt for confirmation, just start the club renewal process.",
        )

    def handle(self, *args, **kwargs):
        if not kwargs["force"]:
            self.stdout.write(
                self.style.WARNING(
                    "You are about to set all club status to inactive and will have "
                    + "to begin the renewal process. This should only happen at the beginning "
                    + "of the school year. Are you postive this is what you want "
                    + "to do? Type 'deactivate all clubs' to continue."
                )
            )

            correct = "deactivate all clubs"
            self.stdout.write("Input:", ending=" ")
            while input().strip() != correct:
                self.stdout.write("Input:", ending=" ")

        # deactivate all clubs
        Club.objects.all().update(active=False, approved=False, approved_by=None)

        self.stdout.write("All clubs deactivated!")

        # send out renewal emails to all clubs
        for club in Club.objects.all():
            club.send_renewal_email()

        self.stdout.write("All emails sent out!")
