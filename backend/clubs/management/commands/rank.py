import datetime
from math import floor

import bleach
import numpy as np
from django.core.management.base import BaseCommand
from django.utils import timezone

from clubs.models import Club, ClubFair, Membership


class Command(BaseCommand):
    help = (
        "Precomputes ranking information for all clubs on Penn Clubs. "
        "This script should be run periodically approximately once per day "
        "to keep rankings fresh. "
        "Also updates club attributes that vary depending on different events."
    )
    web_execute = True

    def handle(self, *args, **kwargs):
        self.set_recruiting_statuses()
        self.rank()

    def set_recruiting_statuses(self):
        """
        Modify the recruiting statuses for clubs based on whether or not they have
        club applications open.
        """
        now = timezone.now()
        # get all clubs with current applications
        current_apps = Club.objects.exclude(
            application_required=Club.OPEN_MEMBERSHIP
        ).filter(
            clubapplication__application_start_time__lte=now,
            clubapplication__application_end_time__gte=now,
        )

        # mark all clubs with past applications but no current applications as not
        # accepting members
        unupd = (
            Club.objects.exclude(application_required=Club.OPEN_MEMBERSHIP)
            .filter(
                clubapplication__application_end_time__lt=now, accepting_members=True
            )
            .exclude(pk__in=current_apps.values_list("pk", flat=True))
            .update(accepting_members=False)
        )

        # mark all clubs with current applications as accepting members
        upd = current_apps.filter(accepting_members=False).update(
            accepting_members=True
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Set accepting members to true for {upd} club(s) "
                f"and to false for {unupd} club(s)!"
            )
        )

    def rank(self):
        count = 0

        clubs = Club.objects.prefetch_related(
            "favorite_set",
            "tags",
            "membership_set",
            "clubapplication_set",
            "events",
            "testimonials",
        ).all()

        for club in clubs:
            ranking = 0

            # inactive clubs get deprioritized
            if not club.active:
                ranking -= 1000

            # small points for favorites
            ranking += club.favorite_set.count() / 25

            # points for minimum amount of tags
            tags = club.tags.count()
            if tags >= 3 and tags <= 7:
                ranking += 15
            elif tags > 7:
                ranking += 7

            # lots of points for officers
            officers = club.membership_set.filter(
                active=True, role__lte=Membership.ROLE_OFFICER
            ).count()
            if officers >= 3:
                ranking += 15

            # ordinary members give even more points
            members = club.membership_set.filter(
                active=True, role__gte=Membership.ROLE_MEMBER
            ).count()
            if members >= 3:
                ranking += 10
            ranking += members / 10

            # points for logo
            if club.image is not None:
                ranking += 15

            # points for subtitle
            subtitle = club.subtitle.strip()
            if subtitle.lower() == "your subtitle here":
                ranking -= 10
            elif len(subtitle) > 3:
                ranking += 5

            # images in description? awesome
            if "<img" in club.description or "<iframe" in club.description:
                ranking += 3

            # points for longer descriptions
            cleaned_description = bleach.clean(
                club.description, tags=[], attributes={}, styles=[], strip=True
            ).strip()

            if len(cleaned_description) > 25:
                ranking += 25

            if len(cleaned_description) > 250:
                ranking += 10

            if len(cleaned_description) > 1000:
                ranking += 10

            # points for fair
            now = timezone.now()
            if ClubFair.objects.filter(
                end_time__gte=now, participating_clubs=club
            ).exists():
                ranking += 10

            # points for club applications
            if club.clubapplication_set.filter(
                application_start_time__lte=now, application_end_time__gte=now
            ).exists():
                ranking += 25

            # points for events
            today_events = club.events.filter(
                end_time__gte=now, start_time__lte=now + datetime.timedelta(days=1)
            )

            if today_events.exists():
                short_events = [
                    (e.end_time - e.start_time).seconds / 3600 < 16
                    for e in today_events
                ]
                if any(short_events):
                    ranking += 10
                    if all(
                        len(e.description) >= 3
                        and e.description not in {"Replace this description!"}
                        and e.image is not None
                        for e in today_events
                    ):
                        ranking += 10

            close_events = club.events.filter(
                end_time__gte=now, start_time__lte=now + datetime.timedelta(weeks=1)
            )

            if close_events.exists():
                short_events = [
                    (e.end_time - e.start_time).seconds / 3600 < 16
                    for e in close_events
                ]
                if any(short_events):
                    ranking += 5
                    if all(
                        len(e.description) > 3
                        and e.description not in {"Replace this description!"}
                        and e.image is not None
                        for e in close_events
                    ):
                        ranking += 5

            # points for public contact email
            if club.email and club.email_public:
                ranking += 10

            # points for social links
            social_fields = [
                "facebook",
                "website",
                "twitter",
                "instagram",
                "linkedin",
                "github",
                "youtube",
            ]
            social_fields = [getattr(club, field) for field in social_fields]
            has_fields = [
                field is not None and len(field) >= 3 for field in social_fields
            ]
            has_fields = [field for field in social_fields if field]
            if len(has_fields) >= 2:
                ranking += 10

            # points for how to get involved
            if len(club.how_to_get_involved.strip()) <= 3:
                ranking -= 30

            # points for updated
            if club.updated_at < now - datetime.timedelta(days=30 * 8):
                ranking -= 10

            # points for testimonials
            num_testimonials = club.testimonials.count()
            if num_testimonials >= 1:
                ranking += 10
            if num_testimonials >= 3:
                ranking += 5

            # random number, mostly shuffles similar clubs with average of 15 points
            # but with long right tail to periodically feature less popular clubs
            # given ~700 active clubs, multiplier c, expected # clubs with rand > cd
            # is 257, 95, 35, 13, 5, 2, 1 for c = 1, 2, 3, 4, 5, 6, 7
            ranking += np.random.standard_exponential() * 15

            club.rank = floor(ranking)
            club.skip_history_when_saving = True
            count += 1

        Club.objects.bulk_update(clubs, ["rank"])

        self.stdout.write(self.style.SUCCESS(f"Computed rankings for {count} clubs!"))
