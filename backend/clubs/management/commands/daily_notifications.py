from django.core.management.base import BaseCommand

from clubs.models import Club, send_mail_helper


class Command(BaseCommand):
    help = "Script that runs at 9AM each day to send out relevant notification emails."

    def handle(self, *args, **kwargs):
        queued_clubs = Club.objects.filter(active=True, approved=None)
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
