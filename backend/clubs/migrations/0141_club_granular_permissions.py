"""
OSA wants to grant elevated access to some personels on Penn Clubs.
This groups request elevated permissions includes:
 - See pending clubs, but cannot approve/reject
 - Generate reports
 - Admin notes

Currently manage_club permission has powers to give access to move of these, but
give too much access and does not allow for granular control. This migration thins the
access level of manage_club by introducing the following new permissions:
 - run_management_scripts: Can run management scripts
 - send_club_email_blast: Can send club email blasts
 - manage_registration_queue: Can manage registration queue settings
 
manage_club perm shouldn't be able to archive clubs. higher access should be required.

To maintain the access level of existing users, all users with the manage_club
permission are given the new permissions.
"""

from django.conf import settings
from django.db import migrations


REVIEWER_GROUP_NAME = "Reviewers (OSA)"


def preserve_existing_access(apps, schema_editor):
    """Backfill extracted permissions so existing admins keep their access."""
    ContentType = apps.get_model("contenttypes", "ContentType")
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    User = apps.get_model(*settings.AUTH_USER_MODEL.split("."))
    database = schema_editor.connection.alias

    club_content_type, _ = ContentType.objects.using(database).get_or_create(
        app_label="clubs", model="club"
    )

    # Custom permissions are normally created after migrations. Ensure they exist
    # here so this data migration can assign them immediately. delete_club is
    # Django's existing model permission, not a new custom permission.
    permission_names = {
        "delete_club": "Can delete club",
        "manage_club": "Manipulate club object and related objects",
        "run_management_scripts": "Can run management scripts",
        "send_club_email_blast": "Can send club email blasts",
    }
    permissions = {}
    for codename, name in permission_names.items():
        permissions[codename], _ = Permission.objects.using(database).get_or_create(
            content_type=club_content_type,
            codename=codename,
            defaults={"name": name},
        )

    manage_club = permissions["manage_club"]
    manager_permissions = [
        permissions["delete_club"],
        permissions["run_management_scripts"],
        permissions["send_club_email_blast"],
    ]

    # Reviewers (OSA) intentionally receive only the permissions assigned to
    # their group after deployment, not these legacy manager capabilities.
    manager_groups = (
        Group.objects.using(database)
        .filter(permissions=manage_club)
        .exclude(name=REVIEWER_GROUP_NAME)
    )
    for group in manager_groups:
        group.permissions.add(*manager_permissions)

    direct_managers = User.objects.using(database).filter(user_permissions=manage_club)
    for user in direct_managers:
        user.user_permissions.add(*manager_permissions)

    email_blast = permissions["send_club_email_blast"]
    for user in User.objects.using(database).filter(is_staff=True):
        user.user_permissions.add(email_blast)


class Migration(migrations.Migration):
    dependencies = [
        ("clubs", "0140_club_email_public_default_false"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="club",
            options={
                "ordering": ["name"],
                "permissions": [
                    ("approve_club", "Can approve pending clubs"),
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
        migrations.RunPython(preserve_existing_access, migrations.RunPython.noop),
    ]
