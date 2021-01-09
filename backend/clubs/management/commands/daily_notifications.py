import collections
import datetime

from django.conf import settings
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand
from django.utils import timezone

from clubs.models import Club, ClubApplication, send_mail_helper


class Command(BaseCommand):
    help = (
        "This script runs each morning to send out relevant notification emails."
        "To avoid duplicate emails, this script should be executed at most once per day."
    )
    web_execute = True

    def handle(self, *args, **kwargs):
        self.send_approval_queue_reminder()
        self.send_application_notifications()

    def send_application_notifications(self):
        """
        Send notifications about application deadlines three days before the deadline, for students
        that have subscribed to those organizations.
        """
        now = timezone.now() + datetime.timedelta(days=3)
        apps = ClubApplication.objects.filter(application_end_time__date=now.date()).values_list(
            "club__code", "club__name", "club__favorite__person__email"
        )
        emails = collections.defaultdict(list)
        for code, name, email in apps:
            emails[email].append((code, name))

        for email, data in emails.values():
            context = {"clubs": data}
            send_mail_helper(
                "application_deadline_reminder",
                f"{len(data)} club(s) have application deadlines approaching",
                [email],
                context,
            )

    def send_approval_queue_reminder(self):
        """
        Send notification to approval authority for clubs awaiting approval.
        """
        now = timezone.now()
        group_name = "Approvers"

        # only send notifications if it is currently a weekday
        if now.isoweekday() not in range(1, 6):
            return False

        # get users in group to send notification to
        group = Group.objects.filter(name=group_name).first()
        if group is None:
            self.stdout.write(
                self.style.WARNING(
                    f"There is no Django admin group named '{group_name}' in the database. "
                    "Cannot send out approval queue notification emails!"
                )
            )
            return False

        emails = list(group.user_set.all().values_list("email", flat=True))

        if not emails:
            self.stdout.write(
                self.style.WARNING(
                    f"There are no users in the '{group_name}' group. No emails will be sent out."
                )
            )
            return False

        # get clubs that need approval
        queued_clubs = Club.objects.filter(active=True, approved__isnull=True)
        if queued_clubs.exists():
            context = {
                "num_clubs": queued_clubs.count(),
                "url": f"https://{settings.DOMAIN}/renew#Queue",
            }
            count = queued_clubs.count()
            send_mail_helper(
                "approval_queue_reminder",
                "{} clubs awaiting review on {}".format(count, settings.BRANDING_SITE_NAME),
                emails,
                context,
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Sent approval queue reminder for {count} clubs to {', '.join(emails)}"
                )
            )

        return True
