import traceback

from django.core.management.base import BaseCommand

from clubs.models import Club, Status


class Command(BaseCommand):
    help = """Sync club status value to 'inactive' for clubs with active=false and \
        'under review' for clubs in the approval queue"""

    def handle(self, *args, **kwargs):
        try:
            self.stdout.write("Starting club status synchronization...")

            # sync inactive status
            inactive_status = Status.objects.get(name="INACTIVE")
            inactive_clubs = Club.objects.filter(active=False)

            self.stdout.write(
                f"Found {inactive_clubs.count()} inactive clubs to update..."
            )

            for club in inactive_clubs:
                club.status = inactive_status
                club.save()

            # sync under review status
            under_review_status = Status.objects.get(name="UNDER REVIEW")
            pending_clubs = Club.objects.filter(active=True, approved=None)

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
