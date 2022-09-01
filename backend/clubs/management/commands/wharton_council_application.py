from datetime import datetime

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

    def add_arguments(self, parser):
        parser.add_argument(
            "application_start_time",
            type=str,
            help="Date and time at which the centralized application opens.",
        )
        parser.add_argument(
            "application_end_time",
            type=str,
            help="Date and time at which the centralized application closes.",
        )
        parser.add_argument(
            "result_release_time",
            type=str,
            help="Date and time at which the centralized application results "
            "are released.",
        )
        parser.add_argument(
            "--dry-run",
            dest="dry_run",
            action="store_true",
            help="Do not actually create applications.",
        )
        parser.add_argument(
            "--clubs",
            dest="clubs",
            type=str,
            help="The comma separated list of club codes for which to create the "
            "centralized applications.",
        )
        parser.set_defaults(
            application_start_time="2021-09-04 00:00:00",
            application_end_time="2021-09-04 00:00:00",
            result_release_time="2021-09-04 00:00:00",
            dry_run=False,
            clubs="",
        )

    def handle(self, *args, **kwargs):
        dry_run = kwargs["dry_run"]
        club_names = list(map(lambda x: x.strip(), kwargs["clubs"].split(",")))
        clubs = []

        if club_names == [] or all(not name for name in club_names):
            wc_badge = Badge.objects.filter(
                label="Wharton Council", purpose="org",
            ).first()
            for club in Club.objects.all():
                if wc_badge in club.badges.all():
                    clubs.append(club)
        else:
            for code in club_names:
                target_club = Club.objects.filter(code=code).first()
                if target_club is not None:
                    clubs.append(target_club)

        application_start_time = datetime.strptime(
            kwargs["application_start_time"], "%Y-%m-%d %H:%M:%S"
        )
        application_end_time = datetime.strptime(
            kwargs["application_end_time"], "%Y-%m-%d %H:%M:%S"
        )
        result_release_time = datetime.strptime(
            kwargs["result_release_time"], "%Y-%m-%d %H:%M:%S"
        )

        prompt_one = (
            "Tell us about a time you took " "initiative or demonstrated leadership"
        )
        prompt_two = "Tell us about a time you faced a challenge and how you solved it"
        prompt_three = "Tell us about a time you collaborated well in a team"

        if len(clubs) == 0:
            self.stdout.write("No valid club codes provided, returning...")

        for club in clubs:
            name = f"{club.name} Application"
            if dry_run:
                self.stdout.write(f"Would have created application for {club.name}")
            else:
                self.stdout.write(f"Creating application for {club.name}")
                application = ClubApplication.objects.create(
                    name=name,
                    club=club,
                    application_start_time=application_start_time,
                    application_end_time=application_end_time,
                    result_release_time=result_release_time,
                    is_wharton_council=True,
                )
                external_url = (
                    f"https://pennclubs.com/club/{club.code}/"
                    f"application/{application.pk}"
                )
                application.external_url = external_url
                application.save()
                prompt = (
                    "Choose one of the following " "prompts for your personal statement"
                )
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
