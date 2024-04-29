import os
import traceback

import requests
from django.conf import settings
from django.core.management.base import BaseCommand

from clubs.models import Club


class Command(BaseCommand):
    help = "List clubs with broken images and delete the image link if broken."
    web_execute = True

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            dest="dry_run",
            action="store_true",
            help="Do not actually modify anything.",
        )
        parser.set_defaults(dry_run=False)

    def handle(self, *args, **kwargs):
        self.dry_run = kwargs["dry_run"]

        broken_list = []
        working_list = []
        for club in Club.objects.filter(image__isnull=False):
            if club.image:
                image_ok = False
                if club.image.url.startswith("http"):
                    resp = requests.head(club.image.url)
                    image_ok = resp.ok
                else:
                    image_ok = os.path.isfile(
                        os.path.join(settings.MEDIA_ROOT, club.image.url)
                    )
                if not image_ok:
                    self.stdout.write(
                        self.style.ERROR(
                            "{} has broken image {}".format(club.code, club.image.url)
                        )
                    )
                    self.stdout.write(self.style.ERROR(traceback.format_exc()))
                    if not self.dry_run:
                        club.image.delete(save=True)
                    broken_list.append(
                        {"id": club.id, "name": club.name, "url": club.image.url}
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(
                            "{} has working image {}".format(club.code, club.image.url)
                        )
                    )
                    working_list.append(
                        {"id": club.id, "name": club.name, "url": club.image.url}
                    )
        self.stdout.write(
            "{} total, {} broken images".format(
                len(working_list) + len(broken_list), len(broken_list)
            )
        )
