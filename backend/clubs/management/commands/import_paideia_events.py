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
        url = "https://snfpaideia.upenn.edu/wp-json/wp/v2/event"

        with (urllib.request.urlopen(url)) as data:
            parsed_json = json.loads(data.read().decode())
            for event in parsed_json:

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
                ev.description = event["excerpt"]
                ev.url = event["link"]

                # parse their datetime format
                string_date = event["acf"]["event_date"]["start_date"]
                yyyy, dd, mm = (
                    int(string_date[:4]),
                    int(string_date[-2:]),
                    int(string_date[4:6]),
                )
                string_time = event["acf"]["time"]
                start_24h = 12 if "PM" in event["acf"]["time"].split("-")[0] else 0
                end_24h = 12 if "PM" in event["acf"]["time"].split("-")[1] else 0
                start_hrs, start_mins = [
                    int(x.strip()) for x in string_time[:5].split(":")
                ]
                end_hrs, end_mins = [
                    int(re.search(r"\d+", x).group())
                    for x in string_time[-8:].split(":")
                ]

                ev.start_time = timezone.make_aware(
                    datetime(yyyy, mm, dd, start_hrs + start_24h, start_mins)
                )
                ev.end_time = timezone.make_aware(
                    datetime(yyyy, mm, dd, end_hrs + end_24h, end_mins)
                )

                ev.save()

                # parse image needs to happen after save so instance.id is not None
                img_tag = event["featured_image"]
                matcher = re.search(r"src=\"([^\"]*)\"", img_tag)
                if matcher is not None:
                    img_url = "https://snfpaideia.upenn.edu{}".format(matcher.group(1))
                    # Remove resizing
                    extension = img_url.split(".")[-1]
                    img_url = "{}.{}".format(
                        img_url[: -(9 + len(extension))], extension
                    )
                    contents = requests.get(img_url).content
                    ev.image.save(
                        "snfpaideia-event.jpg", ContentFile(contents), save=True
                    )
