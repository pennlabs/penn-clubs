import asyncio
import datetime
import random
import time

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from rest_framework import APIRequestFactory

from clubs.models import ApplicationQuestion, Club, ClubApplication


class Command(BaseCommand):
    help = """
        Runs stress tests on Penn Clubs database to assess performance
        upgrades on club submissions.
        """

    def setUp(self):
        self.prefix = "test_club_"
        self.factory = APIRequestFactory()
        self.uri = "/users/"
        self.club_question_ids = []

    async def submit_application(self, user, club_idx):
        start_time = time.time()
        data = {
            "questionIds": self.club_question_ids[club_idx],
        }
        for question_id in self.club_question_ids[club_idx]:
            data[question_id] = "This is a test answer."
        request = self.factory.post(self.uri, data)
        request.user = user

        self.view(request)
        end_time = time.time()
        return end_time - start_time

    async def handle(self, *args, **kwargs):
        random.seed(0)
        subset_size = 0.5
        num_clubs = 6
        num_users = 10

        # Create Clubs & Club Applications
        now = timezone.now()
        for i in range(num_clubs):
            questions = []
            # Create Club Object
            club = Club.objects.create(code=(self.prefix + i), name=(f"Test Club {i}"))
            # Create Club Application
            application = ClubApplication.objects.create(
                name="Test Application",
                club=club,
                application_start_time=now - datetime.timedelta(days=1),
                application_end_time=now + datetime.timedelta(days=3),
                result_release_time=now + datetime.timedelta(weeks=1),
                external_url="https://pennlabs.org/",
            )
            # Create Simple Application Questions
            for _ in range(5):
                question = ApplicationQuestion.objects.create(
                    question_type=ApplicationQuestion.FREE_RESPONSE,
                    prompt="Answer the prompt you selected",
                    word_limit=150,
                    application=application,
                )
                questions.append(question.id)
            self.club_question_ids.append(questions)

        # Create Users (Applicants)
        users = []
        for i in range(num_users):
            users.append(
                get_user_model().objects.create_user(
                    str(i), str(i) + "@upenn.edu", "test"
                )
            )

        # Performance Testing!
        # Randomly choose some subset of clubs (size: clubs_per_user).
        # Then apply to them 3 times each in a random order.
        user_application_pairs = []
        clubs_per_user = round(subset_size * num_clubs)

        for user in users:
            current_user_clubs = set()
            while current_user_clubs < clubs_per_user:
                next_int = random.randint()
                if next_int not in current_user_clubs:
                    user_application_pairs.extend([tuple(user, next_int)] * 3)
        random.shuffle(user_application_pairs)

        start_time = time.time()
        tasks = []
        for i in range(len(user_application_pairs)):
            task = asyncio.create_task(
                self.submit_application(
                    user_application_pairs[i][0], user_application_pairs[i][1]
                )
            )
            tasks.append(task)
            all_tasks = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()

        print(f"Average task time was: {sum(all_tasks) / len(all_tasks)} seconds.")
        print(f"Total processing time was: {end_time - start_time} seconds.")

        # Tear Down
        test_clubs = Club.objects.filter(code__starts_with=self.prefix)
        for club in test_clubs:
            club.delete()
        for user in users:
            user.delete()
