from django.db import migrations


def cleanup_auto_created_groups(apps, schema_editor):
    """
    Remove the empty "Subscribe" groups that the old
    ``ensure_default_subscription_group`` post_save receiver created on every
    club save. Only groups with no questions and no submissions are removed, so
    any form an officer actually built is left untouched.
    """
    Club = apps.get_model("clubs", "Club")
    SubscriptionGroup = apps.get_model("clubs", "SubscriptionGroup")

    auto_created = SubscriptionGroup.objects.filter(
        name="Subscribe",
        questions__isnull=True,
        submissions__isnull=True,
    )
    ids = list(auto_created.values_list("pk", flat=True))
    if not ids:
        return

    # Clear the FK first so the clubs fall back to instant subscribe.
    Club.objects.filter(default_subscription_group_id__in=ids).update(
        default_subscription_group=None
    )
    SubscriptionGroup.objects.filter(pk__in=ids).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("clubs", "0145_subscription_group_enhancements"),
    ]

    operations = [
        migrations.RunPython(
            cleanup_auto_created_groups,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
