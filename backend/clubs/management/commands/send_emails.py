import csv
import os
import re

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.management.base import BaseCommand, CommandError
from django.db.models import CharField, Count, F, Q, Value
from django.template.loader import render_to_string

from clubs.models import Club, Membership, MembershipInvite


def min_edit(s1, s2):
    """
    Return the Levenshtein distance between two strings.
    """
    if len(s1) > len(s2):
        s1, s2 = s2, s1
    distances = range(len(s1) + 1)
    for index2, char2 in enumerate(s2):
        newDistances = [index2 + 1]
        for index1, char1 in enumerate(s1):
            if char1 == char2:
                newDistances.append(distances[index1])
            else:
                newDistances.append(
                    1 + min((distances[index1], distances[index1 + 1], newDistances[-1]))
                )
        distances = newDistances
    return distances[-1]


def fuzzy_lookup_club(name):
    """
    Aggressively attempt to find a club matching the provided name.
    Returns None if the club with that name could not be found.
    """
    name = name.strip()

    # lookup club by case insensitive name
    club = Club.objects.filter(name__iexact=name)
    if club.exists():
        # lookup club by case sensitive name
        if club.count() > 1:
            club = Club.objects.filter(name=name)
            if club:
                return club.first()
        else:
            return club.first()

    # strip out parentheses
    name = re.sub(r"\(.+?\)$", "", name).strip()
    club = Club.objects.filter(name__icontains=name)
    if club.exists():
        return min(club, key=lambda c: min_edit(c.name.lower(), name.lower()))

    # look up clubs with names inside the passed name
    club = Club.objects.annotate(query=Value(name, output_field=CharField())).filter(
        query__icontains=F("name")
    )

    if club.exists():
        return min(club, key=lambda c: min_edit(c.name.lower(), name.lower()))

    return None


def send_fair_email(club, email):
    """
    Sends the SAC fair email for a club to the given email.
    """
    domain = settings.DEFAULT_DOMAIN
    context = {
        "name": club.name,
        "url": settings.VIEW_URL.format(domain=domain, club=club.code),
        "flyer_url": settings.FLYER_URL.format(domain=domain, club=club.code),
    }

    text_content = render_to_string("emails/fair.txt", context)
    html_content = render_to_string("emails/fair.html", context)

    msg = EmailMultiAlternatives(
        "Making the SAC Fair Easier for You", text_content, settings.FROM_EMAIL, [email]
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)


class Command(BaseCommand):
    help = "Send out invites to clubs without owners."

    def add_arguments(self, parser):
        parser.add_argument(
            "emails",
            type=str,
            help="The CSV file with club name to email mapping. First column is club name"
            + "and second column is emails.",
        )
        parser.add_argument(
            "type", type=str, help="The type of email to send.", choices=("invite", "fair")
        )
        parser.add_argument(
            "--dry-run",
            dest="dry_run",
            action="store_true",
            help="Do not actually send out emails.",
        )
        parser.add_argument(
            "--only-sheet",
            dest="only_sheet",
            action="store_true",
            help="Only send out emails to the clubs and emails that are listed in the CSV file.",
        )
        parser.set_defaults(dry_run=False, only_sheet=False)

    def handle(self, *args, **kwargs):
        dry_run = kwargs["dry_run"]
        only_sheet = kwargs["only_sheet"]
        action = kwargs["type"]
        verbosity = kwargs["verbosity"]

        if only_sheet:
            clubs = Club.objects.all()
        else:
            # find all clubs without owners or owner invitations
            clubs = Club.objects.annotate(
                owner_count=Count(
                    "membership", filter=Q(membership__role__lte=Membership.ROLE_OWNER)
                ),
                invite_count=Count(
                    "membershipinvite",
                    filter=Q(membershipinvite__role__lte=Membership.ROLE_OWNER, active=True),
                ),
            ).filter(owner_count=0, invite_count=0, active=True)
            self.stdout.write("Found {} active club(s) without owners.".format(clubs.count()))

        clubs_missing = 0
        clubs_sent = 0

        # parse CSV file
        emails = {}

        email_file = kwargs["emails"]

        if not os.path.isfile(email_file):
            raise CommandError('Email file "{}" does not exist!'.format(email_file))

        with open(email_file, "r") as f:
            for line in csv.reader(f):
                raw_name = line[0].strip()
                club = fuzzy_lookup_club(raw_name)

                if club is not None:
                    if verbosity >= 2:
                        self.stdout.write(f"Mapped {raw_name} -> {club.name} ({club.code})")
                    clubs_sent += 1
                    emails[club.id] = [x.strip() for x in line[1].split(",")]
                else:
                    clubs_missing += 1
                    self.stdout.write(
                        self.style.WARNING(f"Could not find club matching {raw_name}!")
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
                    self.style.SUCCESS(
                        "Sending {} email for {} to {}".format(
                            action, club.name, ", ".join(receivers)
                        )
                    )
                )
                for receiver in receivers:
                    if not dry_run:
                        if action == "invite":
                            existing_invite = MembershipInvite.objects.filter(
                                club=club, email=receiver, active=True
                            )
                            if not existing_invite.exists():
                                invite = MembershipInvite.objects.create(
                                    club=club,
                                    email=receiver,
                                    creator=None,
                                    role=Membership.ROLE_OWNER,
                                    title="Owner",
                                    auto=True,
                                )
                            else:
                                invite = existing_invite.first()
                            invite.send_owner_invite()
                        elif action == "fair":
                            send_fair_email(club, receiver)

        self.stdout.write("Sent {} email(s), {} missing club(s)".format(clubs_sent, clubs_missing))
