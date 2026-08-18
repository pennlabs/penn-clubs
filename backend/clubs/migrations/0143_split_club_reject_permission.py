"""
OSA has more reviewers helping clear the backlog of pending clubs, but they
should only be able to reject clubs, not approve them (final approval stays
with existing OSA administrators).

This migration splits the "approve_club" permission by introducing a
dedicated "reject_club" permission. Existing "approve_club" holders are
granted "reject_club" as well so their access is unchanged, and the
"Reviewers (OSA)" group (added in 0142) is granted "reject_club" so they can
now reject pending clubs, without gaining the ability to approve them.
"""

from django.conf import settings
from django.db import migrations


REVIEWER_GROUP_NAME = "Reviewers (OSA)"


def grant_reject_permission(apps, schema_editor):
    ContentType = apps.get_model("contenttypes", "ContentType")
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    User = apps.get_model(*settings.AUTH_USER_MODEL.split("."))
    database = schema_editor.connection.alias

    club_content_type, _ = ContentType.objects.using(database).get_or_create(
        app_label="clubs", model="club"
    )
    # update_or_create rather than get_or_create: Django only ever creates
    # missing permissions, so the label on an already-existing row is never
    # refreshed from the model. approve_club exists on every deployed database
    # already, and its label needs to say that it grants rejection too.
    reject_club, _ = Permission.objects.using(database).update_or_create(
        content_type=club_content_type,
        codename="reject_club",
        defaults={"name": "Can reject pending clubs (cannot approve)"},
    )
    approve_club, _ = Permission.objects.using(database).update_or_create(
        content_type=club_content_type,
        codename="approve_club",
        defaults={"name": "Can approve and reject pending clubs"},
    )

    # groups and users with approve_club keep the ability to reject clubs
    for group in Group.objects.using(database).filter(permissions=approve_club):
        group.permissions.add(reject_club)

    for user in User.objects.using(database).filter(user_permissions=approve_club):
        user.user_permissions.add(reject_club)

    # reviewers can now reject pending clubs, but still cannot approve them
    reviewer_group, _ = Group.objects.using(database).get_or_create(
        name=REVIEWER_GROUP_NAME
    )
    reviewer_group.permissions.add(reject_club)


class Migration(migrations.Migration):
    dependencies = [
        ("clubs", "0142_create_osa_reviewers_group"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="club",
            options={
                "ordering": ["name"],
                "permissions": [
                    ("approve_club", "Can approve and reject pending clubs"),
                    ("reject_club", "Can reject pending clubs (cannot approve)"),
                    (
                        "see_pending_clubs",
                        "View pending clubs that are not one's own",
                    ),
                    (
                        "see_fair_status",
                        "See whether or not a club has registered for the SAC fair",
                    ),
                    ("manage_club", "Manipulate club object and related objects"),
                    ("run_management_scripts", "Can run management scripts"),
                    ("send_club_email_blast", "Can send club email blasts"),
                    (
                        "manage_registration_queue",
                        "Can manage registration queue settings",
                    ),
                ],
            },
        ),
        migrations.RunPython(grant_reject_permission, migrations.RunPython.noop),
    ]
