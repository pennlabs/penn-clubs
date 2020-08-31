import csv
import os

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count, Q
from django.template.loader import render_to_string

from clubs.models import Club, Membership, MembershipInvite
from clubs.utils import fuzzy_lookup_club, html_to_text


def send_fair_email(club, email, template="fair"):
    """
    Sends the SAC fair email for a club to the given email.
    """
    domain = settings.DEFAULT_DOMAIN
    context = {
        "name": club.name,
        "url": settings.VIEW_URL.format(domain=domain, club=club.code),
        "flyer_url": settings.FLYER_URL.format(domain=domain, club=club.code),
    }

    html_content = render_to_string("emails/{}.html".format(template), context)
    text_content = html_to_text(html_content)

    msg = EmailMultiAlternatives(
        "Making the SAC Fair Easier for You", text_content, settings.FROM_EMAIL, [email]
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)


class Command(BaseCommand):
    help = "Send out invites to clubs without owners."

    def add_arguments(self, parser):
        parser.add_argument(
            "type",
            type=str,
            help="The type of email to send.",
            choices=("invite", "physical_fair", "physical_postfair", "virtual_fair"),
        )
        parser.add_argument(
            "emails",
            nargs="?",
            type=str,
            help="The CSV file with club name to email mapping. First column is club name"
            + "and second column is emails.",
            default=None,
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
        parser.add_argument(
            "--only-active",
            dest="only_active",
            action="store_true",
            help="Only send emails to clubs that are marked as active.",
        )
        parser.add_argument(
            "--role",
            type=int,
            default=Membership.ROLE_OWNER,
            choices=[r[0] for r in Membership.ROLE_CHOICES],
            help="The permission level to grant for new invitations.",
        )
        parser.add_argument(
            "--include-staff",
            dest="include_staff",
            action="store_true",
            help="Include staff members of a club in the email being sent out.",
        )
        parser.add_argument(
            "--clubs",
            dest="clubs",
            type=str,
            help="The comma separated list of club codes to send emails to. "
            "Helpful for previewing the email before it is sent.",
        )
        parser.set_defaults(include_staff=False, dry_run=False, only_sheet=False, only_active=True)

    def handle(self, *args, **kwargs):
        dry_run = kwargs["dry_run"]
        only_sheet = kwargs["only_sheet"]
        action = kwargs["type"]
        verbosity = kwargs["verbosity"]
        include_staff = kwargs["include_staff"]
        role = kwargs["role"]
        role_mapping = {k: v for k, v in Membership.ROLE_CHOICES}

        # get club whitelist
        clubs_whitelist = [club.strip() for club in kwargs.get("clubs", "").split(",")]
        clubs_whitelist = [club for club in clubs_whitelist if club]

        found_whitelist = set(
            Club.objects.filter(code__in=clubs_whitelist).values_list("code", flat=True)
        )
        missing = set(clubs_whitelist) - found_whitelist
        if missing:
            raise CommandError(f"Invalid club codes in clubs parameter: {missing}")

        # handle sending out virtual fair emails
        if action == "virtual_fair":
            clubs = Club.objects.filter(fair=True)
            if clubs_whitelist:
                clubs = clubs.filter(code__in=clubs_whitelist)
            self.stdout.write(f"Found {clubs.count()} clubs participating in the fair.")
            for club in clubs:
                self.stdout.write(f"Sending virtual fair setup email to {club.name}...")
                if not dry_run:
                    club.send_virtual_fair_email()
            return

        # handle all other email events
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
            ).filter(owner_count=0, invite_count=0)
            self.stdout.write(f"Found {clubs.count()} active club(s) without owners.")

        if kwargs["only_active"]:
            clubs = clubs.filter(active=True)

        if clubs_whitelist:
            clubs = clubs.filter(code__in=clubs_whitelist)

        clubs_missing = 0
        clubs_sent = 0

        # parse CSV file
        emails = {}

        email_file = kwargs["emails"]

        # verify email file
        if email_file is not None:
            if not os.path.isfile(email_file):
                raise CommandError(f'Email file "{email_file}" does not exist!')
        elif only_sheet:
            raise CommandError("Cannot specify only sheet option without an email file!")
        else:
            self.stdout.write(self.style.WARNING("No email spreadsheet file specified!"))

        # load email file
        if email_file is not None:
            with open(email_file, "r") as f:
                reader = csv.reader(f)
                for line in reader:
                    if not line:
                        self.stdout.write(self.style.WARNING("Skipping empty line in CSV file..."))
                        continue
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
                if include_staff:
                    receivers += list(
                        club.membership_set.filter(
                            role__lte=Membership.ROLE_OFFICER, person__email__isnull=False
                        )
                        .exclude(person__email="")
                        .values_list("person__email", flat=True)
                    )
                receivers = list(set(receivers))
                receivers_str = ", ".join(receivers)
                self.stdout.write(
                    self.style.SUCCESS(f"Sending {action} email for {club.name} to {receivers_str}")
                )
                for receiver in receivers:
                    if not dry_run:
                        if action == "invite":
                            existing_membership = Membership.objects.filter(
                                person__email=receiver, club=club
                            )
                            if not existing_membership.exists():
                                existing_invite = MembershipInvite.objects.filter(
                                    club=club, email=receiver, active=True
                                )
                                if not existing_invite.exists():
                                    invite = MembershipInvite.objects.create(
                                        club=club,
                                        email=receiver,
                                        creator=None,
                                        role=role,
                                        title=role_mapping[role],
                                        auto=True,
                                    )
                                else:
                                    invite = existing_invite.first()
                                if invite.role <= Membership.ROLE_OWNER:
                                    invite.send_owner_invite()
                                else:
                                    invite.send_mail()
                        elif action == "physical_fair":
                            send_fair_email(club, receiver)
                        elif action == "physical_postfair":
                            send_fair_email(club, receiver, template="postfair")

        self.stdout.write(f"Sent {clubs_sent} email(s), {clubs_missing} missing club(s)")
