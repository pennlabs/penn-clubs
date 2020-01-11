import csv
import os
import re

from django.core.management.base import BaseCommand, CommandError
from django.db.models import CharField, Count, F, Q, Value

from clubs.models import Club, Membership, MembershipInvite


class Command(BaseCommand):
    help = 'Send out invites to clubs without owners.'

    def add_arguments(self, parser):
        parser.add_argument(
            'emails',
            type=str,
            help='The CSV file with club name to email mapping. First column is club name and second column is emails.'
        )
        parser.add_argument(
            '--dry-run',
            dest='dry_run',
            action='store_true',
            help='Do not actually send out emails.'
        )
        parser.add_argument(
            '--only-sheet',
            dest='only_sheet',
            action='store_true',
            help='Only send out emails to the clubs and emails that are listed in the CSV file.'
        )
        parser.set_defaults(dry_run=False, only_sheet=False)

    def handle(self, *args, **kwargs):
        dry_run = kwargs['dry_run']
        only_sheet = kwargs['only_sheet']

        if only_sheet:
            clubs = Club.objects.all()
        else:
            # find all clubs without owners or owner invitations
            clubs = Club.objects.annotate(
                owner_count=Count('membership', filter=Q(membership__role__lte=Membership.ROLE_OWNER)),
                invite_count=Count(
                    'membershipinvite',
                    filter=Q(membershipinvite__role__lte=Membership.ROLE_OWNER, active=True)
                )
            ).filter(owner_count=0, invite_count=0)
            self.stdout.write('Found {} club(s) without owners.'.format(clubs.count()))

        clubs_missing = 0
        clubs_sent = 0
        clubs_many = 0

        # parse CSV file
        emails = {}

        email_file = kwargs['emails']

        if not os.path.isfile(email_file):
            raise CommandError('Email file "{}" does not exist!'.format(email_file))

        with open(email_file, 'r') as f:
            for line in csv.reader(f):
                raw_name = line[0].strip()
                name = re.sub(r'\(.+?\)$', '', raw_name).strip()
                club = Club.objects.filter(name__icontains=name)
                count = club.count()

                # try more exact match if multiple results
                if count > 1:
                    alt_club = Club.objects.filter(name=name)
                    if alt_club.count() == 1:
                        club = alt_club
                        count = club.count()

                # try looking up a club name inside the spreadsheet value
                if count == 0:
                    alt_club = Club.objects.annotate(
                        query=Value(raw_name, output_field=CharField())
                    ).filter(query__icontains=F('name'))
                    if alt_club.count() >= 1:
                        club = alt_club
                        count = club.count()

                if count == 1:
                    clubs_sent += 1
                    emails[club.first().id] = [x.strip() for x in line[1].split(',')]
                elif count == 0:
                    clubs_missing += 1
                    self.stdout.write(
                        self.style.WARNING('Could not find club matching {}!'.format(name))
                    )
                else:
                    clubs_many += 1
                    self.stdout.write(
                        self.style.WARNING('Too many club entries ({}) for {}!'.format(
                            ', '.join(club.values_list('name', flat=True)), name)
                        )
                    )

        # send out emails
        for club in clubs:
            if club.email:
                receivers = [club.email]
                if club.id in emails:
                    if only_sheet:
                        receivers = emails[club.id]
                    else:
                        receivers += emails[club.id]
                elif only_sheet:
                    continue
                receivers = list(set(receivers))
                self.stdout.write(
                    self.style.SUCCESS('Sending email for {} to {}'.format(club.name, ', '.join(receivers)))
                )
                for receiver in receivers:
                    if not dry_run:
                        existing_invite = MembershipInvite.objects.filter(club=club, email=receiver, active=True)
                        if not existing_invite.exists():
                            invite = MembershipInvite.objects.create(
                                club=club,
                                email=receiver,
                                creator=None,
                                role=Membership.ROLE_OWNER,
                                title='Owner',
                                auto=True
                            )
                        else:
                            invite = existing_invite.first()
                        invite.send_owner_invite()

        self.stdout.write(
            'Sent {} email(s), {} missing club(s), {} ambiguous club(s)'.format(clubs_sent, clubs_missing, clubs_many)
        )
