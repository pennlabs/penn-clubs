import datetime
import random
from math import floor

import bleach
from django.core.management.base import BaseCommand
from django.utils import timezone

from clubs.models import Club, Membership


class Command(BaseCommand):
    help = "Precomputes ranking information for all clubs on Penn Clubs. \
            This script should be run periodically to keep the rankings fresh."

    def handle(self, *args, **kwargs):
        for club in Club.objects.all():
            ranking = 0

            # inactive clubs get deprioritized
            if not club.active:
                ranking -= 1000

            # small points for favorites
            ranking += floor(club.favorite_set.count() / 25)

            # points for minimum amount of tags
            tags = club.tags.count()
            if tags >= 3 and tags <= 10:
                ranking += 15

            # lots of points for officers
            officers = club.membership_set.filter(role__lte=Membership.ROLE_OFFICER).count()
            if officers >= 3:
                ranking += 15

            # ordinary members give even more points
            members = club.membership_set.filter(role__gte=Membership.ROLE_MEMBER).count()
            if members >= 3:
                ranking += 10
            ranking += floor(members / 10)

            # points for logo
            if club.image is not None:
                ranking += 15

            # points for subtitle
            if club.subtitle.strip():
                ranking += 5

            # images in description? awesome
            if "<img" in club.description:
                ranking += 3

            # points for longer descriptions
            cleaned_description = bleach.clean(
                club.description, tags=[], attributes={}, styles=[], strip=True
            ).strip()

            if len(cleaned_description) > 10:
                ranking += 10

            if len(cleaned_description) > 250:
                ranking += 10

            if len(cleaned_description) > 1000:
                ranking += 10

            # points for events
            now = timezone.now()
            today_events = club.events.filter(
                end_time__gte=now, start_time__lte=now + datetime.timedelta(days=1)
            )

            if today_events.exists():
                ranking += 20

            close_events = club.events.filter(
                end_time__gte=now, start_time__lte=now + datetime.timedelta(weeks=1)
            )

            if close_events.exists():
                ranking += 10

            # rng
            ranking += floor(random.random() * 5)

            club.rank = ranking
            club.skip_history_when_saving = True
            club.save(update_fields=["rank"])
