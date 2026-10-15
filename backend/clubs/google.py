"""
Talks to Google on behalf of a user who linked their Google account, to import
Google Forms as club applications and to export responses to Google Sheets
"""

import re

import requests
from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from social_core.exceptions import SocialAuthBaseException
from social_django.utils import load_strategy

from clubs.models import ApplicationQuestion


FORMS_API = "https://forms.googleapis.com/v1/forms/{}"
SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets"


class GoogleNotConnected(APIException):
    """
    The user has not linked a Google account with the access we need, so the
    frontend should send them through Google sign-in
    """

    status_code = status.HTTP_403_FORBIDDEN

    def __init__(self):
        super().__init__(
            {
                "detail": "Connect your Google account to continue.",
                "code": "google_not_connected",
            }
        )


def google_api_call(user, verb, url, **kwargs):
    """
    Call a Google API as the given user, refreshing their access token if needed
    """
    if not settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY:
        raise ValidationError("Server is not configured with Google credentials.")

    social = user.social_auth.filter(provider="google-oauth2").first()
    if social is None:
        raise GoogleNotConnected()
    try:
        token = social.get_access_token(load_strategy())
    except (requests.HTTPError, SocialAuthBaseException):
        # the user revoked our access, so they need to sign in again
        raise GoogleNotConnected()

    resp = requests.request(
        verb,
        url,
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
        **kwargs,
    )
    if resp.ok:
        return resp.json()

    try:
        error = resp.json().get("error", {})
    except ValueError:
        error = {}
    # Google lets users untick permissions on its consent screen
    if resp.status_code == 401 or "SCOPE_INSUFFICIENT" in str(error.get("details")):
        raise GoogleNotConnected()
    if resp.status_code in (403, 404):
        raise ValidationError(
            "Google couldn't find that, or your Google account doesn't have access "
            "to it."
        )
    raise ValidationError(error.get("message") or "Google rejected the request.")


def parse_form_id(link):
    """
    Get the form ID from the link to a Google Form's editor, or a bare form ID
    """
    link = link.strip()
    # links for filling out a form use a different ID that the API rejects
    if "/forms/d/e/" in link or "forms.gle" in link:
        raise ValidationError(
            "That's the link for filling out the form. Open the form for editing "
            "and copy the link from your browser's address bar instead."
        )
    match = re.search(r"/forms/d/([\w-]+)", link)
    if match:
        return match.group(1)
    if re.fullmatch(r"[\w-]{20,}", link):
        return link
    raise ValidationError("That doesn't look like a link to a Google Form.")


def form_to_questions(form):
    """
    Convert a Google Form, as returned by the Forms API, into application questions
    and sections, and list anything that could not be carried over exactly.

    Each question names its section by the Google item ID of the page break that
    starts it, or None for the first page, and a routing question maps option
    values to the section they lead to, or "end" for submitting the form.
    """
    questions, sections, warnings = [], [], []
    section = None

    def add(
        question_type, prompt, description="", required=False, choices=(), routing=None
    ):
        questions.append(
            {
                "question_type": question_type,
                "prompt": prompt,
                "description": description,
                "required": required,
                "choices": list(choices),
                "section": section,
                "routing": routing or {},
            }
        )

    # the form's own intro, shown at the top like on Google Forms
    info = form.get("info", {})
    if info.get("description"):
        add(ApplicationQuestion.INFO_TEXT, info.get("title", ""), info["description"])

    for item in form.get("items", []):
        title = item.get("title", "")
        description = item.get("description", "")
        name = f'"{title}"' if title else "An untitled item"

        if "questionItem" in item:
            question = item["questionItem"]["question"]
            required = question.get("required", False)
            if "image" in item["questionItem"]:
                warnings.append(f"{name} has an image, which was left out.")

            if "textQuestion" in question:
                question_type = (
                    ApplicationQuestion.FREE_RESPONSE
                    if question["textQuestion"].get("paragraph")
                    else ApplicationQuestion.SHORT_ANSWER
                )
                add(question_type, title, description, required)
            elif "choiceQuestion" in question:
                choice = question["choiceQuestion"]
                options = choice.get("options", [])
                values = [opt["value"] for opt in options if not opt.get("isOther")]
                # where each option leads, for "go to section based on answer"
                routing = {
                    opt.get("value", "Other"): opt.get("goToSectionId")
                    or ("end" if opt.get("goToAction") == "SUBMIT_FORM" else None)
                    for opt in options
                }
                routing = {value: to for value, to in routing.items() if to}
                if len(values) < len(options):
                    values.append("Other")
                    warnings.append(
                        f'{name} has an "Other" option. Applicants can pick it, but '
                        "can't type in their own answer."
                    )
                question_type = (
                    ApplicationQuestion.CHECKBOX
                    if choice.get("type") == "CHECKBOX"
                    else ApplicationQuestion.MULTIPLE_CHOICE
                )
                add(question_type, title, description, required, values, routing)
            elif "scaleQuestion" in question:
                # Google leaves out zero values, so a missing low end means 0
                scale = question["scaleQuestion"]
                low, high = scale.get("low", 0), scale.get("high", 0)
                labels = ", ".join(
                    f"{end} = {scale[key]}"
                    for end, key in ((low, "lowLabel"), (high, "highLabel"))
                    if scale.get(key)
                )
                add(
                    ApplicationQuestion.MULTIPLE_CHOICE,
                    title,
                    " ".join(filter(None, [description, labels])),
                    required,
                    [str(n) for n in range(low, high + 1)],
                )
            elif "ratingQuestion" in question:
                levels = question["ratingQuestion"].get("ratingScaleLevel", 0)
                add(
                    ApplicationQuestion.MULTIPLE_CHOICE,
                    title,
                    description,
                    required,
                    [str(n) for n in range(1, levels + 1)],
                )
            elif "dateQuestion" in question or "timeQuestion" in question:
                if "dateQuestion" in question:
                    hint = (
                        "Enter a date and time."
                        if question["dateQuestion"].get("includeTime")
                        else "Enter a date."
                    )
                else:
                    hint = (
                        "Enter a duration."
                        if question["timeQuestion"].get("duration")
                        else "Enter a time."
                    )
                add(
                    ApplicationQuestion.SHORT_ANSWER,
                    title,
                    " ".join(filter(None, [description, hint])),
                    required,
                )
            elif "fileUploadQuestion" in question:
                warnings.append(
                    f"{name} is a file upload, which Penn Clubs doesn't support, so "
                    "it was skipped."
                )
            else:
                warnings.append(
                    f"{name} is a kind of question Penn Clubs doesn't support, so it "
                    "was skipped."
                )
        elif "questionGroupItem" in item:
            group = item["questionGroupItem"]
            columns = group.get("grid", {}).get("columns", {})
            question_type = (
                ApplicationQuestion.CHECKBOX
                if columns.get("type") == "CHECKBOX"
                else ApplicationQuestion.MULTIPLE_CHOICE
            )
            values = [opt["value"] for opt in columns.get("options", [])]
            for row in group.get("questions", []):
                add(
                    question_type,
                    f"{title}: {row['rowQuestion']['title']}",
                    description,
                    row.get("required", False),
                    values,
                )
            warnings.append(f"{name} is a grid, so each row became its own question.")
        elif "pageBreakItem" in item:
            section = item.get("itemId")
            sections.append(
                {"key": section, "title": title, "description": description}
            )
        elif "textItem" in item:
            if title or description:
                add(ApplicationQuestion.INFO_TEXT, title, description)
        else:
            warnings.append(f"{name} is an image or video, which was left out.")

    return questions, sections, warnings


def create_spreadsheet(user, title, rows):
    """
    Create a Google Sheet holding the given rows in the user's Drive, with the first
    row frozen as a header, and return its link
    """
    sheet = google_api_call(
        user,
        "POST",
        SHEETS_API,
        json={
            "properties": {"title": title},
            "sheets": [
                {
                    "properties": {"gridProperties": {"frozenRowCount": 1}},
                    "data": [
                        {
                            "rowData": [
                                {
                                    "values": [
                                        {
                                            "userEnteredValue": {
                                                "stringValue": ""
                                                if cell is None
                                                else str(cell)
                                            }
                                        }
                                        for cell in row
                                    ]
                                }
                                for row in rows
                            ]
                        }
                    ],
                }
            ],
        },
    )
    return sheet["spreadsheetUrl"]
