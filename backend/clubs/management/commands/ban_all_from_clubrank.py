import datetime

from django.core.management.base import BaseCommand

from clubs.models import Profile


class Command(BaseCommand):
    help = "Ban or unban everyone from the club rank system."

    def handle(self, *args, **kwargs):
        try:
            queryset = Profile.objects.all()
            ban = kwargs.get("ban", False)
            for profile in queryset:
                if ban:
                    # Set time to vote very far in future so that they can't vote
                    profile.time_since_vote = datetime.datetime.now()
                    +datetime.timedelta(days=36500)
                else:
                    # Set time to vote to now so that they can vote
                    profile.time_since_vote = datetime.datetime.now()
            Profile.objects.bulk_update(queryset, ["time_since_vote"])

            self.stdout.write(
                self.style.SUCCESS("Successfully un/banned everyone from club rank!")
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    "An error was encountered while un/banning everyone from club rank."
                )
            )
            self.stdout.write(e)
