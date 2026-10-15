import datetime
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import Client, TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from social_core.exceptions import AuthForbidden

from clubs.backends import require_logged_in_user
from clubs.google import form_to_questions, parse_form_id
from clubs.models import (
    ApplicationQuestion,
    ApplicationQuestionResponse,
    ApplicationSection,
    ApplicationSubmission,
    Club,
    ClubApplication,
    Major,
    Membership,
    School,
)


# a Google Form as the Forms API returns it, with one item of each kind
FORM = {
    "formId": "abc123",
    "info": {"title": "Harvard Rejects Fall", "description": "Welcome!"},
    "items": [
        {
            "title": "Name",
            "questionItem": {
                "question": {"required": True, "textQuestion": {}},
            },
        },
        {
            "title": "Why us?",
            "description": "Be honest",
            "questionItem": {"question": {"textQuestion": {"paragraph": True}}},
        },
        {
            "title": "Year",
            "questionItem": {
                "question": {
                    "choiceQuestion": {
                        "type": "DROP_DOWN",
                        "options": [{"value": "2027"}, {"value": "2028"}],
                    }
                }
            },
        },
        {
            "title": "Interests",
            "questionItem": {
                "question": {
                    "choiceQuestion": {
                        "type": "CHECKBOX",
                        "options": [
                            {"value": "Design"},
                            {"value": "Code"},
                            {"isOther": True},
                        ],
                    }
                }
            },
        },
        {
            "title": "Excitement",
            "questionItem": {
                "question": {
                    "scaleQuestion": {
                        "high": 3,
                        "lowLabel": "Meh",
                        "highLabel": "Very",
                    }
                }
            },
        },
        {
            "title": "Birthday",
            "questionItem": {"question": {"dateQuestion": {}}},
        },
        {
            "title": "Resume",
            "questionItem": {"question": {"fileUploadQuestion": {}}},
        },
        {
            "title": "Availability",
            "questionGroupItem": {
                "grid": {
                    "columns": {
                        "type": "RADIO",
                        "options": [{"value": "Yes"}, {"value": "No"}],
                    }
                },
                "questions": [
                    {"required": True, "rowQuestion": {"title": "Monday"}},
                    {"rowQuestion": {"title": "Tuesday"}},
                ],
            },
        },
        {
            "title": "Which committee?",
            "questionItem": {
                "question": {
                    "required": True,
                    "choiceQuestion": {
                        "type": "RADIO",
                        "options": [
                            {"value": "Engineering", "goToSectionId": "eng"},
                            {"value": "Design", "goToSectionId": "design"},
                        ],
                    },
                }
            },
        },
        {
            "itemId": "eng",
            "title": "Engineering",
            "description": "Challenge: https://example.com/challenge",
            "pageBreakItem": {},
        },
        {
            "title": "GitHub",
            "questionItem": {"question": {"required": True, "textQuestion": {}}},
        },
        {"title": "Logo", "imageItem": {}},
        {"itemId": "design", "title": "Design", "pageBreakItem": {}},
        {
            "title": "Portfolio",
            "questionItem": {"question": {"required": True, "textQuestion": {}}},
        },
    ],
}


class FormToQuestionsTestCase(TestCase):
    def test_each_kind_of_item_maps_to_a_question(self):
        questions, sections, warnings = form_to_questions(FORM)
        summary = [
            (q["question_type"], q["prompt"], q["required"], q["choices"])
            for q in questions
        ]
        self.assertEqual(
            summary,
            [
                (ApplicationQuestion.INFO_TEXT, "Harvard Rejects Fall", False, []),
                (ApplicationQuestion.SHORT_ANSWER, "Name", True, []),
                (ApplicationQuestion.FREE_RESPONSE, "Why us?", False, []),
                (ApplicationQuestion.MULTIPLE_CHOICE, "Year", False, ["2027", "2028"]),
                (
                    ApplicationQuestion.CHECKBOX,
                    "Interests",
                    False,
                    ["Design", "Code", "Other"],
                ),
                (
                    ApplicationQuestion.MULTIPLE_CHOICE,
                    "Excitement",
                    False,
                    ["0", "1", "2", "3"],
                ),
                (ApplicationQuestion.SHORT_ANSWER, "Birthday", False, []),
                (
                    ApplicationQuestion.MULTIPLE_CHOICE,
                    "Availability: Monday",
                    True,
                    ["Yes", "No"],
                ),
                (
                    ApplicationQuestion.MULTIPLE_CHOICE,
                    "Availability: Tuesday",
                    False,
                    ["Yes", "No"],
                ),
                (
                    ApplicationQuestion.MULTIPLE_CHOICE,
                    "Which committee?",
                    True,
                    ["Engineering", "Design"],
                ),
                (ApplicationQuestion.SHORT_ANSWER, "GitHub", True, []),
                (ApplicationQuestion.SHORT_ANSWER, "Portfolio", True, []),
            ],
        )
        # page breaks become sections, and options keep where they lead
        self.assertEqual(
            [(section["key"], section["title"]) for section in sections],
            [("eng", "Engineering"), ("design", "Design")],
        )
        self.assertEqual(
            questions[9]["routing"], {"Engineering": "eng", "Design": "design"}
        )
        self.assertEqual([q["section"] for q in questions[9:]], [None, "eng", "design"])
        self.assertEqual(questions[0]["description"], "Welcome!")
        self.assertEqual(questions[2]["description"], "Be honest")
        self.assertEqual(questions[5]["description"], "0 = Meh, 3 = Very")
        self.assertEqual(questions[6]["description"], "Enter a date.")
        # the Other option, the file upload, the grid and the image
        self.assertEqual(len(warnings), 4, warnings)
        self.assertIn('"Resume" is a file upload', " ".join(warnings))


class ParseFormIdTestCase(TestCase):
    def test_editor_link(self):
        self.assertEqual(
            parse_form_id("https://docs.google.com/forms/d/1AbC-dEf_123/edit#settings"),
            "1AbC-dEf_123",
        )

    def test_bare_id(self):
        self.assertEqual(
            parse_form_id(" 1FAIpQLSdAbCdEfGhIjKlMnOp "), "1FAIpQLSdAbCdEfGhIjKlMnOp"
        )

    def test_links_for_filling_out_the_form_are_rejected(self):
        for link in [
            "https://docs.google.com/forms/d/e/1FAIpQLSd/viewform",
            "https://forms.gle/abc123",
        ]:
            with self.assertRaisesMessage(ValidationError, "filling out the form"):
                parse_form_id(link)

    def test_other_links_are_rejected(self):
        with self.assertRaises(ValidationError):
            parse_form_id("https://example.com")


class RequireLoggedInUserTestCase(TestCase):
    def test_google_cannot_be_used_to_log_in(self):
        with self.assertRaises(AuthForbidden):
            require_logged_in_user(backend=None, user=None)

    def test_logged_in_user_can_link_google(self):
        self.assertIsNone(require_logged_in_user(backend=None, user=object()))


class GoogleTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.officer = get_user_model().objects.create_user(
            username="officer", password="test", email="officer@example.com"
        )
        self.outsider = get_user_model().objects.create_user(
            username="outsider", password="test", email="outsider@example.com"
        )
        now = timezone.now()
        self.club = Club.objects.create(code="harvard-rejects", name="Harvard Rejects")
        Membership.objects.create(
            person=self.officer, club=self.club, role=Membership.ROLE_OFFICER
        )
        self.application = ClubApplication.objects.create(
            name="Fall",
            club=self.club,
            application_start_time=now - datetime.timedelta(days=1),
            application_end_time=now + datetime.timedelta(days=7),
            result_release_time=now + datetime.timedelta(days=14),
        )
        self.existing = ApplicationQuestion.objects.create(
            prompt="Existing", application=self.application, precedence=4
        )
        self.import_url = reverse(
            "club-applications-import-google-form",
            args=(self.club.code, self.application.pk),
        )

    def _import(self):
        return self.client.post(
            self.import_url,
            {"link": "https://docs.google.com/forms/d/abc123/edit"},
            content_type="application/json",
        )

    @patch("clubs.views.google_api_call", return_value=FORM)
    def test_officer_imports_form_after_existing_questions(self, google_api_call):
        self.client.login(username="officer", password="test")
        resp = self._import()
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.data["imported"], 12)
        self.assertEqual(len(resp.data["warnings"]), 4)
        self.assertIn("forms/abc123", google_api_call.call_args.args[2])

        imported = self.application.questions.exclude(pk=self.existing.pk).order_by(
            "precedence"
        )
        self.assertEqual(imported.first().precedence, 5)
        interests = imported.get(prompt="Interests")
        self.assertEqual(interests.question_type, ApplicationQuestion.CHECKBOX)
        self.assertEqual(
            list(interests.multiple_choice.values_list("value", flat=True)),
            ["Design", "Code", "Other"],
        )
        self.assertTrue(imported.get(prompt="Name").required)
        # sections come across with their questions and the routing into them
        engineering = self.application.sections.get(title="Engineering")
        self.assertEqual(imported.get(prompt="GitHub").section, engineering)
        committee = imported.get(prompt="Which committee?")
        self.assertTrue(committee.routes)
        self.assertEqual(
            committee.multiple_choice.get(value="Engineering").go_to_section,
            engineering,
        )

    @patch("clubs.views.google_api_call", return_value=FORM)
    def test_non_officers_cannot_import(self, google_api_call):
        self.client.login(username="outsider", password="test")
        self.assertEqual(self._import().status_code, 403)
        self.client.logout()
        self.assertEqual(self._import().status_code, 403)
        google_api_call.assert_not_called()

    @override_settings(SOCIAL_AUTH_GOOGLE_OAUTH2_KEY="key")
    def test_officer_without_google_is_asked_to_connect(self):
        self.client.login(username="officer", password="test")
        resp = self._import()
        self.assertEqual(resp.status_code, 403, resp.content)
        self.assertEqual(resp.data["code"], "google_not_connected")

    @patch(
        "clubs.views.create_spreadsheet",
        return_value="https://docs.google.com/spreadsheets/d/1",
    )
    def test_export_to_sheets(self, create_spreadsheet):
        self.client.login(username="officer", password="test")
        rows = [["Name", "Year"], ["Ada", "2027"]]
        resp = self.client.post(
            reverse("google-sheets"),
            {"title": "Responses", "rows": rows},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.data["url"], "https://docs.google.com/spreadsheets/d/1")
        create_spreadsheet.assert_called_once_with(self.officer, "Responses", rows)

    def test_export_to_sheets_rejects_bad_rows(self):
        self.client.login(username="officer", password="test")
        resp = self.client.post(
            reverse("google-sheets"),
            {"rows": "not rows"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)


class CheckboxAndRequiredTestCase(TestCase):
    """
    Tests for checkbox and required questions in POST /api/users/question_response
    """

    def setUp(self):
        self.client = Client()
        user = get_user_model().objects.create_user(
            username="applicant", password="test", email="applicant@example.com"
        )
        profile = user.profile
        profile.graduation_year = timezone.now().year + 1
        profile.school.add(School.objects.create(name="Test School", is_graduate=False))
        profile.major.add(Major.objects.create(name="Test Major"))
        profile.save()
        self.client.login(username="applicant", password="test")

        now = timezone.now()
        club = Club.objects.create(code="test-club", name="Test Club", active=True)
        application = ClubApplication.objects.create(
            name="App",
            club=club,
            application_start_time=now - datetime.timedelta(days=1),
            application_end_time=now + datetime.timedelta(days=7),
            result_release_time=now + datetime.timedelta(days=14),
        )
        self.checkbox = ApplicationQuestion.objects.create(
            question_type=ApplicationQuestion.CHECKBOX,
            prompt="Interests",
            application=application,
        )
        for value in ["Design", "Code", "Events"]:
            self.checkbox.multiple_choice.create(value=value)
        self.required = ApplicationQuestion.objects.create(
            question_type=ApplicationQuestion.SHORT_ANSWER,
            prompt="Name",
            required=True,
            application=application,
        )

    def _post(self, answers):
        return self.client.post(
            reverse("users-question-response"),
            {"questionIds": list(answers), "committee": None, **answers},
            content_type="application/json",
        )

    def test_checkbox_saves_every_selected_option(self):
        resp = self._post(
            {
                str(self.checkbox.id): {"multipleChoices": ["Design", "Events"]},
                str(self.required.id): {"text": "Ada"},
            }
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        response = ApplicationQuestionResponse.objects.get(question=self.checkbox)
        self.assertEqual(
            sorted(response.selected_choices.values_list("value", flat=True)),
            ["Design", "Events"],
        )

    def test_unanswered_required_question_is_rejected(self):
        resp = self._post({str(self.checkbox.id): {"multipleChoices": ["Code"]}})
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertIn("Name", resp.data["detail"])
        self.assertFalse(ApplicationQuestionResponse.objects.exists())


class QuestionOptionsTestCase(TestCase):
    def test_editing_options_keeps_answers_to_unchanged_options(self):
        officer = get_user_model().objects.create_user(
            username="officer", password="test", email="officer@example.com"
        )
        applicant = get_user_model().objects.create_user(
            username="applicant", password="test", email="applicant@example.com"
        )
        now = timezone.now()
        club = Club.objects.create(code="test-club", name="Test Club")
        Membership.objects.create(
            person=officer, club=club, role=Membership.ROLE_OFFICER
        )
        application = ClubApplication.objects.create(
            club=club,
            application_start_time=now,
            application_end_time=now + datetime.timedelta(days=7),
            result_release_time=now + datetime.timedelta(days=14),
        )
        question = ApplicationQuestion.objects.create(
            question_type=ApplicationQuestion.MULTIPLE_CHOICE,
            prompt="Year",
            application=application,
        )
        kept = question.multiple_choice.create(value="2027")
        question.multiple_choice.create(value="2028")
        submission = ApplicationSubmission.objects.create(
            user=applicant, application=application
        )
        ApplicationQuestionResponse.objects.create(
            question=question, submission=submission, multiple_choice=kept
        )

        client = Client()
        client.login(username="officer", password="test")
        resp = client.patch(
            reverse(
                "club-application-questions-detail",
                args=(club.code, application.pk, question.pk),
            ),
            {"multiple_choice": [{"value": "2027"}, {"value": "2029"}]},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(
            sorted(question.multiple_choice.values_list("value", flat=True)),
            ["2027", "2029"],
        )
        self.assertEqual(
            ApplicationQuestionResponse.objects.get().multiple_choice, kept
        )


class ApplicationCommitteesTestCase(TestCase):
    def test_saving_other_settings_keeps_committees(self):
        officer = get_user_model().objects.create_user(
            username="officer", password="test", email="officer@example.com"
        )
        now = timezone.now()
        club = Club.objects.create(code="test-club", name="Test Club")
        Membership.objects.create(
            person=officer, club=club, role=Membership.ROLE_OFFICER
        )
        application = ClubApplication.objects.create(
            club=club,
            application_start_time=now - datetime.timedelta(days=1),
            application_end_time=now + datetime.timedelta(days=7),
            result_release_time=now + datetime.timedelta(days=14),
        )
        application.committees.create(name="Design")

        client = Client()
        client.login(username="officer", password="test")
        resp = client.patch(
            reverse("club-applications-detail", args=(club.code, application.pk)),
            {"name": "Renamed"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(
            list(application.committees.values_list("name", flat=True)), ["Design"]
        )


class RoutingTestCase(TestCase):
    """
    An application split like a Google Form: a committee question on the first
    page sends applicants to the Engineering or the Design section.
    """

    def setUp(self):
        self.officer = get_user_model().objects.create_user(
            username="officer", password="test", email="officer@example.com"
        )
        applicant = get_user_model().objects.create_user(
            username="applicant", password="test", email="applicant@example.com"
        )
        profile = applicant.profile
        profile.graduation_year = timezone.now().year + 1
        profile.school.add(School.objects.create(name="Test School", is_graduate=False))
        profile.major.add(Major.objects.create(name="Test Major"))
        profile.save()

        now = timezone.now()
        self.club = Club.objects.create(code="test-club", name="Test Club")
        Membership.objects.create(
            person=self.officer, club=self.club, role=Membership.ROLE_OFFICER
        )
        self.application = ClubApplication.objects.create(
            club=self.club,
            application_start_time=now - datetime.timedelta(days=1),
            application_end_time=now + datetime.timedelta(days=7),
            result_release_time=now + datetime.timedelta(days=14),
        )
        # engineering applicants finish after their own section
        self.eng = ApplicationSection.objects.create(
            application=self.application,
            title="Engineering",
            precedence=1,
            ends_application=True,
        )
        self.design = ApplicationSection.objects.create(
            application=self.application, title="Design", precedence=2
        )
        self.committee = ApplicationQuestion.objects.create(
            application=self.application,
            question_type=ApplicationQuestion.MULTIPLE_CHOICE,
            prompt="Which committee?",
            routes=True,
        )
        self.committee.multiple_choice.create(
            value="Engineering", go_to_section=self.eng
        )
        self.committee.multiple_choice.create(value="Design", go_to_section=self.design)
        self.github = ApplicationQuestion.objects.create(
            application=self.application,
            section=self.eng,
            prompt="GitHub",
            question_type=ApplicationQuestion.SHORT_ANSWER,
            required=True,
        )
        ApplicationQuestion.objects.create(
            application=self.application,
            section=self.design,
            prompt="Portfolio",
            question_type=ApplicationQuestion.SHORT_ANSWER,
            required=True,
        )
        self.client = Client()
        self.client.login(username="applicant", password="test")

    def test_answers_decide_the_sections(self):
        self.assertEqual(
            self.application.route({self.committee.pk: "Engineering"}),
            [None, self.eng.pk],
        )
        self.assertEqual(
            self.application.route({self.committee.pk: "Design"}),
            [None, self.design.pk],
        )
        # with no routing answer, sections follow in order
        self.assertEqual(self.application.route({}), [None, self.eng.pk])

    def _submit(self, answers):
        return self.client.post(
            reverse("users-question-response"),
            {"questionIds": list(answers), "committee": None, **answers},
            content_type="application/json",
        )

    def test_only_required_questions_on_the_route_are_checked(self):
        committee = str(self.committee.pk)
        github = str(self.github.pk)
        resp = self._submit({committee: {"multipleChoice": "Engineering"}})
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertIn("GitHub", resp.data["detail"])
        # the Design section's required portfolio is never asked of them
        resp = self._submit(
            {
                committee: {"multipleChoice": "Engineering"},
                github: {"text": "https://github.com/ada"},
            }
        )
        self.assertEqual(resp.status_code, 200, resp.content)

    def test_committee_question_sets_the_committees(self):
        self.application.application_start_time = timezone.now() + datetime.timedelta(
            days=1
        )
        self.application.save()
        client = Client()
        client.login(username="officer", password="test")
        url = reverse(
            "club-application-questions-detail",
            args=(self.club.code, self.application.pk, self.committee.pk),
        )
        resp = client.patch(
            url, {"committee_routing": True}, content_type="application/json"
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(
            sorted(self.application.committees.values_list("name", flat=True)),
            ["Design", "Engineering"],
        )

    def test_committee_options_lock_once_open(self):
        client = Client()
        client.login(username="officer", password="test")
        resp = client.patch(
            reverse(
                "club-application-questions-detail",
                args=(self.club.code, self.application.pk, self.committee.pk),
            ),
            {"committee_routing": True},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertFalse(self.application.committees.exists())

    def test_duplicate_gets_its_own_sections_and_routing(self):
        clone = self.application.make_clone()
        clone_eng = clone.sections.get(title="Engineering")
        self.assertNotEqual(clone_eng.pk, self.eng.pk)
        self.assertTrue(clone_eng.ends_application)
        self.assertEqual(clone.questions.get(prompt="GitHub").section, clone_eng)
        option = clone.questions.get(prompt="Which committee?").multiple_choice.get(
            value="Engineering"
        )
        self.assertEqual(option.go_to_section, clone_eng)
