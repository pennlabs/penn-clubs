from django.core.management.base import BaseCommand
import urllib.request
from clubs.models import Club
import json


class Command(BaseCommand):
    help = "Imports events from SNF Paideia's site into the ClubEvents model at a set frequency"


    def handle(self, *args, **kwargs):
        url = "https://snfpaideia.upenn.edu/wp-json/wp/v2/event"

        with (urllib.request.urlopen(url)) as data:
            parsed_json = json.loads(data.read().decode('ascii', 'ignore'))
            print(parsed_json[0]['id'])

