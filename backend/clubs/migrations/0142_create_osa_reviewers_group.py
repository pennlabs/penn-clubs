from django.db import migrations


REVIEWER_GROUP_NAME = "Reviewers (OSA)"


def create_reviewer_group(apps, schema_editor):
    """Create the application-owned reviewer role without assigning users."""
    ContentType = apps.get_model("contenttypes", "ContentType")
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    database = schema_editor.connection.alias

    permission_specs = [
        (
            "club",
            "manage_club",
            "Manipulate club object and related objects",
        ),
        (
            "club",
            "see_pending_clubs",
            "View pending clubs that are not one's own",
        ),
        ("report", "generate_reports", "Can generate reports"),
    ]
    reviewer_permissions = []
    for model, codename, name in permission_specs:
        content_type, _ = ContentType.objects.using(database).get_or_create(
            app_label="clubs", model=model
        )
        permission, _ = Permission.objects.using(database).get_or_create(
            content_type=content_type,
            codename=codename,
            defaults={"name": name},
        )
        reviewer_permissions.append(permission)

    group, _ = Group.objects.using(database).get_or_create(name=REVIEWER_GROUP_NAME)
    # This is a canonical application role, so remove accidental extra permissions.
    group.permissions.set(reviewer_permissions)


class Migration(migrations.Migration):
    dependencies = [
        ("clubs", "0141_club_granular_permissions"),
    ]

    operations = [
        migrations.RunPython(create_reviewer_group, migrations.RunPython.noop),
    ]
