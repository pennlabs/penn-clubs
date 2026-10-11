"""
Unit tests for the subscription form models and the shared form workflow.
These exercise model methods and service classes directly, without HTTP.
"""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import RequestFactory, TestCase, override_settings
from django.utils import timezone

from clubs.models import (
    Club,
    ClubApplication,
    Subscribe,
    SubscriptionGroup,
    SubscriptionMultipleChoice,
    SubscriptionQuestion,
    SubscriptionQuestionResponse,
    SubscriptionSubmission,
)
from clubs.views import build_subscription_magic_link, subscription_link_base
from clubs.workflows import BaseFormWorkflow, SubscriptionFormWorkflow


User = get_user_model()


class SubscriptionGroupModelTestCase(TestCase):
    def setUp(self):
        self.club = Club.objects.create(code="testclub", name="Test Club")
        self.group = SubscriptionGroup.objects.create(
            club=self.club, name="Spring 2026", is_active=True
        )
        self.now = timezone.now()

    def test_inactive_group_is_never_open(self):
        self.group.is_active = False
        self.assertFalse(self.group.is_currently_open())

    def test_active_group_with_no_window_is_open(self):
        self.assertTrue(self.group.is_currently_open())

    def test_not_open_before_opens_at(self):
        self.group.opens_at = self.now + timezone.timedelta(days=1)
        self.assertFalse(self.group.is_currently_open())

    def test_not_open_after_closes_at(self):
        self.group.closes_at = self.now - timezone.timedelta(days=1)
        self.assertFalse(self.group.is_currently_open())

    def test_open_inside_window(self):
        self.group.opens_at = self.now - timezone.timedelta(days=1)
        self.group.closes_at = self.now + timezone.timedelta(days=1)
        self.assertTrue(self.group.is_currently_open())

    def test_at_argument_overrides_now(self):
        self.group.opens_at = self.now + timezone.timedelta(days=5)
        self.group.closes_at = self.now + timezone.timedelta(days=10)
        self.assertFalse(self.group.is_currently_open())
        self.assertTrue(
            self.group.is_currently_open(at=self.now + timezone.timedelta(days=7))
        )

    def test_display_name_falls_back_when_unnamed(self):
        unnamed = SubscriptionGroup.objects.create(club=self.club, name="")
        self.assertEqual(unnamed.get_display_name(), f"Subscription Group {unnamed.pk}")

    def test_display_name_uses_name_when_set(self):
        self.assertEqual(self.group.get_display_name(), "Spring 2026")

    def test_auto_subscribe_eligible_with_no_questions(self):
        self.assertTrue(self.group.auto_subscribe_eligible)

    def test_info_text_does_not_block_auto_subscribe(self):
        SubscriptionQuestion.objects.create(
            subscription_group=self.group,
            question_type=SubscriptionQuestion.INFO_TEXT,
            prompt="Welcome to the club!",
        )
        self.assertTrue(self.group.auto_subscribe_eligible)

    def test_optional_question_still_blocks_auto_subscribe(self):
        """
        An optional question is still something the student should get the
        chance to answer, so it must not be silently skipped.
        """
        SubscriptionQuestion.objects.create(
            subscription_group=self.group,
            question_type=SubscriptionQuestion.SHORT_ANSWER,
            prompt="Favourite color?",
            required=False,
        )
        self.assertFalse(self.group.auto_subscribe_eligible)

    def test_saving_club_creates_no_subscription_group(self):
        """
        Regression: a post_save receiver used to auto-create a default form for
        every club, which made instant subscribe unreachable. Clubs must opt in.
        """
        club = Club.objects.create(code="fresh-club", name="Fresh Club")
        self.assertTrue(club.enables_subscription)
        self.assertIsNone(club.default_subscription_group)
        self.assertEqual(SubscriptionGroup.objects.filter(club=club).count(), 0)

        club.name = "Fresh Club Renamed"
        club.save()
        club.refresh_from_db()
        self.assertIsNone(club.default_subscription_group)
        self.assertEqual(SubscriptionGroup.objects.filter(club=club).count(), 0)


class FormDefinitionMixinTestCase(TestCase):
    """
    ClubApplication is the other implementor of FormDefinitionBehaviorMixin, so
    the workflow contract must hold for it too.
    """

    def setUp(self):
        self.club = Club.objects.create(code="testclub", name="Test Club")
        self.now = timezone.now()

    def _application(self, start_offset, end_offset, name="Fall Application"):
        return ClubApplication.objects.create(
            name=name,
            club=self.club,
            application_start_time=self.now + timezone.timedelta(days=start_offset),
            application_end_time=self.now + timezone.timedelta(days=end_offset),
            result_release_time=self.now + timezone.timedelta(days=end_offset + 1),
        )

    def test_application_open_inside_window(self):
        self.assertTrue(self._application(-1, 1).is_currently_open())

    def test_application_closed_before_start(self):
        self.assertFalse(self._application(1, 2).is_currently_open())

    def test_application_closed_after_end(self):
        self.assertFalse(self._application(-2, -1).is_currently_open())

    def test_application_display_name(self):
        self.assertEqual(
            self._application(-1, 1).get_display_name(), "Fall Application"
        )

    def test_base_workflow_requires_subclass_implementations(self):
        workflow = BaseFormWorkflow(self._application(-1, 1), None)
        with self.assertRaises(NotImplementedError):
            workflow.get_or_create_submission()
        with self.assertRaises(NotImplementedError):
            workflow.save_response(None, None, {})


class SubscriptionFormWorkflowTestCase(TestCase):
    def setUp(self):
        self.club = Club.objects.create(code="testclub", name="Test Club")
        self.user = User.objects.create_user("student", "s@upenn.edu", "test")
        self.group = SubscriptionGroup.objects.create(
            club=self.club, name="Spring 2026", is_active=True
        )
        self.question = SubscriptionQuestion.objects.create(
            subscription_group=self.group,
            question_type=SubscriptionQuestion.FREE_RESPONSE,
            prompt="Why this club?",
        )
        self.subscribe = Subscribe.objects.create(person=self.user, club=self.club)

    def _workflow(self, source="direct"):
        return SubscriptionFormWorkflow(
            form_definition=self.group,
            user=self.user,
            subscribe=self.subscribe,
            attribution_source=source,
        )

    def test_validate_open_raises_on_closed_form(self):
        self.group.is_active = False
        self.group.save()
        with self.assertRaises(ValueError) as ctx:
            self._workflow().validate_open()
        self.assertIn("Spring 2026", str(ctx.exception))

    def test_validate_open_passes_on_open_form(self):
        self._workflow().validate_open()

    def test_get_or_create_submission_is_idempotent(self):
        workflow = self._workflow()
        first = workflow.get_or_create_submission()
        second = workflow.get_or_create_submission()
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(SubscriptionSubmission.objects.count(), 1)

    def test_submit_persists_responses(self):
        submission = self._workflow().submit(
            [{"question": self.question, "text": "Because it is great"}]
        )
        self.assertEqual(submission.responses.count(), 1)
        self.assertEqual(submission.responses.first().text, "Because it is great")

    def test_submit_records_attribution_source(self):
        submission = self._workflow(source="fair").submit([])
        self.assertEqual(submission.attribution_source, "fair")

    def test_submit_updates_existing_response(self):
        workflow = self._workflow()
        workflow.submit([{"question": self.question, "text": "first"}])
        workflow.submit([{"question": self.question, "text": "second"}])
        self.assertEqual(SubscriptionQuestionResponse.objects.count(), 1)
        self.assertEqual(SubscriptionQuestionResponse.objects.first().text, "second")

    def test_submit_saves_multiple_choice(self):
        mc_question = SubscriptionQuestion.objects.create(
            subscription_group=self.group,
            question_type=SubscriptionQuestion.MULTIPLE_CHOICE,
            prompt="Committee?",
        )
        option = SubscriptionMultipleChoice.objects.create(
            question=mc_question, value="Design"
        )
        submission = self._workflow().submit(
            [{"question": mc_question, "text": "", "multiple_choice": option}]
        )
        self.assertEqual(
            submission.responses.get(question=mc_question).multiple_choice_id,
            option.pk,
        )

    def test_submit_does_not_mutate_caller_answers(self):
        """
        The workflow pops "question" off each answer; it must copy first so the
        caller can reuse or re-inspect the list it passed in.
        """
        answers = [{"question": self.question, "text": "hello"}]
        self._workflow().submit(answers)
        self.assertIn("question", answers[0])
        self.assertEqual(answers[0]["question"], self.question)

    def test_submit_raises_on_closed_form_before_writing(self):
        self.group.is_active = False
        self.group.save()
        with self.assertRaises(ValueError):
            self._workflow().submit(
                [{"question": self.question, "text": "should not persist"}]
            )
        self.assertEqual(SubscriptionSubmission.objects.count(), 0)
        self.assertEqual(SubscriptionQuestionResponse.objects.count(), 0)

    def test_post_submit_effects_is_called(self):
        called = []

        class RecordingWorkflow(SubscriptionFormWorkflow):
            def post_submit_effects(self, submission):
                called.append(submission)

        RecordingWorkflow(
            form_definition=self.group,
            user=self.user,
            subscribe=self.subscribe,
        ).submit([])
        self.assertEqual(len(called), 1)


class SubscriptionLinkBaseTestCase(TestCase):
    """
    Magic links and QR codes must point at the production domain in production,
    but at the calling dev frontend under DEBUG so they can be followed locally.
    """

    def setUp(self):
        self.factory = RequestFactory()
        self.club = Club.objects.create(code="testclub", name="Test Club")
        self.group = SubscriptionGroup.objects.create(
            club=self.club, name="Spring 2026", is_active=True
        )
        self.dev_origin = "http://localhost:3001"

    def _request(self, origin=None, referer=None):
        headers = {}
        if origin:
            headers["HTTP_ORIGIN"] = origin
        if referer:
            headers["HTTP_REFERER"] = referer
        return self.factory.get("/", **headers)

    def test_defaults_to_production_domain(self):
        self.assertEqual(subscription_link_base(), f"https://{settings.DEFAULT_DOMAIN}")

    def test_no_request_uses_production_domain(self):
        with override_settings(DEBUG=True):
            self.assertEqual(
                subscription_link_base(None), f"https://{settings.DEFAULT_DOMAIN}"
            )

    @override_settings(DEBUG=True, CSRF_TRUSTED_ORIGINS=["http://localhost:3001"])
    def test_trusted_dev_origin_is_honoured(self):
        base = subscription_link_base(self._request(origin=self.dev_origin))
        self.assertEqual(base, self.dev_origin)

    @override_settings(DEBUG=True, CSRF_TRUSTED_ORIGINS=["http://localhost:3001"])
    def test_referer_used_when_origin_absent(self):
        base = subscription_link_base(
            self._request(referer=f"{self.dev_origin}/club/testclub/edit/")
        )
        self.assertEqual(base, self.dev_origin)

    @override_settings(DEBUG=True, CSRF_TRUSTED_ORIGINS=["http://localhost:3001"])
    def test_untrusted_origin_is_ignored(self):
        base = subscription_link_base(self._request(origin="https://evil.example"))
        self.assertEqual(base, f"https://{settings.DEFAULT_DOMAIN}")

    @override_settings(DEBUG=False, CSRF_TRUSTED_ORIGINS=["http://localhost:3001"])
    def test_origin_ignored_outside_debug(self):
        base = subscription_link_base(self._request(origin=self.dev_origin))
        self.assertEqual(base, f"https://{settings.DEFAULT_DOMAIN}")

    @override_settings(DEBUG=True, CSRF_TRUSTED_ORIGINS=["http://localhost:3001"])
    def test_magic_link_uses_the_resolved_base(self):
        url = build_subscription_magic_link(
            self.group, self._request(origin=self.dev_origin)
        )
        self.assertTrue(url.startswith(f"{self.dev_origin}/subscribe/link/"))

    def test_magic_link_token_round_trips(self):
        url = build_subscription_magic_link(self.group)
        token = url.rsplit("/", 1)[-1]
        self.assertTrue(token.startswith(f"{self.group.pk}:"))
