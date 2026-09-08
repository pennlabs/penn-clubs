"""
Integration tests for the subscription form API.
"""

import csv
import io

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from clubs.models import (
    Club,
    Membership,
    Subscribe,
    SubscriptionGroup,
    SubscriptionMultipleChoice,
    SubscriptionQuestion,
    SubscriptionSubmission,
)


User = get_user_model()


class SubscriptionAPITestCase(TestCase):
    def setUp(self):
        self.club = Club.objects.create(
            code="testclub",
            name="Test Club",
            approved=True,
            active=True,
            listserv="testclub@upenn.edu",
        )
        self.officer = User.objects.create_user(
            "officer", "officer@sas.upenn.edu", "test"
        )
        self.officer.first_name = "Olivia"
        self.officer.last_name = "Officer"
        self.officer.save()
        Membership.objects.create(
            person=self.officer,
            club=self.club,
            role=Membership.ROLE_OFFICER,
        )

        self.student = User.objects.create_user(
            "student", "student@sas.upenn.edu", "test"
        )
        self.student.first_name = "Sam"
        self.student.last_name = "Student"
        self.student.save()

        self.group = SubscriptionGroup.objects.create(
            club=self.club,
            name="Spring 2026",
            is_active=True,
        )
        self.question = SubscriptionQuestion.objects.create(
            subscription_group=self.group,
            question_type=SubscriptionQuestion.FREE_RESPONSE,
            prompt="Tell us about yourself",
            required=True,
        )

    # ------------------------------------------------------------------ helpers
    def _list_url(self):
        return reverse("club-subscription-groups-list", args=(self.club.code,))

    def _detail_url(self, pk=None):
        return reverse(
            "club-subscription-groups-detail",
            args=(self.club.code, pk or self.group.pk),
        )

    def _action_url(self, action, pk=None):
        return reverse(
            f"club-subscription-groups-{action}",
            args=(self.club.code, pk or self.group.pk),
        )

    def _questions_url(self):
        return reverse("sub-group-questions-list", args=(self.club.code, self.group.pk))

    def _question_detail_url(self, question_pk):
        return reverse(
            "sub-group-questions-detail",
            args=(self.club.code, self.group.pk, question_pk),
        )

    def _options_url(self, question_pk):
        return reverse(
            "sub-question-options-list",
            args=(self.club.code, self.group.pk, question_pk),
        )

    def _subscribers_url(self):
        return reverse(
            "sub-group-subscribers-list", args=(self.club.code, self.group.pk)
        )

    def _entry_url(self):
        return reverse("subscription-entry", args=(self.club.code,))

    def _public_url(self, pk=None):
        return reverse("subscription-group-public", args=(pk or self.group.pk,))

    def _submit_url(self, pk=None):
        return reverse("subscription-group-submit", args=(pk or self.group.pk,))

    def _subscribe_student(self, source="direct"):
        """Create a subscriber with one answer, bypassing the API."""
        subscribe = Subscribe.objects.create(person=self.student, club=self.club)
        return SubscriptionSubmission.objects.create(
            subscribe=subscribe,
            subscription_group=self.group,
            attribution_source=source,
        )

    # ------------------------------------------------------------------ list / create
    def test_list_forms_officer(self):
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.get(self._list_url())
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertEqual(len(data), 1, resp.content)
        self.assertIn("question_count", data[0])
        self.assertIn("submission_count", data[0])
        self.assertIn("subscriber_count", data[0])

    def test_subscriber_count_matches_actual_subscribers(self):
        """
        Regression: subscriber_count counted Subscribe rows whose FK pointed at
        the group, but the submit path only sets that FK when it is null, so a
        student already subscribed to the club was never counted. The Overview
        tile then read 0 while the Subscribers tab listed people.
        """
        # already subscribed to the club before this form existed
        Subscribe.objects.create(person=self.student, club=self.club)
        self.client.login(username=self.student.username, password="test")
        self.client.post(
            self._submit_url(),
            {"answers": [{"question": self.question.pk, "text": "hello"}]},
            content_type="application/json",
        )

        self.client.login(username=self.officer.username, password="test")
        data = self.client.get(self._list_url()).json()
        group = next(g for g in data if g["id"] == self.group.pk)
        self.assertEqual(group["subscriber_count"], 1, data)

        subscribers = self.client.get(self._subscribers_url()).json()
        if isinstance(subscribers, dict):
            subscribers = subscribers.get("results", subscribers)
        self.assertEqual(
            group["subscriber_count"],
            len(subscribers),
            "Overview count must agree with the Subscribers tab",
        )

    def test_list_forms_non_officer_rejected(self):
        self.client.login(username=self.student.username, password="test")
        resp = self.client.get(self._list_url())
        self.assertEqual(resp.status_code, 403, resp.content)

    def test_create_form_officer(self):
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.post(
            self._list_url(),
            {"name": "Fall 2026", "is_active": False},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertTrue(SubscriptionGroup.objects.filter(name="Fall 2026").exists())

    def test_create_form_non_officer_rejected(self):
        self.client.login(username=self.student.username, password="test")
        resp = self.client.post(
            self._list_url(),
            {"name": "Fall 2026", "is_active": False},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 403, resp.content)

    # ------------------------------------------------------------------ actions
    def test_set_default(self):
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.post(self._action_url("set-default"))
        self.assertEqual(resp.status_code, 200, resp.content)
        self.club.refresh_from_db()
        self.assertEqual(self.club.default_subscription_group_id, self.group.pk)

    def test_set_default_archived_rejected(self):
        self.group.is_archived = True
        self.group.save()
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.post(self._action_url("set-default"))
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_archive_unsets_default(self):
        self.club.default_subscription_group = self.group
        self.club.save()
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.post(self._action_url("archive"))
        self.assertEqual(resp.status_code, 200, resp.content)
        self.club.refresh_from_db()
        self.assertIsNone(self.club.default_subscription_group)
        self.group.refresh_from_db()
        self.assertTrue(self.group.is_archived)

    def test_archive_default_stays_unset_after_club_save(self):
        """
        Regression: a post_save receiver used to re-create a default form on
        every club save, making archive a no-op and instant subscribe
        unreachable. Saving the club must not resurrect a default.
        """
        self.club.default_subscription_group = self.group
        self.club.save()
        self.client.login(username=self.officer.username, password="test")
        self.client.post(self._action_url("archive"))

        self.club.refresh_from_db()
        self.club.name = "Test Club Renamed"
        self.club.save()

        self.club.refresh_from_db()
        self.assertIsNone(self.club.default_subscription_group)
        self.assertEqual(SubscriptionGroup.objects.filter(club=self.club).count(), 1)

    def test_close_before_open_rejected(self):
        self.client.login(username=self.officer.username, password="test")
        now = timezone.now()
        resp = self.client.patch(
            self._detail_url(),
            {
                "opens_at": (now + timezone.timedelta(days=5)).isoformat(),
                "closes_at": (now + timezone.timedelta(days=1)).isoformat(),
            },
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertIn("closes_at", resp.json())

    def test_close_equal_to_open_rejected(self):
        self.client.login(username=self.officer.username, password="test")
        stamp = (timezone.now() + timezone.timedelta(days=2)).isoformat()
        resp = self.client.patch(
            self._detail_url(),
            {"opens_at": stamp, "closes_at": stamp},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_close_before_stored_open_rejected_on_partial_update(self):
        """A PATCH sending only closes_at must still be checked against the
        opens_at already stored on the form."""
        now = timezone.now()
        self.group.opens_at = now + timezone.timedelta(days=5)
        self.group.save()
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.patch(
            self._detail_url(),
            {"closes_at": (now + timezone.timedelta(days=1)).isoformat()},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_valid_window_accepted(self):
        self.client.login(username=self.officer.username, password="test")
        now = timezone.now()
        resp = self.client.patch(
            self._detail_url(),
            {
                "opens_at": (now + timezone.timedelta(days=1)).isoformat(),
                "closes_at": (now + timezone.timedelta(days=5)).isoformat(),
            },
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.group.refresh_from_db()
        self.assertLess(self.group.opens_at, self.group.closes_at)

    def test_open_date_alone_accepted(self):
        """Either bound may be left blank; only the pair is constrained."""
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.patch(
            self._detail_url(),
            {"opens_at": (timezone.now() + timezone.timedelta(days=1)).isoformat()},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)

    def test_create_with_close_before_open_rejected(self):
        self.client.login(username=self.officer.username, password="test")
        now = timezone.now()
        resp = self.client.post(
            self._list_url(),
            {
                "name": "Bad Window",
                "opens_at": (now + timezone.timedelta(days=5)).isoformat(),
                "closes_at": (now + timezone.timedelta(days=1)).isoformat(),
            },
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertFalse(SubscriptionGroup.objects.filter(name="Bad Window").exists())

    def test_unarchive(self):
        self.group.is_archived = True
        self.group.save()
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.post(self._action_url("unarchive"))
        self.assertEqual(resp.status_code, 200, resp.content)
        self.group.refresh_from_db()
        self.assertFalse(self.group.is_archived)

    def test_actions_reject_non_officer(self):
        self.client.login(username=self.student.username, password="test")
        for action in ("set-default", "archive", "unarchive"):
            resp = self.client.post(self._action_url(action))
            self.assertEqual(resp.status_code, 403, f"{action}: {resp.content}")

    # ------------------------------------------------------------------ entry
    def test_subscription_entry_no_default(self):
        resp = self.client.get(self._entry_url())
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json()["mode"], "instant")

    def test_subscription_entry_with_default(self):
        self.club.default_subscription_group = self.group
        self.club.save()
        resp = self.client.get(self._entry_url())
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertEqual(data["mode"], "form")
        self.assertEqual(data["subscription_group_id"], self.group.pk)
        self.assertEqual(data["attribution_source"], "direct")

    def test_subscription_entry_echoes_valid_source(self):
        self.club.default_subscription_group = self.group
        self.club.save()
        resp = self.client.get(self._entry_url(), {"source": "fair"})
        self.assertEqual(resp.json()["attribution_source"], "fair")

    def test_subscription_entry_rejects_unknown_source(self):
        self.club.default_subscription_group = self.group
        self.club.save()
        resp = self.client.get(self._entry_url(), {"source": "not-a-source"})
        self.assertEqual(resp.json()["attribution_source"], "unknown")

    def test_subscription_entry_closed_default_falls_back_to_instant(self):
        self.group.is_active = False
        self.group.save()
        self.club.default_subscription_group = self.group
        self.club.save()
        resp = self.client.get(self._entry_url())
        self.assertEqual(resp.json()["mode"], "instant")

    # ------------------------------------------------------------------ public
    def test_public_group_visible_to_anonymous(self):
        resp = self.client.get(self._public_url())
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertEqual(data["id"], self.group.pk)
        self.assertFalse(data["auto_subscribe_eligible"])
        self.assertEqual(len(data["questions"]), 1)

    def test_public_group_auto_subscribe_when_no_questions(self):
        self.question.delete()
        resp = self.client.get(self._public_url())
        self.assertTrue(resp.json()["auto_subscribe_eligible"])

    def test_public_group_info_text_still_auto_subscribes(self):
        """Informational text is not a question, so it should not block."""
        self.question.delete()
        SubscriptionQuestion.objects.create(
            subscription_group=self.group,
            question_type=SubscriptionQuestion.INFO_TEXT,
            prompt="Welcome!",
        )
        resp = self.client.get(self._public_url())
        self.assertTrue(resp.json()["auto_subscribe_eligible"], resp.content)

    # ------------------------------------------------------------------ submit
    def test_submit_requires_authentication(self):
        resp = self.client.post(
            self._submit_url(),
            {"answers": [{"question": self.question.pk, "text": "Hi"}]},
            content_type="application/json",
        )
        self.assertIn(resp.status_code, [401, 403], resp.content)
        self.assertFalse(SubscriptionSubmission.objects.exists())

    def test_submit_creates_subscribe(self):
        self.client.login(username=self.student.username, password="test")
        resp = self.client.post(
            self._submit_url(),
            {
                "subscription_group": self.group.pk,
                "answers": [{"question": self.question.pk, "text": "Hello world"}],
                "attribution_source": "direct",
            },
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertTrue(
            Subscribe.objects.filter(person=self.student, club=self.club).exists()
        )
        submission = SubscriptionSubmission.objects.get(
            subscribe__person=self.student, subscription_group=self.group
        )
        self.assertEqual(submission.responses.count(), 1)
        self.assertEqual(submission.responses.first().text, "Hello world")

    def test_submit_records_attribution_source(self):
        self.client.login(username=self.student.username, password="test")
        self.client.post(
            self._submit_url(),
            {
                "answers": [{"question": self.question.pk, "text": "Hi"}],
                "attribution_source": "fair",
            },
            content_type="application/json",
        )
        submission = SubscriptionSubmission.objects.get(subscription_group=self.group)
        self.assertEqual(submission.attribution_source, "fair")

    def test_submit_coerces_invalid_attribution_source(self):
        self.client.login(username=self.student.username, password="test")
        self.client.post(
            self._submit_url(),
            {
                "answers": [{"question": self.question.pk, "text": "Hi"}],
                "attribution_source": "definitely-not-valid",
            },
            content_type="application/json",
        )
        submission = SubscriptionSubmission.objects.get(subscription_group=self.group)
        self.assertEqual(submission.attribution_source, "unknown")

    def test_submit_multiple_choice_answer(self):
        question = SubscriptionQuestion.objects.create(
            subscription_group=self.group,
            question_type=SubscriptionQuestion.MULTIPLE_CHOICE,
            prompt="Which committee?",
        )
        option = SubscriptionMultipleChoice.objects.create(
            question=question, value="Design"
        )
        self.client.login(username=self.student.username, password="test")
        resp = self.client.post(
            self._submit_url(),
            {
                "answers": [
                    {"question": self.question.pk, "text": "Hi"},
                    {"question": question.pk, "multiple_choice": option.pk},
                ]
            },
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        submission = SubscriptionSubmission.objects.get(subscription_group=self.group)
        response = submission.responses.get(question=question)
        self.assertEqual(response.multiple_choice_id, option.pk)

    def test_submit_idempotent(self):
        self.client.login(username=self.student.username, password="test")
        payload = {
            "answers": [{"question": self.question.pk, "text": "Hello"}],
            "attribution_source": "direct",
        }
        self.client.post(self._submit_url(), payload, content_type="application/json")
        self.client.post(self._submit_url(), payload, content_type="application/json")
        self.assertEqual(
            Subscribe.objects.filter(person=self.student, club=self.club).count(), 1
        )
        self.assertEqual(
            SubscriptionSubmission.objects.filter(
                subscribe__person=self.student, subscription_group=self.group
            ).count(),
            1,
        )

    def test_submit_updates_answer_on_resubmit(self):
        self.client.login(username=self.student.username, password="test")
        for text in ("first answer", "second answer"):
            self.client.post(
                self._submit_url(),
                {"answers": [{"question": self.question.pk, "text": text}]},
                content_type="application/json",
            )
        submission = SubscriptionSubmission.objects.get(subscription_group=self.group)
        self.assertEqual(submission.responses.count(), 1)
        self.assertEqual(submission.responses.first().text, "second answer")

    def test_submit_closed_form_rejected(self):
        self.group.is_active = False
        self.group.save()
        self.client.login(username=self.student.username, password="test")
        resp = self.client.post(
            self._submit_url(),
            {"answers": [{"question": self.question.pk, "text": "Hi"}]},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_submit_outside_window_rejected(self):
        self.group.closes_at = timezone.now() - timezone.timedelta(days=1)
        self.group.save()
        self.client.login(username=self.student.username, password="test")
        resp = self.client.post(
            self._submit_url(),
            {"answers": [{"question": self.question.pk, "text": "Hi"}]},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_submit_missing_required_rejected(self):
        self.client.login(username=self.student.username, password="test")
        resp = self.client.post(
            self._submit_url(),
            {"answers": [], "attribution_source": "direct"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertIn("missing_questions", resp.json())
        self.assertFalse(SubscriptionSubmission.objects.exists())

    # ------------------------------------------------------------------ questions
    def test_create_question(self):
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.post(
            self._questions_url(),
            {
                "question_type": SubscriptionQuestion.SHORT_ANSWER,
                "prompt": "Favourite color?",
                "required": False,
            },
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertEqual(self.group.questions.count(), 2)

    def test_edit_question(self):
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.patch(
            self._question_detail_url(self.question.pk),
            {"prompt": "Updated prompt"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.question.refresh_from_db()
        self.assertEqual(self.question.prompt, "Updated prompt")

    def test_delete_question(self):
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.delete(self._question_detail_url(self.question.pk))
        self.assertEqual(resp.status_code, 204, resp.content)
        self.assertEqual(self.group.questions.count(), 0)

    def test_question_multiple_choice_written_from_nested_payload(self):
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.post(
            self._questions_url(),
            {
                "question_type": SubscriptionQuestion.MULTIPLE_CHOICE,
                "prompt": "Which committee?",
                "multiple_choice": [{"value": "Design"}, {"value": "Engineering"}],
            },
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        question = self.group.questions.get(prompt="Which committee?")
        self.assertEqual(
            sorted(question.multiple_choice.values_list("value", flat=True)),
            ["Design", "Engineering"],
        )

    def test_multiple_choice_option_crud(self):
        question = SubscriptionQuestion.objects.create(
            subscription_group=self.group,
            question_type=SubscriptionQuestion.MULTIPLE_CHOICE,
            prompt="Which committee?",
        )
        self.client.login(username=self.officer.username, password="test")

        resp = self.client.post(
            self._options_url(question.pk),
            {"value": "Design"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        option_id = resp.json()["id"]

        resp = self.client.get(self._options_url(question.pk))
        self.assertEqual(len(resp.json()), 1, resp.content)

        resp = self.client.delete(
            reverse(
                "sub-question-options-detail",
                args=(self.club.code, self.group.pk, question.pk, option_id),
            )
        )
        self.assertEqual(resp.status_code, 204, resp.content)
        self.assertEqual(question.multiple_choice.count(), 0)

    def test_reorder_questions(self):
        second = SubscriptionQuestion.objects.create(
            subscription_group=self.group,
            question_type=SubscriptionQuestion.SHORT_ANSWER,
            prompt="Second",
            precedence=1,
        )
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.post(
            reverse(
                "sub-group-questions-reorder", args=(self.club.code, self.group.pk)
            ),
            {"question_ids": [second.pk, self.question.pk]},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        second.refresh_from_db()
        self.question.refresh_from_db()
        self.assertEqual(second.precedence, 0)
        self.assertEqual(self.question.precedence, 1)

    def test_questions_reject_non_officer(self):
        self.client.login(username=self.student.username, password="test")
        resp = self.client.get(self._questions_url())
        self.assertEqual(resp.status_code, 403, resp.content)

    # ------------------------------------------------------------------ subscribers
    def test_subscriber_list_officer_only(self):
        self.client.login(username=self.student.username, password="test")
        resp = self.client.get(self._subscribers_url())
        self.assertEqual(resp.status_code, 403, resp.content)

    def test_subscriber_list_returns_data(self):
        self._subscribe_student()
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.get(self._subscribers_url())
        self.assertEqual(resp.status_code, 200, resp.content)
        results = resp.json()
        if isinstance(results, dict):
            results = results.get("results", results)
        self.assertEqual(len(results), 1, resp.content)
        self.assertEqual(results[0]["email"], self.student.email)

    def test_subscriber_list_filters_by_source(self):
        self._subscribe_student(source="fair")
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.get(self._subscribers_url(), {"source": "search"})
        results = resp.json()
        if isinstance(results, dict):
            results = results.get("results", results)
        self.assertEqual(len(results), 0, resp.content)

    # ------------------------------------------------------------------ exports
    def _export_url(self, kind="emails"):
        return reverse(
            f"club-subscription-groups-export-{kind}",
            args=(self.club.code, self.group.pk),
        )

    def test_export_emails_csv_default(self):
        self._subscribe_student()
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.get(self._export_url())
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertIn("text/csv", resp["Content-Type"])
        self.assertIn("filename=emails.csv", resp["Content-Disposition"])
        content = resp.content.decode("utf-8-sig")
        self.assertIn("email,name,source,subscribed_at", content)
        self.assertIn(self.student.email, content)
        # helper-only columns must not leak into the download
        self.assertNotIn("first_name", content)
        self.assertNotIn("group_email", content)

    def test_export_emails_tsv_has_tsv_extension(self):
        self._subscribe_student()
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.get(self._export_url(), {"fmt": "tsv"})
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertIn("tab-separated", resp["Content-Type"])
        self.assertIn("filename=emails.tsv", resp["Content-Disposition"])
        self.assertIn("\t", resp.content.decode("utf-8-sig"))

    def test_export_emails_plain_text_list(self):
        self._subscribe_student()
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.get(self._export_url(), {"fmt": "txt"})
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertIn("text/plain", resp["Content-Type"])
        self.assertIn("filename=emails-list.txt", resp["Content-Disposition"])
        self.assertEqual(resp.content.decode("utf-8").strip(), self.student.email)

    def test_export_emails_mailchimp_headers(self):
        self._subscribe_student()
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.get(self._export_url(), {"fmt": "mailchimp"})
        self.assertEqual(resp.status_code, 200, resp.content)
        rows = list(csv.reader(io.StringIO(resp.content.decode("utf-8-sig"))))
        self.assertEqual(rows[0], ["Email Address", "First Name", "Last Name"])
        self.assertEqual(rows[1], [self.student.email, "Sam", "Student"])

    def test_export_emails_google_groups_headers(self):
        self._subscribe_student()
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.get(self._export_url(), {"fmt": "google-groups"})
        self.assertEqual(resp.status_code, 200, resp.content)
        rows = list(csv.reader(io.StringIO(resp.content.decode("utf-8-sig"))))
        self.assertEqual(
            rows[0],
            [
                "Group Email [Required]",
                "Member Email",
                "Member Type",
                "Member Role",
            ],
        )
        self.assertEqual(
            rows[1],
            [self.club.listserv, self.student.email, "USER", "MEMBER"],
        )

    def test_export_filenames_are_distinct_per_format(self):
        """
        CSV, Mailchimp and Google Groups are all CSV files. If they share a
        filename they are indistinguishable in the browser's download list.
        """
        self._subscribe_student()
        self.client.login(username=self.officer.username, password="test")
        names = {}
        for fmt in ("csv", "tsv", "txt", "mailchimp", "google-groups"):
            resp = self.client.get(self._export_url(), {"fmt": fmt})
            self.assertEqual(resp.status_code, 200, resp.content)
            names[fmt] = resp["Content-Disposition"].split("filename=")[1]
        self.assertEqual(
            len(set(names.values())), len(names), f"duplicate filenames: {names}"
        )
        self.assertEqual(names["mailchimp"], "emails-mailchimp.csv")
        self.assertEqual(names["google-groups"], "emails-google-groups.csv")

    def test_export_formats_have_distinct_contents(self):
        """The formats must differ in substance, not only in filename."""
        self._subscribe_student()
        self.client.login(username=self.officer.username, password="test")
        bodies = {
            fmt: self.client.get(self._export_url(), {"fmt": fmt}).content
            for fmt in ("csv", "tsv", "txt", "mailchimp", "google-groups")
        }
        self.assertEqual(len(set(bodies.values())), len(bodies))

    def test_export_emails_xlsx(self):
        self._subscribe_student()
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.get(self._export_url(), {"format": "xlsx"})
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(len(resp.data), 1)

    def test_export_unknown_format_rejected(self):
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.get(self._export_url(), {"fmt": "parquet"})
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_export_responses_includes_question_columns(self):
        submission = self._subscribe_student()
        submission.responses.create(question=self.question, text="my answer")
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.get(self._export_url("responses"))
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertIn("filename=responses.csv", resp["Content-Disposition"])
        content = resp.content.decode("utf-8-sig")
        self.assertIn(self.question.prompt, content)
        self.assertIn("my answer", content)

    def test_export_rejects_non_officer(self):
        self.client.login(username=self.student.username, password="test")
        for kind in ("emails", "responses"):
            resp = self.client.get(self._export_url(kind))
            self.assertEqual(resp.status_code, 403, f"{kind}: {resp.content}")

    # ------------------------------------------------------------------ magic link
    def test_magic_link_round_trip(self):
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.get(self._action_url("magic-link"))
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertIn("/subscribe/link/", data["url"])
        self.assertNotIn("/api/subscription-links/", data["url"])
        self.assertFalse(data["auto_subscribe_eligible"])

        self.client.logout()
        resolve_resp = self.client.get(
            reverse("subscription-link-resolve", args=(data["token"],))
        )
        self.assertEqual(resolve_resp.status_code, 200, resolve_resp.content)
        resolved = resolve_resp.json()
        self.assertEqual(resolved["subscription_group_id"], self.group.pk)
        self.assertEqual(resolved["club_code"], self.club.code)

    def test_magic_link_uses_default_domain(self):
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.get(self._action_url("magic-link"))
        self.assertTrue(
            resp.json()["url"].startswith(f"https://{settings.DEFAULT_DOMAIN}/"),
            resp.content,
        )

    def test_magic_link_matches_qr_code_target(self):
        """The QR image and the copyable link must point at the same URL."""
        self.client.login(username=self.officer.username, password="test")
        link = self.client.get(self._action_url("magic-link")).json()["url"]

        from clubs.views import build_subscription_magic_link

        self.assertEqual(link, build_subscription_magic_link(self.group))

    def test_magic_link_invalid_token(self):
        resp = self.client.get(
            reverse("subscription-link-resolve", args=("999:tampered",))
        )
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_qr_code_returns_png(self):
        self.client.login(username=self.officer.username, password="test")
        resp = self.client.get(self._action_url("qr-code"))
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp["Content-Type"], "image/png")
        self.assertTrue(resp.content.startswith(b"\x89PNG"))

    def test_magic_link_rejects_non_officer(self):
        self.client.login(username=self.student.username, password="test")
        for action in ("magic-link", "qr-code"):
            resp = self.client.get(self._action_url(action))
            self.assertEqual(resp.status_code, 403, f"{action}: {resp.content}")
