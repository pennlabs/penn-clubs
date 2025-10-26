import datetime
from math import floor

import bleach
import numpy as np
from django.core.management.base import BaseCommand
from django.db.models import DurationField, ExpressionWrapper, F
from django.utils import timezone

from clubs.models import Club, ClubFair, EventShowing, Membership, RankingWeights


# Default weight values mirroring the historic constant scoring system
DEFAULT_WEIGHTS = {
    "inactive_penalty": -1000,
    "favorites_per": 1 / 25,
    "tags_good": 15,
    "tags_many": 7,
    "officer_bonus": 15,
    "member_base": 10,
    "member_per": 1 / 10,
    "logo_bonus": 15,
    "subtitle_bad": -10,
    "subtitle_good": 5,
    "images_bonus": 3,
    "desc_short": 25,
    "desc_med": 10,
    "desc_long": 10,
    "fair_bonus": 10,
    "application_bonus": 25,
    "today_event_base": 10,
    "today_event_good": 10,
    "week_event_base": 5,
    "week_event_good": 5,
    "email_bonus": 10,
    "social_bonus": 10,
    "howto_penalty": -30,
    "outdated_penalty": -10,
    "testimonial_one": 10,
    "testimonial_three": 5,
    "random_scale": 25,
}


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

        # Retrieve ranking weights singleton
        weights = RankingWeights.get()

        def _w(key):
            """Fetch weight: RankingWeights field ➔ DEFAULT_WEIGHTS ➔ 1.0."""
            val = getattr(weights, key, None)
            if val is not None:
                return val
            return DEFAULT_WEIGHTS.get(key, 1.0)

        clubs = Club.objects.prefetch_related(
            "favorite_set",
            "tags",
            "membership_set",
            "clubapplication_set",
            "events",
            "events__eventshowing_set",
            "testimonials",
        ).all()

        for club in clubs:
            ranking = 0

            # inactive clubs get deprioritized
            if not club.active:
                ranking += _w("inactive_penalty")

            # small points for favorites
            ranking += club.favorite_set.count() * _w("favorites_per")

            # points for minimum amount of tags
            tags = club.tags.count()
            if 3 <= tags <= 7:
                ranking += _w("tags_good")
            elif tags > 7:
                ranking += _w("tags_many")

            # lots of points for officers
            officers = club.membership_set.filter(
                active=True, role__lte=Membership.ROLE_OFFICER
            ).count()
            if officers >= 3:
                ranking += _w("officer_bonus")

            # ordinary members give even more points
            members = club.membership_set.filter(
                active=True, role__gte=Membership.ROLE_MEMBER
            ).count()
            if members >= 3:
                ranking += _w("member_base")
            ranking += members * _w("member_per")

            # points for logo
            if club.image is not None:
                ranking += _w("logo_bonus")

            # points for subtitle
            subtitle = club.subtitle.strip()
            if subtitle.lower() == "your subtitle here":
                ranking += _w("subtitle_bad")
            elif len(subtitle) > 3:
                ranking += _w("subtitle_good")

            # images in description? awesome
            if "<img" in club.description or "<iframe" in club.description:
                ranking += _w("images_bonus")

            # points for longer descriptions
            cleaned_description = bleach.clean(
                club.description, tags=[], attributes={}, styles=[], strip=True
            ).strip()

            if len(cleaned_description) > 25:
                ranking += _w("desc_short")

            if len(cleaned_description) > 250:
                ranking += _w("desc_med")

            if len(cleaned_description) > 1000:
                ranking += _w("desc_long")

            # points for fair
            now = timezone.now()
            if ClubFair.objects.filter(
                end_time__gte=now, participating_clubs=club
            ).exists():
                ranking += _w("fair_bonus")

            # points for club applications
            if club.clubapplication_set.filter(
                application_start_time__lte=now, application_end_time__gte=now
            ).exists():
                ranking += _w("application_bonus")

            # points for events
            # Get all events with showings today
            today_showings = EventShowing.objects.filter(
                event__club=club,
                end_time__gte=now,
                start_time__lte=now + datetime.timedelta(days=1),
            )

            today_events = club.events.filter(
                pk__in=today_showings.values_list("event_id", flat=True)
            )

            if today_events.exists():
                # Create a list of showings with duration less than 16 hours
                short_showings = (
                    today_showings.annotate(
                        duration=ExpressionWrapper(
                            F("end_time") - F("start_time"),
                            output_field=DurationField(),
                        )
                    )
                    .filter(duration__lt=datetime.timedelta(hours=16))
                    .exists()
                )

                if short_showings:
                    ranking += _w("today_event_base")
                    # Check for events with good descriptions and images
                    if all(
                        len(e.description) >= 3
                        and e.description not in {"Replace this description!"}
                        and e.image is not None
                        for e in today_events
                    ):
                        ranking += _w("today_event_good")

            # Get all events with showings in the next week
            close_showings = EventShowing.objects.filter(
                event__club=club,
                end_time__gte=now,
                start_time__lte=now + datetime.timedelta(weeks=1),
            )

            close_events = club.events.filter(
                pk__in=close_showings.values_list("event_id", flat=True)
            )

            if close_events.exists():
                # Create a list of showings with duration less than 16 hours
                short_showings = (
                    close_showings.annotate(
                        duration=ExpressionWrapper(
                            F("end_time") - F("start_time"),
                            output_field=DurationField(),
                        )
                    )
                    .filter(duration__lt=datetime.timedelta(hours=16))
                    .exists()
                )

                if short_showings:
                    ranking += _w("week_event_base")
                    # Check for events with good descriptions and images
                    if all(
                        len(e.description) > 3
                        and e.description not in {"Replace this description!"}
                        and e.image is not None
                        for e in close_events
                    ):
                        ranking += _w("week_event_good")

            # points for public contact email
            if club.email and club.email_public:
                ranking += _w("email_bonus")

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
                ranking += _w("social_bonus")

            # points for how to get involved
            if len(club.how_to_get_involved.strip()) <= 3:
                ranking += _w("howto_penalty")

            # points for updated
            if club.updated_at < now - datetime.timedelta(days=30 * 8):
                ranking += _w("outdated_penalty")

            # points for testimonials
            num_testimonials = club.testimonials.count()
            if num_testimonials >= 1:
                ranking += _w("testimonial_one")
            if num_testimonials >= 3:
                ranking += _w("testimonial_three")

            # random number, mostly shuffles similar clubs with average of 25 points
            # but with long right tail to periodically feature less popular clubs
            # given ~700 active clubs, multiplier c, expected # clubs with rand > cd
            # is 257, 95, 35, 13, 5, 2, 1 for c = 1, 2, 3, 4, 5, 6, 7
            ranking += np.random.standard_exponential() * _w("random_scale")

            club.rank = floor(ranking)
            club.skip_history_when_saving = True
            count += 1

        Club.objects.bulk_update(clubs, ["rank"])

        self.stdout.write(self.style.SUCCESS(f"Computed rankings for {count} clubs!"))
