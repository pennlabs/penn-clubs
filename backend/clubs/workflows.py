"""
Service classes for orchestrating form submission workflows.

`ClubApplication` and `SubscriptionGroup` are both ordered groups of questions a
user answers, so the submit-and-respond sequence is shared here rather than
duplicated in each view. `SubscriptionSubmitView` drives `SubscriptionFormWorkflow`;
an `ApplicationFormWorkflow` can subclass `BaseFormWorkflow` the same way.
"""


class BaseFormWorkflow:
    """
    Shared submit-and-respond orchestration for form-definition models.
    Subclasses must override get_or_create_submission() and save_response().
    """

    def __init__(self, form_definition, user):
        self.form_definition = form_definition
        self.user = user

    def validate_open(self):
        if not self.form_definition.is_currently_open():
            raise ValueError(
                f"'{self.form_definition.get_display_name()}' is not currently open."
            )

    def get_or_create_submission(self):
        raise NotImplementedError

    def save_response(self, submission, question, answer_data):
        raise NotImplementedError

    def submit(self, answers):
        """
        Orchestrate a full submission: validate the open window, create or fetch
        the submission, persist every response, then run post_submit_effects().

        `answers` is a list of dicts shaped {"question": <obj>, ...answer fields}.
        The caller's dicts are not mutated.
        """
        self.validate_open()
        submission = self.get_or_create_submission()
        for answer in answers:
            answer = dict(answer)
            question = answer.pop("question")
            self.save_response(submission, question, answer)
        self.post_submit_effects(submission)
        return submission

    def post_submit_effects(self, submission):
        """Hook called after all responses are saved. No-op by default."""
        pass


class SubscriptionFormWorkflow(BaseFormWorkflow):
    """
    Workflow for SubscriptionGroup form submissions. Submitting subscribes the
    user to the club, in contrast to an application, where membership is only
    created once a club officer accepts the applicant.
    """

    def __init__(
        self,
        form_definition,
        user,
        subscribe,
        attribution_source="unknown",
        attribution_context=None,
    ):
        super().__init__(form_definition, user)
        self.subscribe = subscribe
        self.attribution_source = attribution_source
        self.attribution_context = attribution_context or {}

    def get_or_create_submission(self):
        from clubs.models import SubscriptionSubmission

        submission, _ = SubscriptionSubmission.objects.get_or_create(
            subscribe=self.subscribe,
            subscription_group=self.form_definition,
            defaults={
                "attribution_source": self.attribution_source,
                "attribution_context": self.attribution_context,
            },
        )
        return submission

    def save_response(self, submission, question, answer_data):
        from clubs.models import SubscriptionQuestionResponse

        SubscriptionQuestionResponse.objects.update_or_create(
            question=question,
            submission=submission,
            defaults=answer_data,
        )

    def post_submit_effects(self, submission):
        """Hook for future side-effects (e.g. welcome emails). No-op for now."""
        pass
