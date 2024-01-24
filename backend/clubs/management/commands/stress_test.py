import asyncio
import datetime
import logging
import random
import time

from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db.models import Prefetch
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from clubs.models import ApplicationQuestion, Club, ClubApplication
from clubs.views import UserViewSet


class Command(BaseCommand):
    help = """
        Runs stress tests on Penn Clubs database to assess performance
        upgrades on club submissions.
        """

    def setUp(self):
        self.num_clubs = 500
        self.num_users = 1000
        self.subset_size = 3
        self.num_questions_per_club = 5
        self.total_submissions = 3
        self.club_prefix = "test_club_"
        self.user_prefix = "test_user_"

        self.uri = "/users/question_response/"
        self.factory = APIRequestFactory()
        self.view = UserViewSet.as_view({"post": "question_response"})

        self.club_question_ids = {}
        self.users = []
        now = timezone.now()

        # Create Clubs
        clubs = [
            Club(code=(self.club_prefix + str(i)), name=(f"Test Club {i}"))
            for i in range(self.num_clubs)
        ]
        Club.objects.bulk_create(clubs)
        clubs = Club.objects.filter(code__startswith=self.club_prefix)

        # Create Club Applications
        applications = [
            ClubApplication(
                name="Test Application",
                club=club,
                application_start_time=now - datetime.timedelta(days=1),
                application_end_time=now + datetime.timedelta(days=3),
                result_release_time=now + datetime.timedelta(weeks=1),
                external_url="https://pennlabs.org/",
            )
            for club in clubs
        ]
        ClubApplication.objects.bulk_create(applications)
        applications = ClubApplication.objects.filter(club__in=clubs)

        # Create Club Application Questions
        questions = [
            ApplicationQuestion(
                question_type=ApplicationQuestion.FREE_RESPONSE,
                prompt="Answer the prompt you selected",
                word_limit=150,
                application=application,
            )
            for application in applications
        ]
        ApplicationQuestion.objects.bulk_create(questions)

        clubs_data = Club.objects.filter(
            code__startswith=self.club_prefix
        ).prefetch_related(
            Prefetch(
                "clubapplication_set",
                queryset=ClubApplication.objects.prefetch_related("questions"),
            )
        )
        for club in clubs_data:
            question_ids = [
                str(question.id)
                for application in club.clubapplication_set.all()
                for question in application.questions.all()
            ]
            self.club_question_ids[club.id] = question_ids
        print("Finished setting up clubs.")

        # Create Users (Applicants)
        User = get_user_model()
        User.objects.bulk_create(
            [
                User(
                    username=self.user_prefix + str(i),
                    email=str(i) + "@upenn.edu",
                    password="test",
                )
                for i in range(self.num_users)
            ]
        )
        self.users = list(User.objects.filter(username__startswith=self.user_prefix))
        print("Finished setting up users.")

    @sync_to_async
    def submit_application(self, user, club_id):
        start_time = time.time()
        data = {
            "questionIds": self.club_question_ids[club_id],
        }
        for question_id in self.club_question_ids[club_id]:
            data[question_id] = {"text": "This is a test answer."}

        request = self.factory.post(self.uri, data, format="json")
        request.user = user

        self.view(request)
        end_time = time.time()
        return end_time - start_time

    def tearDown(self):
        Club.objects.filter(code__startswith=self.club_prefix).delete()
        for user in self.users:
            user.delete()

    async def handleAsync(self, *args, **kwargs):
        random.seed(0)

        # Performance Testing!
        # Randomly choose some subset of clubs (size: clubs_per_user).
        # Then apply to them 3 times each in a random order.
        user_application_pairs = []
        club_keys = list(self.club_question_ids.keys())

        for user in self.users:
            sample = random.sample(club_keys, self.subset_size)
            for club_id in sample:
                user_application_pairs.extend(
                    [(user, club_id)] * self.total_submissions
                )
        random.shuffle(user_application_pairs)
        print("Finished generating and shuffling pairs.")

        print("Starting Stress Test.")
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

        print(f"Throughput was: {sum(all_tasks) / len(all_tasks)} seconds per txn.")
        print(f"Total processing time was: {end_time - start_time} seconds.")

    def handle(self, *args, **kwargs):
        self.setUp()
        try:
            asyncio.run(self.handleAsync(args, kwargs))
            # self.tearDown()
        except Exception as e:
            print(e)
            logging.exception("Something happened!")
            # self.tearDown()
