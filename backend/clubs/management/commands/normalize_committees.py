"""
Management command to normalize committees across all club applications.
This fixes duplicate committees with "copy 1" suffixes that may have been
created during application cloning.
"""

import re

from django.core.management.base import BaseCommand

from clubs.models import Club, ClubApplication


class Command(BaseCommand):
    help = (
        "Normalize committees across each club's latest application by removing "
        'duplicates with "copy X" suffixes (where X is any number) and '
        "consolidating references to canonical committees."
    )
    web_execute = True

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be normalized without making changes",
        )
        parser.add_argument(
            "--club-code",
            type=str,
            help="Normalize only applications for the specified club code",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        club_code = options.get("club_code")

        # Get clubs to process
        clubs = Club.objects.all()
        if club_code:
            clubs = clubs.filter(code=club_code)

        total_apps = 0
        total_normalized = 0

        for club in clubs:
            # Get the latest application for this club
            latest_app = (
                ClubApplication.objects.filter(club=club)
                .order_by("-created_at")
                .first()
            )

            if not latest_app:
                continue

            total_apps += 1

            if dry_run:
                # Count potential duplicates for dry run
                committees = list(latest_app.committees.all())
                copy_suffix_regex = re.compile(
                    r"^(?P<base>.+?)\s+copy\s+\d+$", re.IGNORECASE
                )

                def get_base_name(name):
                    if not name:
                        return name
                    match = copy_suffix_regex.match(name.strip())
                    return match.group("base").strip() if match else name.strip()

                base_to_items = {}
                for committee in committees:
                    base = get_base_name(committee.name)
                    base_to_items.setdefault(base, []).append(committee)

                duplicates_found = sum(
                    len(items) - 1 for items in base_to_items.values() if len(items) > 1
                )

                if duplicates_found > 0:
                    self.stdout.write(
                        f"[DRY RUN] Would normalize {duplicates_found} "
                        f"duplicate committees for club {club.code} "
                        f"application {latest_app.id}"
                    )
                    total_normalized += 1
            else:
                # Actually normalize
                try:
                    latest_app.normalize_committees()
                    self.stdout.write(
                        f"Normalized committees for club {club.code} "
                        f"application {latest_app.id}"
                    )
                    total_normalized += 1
                except Exception as e:
                    self.stderr.write(
                        f"Error normalizing committees for club {club.code}: {e}"
                    )

        if dry_run:
            self.stdout.write(
                f"\n[DRY RUN] Would normalize committees for "
                f"{total_normalized}/{total_apps} applications"
            )
        else:
            self.stdout.write(
                f"\nNormalized committees for "
                f"{total_normalized}/{total_apps} applications"
            )
