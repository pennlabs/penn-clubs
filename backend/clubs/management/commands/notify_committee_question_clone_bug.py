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

        # what the bug leaves behind: a committee question with no committee.
        # The application must have committees of its own, or there is nothing
        # for the club to relink the question to and nothing to act on.
        applications = (
            ClubApplication.objects.filter(application_start_time__gt=cutoff)
            .filter(
                questions__committee_question=True,
                questions__committees__isnull=True,
            )
            .filter(committees__isnull=False)
            .distinct()
        )
        clubs = Club.objects.filter(
            pk__in=applications.values_list("club_id", flat=True)
        ).order_by("code")

        self.stdout.write(
            f"Found {applications.count()} affected application(s) across "
            f"{clubs.count()} club(s), starting after {after_date.isoformat()}."
        )

        # one email per person, no matter how many of these clubs they run,
        # but keep the clubs they came from so a dry run can be eyeballed
        clubs_by_email = {}
        unreachable = []
        for club in clubs:
            emails = club.get_officer_emails()
            if not emails:
                unreachable.append(club.code)
                continue
            for email in emails:
                clubs_by_email.setdefault(email, []).append(club.code)

        for code in unreachable:
            self.stdout.write(
                self.style.WARNING(f"No officer emails on file for {code}")
            )

        recipients = sorted(clubs_by_email)
        self.stdout.write(
            f"{len(recipients)} unique recipient(s), "
            f"{len(unreachable)} club(s) with nobody to contact."
        )

        if dry_run:
            for email in recipients:
                codes = ", ".join(clubs_by_email[email])
                self.stdout.write(f"[DRY RUN] Would email {email} ({codes})")
            self.stdout.write(f"[DRY RUN] Would email {len(recipients)} recipient(s).")
            return

        for batch in batched(recipients, BCC_BATCH_SIZE):
            self.send(list(batch))

        self.stdout.write(
            self.style.SUCCESS(f"Emailed {len(recipients)} recipient(s).")
        )
