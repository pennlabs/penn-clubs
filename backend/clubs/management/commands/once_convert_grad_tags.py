from django.core.management.base import BaseCommand

from clubs.models import Club, Tag, Year


class Command(BaseCommand):
    help = (
        "Convert the Undergraduate and Graduate "
        "tags in Hub@Penn into school year (aka degree types). "
        "This script should only be run once on the Hub@Penn database. "
        "This script should be deleted after it has been run once. "
    )
    web_execute = True

    def handle(self, *args, **kwargs):
        ugrad, _ = Year.objects.get_or_create(name="Undergraduate")
        grad, _ = Year.objects.get_or_create(name="Graduate/Professional")

        for club in Club.objects.exclude(tags__name="Graduate").filter(
            tags__name="Undergraduate"
        ):
            club.target_years.add(ugrad)
            self.stdout.write(f"Converted undergraduate club: {club.name}")

        for club in Club.objects.exclude(tags__name="Undergraduate").filter(
            tags__name="Graduate"
        ):
            club.target_years.add(grad)
            self.stdout.write(f"Converted graduate club: {club.name}")

        Tag.objects.filter(name__in=["Undergraduate", "Graduate"]).delete()
