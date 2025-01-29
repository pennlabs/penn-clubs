from django.core.management.base import BaseCommand
from django.db import models, transaction
from django.db.models import Count

from clubs.models import ApplicationCommittee


class Command(BaseCommand):
    help = "Merges committees with duplicate names within the same application"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run without making any changes",
        )
        parser.add_argument(
            "--club",
            help="Only merge committees for this club code",
        )
        parser.set_defaults(dry_run=True, club=None)

    def handle(self, *args, **kwargs):
        dry_run = kwargs["dry_run"]
        club_code = kwargs["club"]

        if dry_run:
            self.stdout.write("Running in dry run mode, no changes will be made.")

        try:
            with transaction.atomic():
                # Find committees that have the same name within an application
                committees_query = ApplicationCommittee.objects.annotate(
                    normalized_name=models.functions.Lower(
                        models.functions.Trim("name")
                    )
                ).values("normalized_name", "application")
                if club_code is not None:
                    committees_query = committees_query.filter(
                        application__club__code=club_code
                    )

                duplicate_committees = committees_query.annotate(
                    count=Count("id")
                ).filter(count__gt=1)

                total_merged = 0
                for duplicate in duplicate_committees:
                    normalized_name = duplicate["normalized_name"]
                    application_id = duplicate["application"]

                    committees = (
                        ApplicationCommittee.objects.filter(application=application_id)
                        .annotate(
                            normalized_name=models.functions.Lower(
                                models.functions.Trim("name")
                            )
                        )
                        .filter(normalized_name=normalized_name)
                        .order_by("id")
                    )

                    primary_committee = committees.first()
                    if not primary_committee:
                        continue

                    self.stdout.write(
                        f"Processing duplicate committees with name "
                        f"'{normalized_name}' in application {application_id}"
                    )

                    # Merge all other committees into the primary one
                    for committee in committees[1:]:
                        try:
                            if not dry_run:
                                submissions_moved = 0
                                for submission in committee.submissions.all():
                                    submission.committee = primary_committee
                                    submission.save()
                                    submissions_moved += 1

                                for question in committee.applicationquestion_set.all():
                                    question.committees.remove(committee)
                                    question.committees.add(primary_committee)

                                committee.delete()

                                self.stdout.write(
                                    f"Moved {submissions_moved} submissions and "
                                    f"updated questions from committee {committee.id} "
                                    f"to {primary_committee.id}"
                                )
                                total_merged += 1
                            else:
                                submission_count = committee.submissions.count()
                                question_count = (
                                    committee.applicationquestion_set.count()
                                )

                                self.stdout.write(
                                    f"Would move {submission_count} "
                                    f"submissions and update {question_count} "
                                    f"questions from committee {committee.id} to "
                                    f"{primary_committee.id}"
                                )

                        except Exception as e:
                            self.stderr.write(
                                self.style.ERROR(
                                    f"Failed to merge committee {committee.id} into "
                                    f"{primary_committee.id}: {str(e)}"
                                )
                            )
                            raise

                if dry_run:
                    return

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Successfully merged {total_merged} duplicate committees"
                    )
                )

        except Exception as e:
            self.stderr.write(
                self.style.ERROR(f"{'(Dry run) ' if dry_run else ''}Error: {str(e)}")
            )
