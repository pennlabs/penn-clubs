from django.core.management.base import BaseCommand
from django.db.models import Count, OuterRef, Q, Subquery

from clubs.models import Club


class Command(BaseCommand):
    help = "Update stored favorite and membership counts."

    def handle(self, *args, **kwargs):
        try:
            favorite_count_subquery = (
                Club.objects.filter(pk=OuterRef("pk"))
                .annotate(count=Count("favorite", distinct=True))
                .values("count")
            )
            membership_count_subquery = (
                Club.objects.filter(pk=OuterRef("pk"))
                .annotate(
                    count=Count("membership", distinct=True, filter=Q(active=True))
                )
                .values("count")
            )

            Club.objects.update(
                favorite_count=Subquery(favorite_count_subquery),
                membership_count=Subquery(membership_count_subquery),
            )

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
