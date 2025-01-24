import logging

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count

from clubs.models import ApplicationCommittee


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Merges committees with duplicate names within the same application"
    web_execute = True

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run without making any changes",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

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

                    logger.info(
                        f"Processing duplicate committees with name '{name}' "
                        f"in application {application_id}"
                    )

                    # Merge all other committees into the primary one
                    for committee in committees[1:]:
                        try:
                            if not dry_run:
                                # Reassign questions to primary committee
                                questions_moved = (
                                    committee.applicationquestion_set.update(
                                        committees=primary_committee
                                    )
                                )
                                committee.delete()

                                logger.info(
                                    f"Moved {questions_moved} questions from committee "
                                    f"{committee.id} to {primary_committee.id}"
                                )
                            else:
                                logger.info(
                                    f"[DRY RUN] Would move questions from committee "
                                    f"{committee.id} to {primary_committee.id}"
                                )

                        except Exception as e:
                            logger.error(
                                f"Failed to merge committee {committee.id} into "
                                f"{primary_committee.id}: {str(e)}"
                            )
                            raise

                if dry_run:
                    logger.info("Dry run completed - rolling back")
                    raise Exception("Dry run completed - rolling back")
                else:
                    logger.info("Successfully merged duplicate committees")

        except Exception as e:
            if not dry_run:
                logger.error(f"Failed: {str(e)}")
            raise
