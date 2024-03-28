import datetime

from django.core.management.base import BaseCommand

from clubs.models import Profile


class Command(BaseCommand):
    help = "Ban or unban everyone from the club rank system."

    def handle(self, *args, **kwargs):
        try:
            queryset = Profile.objects.all()
            ban = args[0] == "ban"
            unban = args[0] == "unban"
            for profile in queryset:
                if ban:
                    # Set time to vote very far in future so that they can't vote
                    profile.time_since_vote = datetime.datetime.now()
                    +datetime.timedelta(days=36500)
                elif unban:
                    # Set time to vote to now so that they can vote
                    profile.time_since_vote = datetime.datetime.now()
                else:
                    self.stdout.write(
                        self.style.ERROR(
                            "Please provide a valid argument: ban or unban."
                        )
                    )
                    return
            Profile.objects.bulk_update(queryset, ["time_since_vote"])

            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully {args[0]}ned everyone from club rank!"
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f"An error was encountered while {args[0]}ning everyone"
                    + "from club rank."
                )
            )
            self.stdout.write(e)
