from django.conf import settings
from django.core.management.base import BaseCommand

from clubs.models import Club, Membership, MembershipInvite, send_mail_helper


def send_reminder_to_club(club):
    """
    Sends an email reminder to clubs to update their information.
    """
    receivers = None
    staff = club.members.filter(membership__role__lte=Membership.ROLE_OFFICER)

    # calculate email recipients
    if staff.exists():
        # if there are staff members that can edit the page,
        # send the update email to them
        receivers = list(staff.values_list("email", flat=True))
    elif club.email:
        invites = club.membershipinvite_set.filter(
            active=True, role__lte=Membership.ROLE_OFFICER
        )
        if invites.exists():
            # if there are existing invites, resend the invite emails
            for invite in invites:
                if invite.role <= Membership.ROLE_OWNER:
                    invite.send_owner_invite()
                else:
                    invite.send_mail()
            return True
        else:
            # if there are no owner-level invites or members,
            # create and send an owner invite
            if club.email:
                invite = MembershipInvite.objects.create(
                    club=club,
                    email=club.email,
                    creator=None,
                    role=Membership.ROLE_OWNER,
                    title="Owner",
                    auto=True,
                )
                invite.send_owner_invite()
                return True
            else:
                return False

    # send email if recipients exist
    if receivers is not None:
        domain = settings.DEFAULT_DOMAIN
        context = {
            "name": club.name,
            "url": settings.EDIT_URL.format(domain=domain, club=club.code),
            "view_url": settings.VIEW_URL.format(domain=domain, club=club.code),
        }

        send_mail_helper(
            "remind", "Reminder to Update Your Club's Page", receivers, context
        )
        return True
    return False


class Command(BaseCommand):
    help = "Remind clubs to update their information on Penn Clubs."

    def handle(self, *args, **kwargs):
        clubs = (
            Club.objects.exclude(email__isnull=True)
            .filter(active=True)
            .order_by("code")
        )
        self.stdout.write(
            "Found {} active club(s) to send out email invites.".format(clubs.count())
        )

        for club in clubs:
            if send_reminder_to_club(club):
                self.stdout.write(
                    self.style.SUCCESS(
                        "Sent {} reminder to {}".format(club.name, club.email)
                    )
                )
            else:
                self.stdout.write(
                    "Skipping {} reminder, no contact email set".format(club.name)
                )
