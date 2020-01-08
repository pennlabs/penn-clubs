from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string

from clubs.models import Club


def send_reminder_to_club(club):
    if club.email:
        receivers = [club.email]
        domain = 'pennclubs.com'
        context = {
            'name': club.name,
            'url': settings.EDIT_URL.format(domain=domain, club=club.code)
        }

        text_content = render_to_string('emails/remind.txt', context)
        html_content = render_to_string('emails/remind.html', context)

        for receiver in receivers:
            msg = EmailMultiAlternatives(
                "Reminder to Update Your Club's Page",
                text_content,
                settings.FROM_EMAIL,
                receivers
            )
            msg.attach_alternative(html_content, 'text/html')
            msg.send(fail_silently=False)
        return True
    return False


class Command(BaseCommand):
    help = 'Remind clubs to update their information on Penn Clubs.'

    def handle(self, *args, **kwargs):
        clubs = Club.objects.exclude(email__isnull=True).filter(active=True).order_by('code')
        self.stdout.write('Found {} active club(s) to send out email invites.'.format(clubs.count()))

        for club in clubs:
            if send_reminder_to_club(club):
                self.stdout.write(
                    self.style.SUCCESS('Sent {} reminder to {}'.format(club.name, club.email))
                )
            else:
                self.stdout.write(
                    'Skipping {} reminder, no contact email set'.format(club.name)
                )
