"""
Migration 0144_approval_comment_html was applied twice in production because
multiple pods ran migrate concurrently on deploy. The second run escaped the
HTML produced by the first, so approval comments and approval response
templates show literal tags such as "<p>&lt;p&gt;...".

This command undoes exactly one layer of that conversion using the inverse
function from the migration itself.

This is a one-off command. Delete it once it has been run in production.
"""

import importlib

from django.core.management.base import BaseCommand
from django.db import transaction

from clubs.models import Club, ClubApprovalResponseTemplate


migration = importlib.import_module("clubs.migrations.0144_approval_comment_html")

# the first run always produces a value starting with <p>, so the second run
# always produces a value starting with an escaped <p> inside a real one
DOUBLE_ENCODED_PREFIX = "<p>&lt;p&gt;"

FIELDS = [
    (Club, "approved_comment"),
    (Club.history.model, "approved_comment"),
    (ClubApprovalResponseTemplate, "content"),
]


class Command(BaseCommand):
    help = (
        "Fix approval comments and approval response templates that were "
        "HTML-encoded twice by migration 0144. Runs as a dry run unless "
        "--commit is passed."
    )
    web_execute = True

    def add_arguments(self, parser):
        parser.add_argument(
            "--commit",
            action="store_true",
            help="Save the fixed values. Without this, only print what would change.",
        )

    def handle(self, *args, **options):
        commit = options["commit"]
        prefix = "" if commit else "[DRY RUN] "

        with transaction.atomic():
            for model, field in FIELDS:
                queryset = model.objects.filter(
                    **{f"{field}__startswith": DOUBLE_ENCODED_PREFIX}
                ).only("pk", field)
                count = 0
                for obj in queryset.iterator():
                    old = getattr(obj, field)
                    new = migration.html_to_text(old)
                    self.stdout.write(
                        f"{prefix}{model.__name__} {obj.pk} {field}:\n"
                        f"  before: {old!r}\n"
                        f"  after:  {new!r}"
                    )
                    if commit:
                        # update() skips save() side effects and history records
                        model.objects.filter(pk=obj.pk).update(**{field: new})
                    count += 1
                verb = "Fixed" if commit else "Would fix"
                self.stdout.write(
                    f"{prefix}{verb} {count} {model.__name__}.{field} value(s)\n"
                )
