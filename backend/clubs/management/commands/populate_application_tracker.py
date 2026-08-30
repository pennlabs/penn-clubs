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

    def _application(
        self, club, name, start, end, release, current_season=True, **kwargs
    ):
        """
        ClubApplication.season buckets anything starting before August as
        "Spring", so a current-season fixture has its start clamped to the
        season boundary. Without it, running this command in early August
        files half the data under last season.
        """
        if current_season:
            boundary = start.replace(
                month=8 if end.month >= 8 else 1,
                day=1,
                hour=0,
                minute=0,
                second=0,
                microsecond=0,
            )
            start = min(max(start, boundary), end - datetime.timedelta(days=1))
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

    def _submit(
        self,
        user,
        application,
        questions,
        answered,
        committee=None,
        days_before_close=2,
        **kwargs,
    ):
        """
        Create a submission and answer the first `answered` questions. A blank
        answer stores no response row, which is what the app itself does, so
        `answered` is literally how many rows get written.

        created_at is auto_now_add, so it has to be rewritten afterwards.
        Left alone, every submission is stamped with the moment this command
        ran, and closed applications end up claiming they were submitted after
        their own deadline.
        """
        submission = ApplicationSubmission.objects.create(
            user=user, application=application, committee=committee, **kwargs
        )
        latest = min(application.application_end_time, timezone.now())
        submitted_at = max(
            latest - datetime.timedelta(days=days_before_close),
            application.application_start_time + datetime.timedelta(hours=1),
        )
        ApplicationSubmission.objects.filter(pk=submission.pk).update(
            created_at=submitted_at
        )
        submission.created_at = submitted_at
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
        self._submit(
            user,
            review_app,
            shared + writing_qs,
            3,
            committee=writing,
            days_before_close=6,
        )
        self._submit(
            user,
            review_app,
            shared + editing_qs,
            5,
            committee=editing,
            days_before_close=4,
        )

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
            days_before_close=5,
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
            days_before_close=3,
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
            current_season=False,
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

        # 9. A second and third in-progress application, including one where
        #    nothing was answered at all - possible because the submit flow
        #    never checks completeness.
        consult = self._club("consult", "Tracker Demo Consulting Group")
        Favorite.objects.get_or_create(person=user, club=consult)
        consult_app = self._application(
            consult, "Fall Application", now - 6 * day, now + 11 * day, now + 30 * day
        )
        self._submit(user, consult_app, self._questions(consult_app, 6), 4)

        outing = self._club("outing", "Tracker Demo Outing Club")
        Favorite.objects.get_or_create(person=user, club=outing)
        outing_app = self._application(
            outing,
            "Trip Leader Application",
            now - 4 * day,
            now + 13 * day,
            now + 35 * day,
        )
        self._submit(user, outing_app, self._questions(outing_app, 4), 0)

        # 9b. Extensions in their other two shapes: one on an application
        #     that is still open anyway (so the badge and the countdown have
        #     to agree on the later date), and one on an application the user
        #     has already submitted to.
        design = self._club("design", "Tracker Demo Design Collective")
        Favorite.objects.get_or_create(person=user, club=design)
        design_app = self._application(
            design, "Studio Application", now - 8 * day, now + 3 * day, now + 30 * day
        )
        self._questions(design_app, 4)
        ApplicationExtension.objects.create(
            user=user, application=design_app, end_time=now + 10 * day
        )

        ApplicationExtension.objects.create(
            user=user, application=consult_app, end_time=now + 18 * day
        )

        # 10. Enough untouched open applications that the Action needed section
        #     has to collapse, across the full range of deadline urgency. The
        #     last one is deliberately long enough to stress the layout.
        for slug, club_name, app_name, closes_in in [
            ("physics", "Tracker Demo Physics Society", "Board Application", 2),
            ("debate", "Tracker Demo Debate Union", "Fall Recruitment", 4),
            ("finance", "Tracker Demo Finance Group", "Analyst Application", 5),
            ("dance", "Tracker Demo Dance Company", "Company Auditions", 9),
            ("robotics", "Tracker Demo Robotics Team", "Build Team Application", 16),
            (
                "longname",
                "Tracker Demo Society for the Study of Exceedingly Long Club Names",
                "Application for the Committee on Exceedingly Long Application Names",
                6,
            ),
        ]:
            club = self._club(slug, club_name)
            Favorite.objects.get_or_create(person=user, club=club)
            app = self._application(
                club, app_name, now - 7 * day, now + closes_in * day, now + 40 * day
            )
            self._questions(app, 4)

        # 11. Enough closed applications that Closed collapses too. Start times
        #     stay inside the current season - ClubApplication.season calls
        #     anything starting before August "Spring".
        for slug, club_name, app_name, closed_days in [
            ("chorale", "Tracker Demo Chorale", "Auditions", 9),
            ("gazette", "Tracker Demo Gazette", "Staff Application", 12),
            ("chess", "Tracker Demo Chess Club", "Team Application", 15),
        ]:
            club = self._club(slug, club_name)
            Favorite.objects.get_or_create(person=user, club=club)
            app = self._application(
                club,
                app_name,
                now - (closed_days + 10) * day,
                now - closed_days * day,
                now - (closed_days - 5) * day,
            )
            self._submit(user, app, self._questions(app, 3), 3)

        # 12. Two more past-season applications for the disclosure.
        for slug, app_name, ago in [
            ("gazette", "Spring Staff Application", 210),
            ("chorale", "Spring Auditions", 220),
        ]:
            club = Club.objects.get(code=f"{CODE_PREFIX}{slug}")
            app = self._application(
                club,
                app_name,
                now - ago * day,
                now - (ago - 20) * day,
                now - (ago - 30) * day,
                current_season=False,
            )
            self._submit(
                user,
                app,
                self._questions(app, 3),
                3,
                status=ApplicationSubmission.REJECTED_AFTER_WRITTEN,
                reason="Not this cycle.",
                notified=True,
            )

        saved = Favorite.objects.filter(person=user).count()
        subscribed = Subscribe.objects.filter(person=user).count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Application tracker populated for {username} "
                f"(replaced {deleted} demo club(s)).\n"
                f"  Action needed:  8 - one closing in hours, one open only via\n"
                f"                  a personal extension, one on an external\n"
                f"                  site, one with names long enough to wrap\n"
                f"  Submitted open: 3 - committees at 3/5 and 5/5, one at 4/6,\n"
                f"                  and one submitted with nothing answered\n"
                f"  Closed:         6 - accepted and rejected on the same\n"
                f"                  application, rejected after written, one\n"
                f"                  decided but never sent, three with no\n"
                f"                  decision posted\n"
                f"  Past season:    3\n"
                f"  Out of scope:   1 open application at an unfollowed club\n"
                f"  saved_club_count should be {saved + subscribed}\n"
                f"\n  Empty state: log in as any other populate user "
                f"(jadams, ajackson) - they follow nothing."
            )
        )
