import datetime

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from clubs.models import (
    ApplicationCommittee,
    ApplicationExtension,
    ApplicationQuestion,
    ApplicationQuestionResponse,
    ApplicationSubmission,
    Club,
    ClubApplication,
    Favorite,
    Subscribe,
)


CODE_PREFIX = "tracker-demo-"


class Command(BaseCommand):
    help = (
        "Populate one user's application tracker with a club application in every "
        "state the tracker can render: urgent and untouched, extended, partially "
        "answered, decided both ways, closed with no decision posted, and a past "
        "season. Layered on top of `populate`; re-running replaces its own data "
        "and leaves everything else alone."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--user",
            dest="username",
            default="bfranklin",
            help="Username to build the tracker for (default: bfranklin).",
        )

    def _club(self, slug, name):
        club, _ = Club.objects.get_or_create(
            code=f"{CODE_PREFIX}{slug}",
            defaults={"name": name, "active": True, "approved": True},
        )
        return club

    def _application(self, club, name, start, end, release, **kwargs):
        return ClubApplication.objects.create(
            name=name,
            club=club,
            application_start_time=start,
            application_end_time=end,
            result_release_time=release,
            **kwargs,
        )

    def _questions(self, application, count, committee=None):
        questions = []
        for i in range(count):
            question = ApplicationQuestion.objects.create(
                application=application,
                question_type=ApplicationQuestion.FREE_RESPONSE,
                prompt=f"Question {i + 1} for {application.name}",
                precedence=i,
                word_limit=250,
                committee_question=committee is not None,
            )
            if committee is not None:
                question.committees.add(committee)
            questions.append(question)
        return questions

    def _submit(self, user, application, questions, answered, committee=None, **kwargs):
        """
        Create a submission and answer the first `answered` questions. A blank
        answer stores no response row, which is what the app itself does, so
        `answered` is literally how many rows get written.
        """
        submission = ApplicationSubmission.objects.create(
            user=user, application=application, committee=committee, **kwargs
        )
        for question in questions[:answered]:
            ApplicationQuestionResponse.objects.create(
                question=question,
                submission=submission,
                text=f"Answer to {question.prompt}.",
            )
        return submission

    @transaction.atomic
    def handle(self, *args, **options):
        username = options["username"]
        user = get_user_model().objects.filter(username=username).first()
        if user is None:
            self.stdout.write(
                self.style.ERROR(
                    f"No user '{username}'. Run `manage.py populate` first, or pass "
                    f"--user."
                )
            )
            return

        # Re-runnable: drop only the clubs this command owns. Applications,
        # committees, questions and responses cascade; submissions are cleaned
        # up explicitly since ClubApplication sets them null rather than
        # deleting them.
        stale = Club.objects.filter(code__startswith=CODE_PREFIX)
        ApplicationSubmission.objects.filter(application__club__in=stale).delete()
        deleted = stale.count()
        stale.delete()

        now = timezone.now()
        day = datetime.timedelta(days=1)

        # 1. Bookmarked, open, closes in under a day, nothing submitted.
        labs = self._club("labs", "Tracker Demo Labs")
        Favorite.objects.get_or_create(person=user, club=labs)
        labs_app = self._application(
            labs, "Fall Application", now - 10 * day, now + day * 0.8, now + 14 * day
        )
        for name in ("Engineering", "Product Design", "Product Management"):
            ApplicationCommittee.objects.create(application=labs_app, name=name)
        self._questions(labs_app, 5)

        # 2. Subscribed, base deadline passed, personal extension still open.
        wharton = self._club("wharton", "Tracker Demo Consulting Club")
        Subscribe.objects.get_or_create(person=user, club=wharton)
        wharton_app = self._application(
            wharton,
            "WC Fall Application",
            now - 10 * day,
            now - day,
            now + 20 * day,
            is_wharton_council=True,
            external_url="https://wharton.upenn.edu/apply",
        )
        self._questions(wharton_app, 4)
        ApplicationExtension.objects.create(
            user=user, application=wharton_app, end_time=now + 6 * day
        )

        # 3. Bookmarked, open, two committees, one partial and one complete.
        review = self._club("review", "Tracker Demo Review")
        Favorite.objects.get_or_create(person=user, club=review)
        review_app = self._application(
            review, "Staff Application", now - 5 * day, now + 8 * day, now + 25 * day
        )
        shared = self._questions(review_app, 3)
        writing = ApplicationCommittee.objects.create(
            application=review_app, name="Writing"
        )
        editing = ApplicationCommittee.objects.create(
            application=review_app, name="Editing"
        )
        writing_qs = self._questions(review_app, 2, committee=writing)
        editing_qs = self._questions(review_app, 2, committee=editing)
        self._submit(user, review_app, shared + writing_qs, 3, committee=writing)
        self._submit(user, review_app, shared + editing_qs, 5, committee=editing)

        # 4. Closed and decided both ways on one application, to prove that
        #    outcome is per committee rather than per application.
        appetit = self._club("appetit", "Tracker Demo Appetit")
        Favorite.objects.get_or_create(person=user, club=appetit)
        appetit_app = self._application(
            appetit,
            "Editorial Application",
            now - 30 * day,
            now - 6 * day,
            now - 2 * day,
        )
        a_shared = self._questions(appetit_app, 4)
        a_writing = ApplicationCommittee.objects.create(
            application=appetit_app, name="Writing"
        )
        a_photo = ApplicationCommittee.objects.create(
            application=appetit_app, name="Photography"
        )
        self._submit(
            user,
            appetit_app,
            a_shared,
            4,
            committee=a_writing,
            status=ApplicationSubmission.ACCEPTED,
            reason="Loved your piece on the stormwater fee.",
            notified=True,
        )
        self._submit(
            user,
            appetit_app,
            a_shared,
            2,
            committee=a_photo,
            status=ApplicationSubmission.REJECTED_AFTER_INTERVIEW,
            reason="A very close call this cycle.",
            notified=True,
        )

        # 5. Closed, submitted, status set but never sent: must still read as
        #    pending, since nobody told the applicant.
        masala = self._club("masala", "Tracker Demo A Cappella")
        Favorite.objects.get_or_create(person=user, club=masala)
        masala_app = self._application(
            masala, "Auditions", now - 20 * day, now - 3 * day, now + 10 * day
        )
        masala_qs = self._questions(masala_app, 3)
        self._submit(
            user,
            masala_app,
            masala_qs,
            3,
            status=ApplicationSubmission.ACCEPTED,
            notified=False,
        )

        # 6. Submitted to a club the user never saved: in scope by submission.
        unsaved = self._club("unsaved", "Tracker Demo Research Society")
        unsaved_app = self._application(
            unsaved,
            "General Application",
            now - 40 * day,
            now - 12 * day,
            now - 5 * day,
        )
        unsaved_qs = self._questions(unsaved_app, 3)
        self._submit(
            user,
            unsaved_app,
            unsaved_qs,
            3,
            status=ApplicationSubmission.REJECTED_AFTER_WRITTEN,
            reason="We had 140 applicants for 12 spots.",
            notified=True,
        )

        # 7. Last season, for the past-applications disclosure.
        past_app = self._application(
            labs,
            "Spring Application",
            now - 200 * day,
            now - 180 * day,
            now - 170 * day,
        )
        past_qs = self._questions(past_app, 4)
        self._submit(
            user,
            past_app,
            past_qs,
            4,
            status=ApplicationSubmission.ACCEPTED,
            reason="Welcome aboard.",
            notified=True,
        )

        # 8. Open at a club the user does NOT follow: must stay out of the
        #    tracker, and is what the discovery count would pick up.
        hidden = self._club("hidden", "Tracker Demo Unfollowed Club")
        hidden_app = self._application(
            hidden, "Open Application", now - day, now + 5 * day, now + 30 * day
        )
        self._questions(hidden_app, 3)

        saved = Favorite.objects.filter(person=user).count()
        subscribed = Subscribe.objects.filter(person=user).count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Application tracker populated for {username} "
                f"(replaced {deleted} demo club(s)).\n"
                f"  Action needed:  1 urgent, 1 extended\n"
                f"  Submitted open: 1 application, 2 committees (3/5 and 5/5)\n"
                f"  Closed:         1 accepted + 1 rejected on one application,\n"
                f"                  1 decided-but-unsent, 1 at an unsaved club\n"
                f"  Past season:    1\n"
                f"  Out of scope:   1 open application at an unfollowed club\n"
                f"  saved_club_count should be {saved + subscribed}"
            )
        )
