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
        parser.add_argument(
            "--clubs",
            dest="club",
            type=str,
            help="If this parameter is specified, then only trigger renewal for the comma \
                  separated list of club codes specified by this argument.",
        )

    def handle(self, *args, **kwargs):
        # warn if we're resetting all clubs and force flag is not specified
        if not kwargs["force"] and not kwargs["club"]:
            self.stdout.write(
                self.style.WARNING(
                    "You are about to set all club status to inactive and will have "
                    + "to begin the renewal process. This should only happen at the beginning "
                    + "of the school year. Are you postive this is what you want "
                    + "to do? Type 'deactivate all clubs' to continue or press Ctrl-C to abort."
                )
            )

            correct = "deactivate all clubs"
            self.stdout.write("Input:", ending=" ")
            while not input().lower().strip() == correct:
                self.stdout.write("Input:", ending=" ")

        # either select all clubs or just some
        if not kwargs["club"]:
            clubs = Club.objects.all()
        else:
            clubs = Club.objects.filter(code__in=kwargs["club"].strip().split(","))

        # deactivate all clubs
        clubs.update(active=False, approved=None, approved_by=None)

        self.stdout.write(f"{clubs.count()} clubs deactivated!")

        # send out renewal emails to all clubs
        for club in clubs:
            club.send_renewal_email()

        self.stdout.write("All emails sent out!")
