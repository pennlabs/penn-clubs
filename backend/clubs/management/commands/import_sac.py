import csv
import os
import datetime
import pytz

from django.core.management.base import (
    BaseCommand,
    CommandError,
)
from django.db.models import Q
from django.utils import timezone

from clubs.models import (
    Badge,
    Club,
    Event,
)


class Command(BaseCommand):
    help = "Import information from the SAC fair spreadsheet to create events for the SAC fair."

    def add_arguments(
        self, parser,
    ):
        parser.add_argument(
            "file",
            type=str,
            help="The name of the CSV file to import. "
            "Assumes that there is a column title row and skips the first row.",
        )
        parser.add_argument(
            "--dry-run",
            dest="dry_run",
            action="store_true",
            help="If set to true, don't actually makes changes to the database.",
        )

    def handle(
        self, *args, **kwargs,
    ):
        file = kwargs["file"]
        dry_run = kwargs["dry_run"]

        if not os.path.isfile(file):
            raise CommandError(f"The file '{file}' does not exist.")

        club_codes = set()
        events = []

        with open(file, "r",) as f:
            reader = csv.reader(f)
            next(reader)
            for line in reader:
                if len(line) < 3:
                    continue
                (code, tag, day,) = line
                if code in club_codes:
                    continue
                club_codes.add(code)
                events.append((code, tag, day,))
        self.stdout.write(f"Loaded {len(events)} clubs from spreadsheet.")

        if not events:
            raise CommandError("There are no clubs in the spreadsheet.")

        # remove invalid clubs from fair
        invalid_clubs = Club.objects.filter(Q(fair=True) & ~Q(code__in=club_codes))
        invalid_club_codes = ", ".join(invalid_clubs.values_list("code", flat=True,))
        self.stdout.write(
            f"The following {invalid_clubs.count()} clubs have fair marked as true, "
            f"but not in the sheet: {invalid_club_codes}"
        )
        if not dry_run:
            invalid_clubs.update(fair=False)
        else:
            return

        # add event badges to system
        self.stdout.write("Adding event badges to system...")
        event_badges = set([e[1] for e in events])
        badge_map = {}
        for badge in event_badges:
            label = f"SAC Fair - {badge}"
            (badge_obj, stat,) = Badge.objects.get_or_create(
                label=label,
                defaults={
                    "description": f"This is a badge for the {label} category for the SAC Fair.",
                    "color": "0099FF",
                    "org": None,
                },
            )
            badge_map[badge] = badge_obj
            self.stdout.write(f"{'Created' if stat else 'Retrieved'} {label} badge.")

        eastern_tz = pytz.timezone("US/Eastern")
        year = timezone.now().year

        # add event badges and events to clubs
        self.stdout.write("Adding events to system...")
        for (code, tag, day,) in events:
            club = Club.objects.get(code=code)
            club.badges.add(badge_map[tag])

            start_time = datetime.datetime(year, 9, int(day), 17, 0, 0, tzinfo=eastern_tz,)

            (_, created,) = Event.objects.get_or_create(
                code=f"sac-fair-{year}-{code}",
                club=club,
                defaults={
                    "creator": None,
                    "name": "SAC Fair Info Session",
                    "start_time": start_time,
                    "type": Event.FAIR,
                    "end_time": start_time + datetime.timedelta(hours=3),
                    "description": "Replace this description!",
                },
            )
            self.stdout.write(f"{'Created' if created else 'Retrieved'} event for {club.code}.")
