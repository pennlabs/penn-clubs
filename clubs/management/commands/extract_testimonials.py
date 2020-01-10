import re

import bleach
from django.core.management.base import BaseCommand

from clubs.models import Club, Testimonial
from clubs.utils import clean


class Command(BaseCommand):
    help = 'Extract club testimonials from descriptions and remove testimonials from descriptions.'

    def handle(self, *args, **kwargs):
        for club in Club.objects.all():
            if club.description:
                match = re.match(r'(.*)From members of ([^:]+)[:;](.*)', club.description, re.M | re.I | re.S)
                if match is not None:
                    desc, _, testimonials = match.groups()

                    # remove testimonials from description
                    club.description = clean(desc)
                    club.save()

                    # save testimonials
                    count = 0
                    testimonials = bleach.clean(testimonials, strip=True, tags=[])
                    for testimonial in re.findall(r'"(.*?)"(?:\r?\n|$)', testimonials, re.M | re.I | re.S):
                        text = testimonial.strip()
                        Testimonial.objects.create(club=club, text=text)
                        count += 1

                    self.stdout.write(
                        self.style.SUCCESS(
                            'Extracted {} testimonial(s) from {}'.format(count, club.code)
                        )
                    )
