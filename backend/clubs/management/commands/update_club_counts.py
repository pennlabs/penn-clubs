from django.core.management.base import BaseCommand
from django.db.models import Count, Q

from clubs.models import Club


class Command(BaseCommand):
    help = "Update stored favorite and membership counts."

    def handle(self, *args, **kwargs):
        try:
            queryset = Club.objects.all().annotate(
                temp_favorite_count=Count("favorite", distinct=True),
                temp_membership_count=Count(
                    "membership", distinct=True, filter=Q(active=True)
                ),
            )

            for club in queryset:
                club.favorite_count = club.temp_favorite_count
                club.membership_count = club.temp_membership_count
            Club.objects.bulk_update(queryset, ["favorite_count", "membership_count"])

            self.stdout.write(
                self.style.SUCCESS(
                    "Successfully updated all club favorite and membership counts!"
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    "An error was encountered while updating"
                    + "club favorite and membership counts!"
                )
            )
            self.stdout.write(e)
