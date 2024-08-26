import sys

from django.core.cache import cache
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from clubs.models import Club


class Command(BaseCommand):
    help = "Deactivates all clubs in the database. This should be used at \
            the beginning of the school year when clubs must be renewed."
    web_execute = True

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
            help="If this parameter is specified, then only trigger renewal for the "
            "comma separated list of club codes specified by this argument.",
        )

        parser.add_argument(
            "action",
            default="all",
            choices=["deactivate", "emails", "all", "remind"],
            type=str,
            help="Specify the actions that you want to take, "
            "either only deactivating the clubs, only sending the reminder emails, "
            "or performing both actions.",
        )

    def handle(self, *args, **kwargs):
        action = kwargs["action"]

        deactivate_clubs = action in {"deactivate", "all"}
        send_emails = action in {"emails", "all"}
        send_remind_emails = action in {"remind"}

        # warn if we're resetting all clubs and force flag is not specified
        if not kwargs["force"] and not kwargs["club"]:
            self.stdout.write(
                self.style.WARNING(
                    "You are about to set all club status to inactive and will have "
                    "to begin the renewal process. This should only happen at the "
                    "beginning of the school year. Are you sure this is what you want "
                    "to do? Type 'deactivate all clubs' to continue or press Ctrl-C "
                    "to abort."
                )
            )

            if not sys.stdin.isatty():
                raise CommandError(
                    "This is not an interactive terminal, "
                    "cannot prompt for confirmation. "
                    "Use the --force flag instead."
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
        if deactivate_clubs:
            num_deactivated = 0
            num_ghosted = 0

            with transaction.atomic():
                for club in clubs:
                    club.active = False
                    club.approved = None
                    club.approved_by = None
                    num_deactivated += 1

                    # allow existing approved version to stay on website for now
                    if club.history.filter(approved=True).exists():
                        club.ghost = True
                        club._change_reason = (
                            "Mark pending approval (yearly renewal process)"
                        )
                        num_ghosted += 1

                    club.save()
                    cache.delete(f"clubs:{club.id}")  # clear cache

            self.stdout.write(
                f"{num_deactivated} clubs deactivated! " f"{num_ghosted} clubs ghosted!"
            )

        # send out renewal emails to all clubs
        if send_emails:
            for club in clubs:
                club.send_renewal_email()

            self.stdout.write(f"All {clubs.count()} emails sent out!")

        # send out reminder emails to all clubs
        if send_remind_emails:
            pending_clubs = clubs.filter(active=False)
            for club in pending_clubs:
                club.send_renewal_reminder_email()

            self.stdout.write(f"All {pending_clubs.count()} reminder emails sent out!")

            rejected_clubs = clubs.filter(approved=False)
            for club in rejected_clubs:
                club.send_approval_email()

            self.stdout.write(
                f"All {rejected_clubs.count()} rejection emails sent out!"
            )
