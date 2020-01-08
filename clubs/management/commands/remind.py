from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string

from clubs.models import Club


class Command(BaseCommand):
    help = 'Remind clubs to update their information on Penn Clubs.'

    def handle(self, *args, **kwargs):
        clubs = Club.objects.filter(active=True)
        self.stdout.write('Found {} active club(s) to send out email invites.'.format(clubs.count()))

        for club in clubs:
            if club.email:
                receivers = [club.email]
                self.stdout.write(
                    self.style.SUCCESS('Sending {} reminder to {}'.format(club.name, ', '.join(receivers)))
                )
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
