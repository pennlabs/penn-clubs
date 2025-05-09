import datetime
import os
import re
import uuid
import warnings
from email.mime.image import MIMEImage
from io import BytesIO
from smtplib import SMTPAuthenticationError, SMTPServerDisconnected
from urllib.parse import urlparse

import pytz
import qrcode
import requests
import yaml
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.mail import EmailMultiAlternatives
from django.core.validators import validate_email
from django.db import models, transaction
from django.db.models import Sum
from django.db.models.deletion import ProtectedError
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.utils.functional import cached_property
from ics import Calendar
from jinja2 import Environment, meta
from model_clone.models import CloneModel
from phonenumber_field.modelfields import PhoneNumberField
from simple_history.models import HistoricalRecords
from urlextract import URLExtract

from clubs.utils import clean, get_django_minified_image, get_domain, html_to_text


subject_regex = re.compile(r"\s*<!--\s*SUBJECT:\s*(.*?)\s*-->", re.I)
types_regex = re.compile(r"\s*<!--\s*TYPES:\s*(.*?)\s*-->", re.DOTALL)


def get_mail_type_annotation(name):
    """
    Given a template name, return the type annotation metadata.
    """
    prefix = {"fyh": "fyh_emails"}.get(settings.BRANDING, "emails")
    path = os.path.join(settings.BASE_DIR, "templates", prefix, f"{name}.html")
    with open(path, "r") as f:
        contents = f.read()
    match = types_regex.search(contents)
    if match is not None:
        return yaml.safe_load(match.group(1).strip())
    return None


def send_mail_helper(
    name, subject, emails, context, attachment=None, reply_to=None, num_retries=2
):
    """
    A helper to send out an email given the template name, subject, to emails,
    and context. Returns true if an email was sent out, or false if no emails
    were sent out.

    All emails should go through this function.
    """
    if not all(isinstance(email, str) for email in emails):
        raise ValueError("The to email argument must be a list of strings!")

    # emulate django behavior of silently returning without recipients
    emails = [email for email in emails if email]
    if not emails:
        return False

    # load email template
    prefix = {"fyh": "fyh_emails"}.get(settings.BRANDING, "emails")
    html_content = render_to_string(f"{prefix}/{name}.html", context)

    # use subject from template if it exists
    # subject should match: <!-- SUBJECT: (subject) --> and be the first line
    match = subject_regex.search(html_content)
    if match is not None:
        subject = match.group(1)
        html_content = subject_regex.sub("", html_content, count=1)

    # remove type annotation comment
    match = types_regex.search(html_content)
    if match is not None:
        html_content = types_regex.sub("", html_content, count=1)
    else:
        warnings.warn(
            f"There is no type annotation information for the template '{name}'! "
            "Email previews may work incorrectly without type information.",
            SyntaxWarning,
        )

    if subject is None:
        raise ValueError(
            "You must specify a email subject as an argument or in the template! \n"
            f"The following output was generated from the template:\n\n{html_content}"
        )

    # generate text alternative
    text_content = html_to_text(html_content)

    msg = EmailMultiAlternatives(
        subject, text_content, settings.FROM_EMAIL, list(set(emails)), reply_to=reply_to
    )

    if attachment is not None:
        if "filename" in attachment and "path" in attachment:
            with open(attachment["path"], "rb") as file:
                msg.attach(
                    attachment["filename"],
                    file.read(),
                    "application/vnd.openxmlformats-officedocument."
                    + "wordprocessingml.document",
                )
        else:  # assumes attachment is an image
            image = MIMEImage(attachment["content"], _subtype=attachment["mimetype"])
            image.add_header("Content-ID", f"<{context['cid']}>")
            image.add_header(
                "Content-Disposition", "inline", filename=attachment["filename"]
            )
            msg.attach(image)
            msg.mixed_subtype = "related"

    msg.attach_alternative(html_content, "text/html")

    # Retry to avoid one-off SMTP errors
    for attempt in range(num_retries + 1):
        try:
            msg.send(fail_silently=False)
            return True
        except (SMTPServerDisconnected, SMTPAuthenticationError) as e:
            if attempt == num_retries:
                raise e


def get_asset_file_name(instance, fname):
    return os.path.join("assets", uuid.uuid4().hex, fname)


def get_club_file_name(instance, fname):
    return os.path.join(
        "clubs", "{}.{}".format(instance.code, fname.rsplit(".", 1)[-1])
    )


def get_club_small_file_name(instance, fname):
    return os.path.join(
        "clubs_small", "{}.{}".format(instance.code, fname.rsplit(".", 1)[-1])
    )


def get_event_file_name(instance, fname):
    return os.path.join("events", "{}.{}".format(instance.id, fname.rsplit(".", 1)[-1]))


def get_event_small_file_name(instance, fname):
    return os.path.join(
        "events_small", "{}.{}".format(instance.id, fname.rsplit(".", 1)[-1])
    )


def get_membership_image_file_name(instance, fname):
    return os.path.join(
        "membership",
        "{}.{}.{}".format(
            instance.club.code, instance.person.username, fname.rsplit(".", 1)[-1]
        ),
    )


def get_user_file_name(instance, fname):
    return os.path.join(
        "users", "{}.{}".format(instance.user.username, fname.rsplit(".", 1)[-1])
    )


class Report(models.Model):
    """
    Represents a report generated by the reporting feature.
    """

    name = models.TextField()
    creator = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True)
    description = models.TextField(blank=True)
    parameters = models.TextField(blank=True)
    public = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
        permissions = [
            ("generate_reports", "Can generate reports"),
        ]


def create_thumbnail_helper(self, request, height):
    """
    Helper to create thumbnail on "image_small" given "image" exists on the model.
    """
    if not self.image:
        return False
    image_url = self.image.url

    # can't minify svgs
    if image_url.endswith(".svg"):
        return False

    # fix path for development
    if not image_url.startswith("http"):
        if request is not None:
            image_url = request.build_absolute_uri(image_url)
        else:
            return False

    # if failed to download image, ignore
    try:
        self.image_small = get_django_minified_image(image_url, height=height)
        self.skip_history_when_saving = True
        self.save(update_fields=["image_small"])
    except requests.exceptions.RequestException:
        return False
    return True


class Club(models.Model):
    """
    Represents a club at the University of Pennsylvania.
    """

    RECRUITING_UNKNOWN = 1
    RECRUITING_FALL = 2
    RECRUITING_SPRING = 3
    RECRUITING_BOTH = 4
    RECRUITING_OPEN = 5
    RECRUITING_CYCLES = (
        (RECRUITING_UNKNOWN, "Unknown"),
        (RECRUITING_FALL, "Fall"),
        (RECRUITING_SPRING, "Spring"),
        (RECRUITING_BOTH, "Both"),
        (RECRUITING_OPEN, "Open"),
    )
    SIZE_SMALL = 1
    SIZE_MEDIUM = 2
    SIZE_LARGE = 3
    SIZE_VERY_LARGE = 4
    SIZE_CHOICES = (
        (SIZE_SMALL, "1-20"),
        (SIZE_MEDIUM, "21-50"),
        (SIZE_LARGE, "51-100"),
        (SIZE_VERY_LARGE, "101+"),
    )

    OPEN_MEMBERSHIP = 1
    TRYOUT = 2
    AUDITION = 3
    APPLICATION = 4
    APPLICATION_AND_INTERVIEW = 5
    APPLICATION_CHOICES = (
        (OPEN_MEMBERSHIP, "Open Membership"),
        (AUDITION, "Audition Required"),
        (TRYOUT, "Tryout Required"),
        (APPLICATION, "Application Required"),
        (APPLICATION_AND_INTERVIEW, "Application and Interview Required"),
    )

    approved = models.BooleanField(null=True, default=None)
    approved_by = models.ForeignKey(
        get_user_model(),
        null=True,
        on_delete=models.SET_NULL,
        related_name="approved_clubs",
        blank=True,
    )
    approved_comment = models.TextField(null=True, blank=True)
    approved_on = models.DateTimeField(null=True, blank=True, db_index=True)

    archived = models.BooleanField(default=False)
    archived_by = models.ForeignKey(
        get_user_model(),
        null=True,
        on_delete=models.SET_NULL,
        related_name="archived_clubs",
        blank=True,
    )
    archived_on = models.DateTimeField(null=True, blank=True)

    code = models.SlugField(max_length=255, unique=True, db_index=True)
    active = models.BooleanField(default=False)
    beta = models.BooleanField(default=False)  # opts club into all beta features
    name = models.CharField(max_length=255)
    subtitle = models.CharField(blank=True, max_length=255)
    terms = models.CharField(blank=True, max_length=1024)
    description = models.TextField(blank=True)  # rich html
    address = models.TextField(blank=True)
    founded = models.DateField(blank=True, null=True)
    size = models.IntegerField(choices=SIZE_CHOICES, default=SIZE_SMALL)
    email = models.EmailField(blank=True, null=True)
    email_public = models.BooleanField(default=True)
    facebook = models.URLField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    twitter = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    github = models.URLField(blank=True, null=True)
    youtube = models.URLField(blank=True, null=True)
    how_to_get_involved = models.TextField(blank=True)  # html
    application_required = models.IntegerField(
        choices=APPLICATION_CHOICES, default=APPLICATION
    )
    accepting_members = models.BooleanField(default=False)
    student_types = models.ManyToManyField("StudentType", through="TargetStudentType")
    recruiting_cycle = models.IntegerField(
        choices=RECRUITING_CYCLES, default=RECRUITING_UNKNOWN
    )
    enables_subscription = models.BooleanField(default=True)
    listserv = models.CharField(blank=True, max_length=255)
    ics_import_url = models.URLField(max_length=200, blank=True, null=True)
    image = models.ImageField(upload_to=get_club_file_name, null=True, blank=True)
    image_small = models.ImageField(
        upload_to=get_club_small_file_name, null=True, blank=True
    )
    tags = models.ManyToManyField("Tag")
    members = models.ManyToManyField(get_user_model(), through="Membership")
    # Represents which organizations this club is directly under in the org structure.
    # For example, SAC is a parent of PAC, which is a parent of TAC-E which is a parent
    # of Penn Players.
    parent_orgs = models.ManyToManyField(
        "Club", related_name="children_orgs", blank=True
    )
    badges = models.ManyToManyField("Badge", blank=True)

    target_years = models.ManyToManyField("Year", through="TargetYear")
    target_schools = models.ManyToManyField("School", through="TargetSchool")
    target_majors = models.ManyToManyField("Major", through="TargetMajor")

    # Hub@Penn fields
    available_virtually = models.BooleanField(default=False)
    appointment_needed = models.BooleanField(default=False)
    signature_events = models.TextField(blank=True)  # html

    # cache club aggregation counts
    favorite_count = models.IntegerField(default=0)
    membership_count = models.IntegerField(default=0)
    # cache club rankings
    rank = models.IntegerField(default=0, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # signifies the existence of a previous instance within history with approved=True
    ghost = models.BooleanField(default=False)
    history = HistoricalRecords(cascade_delete_history=True)

    def __str__(self):
        return self.name

    def create_thumbnail(self, request=None):
        return create_thumbnail_helper(self, request, 200)

    @cached_property
    def is_wharton(self):
        return any(badge.label == "Wharton Council" for badge in self.badges.all())

    def add_ics_events(self):
        """
        Fetch the ICS events from the club's calendar URL
        and return the number of modified events.
        """
        # random but consistent uuid used to generate uuid5s from invalid uuids
        ics_import_uuid_namespace = uuid.UUID("8f37c140-3775-42e8-91d4-fda7a2e44152")

        extractor = URLExtract()

        url = self.ics_import_url
        if url:
            calendar = Calendar(requests.get(url).text)
            event_list = Event.objects.filter(is_ics_event=True, club=self)
            modified_events = []
            for ics_event in calendar.events:
                tries = [
                    Event.objects.filter(
                        club=self,
                        is_ics_event=True,
                    )
                    .filter(
                        eventshowing__start_time=ics_event.begin.datetime,
                        eventshowing__end_time=ics_event.end.datetime,
                    )
                    .first(),
                    Event(),
                ]

                # try matching using uuid if it is valid
                if ics_event.uid:
                    try:
                        event_uuid = uuid.UUID(ics_event.uid[:36])
                    except ValueError:
                        # generate uuid from malformed/invalid uuids
                        event_uuid = uuid.uuid5(
                            ics_import_uuid_namespace, ics_event.uid
                        )

                    tries.insert(0, Event.objects.filter(ics_uuid=event_uuid).first())
                else:
                    event_uuid = None

                for ev in tries:
                    if ev:
                        ev.club = self
                        ev.name = ics_event.name.strip()
                        ev.description = clean(ics_event.description.strip())
                        ev.is_ics_event = True

                        # very simple type detection, only perform on first time
                        if ev.pk is None:
                            ev.type = Event.OTHER
                            for val, lbl in Event.TYPES:
                                if val in {Event.FAIR}:
                                    continue
                                if (
                                    lbl.lower() in ev.name.lower()
                                    or lbl.lower() in ev.description.lower()
                                ):
                                    ev.type = val
                                    break

                        # extract urls from description
                        if ev.description:
                            urls = extractor.find_urls(ev.description)
                            urls.sort(
                                key=lambda url: any(
                                    domain in url
                                    for domain in {
                                        "zoom.us",
                                        "bluejeans.com",
                                        "hangouts.google.com",
                                    }
                                ),
                                reverse=True,
                            )
                            if urls:
                                ev.url = urls[0]

                        # extract url from url or location
                        if ics_event.url:
                            ev.url = ics_event.url

                        # format url properly with schema
                        if ev.url:
                            parsed = urlparse(ev.url)
                            if not parsed.netloc:
                                parsed = parsed._replace(netloc=parsed.path, path="")
                            if not parsed.scheme:
                                parsed = parsed._replace(scheme="https")
                            ev.url = parsed.geturl()

                        # add uuid if it exists, otherwise will be autogenerated
                        if event_uuid:
                            ev.ics_uuid = event_uuid

                        # ensure length limits are met before saving
                        if ev.name:
                            ev.name = ev.name[:255]
                        if ev.code:
                            ev.code = ev.code[:255]
                        if ev.url:
                            ev.url = ev.url[:2048]

                        ev.save()

                        # Update corresponding showing (one per event)
                        showing, created = EventShowing.objects.get_or_create(
                            event=ev,
                            start_time=ics_event.begin.datetime,
                            end_time=ics_event.end.datetime,
                            defaults={
                                "location": ics_event.location[:255]
                                if ics_event.location
                                else None,
                            },
                        )

                        if not created:
                            showing.location = (
                                ics_event.location[:255] if ics_event.location else None
                            )
                            showing.save()

                        modified_events.append(ev)
                        break

            event_list.exclude(pk__in=[e.pk for e in modified_events]).delete()
            return len(modified_events)
        return 0

    def send_virtual_fair_email(
        self, request=None, email="setup", fair=None, emails=None, extra=False
    ):
        """
        Send an email to all club officers about setting
        up their club for the virtual fair.

        If no list of emails is specified, the officer emails for the club will be used.
        If no fair is specified, the closest upcoming fair will be used.
        """
        domain = get_domain(request)

        now = timezone.now()

        if fair is None:
            fair = (
                ClubFair.objects.filter(start_time__gte=now)
                .order_by("start_time")
                .first()
            )

        eastern = pytz.timezone("America/New_York")

        fair_events = Event.objects.filter(
            club=self,
            type=Event.FAIR,
        )

        event_showings = EventShowing.objects.filter(
            event__in=fair_events,
            start_time__gte=fair.start_time,
            end_time__lte=fair.end_time,
        ).order_by("start_time")

        first_event_showing = event_showings.first()
        first_event = first_event_showing.event if first_event_showing else None

        fstr = "%B %d, %Y %I:%M %p"
        events = [
            {
                "time": (
                    f"{timezone.localtime(showing.start_time, eastern).strftime(fstr)} "
                    f"- {timezone.localtime(showing.end_time, eastern).strftime(fstr)} "
                    "ET"
                )
            }
            for showing in event_showings
        ]

        prefix = (
            "ACTION REQUIRED"
            if first_event is None
            or not first_event.url
            or "zoom.us" not in first_event.url
            else "REMINDER"
        )

        # if one day before fair, change prefix to urgent
        if fair.start_time - datetime.timedelta(days=1) < now:
            prefix = "URGENT"

        # if no emails specified, send to officers
        if emails is None:
            emails = self.get_officer_emails()

        fair_str = fair.id if fair is not None else ""
        context = {
            "name": self.name,
            "prefix": prefix,
            "guide_url": f"https://{domain}/guides/fair",
            "media_guide_url": f"https://{domain}/guides/media",
            "zoom_url": f"https://{domain}/zoom",
            "fair_url": f"https://{domain}/fair?fair={fair_str}",
            "subscriptions_url": f"https://{domain}/club/{self.code}/edit/recruitment",
            "num_subscriptions": self.subscribe_set.count(),
            "fair": fair,
            "events": events,
            "extra": extra,
        }

        if emails:
            return send_mail_helper(
                name={
                    "setup": "fair_info",
                    "urgent": "fair_reminder",
                    "post": "fair_feedback_officers",
                }[email],
                subject=None,
                emails=emails,
                context=context,
            )
        return False

    def send_renewal_email(self, request=None, queue_open_date=None):
        """
        Send an email notifying all club officers about renewing their approval with the
        Office of Student Affairs.
        """
        domain = get_domain(request)

        context = {
            "name": self.name,
            "url": settings.RENEWAL_URL.format(domain=domain, club=self.code),
            "queue_open_date": queue_open_date,
        }

        emails = self.get_officer_emails()

        if emails:
            send_mail_helper(
                name="renew",
                subject="[ACTION REQUIRED] Renew {}".format(self.name),
                emails=emails,
                context=context,
                reply_to=settings.OSA_EMAILS + [settings.BRANDING_SITE_EMAIL],
            )

    def get_officer_emails(self):
        """
        Return a list of club officer emails, including the contact email for the club.
        """
        emails = []

        # Add club contact email if valid
        if self.email:
            try:
                validate_email(self.email)
                emails.append(self.email)
            except ValidationError:
                pass

        # Add email for all active officers and above
        emails.extend(
            self.membership_set.filter(
                role__lte=Membership.ROLE_OFFICER, active=True
            ).values_list("person__email", flat=True)
        )

        # Remove whitespace, empty emails, and duplicates, then sort
        return sorted(set(email.strip() for email in emails if email.strip()))

    def send_confirmation_email(self, request=None):
        """
        Send an email to the club officers confirming that
        their club has been queued for approval.
        """
        domain = get_domain(request)

        emails = self.get_officer_emails()

        context = {
            "name": self.name,
            "view_url": settings.VIEW_URL.format(domain=domain, club=self.code),
        }

        if emails:
            send_mail_helper(
                name="confirmation",
                subject=f"{self.name} has been queued for approval",
                emails=emails,
                context=context,
                reply_to=settings.OSA_EMAILS + [settings.BRANDING_SITE_EMAIL],
            )

    def send_approval_email(self, request=None, change=False):
        """
        Send either an approval or rejection email to the club officers
        after their club has been reviewed.
        """
        domain = get_domain(request)

        context = {
            "name": self.name,
            "year": timezone.now().year,
            "approved": self.approved,
            "approved_comment": self.approved_comment,
            "view_url": settings.VIEW_URL.format(domain=domain, club=self.code),
            "edit_url": settings.EDIT_URL.format(domain=domain, club=self.code),
            "change": change,
            "reply_emails": settings.OSA_EMAILS + [settings.BRANDING_SITE_EMAIL],
        }

        emails = self.get_officer_emails()

        if emails:
            send_mail_helper(
                name="approval_status",
                subject="{} status update on {}".format(
                    self.name,
                    settings.BRANDING_SITE_NAME,
                ),
                emails=emails,
                context=context,
                reply_to=settings.OSA_EMAILS + [settings.BRANDING_SITE_EMAIL],
            )

    class Meta:
        ordering = ["name"]
        permissions = [
            ("approve_club", "Can approve pending clubs"),
            ("see_pending_clubs", "View pending clubs that are not one's own"),
            (
                "see_fair_status",
                "See whether or not a club has registered for the SAC fair",
            ),
            ("manage_club", "Manipulate club object and related objects"),
        ]


class TargetStudentType(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    target_student_types = models.ForeignKey(
        "StudentType", blank=True, on_delete=models.CASCADE
    )
    program = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return "{}: {}({})".format(
            self.club.name, self.target_student_types, self.program
        )


class TargetYear(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    target_years = models.ForeignKey("Year", blank=True, on_delete=models.CASCADE)
    program = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return "{}: {}({})".format(self.club.name, self.target_years, self.program)


class TargetSchool(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    target_schools = models.ForeignKey("School", blank=True, on_delete=models.CASCADE)
    program = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return "{}: {}({})".format(self.club.name, self.target_schools, self.program)


class TargetMajor(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    target_majors = models.ForeignKey("Major", blank=True, on_delete=models.CASCADE)
    program = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return "{}: {}({})".format(self.club.name, self.target_majors, self.program)


class QuestionAnswer(models.Model):
    """
    Represents a question asked by a prospective member to a club
    and the club's corresponding answer.
    """

    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name="questions")
    author = models.ForeignKey(
        get_user_model(), on_delete=models.SET_NULL, null=True, related_name="questions"
    )
    responder = models.ForeignKey(
        get_user_model(), on_delete=models.SET_NULL, null=True, related_name="answers"
    )

    approved = models.BooleanField(default=False)
    is_anonymous = models.BooleanField(default=False)

    question = models.TextField()
    answer = models.TextField(null=True)  # html

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    users_liked = models.ManyToManyField(get_user_model(), related_name="likes")

    def __str__(self):
        return "{}: {}".format(self.club.name, self.question)

    def send_question_mail(self, request=None):
        domain = get_domain(request)

        emails = self.club.get_officer_emails()

        context = {
            "name": self.club.name,
            "question": self.question,
            "url": settings.QUESTION_URL.format(domain=domain, club=self.club.code),
        }

        if emails:
            send_mail_helper(
                name="question",
                subject="Question for {}".format(self.club.name),
                emails=emails,
                context=context,
            )


class Testimonial(models.Model):
    """
    Represents a testimonial for a club.
    """

    club = models.ForeignKey(
        Club, on_delete=models.CASCADE, related_name="testimonials"
    )
    text = models.TextField()

    def __str__(self):
        return self.text


class ClubFair(models.Model):
    """
    Represents an activities fair with multiple clubs as participants.
    """

    name = models.TextField()
    organization = models.TextField()
    contact = models.TextField()
    time = models.TextField(blank=True)
    virtual = models.BooleanField(default=False)

    # these fields are rendered as raw html
    information = models.TextField(blank=True)
    registration_information = models.TextField(blank=True)

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    registration_start_time = models.DateTimeField(null=True, blank=True)
    registration_end_time = models.DateTimeField()

    questions = models.TextField(default="[]")
    participating_clubs = models.ManyToManyField(
        Club, through="ClubFairRegistration", blank=True
    )

    def create_events(
        self, start_time=None, end_time=None, filter=None, suffix="default"
    ):
        """
        Create activities fair events for all registered clubs.
        Does not create event if it already exists.
        Returns a list of activities fair events.

        This method should only be used for testing purposes in development.
        """
        start_time = start_time or self.start_time
        end_time = end_time or self.end_time

        club_query = self.participating_clubs.all()
        if filter is not None:
            club_query = club_query.filter(filter)
        events = []
        with transaction.atomic():
            for club in club_query:
                event, _ = Event.objects.get_or_create(
                    code=f"fair-{club.code}-{self.id}-{suffix}",
                    club=club,
                    type=Event.FAIR,
                    defaults={
                        "name": self.name,
                    },
                )

                showing, _ = EventShowing.objects.get_or_create(
                    event=event, start_time=start_time, end_time=end_time
                )

                events.append(event)

        return events

    def __str__(self):
        fmt = "%b %d, %Y"
        return (
            f"{self.name} "
            f"({self.start_time.strftime(fmt)} - {self.end_time.strftime(fmt)})"
        )


class ClubFairRegistration(models.Model):
    """
    Represents a registration between a club and a club fair.
    """

    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    fair = models.ForeignKey(ClubFair, on_delete=models.CASCADE)
    registrant = models.ForeignKey(
        get_user_model(), on_delete=models.SET_NULL, null=True
    )

    answers = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.club.name} registration for {self.fair.name}"


class Event(models.Model):
    """
    Represents an event hosted by a club.
    If the club is null, this is a global event.
    """

    code = models.SlugField(max_length=255, db_index=True)
    creator = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=255)
    club = models.ForeignKey(
        Club, on_delete=models.CASCADE, related_name="events", null=True
    )
    url = models.URLField(max_length=2048, null=True, blank=True)
    image = models.ImageField(upload_to=get_event_file_name, null=True, blank=True)
    image_small = models.ImageField(
        upload_to=get_event_small_file_name, null=True, blank=True
    )
    description = models.TextField(blank=True)  # rich html
    ics_uuid = models.UUIDField(default=uuid.uuid4)
    is_ics_event = models.BooleanField(default=False, blank=True)

    OTHER = 0
    RECRUITMENT = 1
    GBM = 2
    SPEAKER = 3
    FAIR = 4
    SOCIAL = 5
    CAREER = 6
    TYPES = (
        (OTHER, "Other"),
        (RECRUITMENT, "Recruitment"),
        (GBM, "GBM"),
        (SPEAKER, "Speaker"),
        (FAIR, "Activities Fair"),
        (SOCIAL, "Social"),
        (CAREER, "Career"),
    )

    type = models.IntegerField(choices=TYPES, default=RECRUITMENT)
    pinned = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def create_thumbnail(self, request=None):
        return create_thumbnail_helper(self, request, 400)

    def __str__(self):
        return self.name


class EventShowing(models.Model):
    """
    Represents a showing of an event.
    """

    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=255, null=True, blank=True)
    ticket_order_limit = models.IntegerField(default=10)
    ticket_drop_time = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.event.name} showing at {self.start_time}"


class Favorite(models.Model):
    """
    Used when people favorite a club to keep track of which clubs were favorited.
    """

    person = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "<Favorite: {} for {}>".format(self.person.username, self.club.code)

    class Meta:
        unique_together = (("person", "club"),)


class Subscribe(models.Model):
    """
    Used when people subscribe to a club and clubs
    will be able to see the users' email addresses.
    """

    person = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "<Subscribe: {} for {}, with email {}>".format(
            self.person.username, self.club.code, self.person.email
        )

    class Meta:
        unique_together = (("person", "club"),)


class ClubVisit(models.Model):
    """
    Stores user visits to different club pages to be used later in analytics
    """

    person = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    ip = models.GenericIPAddressField(
        protocol="both", unpack_ipv4=False, blank=True, null=True
    )

    CLUB_PAGE = 1
    EVENT_MODAL = 2
    EVENT_LINK = 3
    MANAGE_PAGE = 4
    FAIR_PAGE = 5
    VISIT_TYPES = (
        (CLUB_PAGE, "Club Page Visit"),
        (EVENT_MODAL, "Event Modal Visit"),
        (EVENT_LINK, "Event Link Clicked"),
        (MANAGE_PAGE, "Manage Page Visit"),
        (FAIR_PAGE, "Fair Page Visit"),
    )
    visit_type = models.IntegerField(choices=VISIT_TYPES, default=CLUB_PAGE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "<Visit: {} visited {}>".format(self.person.username, self.club.code)


class ZoomMeetingVisit(models.Model):
    """
    Stores information on a user's attendance to a Zoom meeting
    """

    person = models.ForeignKey(
        get_user_model(), on_delete=models.CASCADE, null=True, related_name="visits"
    )
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="visits")
    meeting_id = models.CharField(max_length=255)
    participant_id = models.CharField(max_length=255)

    join_time = models.DateTimeField()
    leave_time = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "<ZoomMeetingVisit: {} in Zoom meeting {}>".format(
            self.person.username if self.person is not None else self.participant_id,
            self.meeting_id,
        )


class SearchQuery(models.Model):
    person = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, null=True)
    query = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "<SearchQuery: {} at {}>".format(self.query, self.created_at)


class JoinRequest(models.Model):
    """
    Abstract base class for Membership Request and Ownership Request
    """

    requester = models.ForeignKey(
        get_user_model(), on_delete=models.CASCADE, related_name="%(class)ss"
    )
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name="%(class)ss")

    withdrawn = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        unique_together = (("requester", "club"),)


class MembershipRequest(JoinRequest):
    """
    Used when users are not in the club but request membership from the owner
    """

    def __str__(self):
        return f"<MembershipRequest: {self.requester.username} for {self.club.code}>"

    def send_request(self, request=None):
        domain = get_domain(request)
        edit_url = settings.EDIT_URL.format(domain=domain, club=self.club.code)
        club_name = self.club.name
        full_name = self.requester.get_full_name()

        context = {
            "club_name": club_name,
            "edit_url": f"{edit_url}/member",
            "full_name": full_name,
        }

        emails = self.club.get_officer_emails()

        if emails:
            send_mail_helper(
                name="membership_request",
                subject=f"Membership Request from {full_name} for {club_name}",
                emails=emails,
                context=context,
            )


class OwnershipRequest(JoinRequest):
    """
    Represents a user's request to take ownership of a club
    """

    def __str__(self):
        return f"<OwnershipRequest: {self.requester.username} for {self.club.code}>"

    def send_request(self, request=None):
        domain = get_domain(request)
        edit_url = settings.EDIT_URL.format(domain=domain, club=self.club.code)
        club_name = self.club.name
        full_name = self.requester.get_full_name()

        context = {
            "club_name": club_name,
            "edit_url": f"{edit_url}/member",
            "full_name": full_name,
        }

        owner_emails = list(
            self.club.membership_set.filter(
                role=Membership.ROLE_OWNER, active=True
            ).values_list("person__email", flat=True)
        )

        send_mail_helper(
            name="ownership_request",
            subject=f"Ownership Request from {full_name} for {club_name}",
            emails=owner_emails,
            context=context,
        )


class Advisor(models.Model):
    """
    Represents one faculty advisor or point of contact for a club.
    """

    name = models.CharField(max_length=255)
    title = models.CharField(max_length=255, blank=True, null=True)
    department = models.CharField(max_length=255, blank=True, null=True)
    email = models.CharField(
        max_length=320, blank=True, null=True, validators=[validate_email]
    )
    phone = PhoneNumberField(null=False, blank=True)

    club = models.ForeignKey(Club, on_delete=models.CASCADE)

    ADVISOR_VISIBILITY_ADMIN = 1
    ADVISOR_VISIBILITY_STUDENTS = 2
    ADVISOR_VISIBILITY_ALL = 3

    ADVISOR_VISIBILITY_CHOICES = (
        (ADVISOR_VISIBILITY_ADMIN, "Admin Only"),
        (ADVISOR_VISIBILITY_STUDENTS, "Signed-in Students"),
        (ADVISOR_VISIBILITY_ALL, "Public"),
    )

    visibility = models.IntegerField(
        choices=ADVISOR_VISIBILITY_CHOICES, default=ADVISOR_VISIBILITY_STUDENTS
    )

    def __str__(self):
        return self.name


class Note(models.Model):
    """
    Represents a note created by a parent about a
    constituent club
    """

    creator = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    creating_club = models.ForeignKey(
        Club, on_delete=models.CASCADE, related_name="note_by_club"
    )
    subject_club = models.ForeignKey(
        Club, on_delete=models.CASCADE, related_name="note_of_club"
    )
    note_tags = models.ManyToManyField("NoteTag")
    title = models.CharField(max_length=255, default="Note")
    content = models.TextField(blank=True)

    PERMISSION_CREATING_CLUB_OWNER = 0
    PERMISSION_CREATING_CLUB_OFFICER = 10
    PERMISSION_CREATING_CLUB_MEMBER = 20

    PERMISSION_NONE = -1
    PERMISSION_SUBJECT_CLUB_OWNER = 0
    PERMISSION_SUBJECT_CLUB_OFFICER = 10
    PERMISSION_SUBJECT_CLUB_MEMBER = 20
    PERMISSION_PUBLIC = 100

    CREATING_CLUB_PERMISSION_CHOICES = (
        (PERMISSION_CREATING_CLUB_OWNER, "Creating Club Owner"),
        (PERMISSION_CREATING_CLUB_OFFICER, "Creating Club Officers"),
        (PERMISSION_CREATING_CLUB_MEMBER, "Creating Club Members"),
    )

    OUTSIDE_CLUB_PERMISSION_CHOICES = (
        (PERMISSION_NONE, "None"),
        (PERMISSION_SUBJECT_CLUB_OWNER, "Subject Club Owner"),
        (PERMISSION_SUBJECT_CLUB_OFFICER, "Subject Club Officers"),
        (PERMISSION_SUBJECT_CLUB_MEMBER, "Subject Club Members"),
        (PERMISSION_PUBLIC, "Public"),
    )

    creating_club_permission = models.IntegerField(
        choices=CREATING_CLUB_PERMISSION_CHOICES,
        default=PERMISSION_CREATING_CLUB_MEMBER,
    )
    outside_club_permission = models.IntegerField(
        choices=OUTSIDE_CLUB_PERMISSION_CHOICES, default=PERMISSION_SUBJECT_CLUB_MEMBER
    )
    created_at = models.DateTimeField(auto_now_add=True)


class AdminNote(models.Model):
    """
    Represents a note created by school admin about a
    club
    """

    creator = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default="Note")
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "{} ({})".format(self.club.name, self.creator.username)


class StudentType(models.Model):
    """
    Represents a student type that the club is intended for.
    For example, "International Students", "Transfer Students", or "Online Students".
    """

    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class NoteTag(models.Model):
    """
    Represents primary reason for creating a note about a club.
    """

    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class ClubFairBooth(models.Model):
    """
    Represents a booth hosted at an in-person club fair
    """

    name = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True, null=True)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    image_url = models.URLField(blank=True, null=True)
    lat = models.FloatField()
    long = models.FloatField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    def __str__(self):
        return self.name


class Membership(models.Model):
    """
    Represents the relationship between a member and a club.
    """

    ROLE_OWNER = 0
    ROLE_OFFICER = 10
    ROLE_MEMBER = 20
    ROLE_CHOICES = (
        (ROLE_OWNER, "Owner"),
        (ROLE_OFFICER, "Officer"),
        (ROLE_MEMBER, "Member"),
    )

    active = models.BooleanField(default=True)
    public = models.BooleanField(default=True)

    person = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default="Member")
    role = models.IntegerField(choices=ROLE_CHOICES, default=ROLE_MEMBER)
    description = models.TextField(max_length=1000, blank=True)
    image = models.ImageField(
        upload_to=get_membership_image_file_name, null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "<Membership: {} in {} ({})>".format(
            self.person.username, self.club.code, self.get_role_display()
        )

    class Meta:
        unique_together = (("club", "person"),)


def get_token():
    """
    Generate a secure token for membership invites.
    Is a custom function because Django can't serialize lambdas.
    """
    return get_random_string(length=128)


def get_invite_id():
    """
    Generate a secure ID for membership invites.
    """
    return get_random_string(length=8)


class MembershipInvite(models.Model):
    """
    Represents an invitation to a club.
    """

    id = models.CharField(max_length=8, primary_key=True, default=get_invite_id)
    active = models.BooleanField(default=True)
    auto = models.BooleanField(default=False)
    creator = models.ForeignKey(get_user_model(), null=True, on_delete=models.SET_NULL)

    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    email = models.EmailField()
    token = models.CharField(max_length=128, default=get_token)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    title = models.CharField(max_length=255, default="Member")
    role = models.IntegerField(default=Membership.ROLE_MEMBER)

    def __str__(self):
        return "<MembershipInvite: {} for {}>".format(self.club.code, self.email)

    def claim(self, user):
        """
        Claim an invitation using a user.
        """
        self.active = False
        self.save()

        obj, _ = Membership.objects.get_or_create(
            person=user,
            club=self.club,
            defaults={"role": self.role, "title": self.title},
        )

        return obj

    def send_mail(self, request=None):
        """
        Send the email associated with this invitation to the user.
        """
        domain = get_domain(request)

        context = {
            "token": self.token,
            "name": self.club.name,
            "id": self.id,
            "club_id": self.club.code,
            "sender": (
                request.user
                if request is not None
                else {
                    "username": settings.BRANDING_SITE_NAME,
                    "email": settings.BRANDING_SITE_EMAIL,
                }
            ),
            "role": self.role,
            "title": self.title,
            "url": settings.INVITE_URL.format(
                domain=domain, id=self.id, token=self.token, club=self.club.code
            ),
        }

        send_mail_helper(
            name="invite",
            subject="Invitation to {}".format(self.club.name),
            emails=[self.email],
            context=context,
        )

    def send_owner_invite(self, request=None):
        """
        Send the initial email invitation to owner(s) of the club.
        """
        if self.role > Membership.ROLE_OWNER:
            raise ValueError(
                "This invite should grant owner permissions "
                "if sending out the owner email!"
            )

        domain = get_domain(request)

        context = {
            "name": self.club.name,
            "view_url": settings.VIEW_URL.format(domain=domain, club=self.club.code),
            "url": settings.INVITE_URL.format(
                domain=domain, id=self.id, token=self.token, club=self.club.code
            ),
        }

        send_mail_helper(
            name="owner",
            subject=f"Welcome to {settings.BRANDING_SITE_NAME}!",
            emails=[self.email],
            context=context,
        )


class Tag(models.Model):
    """
    Represents general categories that clubs fit into.
    """

    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class Badge(models.Model):
    """
    Represents a category that a club could fall under.
    Clubs do not select badges, these are designated by an external authority.

    The label and description are shown to the public.

    The purpose field is used for tagging badges with special purposes (ex: "fair").
    """

    PURPOSE_CHOICES = [("fair", "Fair"), ("org", "Organization")]

    label = models.CharField(max_length=255)
    purpose = models.CharField(max_length=255, choices=PURPOSE_CHOICES)
    description = models.TextField(blank=True)

    # The color of the badge to be displayed on the frontend.
    color = models.CharField(max_length=16, default="")

    # The organization that this badge represents (If this is the "SAC Funded" badge,
    # then this would link to SAC)
    org = models.ForeignKey(Club, on_delete=models.CASCADE, blank=True, null=True)

    # The fair that this badge is related to
    fair = models.ForeignKey(ClubFair, on_delete=models.CASCADE, blank=True, null=True)

    # whether or not users can view and filter by this badge
    visible = models.BooleanField(default=False)

    # optional message to display on club pages with the badge
    message = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.label


class Asset(models.Model):
    """
    Represents an uploaded file object.
    """

    creator = models.ForeignKey(get_user_model(), null=True, on_delete=models.SET_NULL)
    file = models.FileField(upload_to=get_asset_file_name)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, null=True)
    name = models.CharField(max_length=255)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Year(models.Model):
    """
    Represents a graduation class
    (ex: Freshman, Sophomore, Junior, Senior, Graduate Student).
    """

    name = models.TextField()

    @property
    def year(self):
        """
        Convert from graduation class name to graduation year.
        """
        now = datetime.datetime.now()
        year = now.year
        if now.month > 6:
            year += 1

        # get offset associated with graduation year
        key = re.sub(r"[^a-zA-Z]", "", self.name.lower())
        offsets = {
            "freshman": 3,
            "sophomore": 2,
            "junior": 1,
            "senior": 0,
            "graduate": -1,
            "firstyear": 3,
            "secondyear": 2,
        }
        offset = 0
        for k, v in offsets.items():
            if key.startswith(k):
                offset = v
                break

        return year + offset

    def __str__(self):
        return self.name


class School(models.Model):
    """
    Represents a school (ex: Engineering, Wharton, etc).
    """

    name = models.TextField()
    is_graduate = models.BooleanField()

    def __str__(self):
        return self.name


class Major(models.Model):
    """
    Represents a major (ex: Computer Science, BSE).
    """

    name = models.TextField()

    def __str__(self):
        return self.name


class Profile(models.Model):
    """
    Additional information attached to a user account.
    """

    user = models.OneToOneField(
        get_user_model(), on_delete=models.CASCADE, primary_key=True
    )
    image = models.ImageField(upload_to=get_user_file_name, null=True, blank=True)
    uuid_secret = models.UUIDField(default=uuid.uuid4)

    has_been_prompted = models.BooleanField(default=False)
    share_bookmarks = models.BooleanField(default=False)
    show_profile = models.BooleanField(default=True)
    graduation_year = models.PositiveSmallIntegerField(null=True, blank=True)
    school = models.ManyToManyField(School, blank=True)
    major = models.ManyToManyField(Major, blank=True)

    def __str__(self):
        return self.user.username


class ApplicationCycle(models.Model):
    """
    Represents an application cycle attached to club applications
    """

    name = models.CharField(max_length=255)
    start_date = models.DateTimeField(null=True)
    end_date = models.DateTimeField(null=True)
    release_date = models.DateTimeField(null=True)

    def __str__(self):
        return self.name


class ClubApplication(CloneModel):
    """
    Represents custom club application.
    """

    DEFAULT_COMMITTEE = "General Member"
    VALID_TEMPLATE_TOKENS = {"name", "reason", "committee"}

    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    description = models.TextField(blank=True)
    application_start_time = models.DateTimeField()
    application_end_time = models.DateTimeField()
    application_end_time_exception = models.BooleanField(default=False, blank=True)
    name = models.TextField(blank=True)
    result_release_time = models.DateTimeField()
    application_cycle = models.ForeignKey(
        ApplicationCycle, on_delete=models.SET_NULL, null=True
    )
    external_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=False, blank=True)
    is_wharton_council = models.BooleanField(default=False, blank=True)
    acceptance_email = models.TextField(blank=True)
    rejection_email = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    _clone_m2o_or_o2m_fields = [
        "committees",
        "questions",
    ]

    def __str__(self):
        return "{} created {}: start {}, end {}".format(
            self.club.name,
            self.name,
            self.application_start_time,
            self.application_end_time,
        )

    @cached_property
    def season(self):
        semester = "Fall" if 8 <= self.application_start_time.month <= 12 else "Spring"
        year = str(self.application_start_time.year)
        return f"{semester} {year}"

    @classmethod
    def validate_template(cls, template):
        environment = Environment()
        j2_template = environment.parse(template)
        tokens = meta.find_undeclared_variables(j2_template)
        return all(t in cls.VALID_TEMPLATE_TOKENS for t in tokens)


class ApplicationExtension(models.Model):
    """
    Represents an individual club application extension.
    """

    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    application = models.ForeignKey(
        ClubApplication, related_name="extensions", on_delete=models.CASCADE
    )
    end_time = models.DateTimeField()

    def send_extension_mail(self):
        context = {
            "name": self.user.first_name,
            "application_name": self.application.name,
            "end_time": self.end_time,
            "club": self.application.club.name,
            "url": (
                f"https://pennclubs.com/club/{self.application.club.code}"
                f"/application/{self.application.pk}/"
            ),
        }

        send_mail_helper(
            name="application_extension",
            subject=f"Application Extension for {self.application.name}",
            emails=[self.user.email],
            context=context,
        )

    class Meta:
        unique_together = (("user", "application"),)


class ApplicationCommittee(models.Model):
    """
    Represents a committee for a particular club application. Each application
    may have multiple committees to which students can apply.
    """

    name = models.TextField(blank=True)
    application = models.ForeignKey(
        ClubApplication,
        related_name="committees",
        on_delete=models.CASCADE,
    )

    def get_word_limit(self):
        total_limit = self.applicationquestion_set.aggregate(
            total_limit=Sum("word_limit")
        )
        return total_limit["total_limit"] or 0

    def __str__(self):
        return "<ApplicationCommittee: {} in {}>".format(self.name, self.application.pk)

    class Meta:
        unique_together = (("application", "name"),)


class ApplicationQuestion(CloneModel):
    """
    Represents a question of a custom application
    """

    FREE_RESPONSE = 1
    MULTIPLE_CHOICE = 2
    SHORT_ANSWER = 3
    INFO_TEXT = 4
    QUESTION_TYPES = (
        (FREE_RESPONSE, "Free Response"),
        (MULTIPLE_CHOICE, "Multiple Choice"),
        (SHORT_ANSWER, "Short Answer"),
        (INFO_TEXT, "Informational Text"),
    )

    question_type = models.IntegerField(choices=QUESTION_TYPES, default=FREE_RESPONSE)
    prompt = models.TextField(blank=True)
    precedence = models.IntegerField(default=0)
    word_limit = models.IntegerField(default=0)
    application = models.ForeignKey(
        ClubApplication, related_name="questions", on_delete=models.CASCADE
    )
    committee_question = models.BooleanField(default=False)
    committees = models.ManyToManyField("ApplicationCommittee", blank=True)

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    _clone_m2o_or_o2m_fields = ["multiple_choice"]


class ApplicationMultipleChoice(models.Model):
    """
    Represents a multiple choice selection in an application question
    """

    value = models.TextField(blank=True)
    question = models.ForeignKey(
        ApplicationQuestion,
        related_name="multiple_choice",
        on_delete=models.CASCADE,
    )


class ApplicationSubmission(models.Model):
    """
    Represents a complete submission of a particular club application
    """

    # pending, first round, second round, accepted, rejected
    PENDING = 1
    REJECTED_AFTER_WRITTEN = 2
    REJECTED_AFTER_INTERVIEW = 3
    ACCEPTED = 4
    STATUS_TYPES = (
        (PENDING, "Pending"),
        (REJECTED_AFTER_WRITTEN, "Rejected after written application"),
        (REJECTED_AFTER_INTERVIEW, "Rejected after interview(s)"),
        (ACCEPTED, "Accepted"),
    )
    status = models.IntegerField(choices=STATUS_TYPES, default=PENDING)
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, null=False)
    reason = models.TextField(blank=True)
    application = models.ForeignKey(
        ClubApplication,
        related_name="submissions",
        on_delete=models.SET_NULL,
        null=True,
    )
    committee = models.ForeignKey(
        ApplicationCommittee,
        related_name="submissions",
        on_delete=models.SET_NULL,
        null=True,
    )
    notified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.first_name}: {self.application.name}"

    class Meta:
        unique_together = (("user", "application", "committee"),)


class ApplicationQuestionResponse(models.Model):
    """
    Represents a response to a question in a custom application. The fields here are
    a union of all possible fields from all types of questions (most principally free
    response, but also multiple choice, essay response, etc.).
    """

    text = models.TextField(blank=True)
    question = models.ForeignKey(
        ApplicationQuestion, related_name="responses", on_delete=models.CASCADE
    )
    submission = models.ForeignKey(
        ApplicationSubmission,
        related_name="responses",
        on_delete=models.CASCADE,
        null=False,
    )
    multiple_choice = models.ForeignKey(
        ApplicationMultipleChoice,
        related_name="responses",
        on_delete=models.CASCADE,
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (("question", "submission"),)


class Cart(models.Model):
    """
    Represents an instance of a ticket cart for a user
    """

    owner = models.OneToOneField(
        get_user_model(), related_name="cart", on_delete=models.CASCADE
    )
    # Capture context from Cybersource should be 8297 chars
    checkout_context = models.CharField(max_length=8297, blank=True, null=True)


class TicketQuerySet(models.query.QuerySet):
    def delete(self):
        if self.filter(transaction_record__isnull=False).exists():
            raise ProtectedError(
                "Cannot delete tickets with an associated transaction record.", self
            )
        super().delete()


class TicketManager(models.Manager):
    # Update holds for all tickets
    def update_holds(self):
        with transaction.atomic():
            self.get_queryset().select_for_update().filter(
                holder__isnull=False, holding_expiration__lte=timezone.now()
            ).update(holder=None)

    def get_queryset(self):
        return TicketQuerySet(self.model)


class TicketTransactionRecord(models.Model):
    """
    Represents an instance of a transaction record for an ticket, used for bookkeeping
    """

    reconciliation_id = models.CharField(max_length=100, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=5, decimal_places=2)
    buyer_phone = PhoneNumberField(null=True, blank=True)
    buyer_first_name = models.CharField(max_length=100)
    buyer_last_name = models.CharField(max_length=100)
    buyer_email = models.EmailField(blank=True, null=True)


class Ticket(models.Model):
    """
    Represents an instance of a ticket for an event
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    showing = models.ForeignKey(
        EventShowing,
        related_name="tickets",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    type = models.CharField(max_length=100)
    owner = models.ForeignKey(
        get_user_model(),
        related_name="owned_tickets",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    holder = models.ForeignKey(
        get_user_model(),
        related_name="held_tickets",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    holding_expiration = models.DateTimeField(null=True, blank=True, db_index=True)
    carts = models.ManyToManyField(Cart, related_name="tickets", blank=True)
    price = models.DecimalField(max_digits=5, decimal_places=2)
    group_discount = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        blank=True,
    )
    group_size = models.PositiveIntegerField(null=True, blank=True)
    transferable = models.BooleanField(default=True)
    attended = models.BooleanField(default=False)
    # TODO: change to enum between All, Club, None
    buyable = models.BooleanField(default=True)
    transaction_record = models.ForeignKey(
        TicketTransactionRecord,
        related_name="tickets",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    objects = TicketManager()

    def delete(self, *args, **kwargs):
        if self.transaction_record:
            raise ProtectedError(
                "Cannot delete a ticket with an associated transaction record.", [self]
            )
        super().delete(*args, **kwargs)

    def get_qr(self):
        """
        Return a QR code image linking to the ticket page
        """
        if not self.owner:
            return None

        url = f"https://{settings.DOMAINS[0]}/api/tickets/{self.id}"
        qr_image = qrcode.make(url, box_size=20, border=0)
        return qr_image

    def send_confirmation_email(self):
        """
        Send a confirmation email to the ticket owner after purchase
        """
        output = BytesIO()
        qr_image = self.get_qr()
        qr_image.save(output, format="PNG")

        context = {
            "first_name": self.owner.first_name,
            "name": self.showing.event.name,
            "type": self.type,
            "start_time": self.showing.start_time,
            "end_time": self.showing.end_time,
            "cid": "qr_code",
            "ticket_url": f"https://{settings.DOMAINS[0]}/settings#Tickets",
        }

        if self.owner.email:
            send_mail_helper(
                name="ticket_confirmation",
                subject=f"Ticket confirmation for {self.owner.get_full_name()}"
                f" to {self.showing.event.name}",
                emails=[self.owner.email],
                context=context,
                attachment={
                    "filename": "qr_code.png",
                    "content": output.getvalue(),
                    "mimetype": "image/png",
                },
            )


class TicketTransferRecord(models.Model):
    """
    Represents a transfer of ticket ownership, used for bookkeeping
    """

    ticket = models.ForeignKey(
        Ticket, related_name="transfer_records", on_delete=models.PROTECT
    )
    sender = models.ForeignKey(
        get_user_model(),
        related_name="sent_transfers",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    receiver = models.ForeignKey(
        get_user_model(),
        related_name="received_transfers",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def send_confirmation_email(self):
        """
        Send confirmation email to the sender and recipient of the transfer.
        """
        context = {
            "sender_first_name": self.sender.first_name,
            "receiver_first_name": self.receiver.first_name,
            "receiver_username": self.receiver.username,
            "event_name": self.ticket.showing.event.name,
            "type": self.ticket.type,
        }

        send_mail_helper(
            name="ticket_transfer",
            subject=(
                f"Ticket transfer confirmation for {self.ticket.showing.event.name}"
            ),
            emails=[self.sender.email, self.receiver.email],
            context=context,
        )


class ClubApprovalResponseTemplate(models.Model):
    """
    Represents a (rejection) template for site administrators to use
    during the club approval process.
    """

    author = models.ForeignKey(
        get_user_model(), on_delete=models.SET_NULL, null=True, related_name="templates"
    )
    title = models.CharField(max_length=255, unique=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


@receiver(models.signals.pre_delete, sender=Asset)
def asset_delete_cleanup(sender, instance, **kwargs):
    if instance.file:
        instance.file.delete(save=False)


@receiver(models.signals.post_delete, sender=Club)
def club_delete_cleanup(sender, instance, **kwargs):
    if instance.image:
        instance.image.delete(save=False)
        instance.image_small.delete(save=True)


@receiver(models.signals.post_delete, sender=Event)
def event_delete_cleanup(sender, instance, **kwargs):
    if instance.image:
        instance.image.delete(save=False)
        instance.image_small.delete(save=True)


@receiver(models.signals.post_save, sender=get_user_model())
def user_create(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(models.signals.post_delete, sender=Profile)
def profile_delete_cleanup(sender, instance, **kwargs):
    if instance.image:
        instance.image.delete(save=False)


class RegistrationQueueSettings(models.Model):
    """
    Singleton model to store registration queue settings.
    Only one instance of this model should exist.
    """

    SINGLETON_PK = 1

    reapproval_queue_open = models.BooleanField(
        default=True,
        help_text="Controls whether existing clubs can submit for reapproval",
    )
    new_approval_queue_open = models.BooleanField(
        default=True, help_text="Controls whether new clubs can submit for approval"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="modified_queue_settings",
    )

    def save(self, *args, **kwargs):
        """
        Override save method to ensure this is a singleton.
        """
        if self.pk and self.pk != self.SINGLETON_PK:
            raise ValueError("Use get() to retrieve singleton instance")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """
        Prevent deletion of singleton instance.
        """
        if self.pk and self.pk == self.SINGLETON_PK:
            raise ValueError("Cannot delete singleton instance")

    @classmethod
    def create(cls, **kwargs):
        """
        Prevent creation of new singleton instance.
        """
        raise ValueError("Use get() to retrieve singleton instance")

    @classmethod
    def get(cls):
        """
        Get or create singleton instance of QueueSettings.
        """
        if cls.objects.count() > 1:
            raise ValueError("Multiple instances of RegistrationQueueSettings found")
        obj, _ = cls.objects.get_or_create(pk=cls.SINGLETON_PK)
        return obj
