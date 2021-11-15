import numpy as np
from django.core.management.base import BaseCommand
from django.db.models import Q
from openpyxl import Workbook

from clubs.models import ApplicationCommittee, ApplicationSubmission, Badge, Club


class Command(BaseCommand):
    """
    To run this command you need to install `numpy` and `openpyxl` locally, we did not
    add them to the pipenv environment because they are fairly heavy packages
    that are not necessary anywhere else on the site. You can do this by running

        pip install numpy
        pip install openpyxl

    just make sure not to commit the `Pipfile` or `Pipfile.lock` changes to the
    repository.
    """

    help = "Helper to generate Wharton Council Application Analytics."
    web_execute = True

    def handle(self, *args, **kwargs):
        wb = Workbook()
        ws = wb.active

        wc_badge = Badge.objects.filter(label="Wharton Council", purpose="org",).first()
        if wc_badge is None:
            return

        wc_clubs = []
        for club in Club.objects.all():
            if wc_badge in club.badges.all():
                wc_clubs.append(club)

        # insert column names for per club analytics
        ws.append(
            [
                "Club",
                "# Committees",
                "# Applicants",
                "Average # applications per applicant",
                "# Accepted",
                "# Rejected",
                "# Rejected After Written",
                "# Rejected After Interview",
                "Acceptance Rate",
            ]
        )

        # insert per club analytics
        for club in wc_clubs:
            committees = ApplicationCommittee.objects.filter(
                application__club=club
            ).count()
            applicants = ApplicationSubmission.objects.filter(
                application__club=club
            ).distinct("user_id")
            applications = applicants.count()
            applied_to_counts = []
            for applicant in applicants:
                applied_to = ApplicationSubmission.objects.filter(
                    user=applicant.user
                ).distinct("application__club").count()
                applied_to_counts.append(applied_to)
            average_applied = np.mean(applied_to_counts)
            accepted = applicants.filter(status=ApplicationSubmission.ACCEPTED).count()
            rejected_total = applicants.filter(
                ~Q(status=ApplicationSubmission.ACCEPTED)
            ).count()
            rejected_after_written = applicants.filter(
                status=ApplicationSubmission.REJECTED_AFTER_WRITTEN
            ).count()
            rejected_after_interview = applicants.filter(
                status=ApplicationSubmission.REJECTED_AFTER_INTERVIEW
            ).count()
            acceptance_rate = accepted / applications if applications != 0 else 0

            ws.append(
                [
                    club.name,
                    committees,
                    applications,
                    average_applied,
                    accepted,
                    rejected_total,
                    rejected_after_written,
                    rejected_after_interview,
                    acceptance_rate,
                ]
            )

        wb.save("wharton_council_analytics.xlsx")
