import os

import requests
from django.conf import settings
from django.core.management.base import BaseCommand

from clubs.models import Club


class Command(BaseCommand):
    help = 'List clubs with broken images and delete the image link.'

    def handle(self, *args, **kwargs):
        broken_list = []
        working_list = []
        for club in Club.objects.filter(image__isnull=False):
            if club.image:
                image_ok = False
                if club.image.url.startswith('http'):
                    resp = requests.head(club.image.url)
                    image_ok = resp.ok
                else:
                    image_ok = os.path.isfile(os.path.join(settings.MEDIA_ROOT, club.image.url))
                if not image_ok:
                    self.stdout.write(self.style.ERROR('{} has broken image {}'.format(club.code, club.image.url)))
                    broken_list.append({
                        'id': club.id,
                        'name': club.name,
                        'url': club.image.url
                    })
                    club.image.delete(save=True)
                else:
                    self.stdout.write(self.style.SUCCESS('{} has working image {}'.format(club.code, club.image.url)))
                    working_list.append({
                        'id': club.id,
                        'name': club.name,
                        'url': club.image.url
                    })
        self.stdout.write('{} total, {} broken images'.format(len(working_list) + len(broken_list), len(broken_list)))
