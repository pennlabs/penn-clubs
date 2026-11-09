"""
Migration 0144_approval_comment_html was applied more than once in production
because multiple pods ran migrate concurrently on deploy. Each extra run
escaped the HTML produced by the previous one, so approval comments and
approval response templates show literal tags such as "<p>&lt;p&gt;...".
Some values were encoded three times, not just twice.

This command undoes every extra layer of that conversion, using the inverse
function from the migration itself, until one layer of real HTML remains.

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


def undo_extra_encodings(value):
    """
    Decode one layer at a time until the value no longer looks double-encoded,
    leaving the single layer of HTML that one migration run would produce.
    Returns the decoded value and the number of layers removed.
    """
    layers = 0
    while value.startswith(DOUBLE_ENCODED_PREFIX):
        value = migration.html_to_text(value)
        layers += 1
    return value, layers


FIELDS = [
    (Club, "approved_comment"),
    (Club.history.model, "approved_comment"),
    (ClubApprovalResponseTemplate, "content"),
]


class Command(BaseCommand):
    help = (
        "Fix approval comments and approval response templates that were "
        "HTML-encoded more than once by migration 0144. Runs as a dry run unless "
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
                    new, layers = undo_extra_encodings(old)
                    self.stdout.write(
                        f"{prefix}{model.__name__} {obj.pk} {field} "
                        f"({layers} extra layer(s)):\n"
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
