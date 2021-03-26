import json
import re
import urllib.request
from datetime import datetime
from html import unescape

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.html import strip_tags

from clubs.models import Event


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
                # ev.club = Is there a club for this? What even is SNF Paideia?
                ev.code = event["slug"]
                ev.name = unescape(event["title"]["rendered"])
                ev.description = (
                    "Register Here: "
                    + event["acf"]["registration_url"]
                    + "\n\n"
                    + unescape(strip_tags(event["content"]["rendered"]))
                )
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
