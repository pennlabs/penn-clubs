import sys

from django.core.cache import cache
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from clubs.models import Club, RegistrationQueueSettings


class Command(BaseCommand):
    help = "Deactivates all clubs in the database. This should be used at \
            the beginning of the school year when clubs must be renewed."
    web_execute = True

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            dest="force",
            action="store_true",
            help="Do not prompt for confirmation, just start the club renewal process. "
            "Necessary if running via web interface.",
        )
        parser.add_argument(
            "--clubs",
            dest="club",
            type=str,
            help="If this parameter is specified, then only trigger renewal for the "
            "comma separated list of club codes specified by this argument.",
        )
        parser.add_argument(
            "--queue-open-date",
            dest="queue_open_date",
            type=str,
            help="If this parameter is specified, then the approval queue is not "
            "currently open and clubs will be notified of the specified open date "
            "in plain text (e.g. put the string 'August 24, 2025').",
        )
        parser.add_argument(
            "--email",
            dest="email",
            action="store_true",
            help="If set, then notification emails will be sent out to affected clubs "
            "in addition to deactivating them. Please use the email blast command "
            "if you wish to solely send out reminders without deactivating clubs.",
        )

    def handle(self, *args, **kwargs):
        send_emails = kwargs["email"]

        # if queue open date is specified but queue is already open, error
        queue_settings = RegistrationQueueSettings.get()
        if kwargs["queue_open_date"] and queue_settings.reapproval_queue_open:
            raise CommandError("The re-approval queue is already open!")

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
        num_ghosted = 0

        with transaction.atomic():
            for club in clubs:
                club.active = False
                club.approved = None
                club.approved_by = None

                # allow existing approved version to stay on website for now
                if club.history.filter(approved=True).exists():
                    club.ghost = True
                    club._change_reason = (
                        "Mark pending approval (yearly renewal process)"
                    )
                    num_ghosted += 1

                club.save()
                cache.delete(f"clubs:{club.id}-authed")  # clear cache
                cache.delete(f"clubs:{club.id}-anon")

        self.stdout.write(
            f"{clubs.count()} clubs deactivated! {num_ghosted} clubs ghosted!"
        )

        # send out renewal emails to all clubs
        if send_emails:
            for club in clubs:
                club.send_renewal_email(queue_open_date=kwargs["queue_open_date"])

            self.stdout.write(f"All {clubs.count()} emails sent out!")
