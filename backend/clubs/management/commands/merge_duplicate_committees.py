import json
import logging
from datetime import datetime

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count

from clubs.models import ApplicationCommittee


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Merges committees with duplicate names within the same application"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run without making any changes",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        audit_log = []

        try:
            with transaction.atomic():
                # Find committees that have the same name within an application
                duplicate_committees = (
                    ApplicationCommittee.objects.values("name", "application")
                    .annotate(count=Count("id"))
                    .filter(count__gt=1)
                )

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

                    # Record the merge operation
                    merge_record = {
                        "timestamp": datetime.now().isoformat(),
                        "primary_committee_id": primary_committee.id,
                        "name": name,
                        "application_id": application_id,
                        "merged_committees": [],
                    }

                    # Merge all other committees into the primary one
                    for committee in committees[1:]:
                        try:
                            # Record the committee being merged
                            committee_record = {
                                "committee_id": committee.id,
                                "questions": list(
                                    committee.applicationquestion_set.values_list(
                                        "id", flat=True
                                    )
                                ),
                            }

                            if not dry_run:
                                # Reassign questions to primary committee
                                questions_moved = (
                                    committee.applicationquestion_set.update(
                                        committees=primary_committee
                                    )
                                )
                                committee.delete()

                                self.stdout.write(
                                    f"Moved {questions_moved} questions from committee "
                                    f"{committee.id} to {primary_committee.id}"
                                )
                            else:
                                self.stdout.write(
                                    f"[DRY RUN] Would move questions from committee "
                                    f"{committee.id} to {primary_committee.id}"
                                )

                            merge_record["merged_committees"].append(committee_record)

                        except Exception as e:
                            self.stdout.write(
                                self.style.ERROR(
                                    f"Failed to merge committee {committee.id} into "
                                    f"{primary_committee.id}: {str(e)}"
                                )
                            )
                            raise

                    audit_log.append(merge_record)

                if dry_run:
                    self.stdout.write(
                        self.style.SUCCESS("Dry run completed - rolling back")
                    )
                    raise Exception("Dry run completed - rolling back")
                else:
                    # Save audit log
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"committee_merge_audit_{timestamp}.json"
                    with open(filename, "w") as f:
                        json.dump(audit_log, f, indent=2)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Merge completed. Audit log saved to {filename}"
                        )
                    )

        except Exception as e:
            if not dry_run:
                self.stdout.write(self.style.ERROR(f"Failed: {str(e)}"))
            raise
