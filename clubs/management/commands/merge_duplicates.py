from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count, Q

from clubs.models import Club, Membership, Tag


class Command(BaseCommand):
    help = 'Helper to merge duplicate clubs and tags.'

    def add_arguments(self, parser):
        parser.add_argument('items', nargs='*', type=str, help='The ID or name of the clubs/tags to merge.')
        parser.add_argument('--tag', dest='tag', action='store_true', help='Merge tags instead of clubs.')
        parser.add_argument(
            '--auto',
            dest='auto',
            action='store_true',
            help='Automatically detect and merge clubs by name.'
        )
        parser.set_defaults(auto=False, tag=False)

    def handle(self, *args, **kwargs):
        if kwargs['auto']:
            self.stdout.write('Automatically merging duplicate clubs...')
            duplicates = Club.objects.values('name').annotate(name_count=Count('name')).filter(name_count__gt=1)
            duplicates = [x['name'] for x in duplicates]

            for duplicate in duplicates:
                clubs = Club.objects.filter(name=duplicate)
                num_clubs = clubs.count()
                final, rest = clubs[0], clubs[1:]
                for item in rest:
                    final = self.merge_clubs(final, item)
                self.stdout.write('Merged {} ({})'.format(duplicate, num_clubs))
        else:
            items = kwargs['items']
            if kwargs['tag']:
                tags = Tag.objects.filter(name__in=items)
                if tags.count() < 2:
                    raise CommandError('You must specify at least two tags to merge!')

                final, rest = tags[0], tags[1:]
                for item in rest:
                    final = self.merge_tags(final, item)

                self.stdout.write('Merged {}'.format(final.name))
            else:
                clubs = Club.objects.filter(Q(id__in=items) | Q(name__in=items))
                if clubs.count() < 2:
                    raise CommandError('You must specify at least two clubs to merge!')
                final, rest = clubs[0], clubs[1:]
                for item in rest:
                    final = self.merge_clubs(final, item)
                self.stdout.write('Merged {}'.format(final.name))

    def merge_tags(self, one, two):
        """
        Merges two tags and returns the combined tag.
        """
        one.club_set.add(*two.club_set.all())
        two.delete()
        return one

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
                      'instagram', 'github', 'how_to_get_involved', 'listserv']:
            value = getattr(secondary, field)
            old_value = getattr(primary, field)
            if old_value is None or (value is not None and len(value) > len(old_value)):
                setattr(primary, field, value)

        # If either one is accepting members, the final one is as well
        primary.accepting_members = primary.accepting_members or secondary.accepting_members

        # Choose most restrictive application_required
        primary.application_required = max(primary.application_required, secondary.application_required)

        # Use the larger club size
        primary.size = max(primary.size, secondary.size)

        # Take all tags
        primary.tags.add(*secondary.tags.all())

        # Take all members
        Membership.objects.filter(club=secondary).update(club=primary)

        primary.save()
        secondary.delete()

        return primary
