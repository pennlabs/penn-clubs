import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clubs", "0143_split_club_reject_permission"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. SubscriptionGroup (no FK to Club yet — Club will gain the FK later)
        migrations.CreateModel(
            name="SubscriptionGroup",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(blank=True, max_length=255)),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=False)),
                ("opens_at", models.DateTimeField(blank=True, null=True)),
                ("closes_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "club",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="subscription_groups",
                        to="clubs.club",
                    ),
                ),
            ],
        ),
        # 2. SubscriptionQuestion
        migrations.CreateModel(
            name="SubscriptionQuestion",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "question_type",
                    models.IntegerField(
                        choices=[
                            (1, "Free Response"),
                            (2, "Multiple Choice"),
                            (3, "Short Answer"),
                            (4, "Informational Text"),
                        ],
                        default=1,
                    ),
                ),
                ("prompt", models.TextField(blank=True)),
                ("precedence", models.IntegerField(default=0)),
                ("word_limit", models.IntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True, null=True)),
                (
                    "subscription_group",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="questions",
                        to="clubs.subscriptiongroup",
                    ),
                ),
            ],
        ),
        # 3. SubscriptionMultipleChoice
        migrations.CreateModel(
            name="SubscriptionMultipleChoice",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("value", models.TextField(blank=True)),
                (
                    "question",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="multiple_choice",
                        to="clubs.subscriptionquestion",
                    ),
                ),
            ],
        ),
        # 4. SubscriptionSubmission
        migrations.CreateModel(
            name="SubscriptionSubmission",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "attribution_source",
                    models.CharField(
                        choices=[
                            ("direct", "Direct Club Page"),
                            ("fair", "Activities Fair Booth"),
                            ("search", "Search Results"),
                            ("email", "Email Link"),
                            ("external", "External Link"),
                            ("import", "Imported"),
                            ("unknown", "Unknown"),
                        ],
                        default="unknown",
                        max_length=50,
                    ),
                ),
                ("attribution_context", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "subscribe",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="form_submission",
                        to="clubs.subscribe",
                    ),
                ),
                (
                    "subscription_group",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="submissions",
                        to="clubs.subscriptiongroup",
                    ),
                ),
            ],
            options={
                "unique_together": {("subscribe", "subscription_group")},
            },
        ),
        # 5. SubscriptionQuestionResponse
        migrations.CreateModel(
            name="SubscriptionQuestionResponse",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("text", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "multiple_choice",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="responses",
                        to="clubs.subscriptionmultiplechoice",
                    ),
                ),
                (
                    "question",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="responses",
                        to="clubs.subscriptionquestion",
                    ),
                ),
                (
                    "submission",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="responses",
                        to="clubs.subscriptionsubmission",
                    ),
                ),
            ],
            options={
                "unique_together": {("question", "submission")},
            },
        ),
        # 6. Club.default_subscription_group (nullable FK)
        migrations.AddField(
            model_name="club",
            name="default_subscription_group",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="default_for_clubs",
                to="clubs.subscriptiongroup",
            ),
        ),
        # 7. Subscribe.subscription_group (nullable FK)
        migrations.AddField(
            model_name="subscribe",
            name="subscription_group",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="subscriptions",
                to="clubs.subscriptiongroup",
            ),
        ),
        # 8. HistoricalClub.default_subscription_group (simple_history shadow field)
        migrations.AddField(
            model_name="historicalclub",
            name="default_subscription_group",
            field=models.ForeignKey(
                blank=True,
                db_constraint=False,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="+",
                to="clubs.subscriptiongroup",
            ),
        ),
    ]
