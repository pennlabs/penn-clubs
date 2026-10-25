"""
Approval comments and approval response templates are now edited with a rich
text editor and stored as sanitized HTML. Existing values were written as plain
text, so convert them to the equivalent HTML. Values without line breaks or
HTML special characters already render identically as HTML and are left as is.
"""

import re
from html import unescape

from django.db import migrations
from django.utils.html import escape, linebreaks, strip_tags


BATCH_SIZE = 500

FIELDS = [
    ("Club", "approved_comment"),
    ("HistoricalClub", "approved_comment"),
    ("ClubApprovalResponseTemplate", "content"),
]


def text_to_html(text):
    return linebreaks(escape(text.strip()))


def html_to_text(html):
    text = re.sub(r"<br\s*/?>", "\n", html)
    text = re.sub(r"</p>\s*", "\n\n", text)
    return unescape(strip_tags(text)).strip()


def convert(apps, schema_editor, pattern, func):
    database = schema_editor.connection.alias
    for model_name, field in FIELDS:
        model = apps.get_model("clubs", model_name)
        queryset = (
            model.objects.using(database)
            .filter(**{f"{field}__regex": pattern})
            .only("pk", field)
        )
        batch = []
        for obj in queryset.iterator(chunk_size=BATCH_SIZE):
            setattr(obj, field, func(getattr(obj, field)))
            batch.append(obj)
            if len(batch) >= BATCH_SIZE:
                model.objects.using(database).bulk_update(batch, [field])
                batch = []
        if batch:
            model.objects.using(database).bulk_update(batch, [field])


def forwards(apps, schema_editor):
    convert(apps, schema_editor, r"[\n<>&]", text_to_html)


def backwards(apps, schema_editor):
    convert(apps, schema_editor, r"[<&]", html_to_text)


class Migration(migrations.Migration):
    dependencies = [
        ("clubs", "0143_split_club_reject_permission"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
