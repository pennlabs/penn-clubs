import datetime

import pytz
from django.core.management.base import BaseCommand

from clubs.models import (
    ApplicationMultipleChoice,
    ApplicationQuestion,
    Badge,
    Club,
    ClubApplication,
)


class Command(BaseCommand):
    help = "Helper to automatically create the Wharton council club applications."
    web_execute = True

    def handle(self, *args, **kwargs):
        wc_badge = Badge.objects.filter(
            label="Wharton Council", purpose="org",
        ).first()
        eastern = pytz.timezone("America/New_York")
        application_start_time = datetime.datetime(2021, 9, 4, 0, 0, tzinfo=eastern)
        application_end_time = datetime.datetime(2021, 9, 20, 2, 0, tzinfo=eastern)
        result_release_time = datetime.datetime(2021, 10, 4, 0, 0, tzinfo=eastern)

        wc_clubs = []
        for club in Club.objects.all():
            if wc_badge in club.badges.all():
                wc_clubs.append(club)

        prompt_one = (
            "Tell us about a time you took initiative or demonstrated leadership"
        )
        prompt_two = "Tell us about a time you faced a challenge and how you solved it"
        prompt_three = "Tell us about a time you collaborated well in a team"
        for club in wc_clubs:
            name = f"{club.name} Application"
            application = ClubApplication.objects.create(
                name=name,
                club=club,
                application_start_time=application_start_time,
                application_end_time=application_end_time,
                result_release_time=result_release_time,
                is_wharton_council=True,
            )
            link = (
                f"https://pennclubs.com/club/{club.code}/application/{application.pk}"
            )
            application.external_url = link
            prompt = "Choose one of the following prompts for your personal statement"
            prompt_question = ApplicationQuestion.objects.create(
                question_type=ApplicationQuestion.MULTIPLE_CHOICE,
                application=application,
                prompt=prompt,
            )
            ApplicationMultipleChoice.objects.create(
                value=prompt_one, question=prompt_question
            )
            ApplicationMultipleChoice.objects.create(
                value=prompt_two, question=prompt_question
            )
            ApplicationMultipleChoice.objects.create(
                value=prompt_three, question=prompt_question
            )
            ApplicationQuestion.objects.create(
                question_type=ApplicationQuestion.FREE_RESPONSE,
                prompt="Answer the prompt you selected",
                word_limit=150,
                application=application,
            )
