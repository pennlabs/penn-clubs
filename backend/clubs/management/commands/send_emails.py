import csv
import os

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count, Q
from django.template.loader import render_to_string

from clubs.models import Club, Membership, MembershipInvite
from clubs.utils import fuzzy_lookup_club


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
            self.stdout.write(f"Found {clubs.count()} active club(s) without owners.")

        clubs_missing = 0
        clubs_sent = 0

        # parse CSV file
        emails = {}

        email_file = kwargs["emails"]

        if not os.path.isfile(email_file):
            raise CommandError(f'Email file "{email_file}" does not exist!')

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
                receivers_str = ", ".join(receivers)
                self.stdout.write(
                    self.style.SUCCESS(f"Sending {action} email for {club.name} to {receivers_str}")
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

        self.stdout.write(f"Sent {clubs_sent} email(s), {clubs_missing} missing club(s)")
