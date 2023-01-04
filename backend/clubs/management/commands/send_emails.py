import collections
import csv
import os
import re
import tempfile

import requests
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count, Q
from django.utils import timezone

from clubs.models import (
    ApplicationSubmission,
    Badge,
    Club,
    ClubFair,
    Event,
    Membership,
    MembershipInvite,
    send_mail_helper,
)
from clubs.utils import fuzzy_lookup_club


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

    send_mail_helper(template, "Making the SAC Fair Easier for You", [email], context)


def send_hap_intro_email(email, resources, recipient_string, template="intro"):
    """
    Send the Hub@Penn introduction email given the email and the list of resources.
    """

    send_mail_helper(
        template,
        None,
        [email],
        {"resources": resources, "recipient_string": recipient_string},
    )


def send_wc_intro_email(emails, clubs, recipient_string, template="wc_intro"):
    """
    Send the Hub@Penn introduction email given the email and the list of resources.
    """

    send_mail_helper(
        template, None, emails, {"clubs": clubs, "recipient_string": recipient_string}
    )


class Command(BaseCommand):
    help = "Send out mass email communications for various purposes."
    web_execute = True

    def add_arguments(self, parser):
        parser.add_argument(
            "type",
            type=str,
            help="The type of email to send.",
            choices=(
                "invite",
                "physical_fair",
                "physical_postfair",
                "virtual_fair",
                "urgent_virtual_fair",
                "post_virtual_fair",
                "hap_intro",
                "hap_intro_remind",
                "hap_second_round",
                "hap_partner_communication",
                "wc_intro",
                "osa_email_communication",
                "ics_calendar_ingestation",
                "grad_resource_contact",
                "faq_demo",
                "admin_outreach",
                "semesterly_email",
                "hap_designate_resource",
                "hap_update_resource",
                "wc_feedback",
                "update_status_reminder",
                "keywords_update",
                "update_officers",
            ),
        )
        parser.add_argument(
            "emails",
            nargs="?",
            type=str,
            help="The CSV file with club name to email mapping. First column is club "
            "name and second column is emails. You can also input a URL to a CSV file.",
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
            help="Only send out emails to the clubs and emails "
            "that are listed in the CSV file.",
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
            "--fair",
            type=int,
            help="The id of the club fair to use for fair related emails. "
            "If not specified, uses the closest upcoming activities fair.",
        )
        parser.add_argument(
            "--include-staff",
            dest="include_staff",
            action="store_true",
            help="Include staff members of a club in the email being sent out. "
            "Only applies to certain email types.",
        )
        parser.add_argument(
            "--extra",
            dest="extra",
            action="store_true",
            help="Include extra information in the email template. "
            "Only applies to certain templates.",
        )
        parser.add_argument(
            "--limit",
            dest="limit",
            action="store_true",
            help="Limit the number of emails being sent. "
            "Only applies to certain templates.",
        )
        parser.add_argument(
            "--clubs",
            dest="clubs",
            type=str,
            help="The comma separated list of club codes to send emails to. "
            "Helpful for previewing the email before it is sent.",
        )
        parser.add_argument(
            "--test",
            type=str,
            help="Send all emails to the specified test email "
            "instead of to the actual recipient. "
            "Does not work with all email types.",
        )
        parser.set_defaults(
            extra=False,
            include_staff=False,
            dry_run=False,
            only_sheet=False,
            only_active=True,
            limit=False,
        )

    def handle(self, *args, **kwargs):
        dry_run = kwargs["dry_run"]
        only_sheet = kwargs["only_sheet"]
        action = kwargs["type"]
        verbosity = kwargs["verbosity"]
        include_staff = kwargs["include_staff"]
        role = kwargs["role"]
        role_mapping = {k: v for k, v in Membership.ROLE_CHOICES}

        email_file = kwargs["emails"]
        test_email = kwargs.get("test", None)

        # download file if url
        if email_file is not None and re.match("^https?://", email_file, re.I):
            tf = tempfile.NamedTemporaryFile(delete=False)
            resp = requests.get(email_file)
            tf.write(resp.content)
            self.stdout.write(f"Downloaded '{email_file}' to '{tf.name}'.")
            email_file = tf.name
            tf.close()

        if action == "update_status_reminder":
            wc_badge = Badge.objects.filter(
                label="Wharton Council", purpose="org",
            ).first()
            clubs = Club.objects.filter(badges__in=[wc_badge])
            payloads = []
            for club in clubs:
                emails = (
                    Membership.objects.filter(
                        role__lte=Membership.ROLE_OFFICER, club__active=True, club=club,
                    )
                    .values_list("person__email", flat=True)
                    .distinct()
                )
                applications_url = (
                    f"https://pennclubs.com/club/{club.code}/edit/applications"
                )
                payloads.append((applications_url, emails))
            if test_email is not None:
                payloads = [(payloads[0][0], [test_email])]
            for (applications_url, emails) in payloads:
                for email in emails:
                    if not dry_run:
                        template = "update_status_reminder"
                        send_mail_helper(
                            template,
                            None,
                            [email],
                            {"applications_url": applications_url},
                        )
                        self.stdout.write(f"Sent {action} email to {email}")
                    else:
                        self.stdout.write(f"Would have sent {action} email to {email}")
            return

        # handle Wharton Council feedback email to all centralized applicants
        if action == "wc_feedback":
            emails = (
                ApplicationSubmission.objects.filter(
                    application__is_wharton_council=True
                )
                .values_list("user__email", flat=True)
                .distinct()
            )
            if test_email is not None:
                emails = [test_email]
            for email in emails:
                if not dry_run:
                    template = "wharton_council_feedback"
                    send_mail_helper(template, None, [email], {})
                    self.stdout.write(f"Sent {action} email to {email}")
                else:
                    self.stdout.write(f"Would have sent {action} email to {email}")
            return

        if action == "hap_update_resource":
            emails = (
                Membership.objects.filter(
                    role__lte=Membership.ROLE_OFFICER, club__active=False
                )
                .values_list("person__email", flat=True)
                .distinct()
            )
            if test_email is not None:
                emails = [test_email]
            for email in emails:
                if not dry_run:
                    template = "update_your_penn_resource"
                    send_mail_helper(template, None, [email], {})
                    self.stdout.write(f"Sent {action} email to {email}")
                else:
                    self.stdout.write(f"Would have sent {action} email to {email}")
            return

        # handle custom Hub@Penn intro email
        if action in {
            "hap_intro",
            "hap_intro_remind",
            "hap_second_round",
            "hap_partner_communication",
            "grad_resource_contact",
            "hap_designate_resource",
            "keywords_update",
        }:
            people = collections.defaultdict(dict)

            if action in {
                "hap_partner_communication",
                "hap_designate_resource",
                "keywords_update",
            }:
                emails = (
                    Membership.objects.filter(role__lte=Membership.ROLE_OFFICER)
                    .values_list("person__email", flat=True)
                    .distinct()
                )
                if test_email is not None:
                    emails = [test_email]
                for email in emails:
                    if not dry_run:
                        template = {
                            "hap_partner_communication": "communication_to_partners",
                            "hap_designate_resource": "designate_resource_admin",
                            "hap_update_resource": "update_your_penn_resource",
                            "keywords_update": "keywords_email",
                        }[action]
                        send_mail_helper(template, None, [email], {})
                        self.stdout.write(f"Sent {action} email to {email}")
                    else:
                        self.stdout.write(f"Would have sent {action} email to {email}")
                return

            # read recipients from csv file
            with open(email_file, "r") as f:
                header = [
                    re.sub(r"\W+", "", h.lower().strip().replace(" ", "_"))
                    for h in f.readline().split(",")
                ]
                reader = csv.DictReader(f, fieldnames=header)
                try:
                    for line in reader:
                        name = line["name"].strip()
                        email = line["email"].strip()
                        if "contact" in line:
                            contact = line["contact"].strip()
                        else:
                            contact = ""
                        if test_email is not None:
                            email = test_email
                        if name and email:
                            if email in people.keys():
                                people[email]["resources"].append(name)
                                people[email]["contacts"].append(contact)
                            else:
                                people[email]["resources"] = [name]
                                people[email]["contacts"] = [contact]
                except KeyError as e:
                    raise ValueError(
                        "Ensure the spreadsheet has a header with "
                        "the 'name' and 'email' columns."
                    ) from e

            # send emails grouped by recipients
            for email, context in people.items():
                contacts = list(set(context["contacts"]))  # No duplicate names
                contacts = list(
                    filter(lambda x: x != "", contacts)
                )  # No empty string names
                if len(contacts) == 0:
                    contacts.append("Staff member")

                # Format names in comma separated form
                recipient_string = ", ".join(contacts)

                resources = context["resources"]
                if not dry_run:
                    send_hap_intro_email(
                        email,
                        resources,
                        recipient_string,
                        template={
                            "hap_intro": "intro",
                            "hap_intro_remind": "intro_remind",
                            "hap_second_round": "second_round",
                            "wc_intro": "wc_intro",
                            "grad_resource_contact": "grad_resource_contact",
                        }[action],
                    )
                    self.stdout.write(
                        f"Sent {action} email to {email} (recipients: "
                        + f"{recipient_string}) for groups: {resources}"
                    )
                else:
                    self.stdout.write(
                        f"Would have sent {action} email to {email} (recipients: "
                        + f"{recipient_string}) for groups: {resources}"
                    )
            self.stdout.write(f"Sent out {len(people)} emails!")
            return

        if action in {"wc_intro"}:
            people = collections.defaultdict(dict)

            # read recipients from csv file
            with open(email_file, "r") as f:
                header = [
                    re.sub(r"\W+", "", h.lower().strip().replace(" ", "_"))
                    for h in f.readline().split(",")
                ]
                reader = csv.DictReader(f, fieldnames=header)
                try:
                    for line in reader:
                        name = line["name"].strip()
                        email = line["email"].strip()
                        contact = line["contact"].strip()
                        if test_email is not None:
                            email = test_email
                        if name in people.keys():
                            people[name]["emails"].append(email)
                            people[name]["contacts"].append(contact)
                        else:
                            people[name]["emails"] = [email]
                            people[name]["contacts"] = [contact]
                except KeyError as e:
                    raise ValueError(
                        "Ensure the spreadsheet has a header with "
                        "the 'name' and 'email' columns."
                    ) from e

            # send emails grouped by recipients
            for name, context in people.items():
                emails = list(set(context["emails"]))  # No duplicate names
                contacts = list(set(context["contacts"]))  # No duplicate names
                contacts = list(
                    filter(lambda x: x != "", contacts)
                )  # No empty string names
                if len(contacts) == 0:
                    contacts.append("Staff member")

                # Format names in comma separated form
                recipient_string = ", ".join(contacts)

                clubs = [name]
                if not dry_run:
                    send_wc_intro_email(
                        emails,
                        clubs,
                        recipient_string,
                        template={"wc_intro": "wc_intro"}[action],
                    )
                    self.stdout.write(
                        f"Sent {action} email to {email} (recipients: "
                        + f"{recipient_string}) for groups: {clubs}"
                    )
                else:
                    self.stdout.write(
                        f"Would have sent {action} email to {email} (recipients: "
                        + f"{recipient_string}) for groups: {clubs}"
                    )
            return

        # Sends email to all club officers
        if action in {
            "osa_email_communication",
            "ics_calendar_ingestation",
            "faq_demo",
            "admin_outreach",
            "semesterly_email",
            "update_officers",
        }:
            clubs = Club.objects.all()
            attachment = None
            context = None

            if action == "admin_outreach":
                path = os.path.join(
                    settings.BASE_DIR, "templates", "fyh_emails", "one_pager.docx"
                )
                attachment = {
                    "filename": "Hub@Penn One-Pager",
                    "path": path,
                }

            # Only send one email if it is a test email
            if test_email is not None:
                clubs = clubs[:1]

            for club in clubs:
                if action == "semesterly_email":
                    context = {"code": club.code}
                elif action == "update_officers":
                    context = {
                        "name": club.name,
                        "url": f"https://pennclubs.com/club/{club.code}/edit/member",
                    }
                emails = club.get_officer_emails()
                if test_email is not None:
                    emails = [test_email]

                if not dry_run:
                    send_mail_helper(
                        action, None, emails, context, attachment=attachment
                    )
                    self.stdout.write(
                        f"Sent {action} email to {emails} for club {club}"
                    )
                else:
                    self.stdout.write(
                        f"Would have sent {action} email to {emails} for club {club}"
                    )
            return

        # get club allowlist
        clubs_allowlist = [
            club.strip() for club in (kwargs.get("clubs") or "").split(",")
        ]
        clubs_allowlist = [club for club in clubs_allowlist if club]

        found_allowlist = set(
            Club.objects.filter(code__in=clubs_allowlist).values_list("code", flat=True)
        )
        missing = set(clubs_allowlist) - found_allowlist
        if missing:
            raise CommandError(f"Invalid club codes in clubs parameter: {missing}")

        # load fair
        now = timezone.now()
        if action in {"virtual_fair", "urgent_virtual_fair", "post_virtual_fair"}:
            fair_id = kwargs.get("fair")
            if fair_id is not None:
                fair = ClubFair.objects.get(id=fair_id)
            else:
                fair = (
                    ClubFair.objects.filter(end_time__gte=now)
                    .order_by("start_time")
                    .first()
                )
            if fair is None:
                raise CommandError("Could not find an upcoming activities fair!")

        # handle sending out virtual fair emails
        if action == "virtual_fair":
            clubs = fair.participating_clubs.all()
            if clubs_allowlist:
                self.stdout.write(f"Using clubs allowlist: {clubs_allowlist}")
                clubs = clubs.filter(code__in=clubs_allowlist)
            self.stdout.write(
                f"Found {clubs.count()} clubs participating in the {fair.name} fair."
            )
            extra = kwargs.get("extra", False)
            limit = kwargs.get("limit", False)
            self.stdout.write(f"Extra flag status: {extra}")
            for club in clubs:
                emails = [test_email] if test_email else None
                emails_disp = emails or "officers"
                if limit:
                    if club.events.filter(
                        ~Q(url="") & ~Q(url__isnull=True),
                        start_time__gte=now,
                        type=Event.FAIR,
                    ).exists():
                        self.stdout.write(
                            f"Skipping {club.name}, fair event already set up."
                        )
                        continue
                if not dry_run:
                    status = club.send_virtual_fair_email(
                        fair=fair, emails=emails, extra=extra
                    )
                    self.stdout.write(
                        "Sent virtual fair email to "
                        f"{club.name} ({emails_disp})... -> {status}"
                    )
                else:
                    self.stdout.write(
                        "Would have sent virtual fair email to "
                        f"{club.name} ({emails_disp})..."
                    )
            return
        elif action == "urgent_virtual_fair":
            clubs = fair.participating_clubs.filter(
                Q(events__url="") | Q(events__url__isnull=True),
                events__type=Event.FAIR,
                events__start_time__gte=fair.start_time,
                events__end_time__lte=fair.end_time,
            )
            if clubs_allowlist:
                self.stdout.write(f"Using clubs allowlist: {clubs_allowlist}")
                clubs = clubs.filter(code__in=clubs_allowlist)

            self.stdout.write(
                f"{clubs.count()} clubs have not registered for the {fair.name}."
            )
            extra = kwargs.get("extra", False)
            for club in clubs.distinct():
                emails = [test_email] if test_email else None
                emails_disp = emails or "officers"
                if not dry_run:
                    self.stdout.write(
                        "Sending fair urgent reminder for "
                        f"{club.name} to {emails_disp}..."
                    )
                    club.send_virtual_fair_email(
                        email="urgent", fair=fair, extra=extra, emails=emails
                    )
                else:
                    self.stdout.write(
                        "Would have sent fair urgent reminder for "
                        f"{club.name} to {emails_disp}..."
                    )

            # don't continue
            return
        elif action == "post_virtual_fair":
            clubs = fair.participating_clubs.filter(
                events__type=Event.FAIR,
                events__start_time__gte=fair.start_time,
                events__end_time__lte=fair.end_time,
            )
            if clubs_allowlist:
                clubs = clubs.filter(code__in=clubs_allowlist)

            self.stdout.write(
                f"{clubs.count()} post fair emails to send to participants."
            )
            for club in clubs.distinct():
                self.stdout.write(f"Sending post fair reminder to {club.name}...")
                if not dry_run:
                    club.send_virtual_fair_email(email="post")

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
                    filter=Q(
                        membershipinvite__role__lte=Membership.ROLE_OWNER, active=True
                    ),
                ),
            ).filter(owner_count=0, invite_count=0)
            self.stdout.write(f"Found {clubs.count()} active club(s) without owners.")

        if kwargs["only_active"]:
            clubs = clubs.filter(active=True)

        if clubs_allowlist:
            clubs = clubs.filter(code__in=clubs_allowlist)

        clubs_missing = 0
        clubs_sent = 0

        # parse CSV file
        emails = {}

        # verify email file
        if email_file is not None:
            if not os.path.isfile(email_file):
                raise CommandError(f'Email file "{email_file}" does not exist!')
        elif only_sheet:
            raise CommandError(
                "Cannot specify only sheet option without an email file!"
            )
        else:
            self.stdout.write(
                self.style.WARNING("No email spreadsheet file specified!")
            )

        # load email file
        if email_file is not None:
            with open(email_file, "r") as f:
                reader = csv.reader(f)
                for line in reader:
                    if not line:
                        self.stdout.write(
                            self.style.WARNING("Skipping empty line in CSV file...")
                        )
                        continue
                    raw_name = line[0].strip()
                    club = fuzzy_lookup_club(raw_name)

                    if club is not None:
                        if verbosity >= 2:
                            self.stdout.write(
                                f"Mapped {raw_name} -> {club.name} ({club.code})"
                            )
                        clubs_sent += 1
                        emails[club.id] = [x.strip() for x in line[1].split(",")]
                    else:
                        clubs_missing += 1
                        self.stdout.write(
                            self.style.WARNING(
                                f"Could not find club matching {raw_name}!"
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
                if include_staff:
                    receivers += list(
                        club.membership_set.filter(
                            role__lte=Membership.ROLE_OFFICER,
                            person__email__isnull=False,
                        )
                        .exclude(person__email="")
                        .values_list("person__email", flat=True)
                    )
                receivers = list(set(receivers))
                receivers_str = ", ".join(receivers)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Sending {action} email for {club.name} to {receivers_str}"
                    )
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

        self.stdout.write(
            f"Sent {clubs_sent} email(s), {clubs_missing} missing club(s)"
        )
