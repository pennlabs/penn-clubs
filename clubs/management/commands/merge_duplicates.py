from django.core.management.base import BaseCommand
from django.db.models import Count

from clubs.models import Club, Membership


class Command(BaseCommand):
    help = 'Merge duplicate clubs by name.'

    def handle(self, *args, **kwargs):
        duplicates = Club.objects.values('name').annotate(name_count=Count('name')).filter(name_count__gt=1)
        duplicates = [x['name'] for x in duplicates]

        for duplicate in duplicates:
            clubs = Club.objects.filter(name=duplicate)
            num_clubs = clubs.count()
            final, rest = clubs[0], clubs[1:]
            for item in rest:
                final = self.merge_clubs(final, item)
            self.stdout.write('Merged {} ({})'.format(duplicate, num_clubs))

    def merge_clubs(self, one, two):
        """
        Merges two clubs and returns the combined club.
        """
        primary = one
        secondary = two
        if not one.active and two.active:
            secondary = one
            primary = two

        primary.active = one.active or two.active

        # Choose longest string or string that exists
        for field in ['name', 'subtitle', 'description', 'email', 'facebook', 'website', 'twitter',
                      'instagram', 'github', 'how_to_get_involved', 'image_url']:
            value = getattr(secondary, field)
            old_value = getattr(primary, field)
            if old_value is None or (value is not None and len(value) > len(old_value)):
                setattr(primary, field, value)

        # If either one is checked, the final one is checked
        for field in ['application_required', 'application_available', 'listserv_available']:
            setattr(primary, field, getattr(primary, field) or getattr(secondary, field))

        # Use the larger club size
        if secondary.size > primary.size:
            primary.size = secondary.size

        # Take all tags
        primary.tags.add(*secondary.tags.all())

        # Take all members
        Membership.objects.filter(club=secondary).update(club=primary)

        primary.save()
        secondary.delete()

        return primary
