import csv
import os
import re

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count, Q

from clubs.models import Club, Membership, MembershipInvite


class Command(BaseCommand):
    help = 'Send out invites to clubs without owners.'

    def add_arguments(self, parser):
        parser.add_argument(
            'emails',
            type=str,
            help='The CSV file with club name to email mapping. First column is club name and second column is emails.'
        )

    def handle(self, *args, **kwargs):
        clubs = Club.objects.annotate(
            owner_count=Count('membership', filter=Q(membership__role__lte=Membership.ROLE_OWNER)),
            invite_count=Count('membershipinvite', filter=Q(membershipinvite__role__lte=Membership.ROLE_OWNER))
        ).filter(owner_count=0, invite_count=0)
        self.stdout.write('Found {} club(s) without owners.'.format(clubs.count()))

        emails = {}

        email_file = kwargs['emails']

        if not os.path.isfile(email_file):
            raise CommandError('Email file "{}" does not exist!'.format(email_file))

        with open(email_file, 'r') as f:
            for line in csv.reader(f):
                name = re.sub(r'\(.+?\)$', '', line[0].strip()).strip()
                club = Club.objects.filter(name__icontains=name)
                count = club.count()
                if count == 1:
                    emails[club.first().id] = [x.strip() for x in line[1].split(',')]
                elif count == 0:
                    self.stdout.write(self.style.WARNING('Could not find {}!'.format(name)))
                else:
                    self.stdout.write(self.style.WARNING('Too many entries ({}) for {}!'.format(count, name)))

        for club in clubs:
            if club.email:
                receivers = [club.email]
                if club.id in emails:
                    receivers += emails[club.id]
                receivers = list(set(receivers))
                self.stdout.write(self.style.SUCCESS('Sending {} to {}'.format(club.name, ', '.join(receivers))))
                for receiver in receivers:
                    invite = MembershipInvite.objects.create(
                        club=club,
                        email=receiver,
                        creator=None,
                        role=Membership.ROLE_OWNER,
                        title='Owner',
                        auto=True
                    )
                    invite.send_owner_invite()
