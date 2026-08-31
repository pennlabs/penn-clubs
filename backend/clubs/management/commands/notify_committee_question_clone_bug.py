import datetime
from itertools import batched

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from clubs.models import Club, ClubApplication, send_mail_helper


# recipients go in BCC, matching the email blast flow in views.py
BCC_BATCH_SIZE = 999


class Command(BaseCommand):
    help = (
        "Notify officers of clubs with applications starting after a given date "
        "about the committee questions cloning bug, so they can check and fix "
        "their Fall 2026 applications."
    )
    web_execute = True

    def add_arguments(self, parser):
        parser.add_argument(
            "--after",
            type=str,
            default="2026-08-01",
            help="Only notify clubs with an application starting after this date "
            "(YYYY-MM-DD, interpreted in the server's local time zone).",
        )
        parser.add_argument(
            "--dry-run",
            dest="dry_run",
            action="store_true",
            help="Print the clubs and recipients that would be emailed, "
            "without actually sending anything.",
        )
        parser.add_argument(
            "--test-email",
            dest="test_email",
            type=str,
            default=None,
            help="Send a single copy of the email to this address instead of "
            "club officers, so you can see what it looks like.",
        )

    def send(self, bcc):
        send_mail_helper(
            "committee_question_clone_bug",
            None,
            [settings.BRANDING_SITE_EMAIL],
            {},
            bcc=bcc,
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        test_email = options["test_email"]

        if test_email:
            if dry_run:
                self.stdout.write(f"[DRY RUN] Would send test email to {test_email}")
            else:
                self.send([test_email])
                self.stdout.write(
                    self.style.SUCCESS(f"Sent test email to {test_email}")
                )
            return

        after_date = datetime.datetime.strptime(options["after"], "%Y-%m-%d").date()
        cutoff = timezone.make_aware(
            datetime.datetime.combine(after_date, datetime.time.min)
        )

        club_ids = (
            ClubApplication.objects.filter(application_start_time__gt=cutoff)
            .values_list("club_id", flat=True)
            .distinct()
        )
        clubs = Club.objects.filter(pk__in=club_ids).order_by("code")

        self.stdout.write(
            f"Found {clubs.count()} club(s) with an application starting "
            f"after {after_date.isoformat()}."
        )

        # one email per person, no matter how many of these clubs they run
        recipients = set()
        unreachable = []
        for club in clubs:
            emails = club.get_officer_emails()
            if not emails:
                unreachable.append(club.code)
                continue
            recipients.update(emails)

        for code in unreachable:
            self.stdout.write(
                self.style.WARNING(f"No officer emails on file for {code}")
            )

        recipients = sorted(recipients)
        self.stdout.write(
            f"{len(recipients)} unique recipient(s), "
            f"{len(unreachable)} club(s) with nobody to contact."
        )

        if dry_run:
            for email in recipients:
                self.stdout.write(f"[DRY RUN] Would email {email}")
            self.stdout.write(f"[DRY RUN] Would email {len(recipients)} recipient(s).")
            return

        for batch in batched(recipients, BCC_BATCH_SIZE):
            self.send(list(batch))

        self.stdout.write(
            self.style.SUCCESS(f"Emailed {len(recipients)} recipient(s).")
        )
