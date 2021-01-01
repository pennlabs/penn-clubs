from django.conf import settings
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand
from django.utils import timezone

from clubs.models import Club, send_mail_helper


class Command(BaseCommand):
    help = "Script that runs at 9AM each day to send out relevant notification emails."
    web_execute = True

    def handle(self, *args, **kwargs):
        # send notification to OSA for clubs pending approval
        now = timezone.now()

        # only send notifications if it is currently a weekday
        if now.isoweekday() in range(1, 6):
            # get users in group to send notification to
            group = Group.objects.filter(name="Approvers").first()
            if group is not None:
                emails = list(group.user_set.all().values_list("email", flat=True))

                # get clubs that need approval
                queued_clubs = Club.objects.filter(active=True, approved__isnull=True)
                if queued_clubs.exists():
                    context = {
                        "num_clubs": queued_clubs.count(),
                        "url": "https://pennclubs.com/renew#Queue",
                    }
                    send_mail_helper(
                        "approval_queue_reminder",
                        "{} clubs awaiting review on {}".format(
                            queued_clubs.count(), settings.BRANDING_SITE_NAME
                        ),
                        emails,
                        context,
                    )
