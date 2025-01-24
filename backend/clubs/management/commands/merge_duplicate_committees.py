from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count

from clubs.models import ApplicationCommittee, ApplicationSubmission


class Command(BaseCommand):
    help = "Merges committees with duplicate names within the same application"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            help="Run without making any changes",
        )
        parser.set_defaults(dry_run=False)

    def handle(self, *args, **kwargs):
        dry_run = kwargs["dry_run"]
        if dry_run:
            self.stdout.write("Running in dry run mode, no changes will be made.")

        try:
            with transaction.atomic():
                # Find committees that have the same name within an application
                duplicate_committees = (
                    ApplicationCommittee.objects.values("name", "application")
                    .annotate(count=Count("id"))
                    .filter(count__gt=1)
                )

                total_merged = 0
                for duplicate in duplicate_committees:
                    name = duplicate["name"]
                    application_id = duplicate["application"]

                    committees = ApplicationCommittee.objects.filter(
                        name=name, application=application_id
                    ).order_by("id")

                    primary_committee = committees.first()
                    if not primary_committee:
                        continue

                    self.stdout.write(
                        f"Processing duplicate committees with name '{name}' "
                        f"in application {application_id}"
                    )

                    # Merge all other committees into the primary one
                    for committee in committees[1:]:
                        try:
                            if not dry_run:
                                # Update ApplicationSubmission foreign keys
                                submissions_moved = (
                                    ApplicationSubmission.objects.filter(
                                        committee=committee
                                    ).update(committee=primary_committee)
                                )

                                # Move M2M relationships from ApplicationQuestion
                                for question in committee.applicationquestion_set.all():
                                    question.committees.remove(committee)
                                    question.committees.add(primary_committee)

                                # Delete the duplicate committee (ClubApplication
                                # relation will be handled automatically by Django)
                                committee.delete()

                                self.stdout.write(
                                    f"Moved {submissions_moved} submissions and "
                                    f"updated questions from committee {committee.id} "
                                    f"to {primary_committee.id}"
                                )
                                total_merged += 1
                            else:
                                submission_count = ApplicationSubmission.objects.filter(
                                    committee=committee
                                ).count()
                                question_count = (
                                    committee.applicationquestion_set.count()
                                )

                                self.stdout.write(
                                    f"[DRY RUN] Would move {submission_count} "
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
                    self.stdout.write("Dry run completed - rolling back")
                    return

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Successfully merged {total_merged} duplicate committees"
                    )
                )

        except Exception as e:
            self.stderr.write(
                self.style.ERROR(
                    f"{'DRY RUN ' if dry_run else ''}Error merging committees: {str(e)}"
                )
            )
