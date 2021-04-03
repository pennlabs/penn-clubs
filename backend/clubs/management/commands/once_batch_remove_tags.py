from django.core.management.base import BaseCommand
from django.db.models import Count

from clubs.models import Club, School, StudentType, Year


class Command(BaseCommand):
    help = (
        "Remove target tags from orgs which selected all target tags: "
        "target_year (Degree Type), target_school (Target School), "
        "student_types (Students Type). This script should only be run "
        "once on the Hub@Penn database. This script should be deleted "
        "after it has been run once."
    )
    web_execute = True

    def handle(self, *args, **kwargs):
        target_years_count = Year.objects.count()
        target_schools_count = School.objects.count()
        student_types_count = StudentType.objects.count()

        # clear the many-to-many field if it is connected to all associated objects

        for club in Club.objects.annotate(num_years=Count("target_years")).filter(
            num_years=target_years_count
        ):
            club.target_years.clear()

        for club in Club.objects.annotate(num_schools=Count("target_schools")).filter(
            num_schools=target_schools_count
        ):
            club.target_schools.clear()

        for club in Club.objects.annotate(num_types=Count("student_types")).filter(
            num_types=student_types_count
        ):
            club.student_types.clear()
