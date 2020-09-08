from django.core.management.base import BaseCommand
from django.utils import timezone

from clubs.models import Club, send_mail_helper


class Command(BaseCommand):
    help = "Script that runs at 9AM each day to send out relevant notification emails."

    def handle(self, *args, **kwargs):
        # send notification to OSA for clubs pending approval
        now = timezone.now()

        # only send notifications if it is currently a weekday
        if now.isoweekday() in range(1, 6):
            queued_clubs = Club.objects.filter(active=True, approved__isnull=True)
            if queued_clubs.exists():
                context = {
                    "num_clubs": queued_clubs.count(),
                    "url": "https://pennclubs.com/renew#Queue",
                }
                send_mail_helper(
                    "osa_queue_reminder",
                    "{} clubs awaiting review on Penn Clubs".format(queued_clubs.count()),
                    ["rodneyr@upenn.edu"],
                    context,
                )
