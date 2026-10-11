from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clubs", "0144_subscription_group_models"),
    ]

    operations = [
        migrations.AddField(
            model_name="subscriptiongroup",
            name="is_archived",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="subscriptionquestion",
            name="required",
            field=models.BooleanField(default=False),
        ),
    ]
