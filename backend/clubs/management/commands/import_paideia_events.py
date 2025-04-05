import json
import re
import urllib.request
from datetime import datetime
from html import unescape

import requests
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone

from clubs.models import Club, Event


class Command(BaseCommand):
    help = (
        "Imports events from SNF Paideia's site "
        "into the Events model at a set frequency"
    )

    def handle(self, *args, **kwargs):
        url = (
            "https://snfpaideia.upenn.edu/wp-json/wp/v2/event?"
            "order=asc&per_page=100&page=1&onlyInclude=upcoming_events"
        )
        with urllib.request.urlopen(url) as data:
            parsed_json = json.loads(data.read().decode())
            for event in parsed_json:
                try:
                    # prevent duplicates
                    existing = Event.objects.filter(code=event["slug"]).first()
                    if existing:
                        existing.delete()
                    ev = Event()
                    ev.club = Club.objects.filter(code="snf-paideia-program").first()
                    # if SNF Paideia has been deleted, this script should do nothing
                    if ev.club is None:
                        return
                    ev.type = Event.OTHER
                    ev.code = event["slug"]
                    ev.name = unescape(event["title"]["rendered"])
                    ev.description = unescape(event["excerpt"])
                    ev.url = event["link"]

                    event_dates = event["acf"]["event_dates"]
                    # parse their datetime format
                    start_date = event_dates["start_date"]

                    end_date = (
                        event_dates["end_date"]
                        if event_dates["multi_day"]
                        else event_dates["start_date"]
                    )

                    for type, d in [("s", start_date), ("e", end_date)]:
                        yyyy, dd, mm = (
                            int(d[:4]),
                            int(d[-2:]),
                            int(d[4:6]),
                        )

                        if type == "s":
                            _24h = (
                                12 if "pm" in event_dates["start_time"].lower() else 0
                            )

                            hrs, mins = (
                                (event_dates["start_time"].split()[0].split(":"))
                                if not event_dates["all_day"]
                                else (0, 0)
                            )
                            ev.start_time = timezone.make_aware(
                                datetime(yyyy, mm, dd, int(hrs) + _24h, int(mins))
                            )
                        elif type == "e":
                            _24h = 12 if "pm" in event_dates["end_time"].lower() else 0
                            hrs, mins = (
                                (
                                    event["acf"]["event_dates"]["end_time"]
                                    .split()[0]
                                    .split(":")
                                )
                                if not event_dates["all_day"]
                                else (23, 59)
                            )

                            ev.end_time = timezone.make_aware(
                                datetime(
                                    yyyy, mm, dd, min(int(hrs) + _24h, 23), int(mins)
                                )
                            )
                    ev.save()
                    # parse image needs to happen after save so instance.id is not None
                    img_tag = event["featured_image"]
                    matcher = re.search(r"src=\"([^\"]*)\"", img_tag)
                    if matcher is not None:
                        img_url = "https://snfpaideia.upenn.edu{}".format(
                            matcher.group(1)
                        )
                        # Remove resizing
                        extension = img_url.split(".")[-1]
                        img_url = "{}.{}".format(
                            img_url[: -(9 + len(extension))], extension
                        )
                        contents = requests.get(img_url).content
                        ev.image.save(
                            "snfpaideia-event.jpg", ContentFile(contents), save=True
                        )
                except Exception:
                    # exceptions occur only when the site has badly formatted input
                    # noqa: E501
                    continue
