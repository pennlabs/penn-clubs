import requests
from django.core.management.base import BaseCommand

from clubs.models import Club


class Command(BaseCommand):
    help = 'List clubs with broken images.'

    def handle(self, *args, **kwargs):
        broken_list = []
        working_list = []
        for club in Club.objects.all():
            if club.image:
                resp = requests.head(club.image.url)
                if not resp.ok:
                    self.stdout.write(self.style.ERROR('{} has broken image {}'.format(club.id, club.image.url)))
                    broken_list.append({
                        'id': club.id,
                        'name': club.name,
                        'url': club.image.url
                    })
                    club.image.delete(save=True)
                else:
                    self.stdout.write(self.style.SUCCESS('{} has working image {}'.format(club.id, club.image.url)))
                    working_list.append({
                        'id': club.id,
                        'name': club.name,
                        'url': club.image.url
                    })
        self.stdout.write('{} total, {} broken images'.format(len(working_list) + len(broken_list), len(broken_list)))
