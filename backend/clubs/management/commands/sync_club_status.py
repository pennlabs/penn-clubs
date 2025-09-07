import traceback

from django.core.management.base import BaseCommand

from clubs.models import Club, Status


class Command(BaseCommand):
    help = """Sync club status value to 'inactive' for clubs with active=false and \
        'under review' for clubs in the approval queue"""

    def add_arguments(self, parser):
        parser.add_argument(
            "--clubs",
            dest="club",
            type=str,
            help="If this parameter is specified, then only sync status for the "
            "comma separated list of club codes specified by this argument.",
        )

    def handle(self, *args, **kwargs):
        try:
            self.stdout.write("Starting club status synchronization...")

            # either select all clubs or just some
            if not kwargs["club"]:
                all_clubs = Club.objects.all()
            else:
                club_codes = [code.strip() for code in kwargs["club"].split(",")]
                all_clubs = Club.objects.filter(code__in=club_codes)
                self.stdout.write(f"Processing {all_clubs.count()} specified clubs...")

            # sync inactive status
            inactive_status = Status.objects.get(name="INACTIVE")
            inactive_clubs = all_clubs.filter(active=False)

            self.stdout.write(
                f"Found {inactive_clubs.count()} inactive clubs to update..."
            )

            for club in inactive_clubs:
                club.status = inactive_status
                club.save()

            # sync under review status
            under_review_status = Status.objects.get(name="UNDER REVIEW")
            pending_clubs = all_clubs.filter(active=True, approved=None)

            self.stdout.write(
                f"Found {pending_clubs.count()} clubs in queue to update..."
            )

            for club in pending_clubs:
                club.status = under_review_status
                club.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f"Updated status for {inactive_clubs.count()} inactive clubs and "
                    f"{pending_clubs.count()} pending clubs!"
                )
            )

        except Status.DoesNotExist as e:
            self.stdout.write(self.style.ERROR(f"Required status not found: {str(e)}"))
            self.stdout.write(self.style.ERROR(traceback.format_exc()))
        except Exception as err:
            self.stdout.write(
                self.style.ERROR(
                    f"Error occurred while syncing club status: {str(err)}"
                )
            )
            self.stdout.write(self.style.ERROR(traceback.format_exc()))
