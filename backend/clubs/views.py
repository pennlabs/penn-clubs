import argparse
import base64
import collections
import datetime
import functools
import io
import json
import os
import re
import secrets
import string
from functools import wraps
from typing import Tuple
from urllib.parse import urlparse

import jwt
import pandas as pd
import pytz
import qrcode
import requests
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from CyberSource import (
    PaymentsApi,
    TransientTokenDataApi,
    UnifiedCheckoutCaptureContextApi,
)
from CyberSource.rest import ApiException
from dateutil.parser import parse
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core import mail
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile
from django.core.mail import EmailMultiAlternatives
from django.core.management import call_command, get_commands, load_command_class
from django.core.serializers.json import DjangoJSONEncoder
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import (
    Case,
    CharField,
    Count,
    DurationField,
    ExpressionWrapper,
    F,
    Max,
    Min,
    OuterRef,
    Prefetch,
    Q,
    Subquery,
    TextField,
    Value,
    When,
)
from django.db.models.functions import SHA1, Concat, Lower, Trunc
from django.db.models.query import prefetch_related_objects
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render
from django.template import TemplateDoesNotExist
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.utils.text import slugify
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_cookie
from ics import Calendar as ICSCal
from ics import Event as ICSEvent
from ics.grammar import parse as ICSParse
from jinja2 import Template
from options.models import Option
from rest_framework import filters, generics, parsers, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.utils.serializer_helpers import ReturnList
from rest_framework.views import APIView
from social_django.utils import load_strategy
from tatsu.exceptions import FailedParse

from clubs.filters import RandomOrderingFilter, RandomPageNumberPagination
from clubs.mixins import XLSXFormatterMixin
from clubs.models import (
    AdminNote,
    Advisor,
    ApplicationCycle,
    ApplicationExtension,
    ApplicationMultipleChoice,
    ApplicationQuestion,
    ApplicationQuestionResponse,
    ApplicationSubmission,
    Asset,
    Badge,
    Cart,
    Category,
    Classification,
    Club,
    ClubApplication,
    ClubApprovalResponseTemplate,
    ClubFair,
    ClubFairBooth,
    ClubFairRegistration,
    ClubVisit,
    Designation,
    Eligibility,
    Event,
    EventShowing,
    Favorite,
    GroupActivityOption,
    Major,
    Membership,
    MembershipInvite,
    MembershipRequest,
    Note,
    OwnershipRequest,
    QuestionAnswer,
    RankingWeights,
    RegistrationQueueSettings,
    Report,
    School,
    SearchQuery,
    Status,
    StudentType,
    Subscribe,
    Tag,
    Testimonial,
    Ticket,
    TicketTransactionRecord,
    TicketTransferRecord,
    Type,
    Year,
    ZoomMeetingVisit,
    get_mail_type_annotation,
    send_mail_helper,
)
from clubs.permissions import (
    AssetPermission,
    ClubBadgePermission,
    ClubFairPermission,
    ClubItemPermission,
    ClubPermission,
    ClubSensitiveItemPermission,
    DjangoPermission,
    EventPermission,
    EventShowingPermission,
    InvitePermission,
    IsSuperuser,
    MemberPermission,
    MembershipRequestPermission,
    NotePermission,
    OwnershipRequestPermission,
    ProfilePermission,
    QuestionAnswerPermission,
    ReadOnly,
    WhartonApplicationPermission,
    find_membership_helper,
)
from clubs.serializers import (
    AdminClubSerializer,
    AdminNoteSerializer,
    AdvisorSerializer,
    ApplicationCycleSerializer,
    ApplicationExtensionSerializer,
    ApplicationQuestionResponseSerializer,
    ApplicationQuestionSerializer,
    ApplicationSubmissionCSVSerializer,
    ApplicationSubmissionSerializer,
    ApplicationSubmissionUserSerializer,
    ApprovalHistorySerializer,
    AssetSerializer,
    AuthenticatedClubSerializer,
    AuthenticatedMembershipSerializer,
    BadgeSerializer,
    CategorySerializer,
    ClassificationSerializer,
    ClubApplicationSerializer,
    ClubApprovalResponseTemplateSerializer,
    ClubBoothSerializer,
    ClubConstitutionSerializer,
    ClubDiffSerializer,
    ClubFairSerializer,
    ClubListSerializer,
    ClubMembershipSerializer,
    ClubMinimalSerializer,
    ClubSerializer,
    DesignationSerializer,
    EligibilitySerializer,
    EventSerializer,
    EventShowingSerializer,
    EventShowingWriteSerializer,
    EventWriteSerializer,
    ExternalMemberListSerializer,
    FavoriteSerializer,
    FavoriteWriteSerializer,
    FavouriteEventSerializer,
    GroupActivityOptionSerializer,
    MajorSerializer,
    ManagedClubApplicationSerializer,
    MembershipInviteSerializer,
    MembershipRequestSerializer,
    MembershipSerializer,
    MinimalUserProfileSerializer,
    NoteSerializer,
    OwnershipRequestSerializer,
    QuestionAnswerSerializer,
    RankingWeightsSerializer,
    RegistrationQueueSettingsSerializer,
    ReportClubSerializer,
    ReportSerializer,
    SchoolSerializer,
    SearchQuerySerializer,
    StatusSerializer,
    StudentTypeSerializer,
    SubscribeBookmarkSerializer,
    SubscribeSerializer,
    TagSerializer,
    TestimonialSerializer,
    TicketSerializer,
    TypeSerializer,
    UserClubVisitSerializer,
    UserClubVisitWriteSerializer,
    UserMembershipInviteSerializer,
    UserMembershipRequestSerializer,
    UserMembershipSerializer,
    UserOwnershipRequestSerializer,
    UserProfileSerializer,
    UserSerializer,
    UserSubscribeSerializer,
    UserSubscribeWriteSerializer,
    UserUUIDSerializer,
    WhartonApplicationStatusSerializer,
    WritableClubApplicationSerializer,
    WritableClubFairSerializer,
    YearSerializer,
)
from clubs.utils import fuzzy_lookup_club, html_to_text


def update_holds(func):
    """
    Decorator to update ticket holds
    """

    @wraps(func)
    def wrap(self, request, *args, **kwargs):
        Ticket.objects.update_holds()
        return func(self, request, *args, **kwargs)

    return wrap


def file_upload_endpoint_helper(request, code):
    obj = get_object_or_404(Club, code=code)
    if "file" in request.data and isinstance(request.data["file"], UploadedFile):
        asset = Asset.objects.create(
            creator=request.user,
            club=obj,
            file=request.data["file"],
            name=request.data["file"].name,
        )
    else:
        return Response(
            {"detail": "No image file was uploaded!"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response({"detail": "Club file uploaded!", "id": asset.id})


def upload_endpoint_helper(request, cls, keyword, field, save=True, **kwargs):
    """
    Given a Model class with lookup arguments or a Model object, save the uploaded image
    to the image field specified in the argument.

    The save parameter can be used to control whether the Model is actually saved to
    the database. This parameter only applies if you pass in a Model object.

    Returns a response that can be given to the end user.
    """
    if isinstance(cls, type):
        obj = get_object_or_404(cls, **kwargs)
    else:
        obj = cls
    if keyword in request.data and isinstance(request.data[keyword], UploadedFile):
        getattr(obj, field).delete(save=False)
        setattr(obj, field, request.data[keyword])
        if save:
            obj._change_reason = f"Update '{field}' image field"
            obj.save()
    else:
        return Response(
            {"detail": "No image file was uploaded!"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response(
        {
            "detail": f"{obj.__class__.__name__} image uploaded!",
            "url": getattr(obj, field).url,
        }
    )


def find_relationship_helper(relationship, club_object, found):
    """
    Format and retrieve all parents or children of a club into tree.
    """
    children = getattr(club_object, relationship).all().prefetch_related(relationship)
    children_recurse = []
    for child in children:
        if child.code not in found:
            found.add(child.code)
            children_recurse.append(
                find_relationship_helper(relationship, child, found)
            )
            found.remove(child.code)
        else:
            children_recurse.append({"name": child.name, "code": child.code})

    return {
        "name": club_object.name,
        "code": club_object.code,
        "children": children_recurse,
    }


def filter_note_permission(queryset, club, user):
    """
    Filter the note queryset so that only notes the user has access
    to remain in the queryset
    """
    creating_club_membership = Membership.objects.filter(club=club, person=user).first()
    subject_club_membership = Membership.objects.filter(club=club, person=user).first()

    # Convert memberships into actual numerical representation
    if creating_club_membership is None:
        creating_club_membership = Note.PERMISSION_PUBLIC
    else:
        creating_club_membership = creating_club_membership.role

    if subject_club_membership is None:
        subject_club_membership = Note.PERMISSION_PUBLIC
    else:
        subject_club_membership = subject_club_membership.role

    queryset = queryset.filter(
        creating_club_permission__gte=creating_club_membership
    ) | queryset.filter(outside_club_permission__gte=subject_club_membership)

    return queryset


def hour_to_string_helper(hour):
    hour_string = ""
    if hour == 0:
        hour_string = "12am"
    elif hour < 12:
        hour_string = f"{hour}am"
    elif hour == 12:
        hour_string = "12pm"
    else:
        hour_string = f"{hour - 12}pm"

    return hour_string


def validate_transient_token(cc: str, tt: str) -> Tuple[bool, str]:
    """Validate the integrity of the transient token using
    the public key (JWK) obtained from the capture context"""

    try:
        _, body, _ = cc.split(".")
        decoded_body = json.loads(base64.b64decode(body + "==="))
        jwk = decoded_body["flx"]["jwk"]

        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))
        # This will throw if the key is invalid
        jwt.decode(tt, key=public_key, algorithms=["RS256"])
        return (True, "Successfully decoded the JWT")

    except Exception as e:
        return (False, str(e))


class ReportViewSet(viewsets.ModelViewSet):
    """
    retrieve:
    Return a list of reports that can be generated.
    """

    permission_classes = [DjangoPermission("clubs.generate_reports") | IsSuperuser]
    serializer_class = ReportSerializer
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        return Report.objects.filter(Q(creator=self.request.user) | Q(public=True))


class ClubsSearchFilter(filters.BaseFilterBackend):
    """
    A DRF filter to implement custom filtering logic for the frontend.
    If model is not a Club, expects the model to have a club foreign key to Club.
    """

    def filter_queryset(self, request, queryset, view):
        params = request.GET.dict()

        def parse_year(field, value, operation, queryset):
            if value.isdigit():
                suffix = ""
                if operation in {"lt", "gt", "lte", "gte"}:
                    suffix = f"__{operation}"
                return {f"{field}__year{suffix}": int(value)}
            if value.lower() in {"none", "null"}:
                return {f"{field}__isnull": True}
            return {}

        def parse_int(field, value, operation, queryset):
            if operation == "in":
                values = value.strip().split(",")
                sizes = [int(size) for size in values if size]
                return {f"{field}__in": sizes}

            if "," in value:
                values = [int(x.strip()) for x in value.split(",") if x]
                if operation == "and":
                    for value in values:
                        queryset = queryset.filter(**{field: value})
                    return queryset
                return {f"{field}__in": values}

            if value.isdigit():
                suffix = ""
                if operation in {"lt", "gt", "lte", "gte"}:
                    suffix = f"__{operation}"
                return {f"{field}{suffix}": int(value)}
            if value.lower() in {"none", "null"}:
                return {f"{field}__isnull": True}
            return {}

        def parse_many_to_many(label, field, value, operation, queryset):
            tags = value.strip().split(",")
            if operation == "or":
                if tags[0].isdigit():
                    tags = [int(tag) for tag in tags if tag]
                    return {f"{field}__id__in": tags}
                else:
                    return {f"{field}__{label}__in": tags}

            if tags[0].isdigit() or operation == "id":
                tags = [int(tag) for tag in tags if tag]
                if settings.BRANDING == "fyh":
                    queryset = queryset.filter(**{f"{field}__id__in": tags})
                else:
                    for tag in tags:
                        queryset = queryset.filter(**{f"{field}__id": tag})
            else:
                for tag in tags:
                    queryset = queryset.filter(**{f"{field}__{label}": tag})
            return queryset

        def parse_badges(field, value, operation, queryset):
            return parse_many_to_many("label", field, value, operation, queryset)

        def parse_tags(field, value, operation, queryset):
            return parse_many_to_many("name", field, value, operation, queryset)

        def parse_boolean(field, value, operation, queryset):
            value = value.strip().lower()

            if operation == "in":
                if set(value.split(",")) == {"true", "false"}:
                    return

            if value in {"true", "yes"}:
                boolval = True
            elif value in {"false", "no"}:
                boolval = False
            elif value in {"null", "none"}:
                boolval = None
            else:
                return

            if boolval is None:
                return {f"{field}__isnull": True}

            return {f"{field}": boolval}

        def parse_string(field, value, operation, queryset):
            if operation == "in":
                values = [x.strip() for x in value.split(",")]
                values = [x for x in values if x]
                return {f"{field}__in": values}
            return {f"{field}": value}

        def parse_datetime(field, value, operation, queryset):
            try:
                value = parse(value.strip())
            except (ValueError, OverflowError):
                return

            if operation in {"gt", "lt", "gte", "lte"}:
                return {f"{field}__{operation}": value}
            return

        fields = {
            "accepting_members": parse_boolean,
            "active": parse_boolean,
            "application_required": parse_int,
            "appointment_needed": parse_boolean,
            "approved": parse_boolean,
            "available_virtually": parse_boolean,
            "badges": parse_badges,
            "code": parse_string,
            "enables_subscription": parse_boolean,
            "favorite_count": parse_int,
            "founded": parse_year,
            "recruiting_cycle": parse_int,
            "size": parse_int,
            "tags": parse_tags,
            "target_majors": parse_tags,
            "target_schools": parse_tags,
            "target_years": parse_tags,
            "target_students": parse_tags,
            "student_types": parse_tags,
        }

        def parse_fair(field, value, operation, queryset):
            try:
                value = int(value.strip())
            except ValueError:
                return

            fair = ClubFair.objects.filter(id=value).first()
            if fair:
                return {
                    "start_time__gte": fair.start_time,
                    "end_time__lte": fair.end_time,
                }

        if not queryset.model == Club:
            fields = {f"club__{k}": v for k, v in fields.items()}

        if queryset.model == Event:
            fields.update(
                {
                    "type": parse_int,
                    "fair": parse_fair,
                    "earliest_start_time": parse_datetime,
                    "latest_start_time": parse_datetime,
                    "earliest_end_time": parse_datetime,
                    "latest_end_time": parse_datetime,
                }
            )

        query = {}

        for param, value in params.items():
            field = param.split("__")
            if field[0] == "club":
                prefix = field.pop(0)
                field[0] = f"{prefix}__{field[0]}"

            if len(field) <= 1:
                field = field[0]
                type = "eq"
            else:
                type = field[1].lower()
                field = field[0]

            if field not in fields:
                continue

            condition = fields[field](field, value.strip(), type, queryset)
            if isinstance(condition, dict):
                query.update(condition)
            elif condition is not None:
                queryset = condition

        queryset = queryset.filter(**query)

        return queryset


class ClubsOrderingFilter(RandomOrderingFilter):
    """
    Custom ordering filter for club objects.
    If used by a non club model, the object must have a foreign key to Club named club.
    """

    def get_valid_fields(self, queryset, view, context={}):
        # report generators can order by any field
        request = context.get("request")
        if (
            request is not None
            and request.user.is_authenticated
            and request.user.has_perm("clubs.generate_reports")
        ):
            valid_fields = [
                (field.name, field.verbose_name)
                for field in queryset.model._meta.fields
            ]
            valid_fields += [
                (key, key.title().split("__")) for key in queryset.query.annotations
            ]
            valid_fields += [
                (f"club__{field.name}", f"Club - {field.verbose_name}")
                for field in Club._meta.fields
            ]
            return valid_fields

        # other people can order by allowlist
        return super().get_valid_fields(queryset, view, context)

    def filter_queryset(self, request, queryset, view):
        ordering = [
            arg for arg in request.GET.get("ordering", "").strip().split(",") if arg
        ]
        if not ordering and hasattr(view, "ordering"):
            ordering = [view.ordering]

        if "featured" in ordering:
            if queryset.model == Club:
                return queryset.order_by("-rank", "-favorite_count", "-id")
            return queryset.order_by(
                "-club__rank", "-club__favorite_count", "-club__id"
            )
        else:
            # prevent invalid SQL lookups from custom ordering properties
            if hasattr(view, "ordering") and view.ordering in {
                "featured",
                "alphabetical",
                "random",
            }:
                old_ordering = view.ordering
                view.ordering = "-id"
            else:
                old_ordering = None

            new_queryset = super().filter_queryset(request, queryset, view)

            # restore ordering property
            if old_ordering is not None:
                view.ordering = old_ordering

        if "alphabetical" in ordering:
            new_queryset = new_queryset.order_by(Lower("name"))

        return new_queryset


class ClubFairViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of ongoing and upcoming club fairs.

    create:
    Schedule a new club fair.

    update:
    Update some attributes related to an existing club fair.
    All fields must be specified.

    partial_update:
    Update some attributes related to an existing club fair.
    Only specified fields are updated.

    destroy:
    Delete a club fair.
    """

    permission_classes = [ClubFairPermission | IsSuperuser]

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return WritableClubFairSerializer
        return ClubFairSerializer

    @action(detail=False, methods=["get"])
    def current(self, request, *args, **kwargs):
        """
        Return only the current club fair instance in a list or an empty list
        if there is no fair going on.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                $ref: "#/components/schemas/ClubFair"
        ---
        """
        now = timezone.now()
        fair = ClubFair.objects.filter(
            start_time__lte=now + datetime.timedelta(minutes=2),
            end_time__gte=now - datetime.timedelta(minutes=2),
        ).first()
        if fair is None:
            return Response([])
        else:
            return Response([ClubFairSerializer(instance=fair).data])

    @action(detail=True, methods=["get"])
    def live(self, *args, **kwargs):
        """
        Returns all events, grouped by event id, with the number of participants
        currently in the meeting, the officers or owners in the meeting, and the
        number of participants who have already attended the meeting.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            additionalProperties:
                                type: object
                                properties:
                                    participant_count:
                                        type: integer
                                    already_attended:
                                        type: integer
                                    officers:
                                        type: array
                                        items:
                                            type: string
                                    median:
                                        type: number
        ---
        """
        fair = self.get_object()
        clubs = fair.participating_clubs.all()

        events = Event.objects.filter(club__in=clubs, type=Event.FAIR)

        # Calculate metrics per showing
        metrics = (
            events.annotate(
                participant_count=Count(
                    "visits__person",
                    distinct=True,
                    filter=Q(visits__leave_time__isnull=True),
                ),
                already_attended=Count(
                    "visits__person",
                    distinct=True,
                    filter=Q(visits__leave_time__isnull=False),
                ),
            )
            .filter(
                Q(visits__leave_time__isnull=False) | Q(visits__leave_time__isnull=True)
            )
            .annotate(
                durations=ExpressionWrapper(
                    F("visits__leave_time") - F("visits__join_time"),
                    output_field=DurationField(),
                )
            )
        )

        median_list = collections.defaultdict(list)
        for event_id, duration in metrics.values_list("id", "durations").order_by(
            "durations"
        ):
            if duration is not None:
                median_list[event_id].append(duration.total_seconds())

        # Calculate metrics per event
        event_medians = {k: v[len(v) // 2] if v else 0 for k, v in median_list.items()}

        # Aggregate metrics by event
        event_participant_counts = collections.defaultdict(int)
        event_already_attended = collections.defaultdict(int)

        for event_id, participant_count, attended_count in metrics.values_list(
            "id", "participant_count", "already_attended"
        ):
            event_participant_counts[event_id] += participant_count
            event_already_attended[event_id] += attended_count

        # Get officers who are currently in any showing of the event
        officer_mapping = collections.defaultdict(list)
        for event_id, username in (
            events.filter(
                club__in=clubs,
                club__membership__role__lte=10,
                visits__leave_time__isnull=True,
            )
            .values_list("id", "club__membership__person__username")
            .distinct()
        ):
            officer_mapping[event_id].append(username)

        # Format the response with event IDs as keys
        formatted = {}
        for event_id in events.values_list("id", flat=True):
            formatted[event_id] = {
                "participant_count": event_participant_counts.get(event_id, 0),
                "already_attended": event_already_attended.get(event_id, 0),
                "officers": officer_mapping.get(event_id, []),
                "median": event_medians.get(event_id, 0),
            }

        return Response(formatted)

    @action(detail=True, methods=["post"])
    def create_events(self, request, *args, **kwargs):
        """
        Create events for each club registered for this activities fair.
        This endpoint will create one event per club spanning the
        entire listed duration.
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            start_time:
                                type: string
                            end_time:
                                type: string
                            suffix:
                                type: string
                            clubs:
                                type: string
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                events:
                                    type: number
        ---
        """
        start_time = None
        end_time = None
        query = None
        suffix = request.data.get("suffix") or "default"
        clubs = [c.strip() for c in re.split(r"[,\t\n]", request.data.get("clubs", ""))]
        clubs = [c for c in clubs]

        if clubs:
            query = Q(code__in=clubs)

        if "start_time" in request.data:
            start_time = parse(request.data["start_time"])
        if "end_time" in request.data:
            end_time = parse(request.data["end_time"])

        fair = self.get_object()
        events = fair.create_events(
            start_time=start_time, end_time=end_time, suffix=suffix, filter=query
        )
        return Response({"events": len(events)})

    @action(detail=True, methods=["get"])
    def events(self, request, *args, **kwargs):
        """
        Return all of the events related to this club fair
        and whether they are properly configured.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: object
                                properties:
                                    code:
                                        type: string
                                        description: >
                                            The club code for the club.
                                    name:
                                        type: string
                                        description: >
                                            The name of the club.
                                    approved:
                                        type: boolean
                                        description: >
                                            Whether this club has been approved by the
                                            approval authority or not.
                                    badges:
                                        type: array
                                        description: >
                                            A list of badges associated with this
                                            club and fair.
                                        items:
                                            type: string
                                    meetings:
                                        type: array
                                        description: >
                                            The meeting links for the fair events.
                                        items:
                                            type: string
        ---
        """
        fair = self.get_object()
        clubs = fair.participating_clubs.all()

        # collect events
        events = collections.defaultdict(list)
        for club_code, event_url in (
            Event.objects.filter(club__in=clubs, type=Event.FAIR)
            .filter(
                eventshowing__start_time__gte=fair.start_time,
                eventshowing__end_time__lte=fair.end_time,
            )
            .values_list("club__code", "url")
        ):
            events[club_code].append(event_url)

        # collect badges
        badges = collections.defaultdict(list)
        for code, lbl in Badge.objects.filter(purpose="fair", fair=fair).values_list(
            "club__code", "label"
        ):
            badges[code].append(lbl)

        return Response(
            [
                {
                    "code": code,
                    "name": name,
                    "approved": approved or ghost,
                    "meetings": events.get(code, []),
                    "badges": badges.get(code, []),
                }
                for code, name, approved, ghost in clubs.order_by("name").values_list(
                    "code", "name", "approved", "ghost"
                )
            ]
        )

    @action(detail=True, methods=["post"])
    def register(self, request, *args, **kwargs):
        """
        Register a club for this club fair.
        Pass in a "club" string parameter with the club code
        and a "status" parameter that is true to register the club,
        or false to unregister.
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            status:
                                type: boolean
                                description: >
                                    Whether to register or unregister this club for
                                    the fair. By default, the endpoint will attempt
                                    to register the club.
                            club:
                                type: string
                                description: >
                                    The code of the club that you are trying
                                    to register.
                            answers:
                                type: array
                                description: >
                                    The answers to the required fair questions.
                                    Each element in the array is an answer to a fair
                                    question, in the same order of the related
                                    fair questions.
                        required:
                            - club
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                success:
                                    type: boolean
                                    description: >
                                        Whether or not this club has been registered.
                                message:
                                    type: string
                                    description: A success or error message.
        ---
        """
        fair = self.get_object()

        if not request.user.is_authenticated:
            raise PermissionDenied

        club = get_object_or_404(Club, code=request.data.get("club"))

        # get register/unregister action status
        status = request.data.get("status")
        if isinstance(status, str):
            status = status.strip().lower() == "true"
        elif not isinstance(status, bool):
            status = True

        # get answers to questions
        num_questions = len(json.loads(fair.questions)) if fair.questions else 0
        answer_objects = request.data.get("answers", [])
        answers = json.dumps(answer_objects)

        # make sure questions are answered
        if (
            status
            and num_questions > 0
            and (
                not all(ans is not None for ans in answer_objects)
                or len(answer_objects) < num_questions
            )
        ):
            return Response(
                {
                    "success": False,
                    "message": "Please fill out all of the questions in the form.",
                }
            )

        # make sure club constitution is uploaded for SAC clubs
        if (
            status
            and fair.organization == "Student Activities Council"
            and club.badges.filter(label="SAC").exists()
        ):
            if club.asset_set.count() <= 0 or not any(
                asset.name.lower().endswith((".pdf", ".doc", ".docx"))
                for asset in club.asset_set.all()
            ):
                if not request.user.is_superuser:
                    return Response(
                        {
                            "success": False,
                            "message": "As a SAC affiliated club, "
                            "you must upload a club constitution "
                            "before registering for this fair.",
                        }
                    )

        # check if registration has started
        now = timezone.now()
        if (
            fair.registration_start_time is not None
            and fair.registration_start_time > now
        ):
            return Response(
                {
                    "success": False,
                    "message": "Registration for this activities fair "
                    "has not opened yet.",
                }
            )

        # check if deadline has passed
        if fair.registration_end_time < now:
            return Response(
                {
                    "success": False,
                    "message": "The deadline has passed to register "
                    "for this activities fair. "
                    f"Please email {fair.contact} for assistance.",
                }
            )

        # check if user can actually register club
        mship = find_membership_helper(request.user, club)
        if (
            mship is not None
            and mship.role <= Membership.ROLE_OFFICER
            or request.user.is_superuser
        ):
            # register or unregister club
            if status:
                ClubFairRegistration.objects.update_or_create(
                    club=club,
                    fair=fair,
                    defaults={"answers": answers, "registrant": request.user},
                )
            else:
                fair.participating_clubs.remove(club)
            return Response({"success": True})
        else:
            raise PermissionDenied

    def get_queryset(self):
        now = timezone.now()
        return ClubFair.objects.filter(end_time__gte=now).order_by("start_time")


class ClubViewSet(XLSXFormatterMixin, viewsets.ModelViewSet):
    """
    retrieve:
    Return a single club with all information fields present.

    list:
    Return a list of clubs with partial information for each club.

    create:
    Add a new club record.
    After creation, the club will need to go through the approval process.

    update:
    Update all fields in the club.
    You must specify all of the fields or use a patch request.

    partial_update:
    Update certain fields in the club.
    Only specify the fields that you want to change.

    destroy:
    Delete a club. Consider marking the club as inactive instead of deleting the club.
    """

    queryset = (
        Club.objects.all().prefetch_related("tags").order_by("-favorite_count", "name")
    )
    permission_classes = [ClubPermission | IsSuperuser]
    filter_backends = [filters.SearchFilter, ClubsSearchFilter, ClubsOrderingFilter]
    search_fields = ["name", "subtitle", "code", "terms"]
    ordering_fields = ["favorite_count", "name"]
    ordering = "featured"

    lookup_field = "code"
    http_method_names = ["get", "post", "put", "patch", "delete"]
    pagination_class = RandomPageNumberPagination

    def get_queryset(self):
        queryset = super().get_queryset()

        # additional prefetch optimizations
        person = self.request.user
        if not person.is_authenticated:
            person = None

        if self.action in {"list", "retrieve"}:
            queryset = queryset.prefetch_related(
                Prefetch(
                    "favorite_set",
                    queryset=Favorite.objects.filter(person=person),
                    to_attr="user_favorite_set",
                ),
                Prefetch(
                    "subscribe_set",
                    queryset=Subscribe.objects.filter(person=person),
                    to_attr="user_subscribe_set",
                ),
                Prefetch(
                    "membership_set",
                    queryset=Membership.objects.filter(person=person),
                    to_attr="user_membership_set",
                ),
                "badges",
                "group_activity_assessment",
                "eligibility",
            )
            queryset = queryset.select_related(
                "classification",
                "category",
                "category__designation",
                "type",
                "status",
            )

            if self.action in {"retrieve"}:
                queryset = queryset.prefetch_related(
                    "asset_set",
                    "student_types",
                    "target_majors",
                    "target_schools",
                    "target_years",
                    "testimonials",
                    Prefetch(
                        "membership_set",
                        queryset=Membership.objects.filter(active=True)
                        .order_by("role", "person__first_name", "person__last_name")
                        .prefetch_related("person__profile"),
                    ),
                )

        # if there is a search query made by a signed-in user, save it to the database
        if self.request.query_params.get("search") and isinstance(
            self.request.user, get_user_model()
        ):
            SearchQuery(
                person=self.request.user,
                query=self.request.query_params.get("search"),
            ).save()

        # select subset of clubs if requested
        subset = self.request.query_params.get("in", None)

        if subset:
            subset = [x.strip() for x in subset.strip().split(",")]
            queryset = queryset.filter(code__in=subset)

        # filter out archived clubs
        queryset = queryset.filter(archived=False)

        # filter by approved clubs
        if (
            self.request.user.has_perm("clubs.see_pending_clubs")
            or self.request.query_params.get("bypass", "").lower() == "true"
            or self.action not in {"list"}
        ):
            return queryset
        else:
            return queryset.filter(Q(approved=True) | Q(ghost=True))

    def _has_elevated_view_perms(self, instance):
        """
        Determine if the current user has elevated view privileges.
        """
        see_pending = self.request.user.has_perm("clubs.see_pending_clubs")
        manage_club = self.request.user.has_perm("clubs.manage_club")
        is_member = (
            self.request.user.is_authenticated
            and instance.membership_set.filter(person=self.request.user).exists()
        )
        return see_pending or manage_club or is_member

    @action(detail=True, methods=["post"])
    def upload(self, request, *args, **kwargs):
        """
        Upload the club logo.
        Marks the club as pending approval since the logo has changed.
        Also create a thumbnail version of the club logo.
        ---
        requestBody:
            content:
                multipart/form-data:
                    schema:
                        type: object
                        properties:
                            file:
                                type: object
                                format: binary
        responses:
            "200":
                description: Returned if the file was successfully uploaded.
                content: &upload_resp
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: The status of the file upload.
                                url:
                                    type: string
                                    nullable: true
                                    description: >
                                        The URL of the newly uploaded file.
                                        Only exists if the file was
                                        successfully uploaded.
            "400":
                description: Returned if there was an error while uploading the file.
                content: *upload_resp
        ---
        """
        # ensure user is allowed to upload image
        club = self.get_object()
        cache.delete(f"clubs:{club.id}-authed")
        cache.delete(f"clubs:{club.id}-anon")

        # check if reapproval queue is open
        queue_settings = RegistrationQueueSettings.get()
        relevant_queue_open = (
            queue_settings.reapproval_queue_open
            if club.image is not None
            else queue_settings.approval_queue_open
        )
        if not request.user.has_perm("clubs.approve_club") and not relevant_queue_open:
            raise PermissionDenied(
                "The approval queue is not currently open for editing club images."
            )

        # reset approval status after upload
        resp = upload_endpoint_helper(request, club, "file", "image", save=False)
        if status.is_success(resp.status_code):
            club.approved = None
            club.approved_by = None
            club.approved_on = None
            if club.history.filter(approved=True).exists():
                club.ghost = True

            club._change_reason = "Mark pending approval due to image change"
            club.save(
                update_fields=[
                    "image",
                    "approved",
                    "approved_by",
                    "approved_on",
                    "ghost",
                ]
            )

            # create thumbnail
            club.create_thumbnail(request)

        return resp

    @action(detail=True, methods=["post"])
    def upload_file(self, request, *args, **kwargs):
        """
        Upload a file for the club.
        ---
        requestBody:
            content:
                multipart/form-data:
                    schema:
                        type: object
                        properties:
                            file:
                                type: object
                                format: binary
        responses:
            "200":
                description: Returned if the file was successfully uploaded.
                content: &upload_resp
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: The status of the file upload.
                                url:
                                    type: string
                                    nullable: true
                                    description: >
                                        The URL of the newly uploaded file.
                                        Only exists if the file was successfully
                                        uploaded.
            "400":
                description: Returned if there was an error while uploading the file.
                content: *upload_resp
        ---
        """
        # ensure user is allowed to upload file
        club = self.get_object()

        return file_upload_endpoint_helper(request, code=club.code)

    @action(detail=True, methods=["get"])
    def history(self, request, *args, **kwargs):
        """
        Return a simplified approval history for the club.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: object
                                properties:
                                    approved:
                                        type: boolean
                                    approved_on:
                                        type: string
                                        format: date-time
                                    approved_by:
                                        type: string
                                        description: >
                                            The full name of the user who approved
                                            the club.
                                    approved_comment:
                                        type: string
                                    history_date:
                                        type: string
                                        format: date-time
                                        description: >
                                            The time in which the specific version
                                            of the club was saved at.
        ---
        """
        club = self.get_object()
        return Response(
            ApprovalHistorySerializer(
                club.history.order_by("-history_date"),
                many=True,
                context={"request": request},
            ).data
        )

    @action(detail=True, methods=["get"])
    def owned_badges(self, request, *args, **kwargs):
        """
        Return a list of badges that this club is an owner of.
        The club will be able to assign these badges to other clubs.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            allOf:
                                - $ref: "#/components/schemas/Badge"
        ---
        """
        club = self.get_object()
        badges = Badge.objects.filter(org=club)
        return Response(BadgeSerializer(badges, many=True).data)

    @action(detail=True, methods=["get"])
    def children(self, request, *args, **kwargs):
        """
        Return a recursive list of all children that this club is a parent of.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                name:
                                    type: string
                                code:
                                    type: string
                                children:
                                    type: array
                                    description: >
                                        An array of clubs containing
                                        the fields in this object.
        ---
        """
        club = self.get_object()
        child_tree = find_relationship_helper("children_orgs", club, {club.code})
        return Response(child_tree)

    @action(detail=True, methods=["get"])
    def parents(self, request, *args, **kwargs):
        """
        Return a recursive list of all parents that this club is a child to.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                name:
                                    type: string
                                code:
                                    type: string
                                children:
                                    type: array
                                    description: >
                                        An array of clubs containing
                                        the fields in this object.
        ---
        """
        club = self.get_object()
        parent_tree = find_relationship_helper("parent_orgs", club, {club.code})
        return Response(parent_tree)

    @action(detail=True, methods=["get"])
    def alumni(self, request, *args, **kwargs):
        """
        Return the members of this club who are no longer active.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            additionalProperties:
                                type: array
                                items:
                                    type: object
                                    properties:
                                        name:
                                            type: string
                                        username:
                                            type: string
        ---
        """
        if not request.user.is_authenticated:
            raise PermissionDenied
        club = self.get_object()
        results = collections.defaultdict(list)
        for first, last, year, show, username in club.membership_set.filter(
            active=False, public=True
        ).values_list(
            "person__first_name",
            "person__last_name",
            "person__profile__graduation_year",
            "person__profile__show_profile",
            "person__username",
        ):
            results[year].append(
                {
                    "name": f"{first} {last}".strip(),
                    "username": username if show else None,
                }
            )
        return Response(results)

    @action(detail=True, methods=["get"], url_path="notes-about")
    def notes_about(self, request, *args, **kwargs):
        """
        Return a list of notes about this club, used by members of parent organizations.
        """
        club = self.get_object()
        queryset = Note.objects.filter(subject_club__code=club.code)
        queryset = filter_note_permission(queryset, club, self.request.user)
        serializer = NoteSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def qr(self, request, *args, **kwargs):
        """
        Return a QR code png image representing a link to the club on Penn Clubs.
        ---
        operationId: Generate QR Code for Club
        responses:
            "200":
                description: Return a png image representing a QR code to the fair page.
                content:
                    image/png:
                        schema:
                            type: binary
        ---
        """
        club = self.get_object()

        url = f"https://{settings.DEFAULT_DOMAIN}/club/{club.code}/fair"
        response = HttpResponse(content_type="image/png")
        qr_image = qrcode.make(url, box_size=20, border=0)
        qr_image.save(response, "PNG")
        return response

    @action(detail=True, methods=["get"])
    def subscription(self, request, *args, **kwargs):
        """
        Return a list of all students that have subscribed to the club,
        including their names and emails.

        If a student has indicated that they want to share their bookmarks as well,
        include this information in the results.
        """
        club = self.get_object()
        subscribes = (
            Subscribe.objects.filter(club=club)
            .select_related("person", "person__profile", "club")
            .prefetch_related("person__profile__school", "person__profile__major")
        )
        shared_bookmarks = (
            Favorite.objects.exclude(
                person__pk__in=subscribes.values_list("person__pk", flat=True)
            )
            .filter(club=club, person__profile__share_bookmarks=True)
            .select_related("person", "person__profile", "club")
            .prefetch_related("person__profile__school", "person__profile__major")
        )
        bookmark_serializer = SubscribeBookmarkSerializer(shared_bookmarks, many=True)
        serializer = SubscribeSerializer(subscribes, many=True)
        output = serializer.data + bookmark_serializer.data
        return Response(ReturnList(output, serializer=serializer))

    @action(detail=True, methods=["get"])
    def analytics_pie_charts(self, request, *args, **kwargs):
        """
        Returns demographic information about bookmarks
        and subscriptions in pie chart format.
        ---
        parameters:
            - name: category
              in: query
              type: string
            - name: metric
              in: query
              type: string
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                content:
                                    type: array
        ---
        """
        club = self.get_object()
        lower_bound = timezone.now() - datetime.timedelta(days=30 * 6)
        category = self.request.query_params.get("category")
        metric = self.request.query_params.get("metric")

        def get_breakdown(category, metric):
            if category == "graduation_year":
                category_join = "person__profile__graduation_year"
            else:
                category_join = "person__profile__school__name"

            if metric == "favorite":
                queryset = Favorite.objects.filter(
                    club=club, created_at__gte=lower_bound
                )
            elif metric == "subscribe":
                queryset = Subscribe.objects.filter(
                    club=club, created_at__gte=lower_bound
                )
            else:
                queryset = ClubVisit.objects.filter(
                    club=club, created_at__gte=lower_bound, visit_type=1
                )

            return {
                "content": list(
                    queryset.values(category_join).annotate(count=Count("id"))
                ),
            }

        return Response(get_breakdown(category, metric))

    @action(detail=True, methods=["get"])
    def analytics(self, request, *args, **kwargs):
        """
        Returns a list of all analytics (club visits, favorites,
        subscriptions) for a club.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                max:
                                    type: integer
                                    description: >
                                        The maximum value among all categories.
                                        Useful when deciding how tall a
                                        line chart should be.
                                visits:
                                    type: array
                                favorites:
                                    type: array
                                subscriptions:
                                    type: array
        ---
        """
        club = self.get_object()
        group = self.request.query_params.get("group", "hour")
        if "date" in request.query_params:
            date = datetime.datetime.strptime(request.query_params["date"], "%Y-%m-%d")
        else:
            date = datetime.datetime.combine(
                datetime.date.today(), datetime.datetime.min.time()
            )

        # parse date range
        if "start" in request.query_params:
            start = parse(request.query_params["start"])
        else:
            start = date

        if "end" in request.query_params:
            end = parse(request.query_params["end"])
        else:
            end = start + datetime.timedelta(days=1)

        # retrieve data
        def get_count(queryset):
            """
            Return a json serializable aggregation of
            analytics data for a specific model.
            """
            objs = (
                queryset.annotate(group=Trunc("created_at", group))
                .values("group")
                .annotate(count=Count("id"))
            )
            for item in objs:
                item["group"] = item["group"].isoformat()
            return list(objs)

        visits_data = get_count(
            ClubVisit.objects.filter(
                club=club,
                created_at__gte=start,
                created_at__lte=end,
                visit_type=ClubVisit.CLUB_PAGE,
            )
        )
        favorites_data = get_count(
            Favorite.objects.filter(
                club=club, created_at__gte=start, created_at__lte=end
            )
        )
        subscriptions_data = get_count(
            Subscribe.objects.filter(
                club=club, created_at__gte=start, created_at__lte=end
            )
        )

        max_value = max(
            max([v["count"] for v in visits_data], default=0),
            max([v["count"] for v in favorites_data], default=0),
            max([v["count"] for v in subscriptions_data], default=0),
        )

        analytics_dict = {
            "visits": visits_data,
            "favorites": favorites_data,
            "subscriptions": subscriptions_data,
            "max": max_value,
        }

        return Response(analytics_dict)

    @action(detail=True, methods=["get"])
    def booths(self, request, *args, **kwargs):
        """
        Getting all booths associated with a club
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: object
                                properties:
                                    name:
                                        type: string
                                    subtitle:
                                        type: string
                                    club:
                                        type: string
                                    image_url:
                                        type: string
                                    lat:
                                        type: number
                                    long:
                                        type: number
                                    start_time:
                                        type: string
                                    end_time:
                                        type: string
        ---
        """
        club = self.get_object()
        res = ClubFairBooth.objects.filter(club=club).select_related("club").all()
        return Response(ClubBoothSerializer(res, many=True).data)

    def get_operation_id(self, **kwargs):
        if kwargs["action"] == "fetch" and kwargs["method"] == "DELETE":
            return "deleteIcsEvents"

    @action(detail=True, methods=["post", "delete"])
    def fetch(self, request, *args, **kwargs):
        """
        Fetch the ICS calendar events from the club's ICS calendar URL.
        ---
        requestBody: {}
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                success:
                                    type: boolean
                                    description: Whether or not events were fetched.
                                message:
                                    type: string
                                    description: A success or error message.
        ---
        """
        club = self.get_object()

        if request.method == "DELETE":
            now = timezone.now()
            event_ids = Event.objects.filter(club=club, is_ics_event=True).values_list(
                "id", flat=True
            )
            event_count, _ = (
                Event.objects.filter(
                    id__in=event_ids, eventshowing__start_time__gte=now
                )
                .distinct()
                .delete()
            )  # showings will be deleted by cascade

            return Response(
                {
                    "success": True,
                    "message": f"Deleted {event_count} imported ICS calendar events!",
                }
            )

        if not club.ics_import_url:
            return Response(
                {
                    "success": False,
                    "message": "No ICS calendar URL set, so no events were imported.",
                }
            )

        try:
            num_events = club.add_ics_events()
        except requests.exceptions.RequestException:
            return Response(
                {
                    "success": False,
                    "message": "Failed to fetch events from server, "
                    "are you sure your URL is correct?",
                }
            )
        except FailedParse:
            return Response(
                {
                    "success": False,
                    "message": "Failed to parse ICS events, "
                    "are you sure this is an ICS file?",
                }
            )

        return Response({"success": True, "message": f"Fetched {num_events} events!"})

    @action(detail=False, methods=["get"])
    def directory(self, request, *args, **kwargs):
        """
        Custom return endpoint for the directory page, allows the page to load faster.
        ---
        operationId: Club Directory List
        ---
        """
        serializer = ClubMinimalSerializer(
            Club.objects.all()
            .exclude((~Q(approved=True) & Q(ghost=False)) | Q(archived=True))
            .order_by(Lower("name")),
            many=True,
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def constitutions(self, request, *args, **kwargs):
        """
        A special endpoint for SAC affiliated clubs to check if
        they have uploaded a club constitution.
        ---
        operationId: List Club Constitutions
        ---
        """
        badge = Badge.objects.filter(label="SAC").first()
        if badge:
            query = (
                Club.objects.filter(badges=badge, archived=False)
                .order_by(Lower("name"))
                .prefetch_related(
                    Prefetch("asset_set", to_attr="prefetch_asset_set"),
                )
            )
            if request.user.is_authenticated:
                query = query.prefetch_related(
                    Prefetch(
                        "membership_set",
                        queryset=Membership.objects.filter(person=request.user),
                        to_attr="user_membership_set",
                    )
                )
            serializer = ClubConstitutionSerializer(
                query, many=True, context={"request": request}
            )
            return Response(serializer.data)
        else:
            return Response({"error": "The SAC badge does not exist in the database."})

    @action(detail=False, methods=["post"])
    def lookup(self, request, *args, **kwargs):
        """
        An endpoint to look up club codes from club names.
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        properties:
                            clubs:
                                type: string
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                output:
                                    type: string
        ---
        """
        clubs = [c.strip() for c in re.split(r"[\t\n]", request.data.get("clubs", ""))]
        clubs = [c for c in clubs if c]
        simple = {
            name: code
            for name, code in Club.objects.filter(name__in=clubs).values_list(
                "name", "code"
            )
        }
        output = []
        for name in clubs:
            if name in simple:
                output.append(simple[name])
            elif name:
                fuzzy = fuzzy_lookup_club(name)
                if fuzzy is None:
                    fuzzy = "None"
                else:
                    fuzzy = fuzzy.code
                output.append(fuzzy)
            else:
                output.append(name)
        return Response({"output": "\n".join(output).strip()})

    @action(detail=False, methods=["post"])
    def bulk(self, request, *args, **kwargs):
        """
        An endpoint to perform certain club edit operations in bulk.
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        properties:
                            action:
                                type: string
                                description: The bulk action to perform.
                            clubs:
                                type: string
                                description: >
                                    A list of club codes, separated by
                                    comma, newline, space, or tab.
                            tags:
                                type: array
                                items:
                                    type: object
                                    parameters:
                                        id:
                                            type: number
                            badges:
                                type: array
                                items:
                                    type: object
                                    parameters:
                                        id:
                                            type: number
                            fairs:
                                type: array
                                items:
                                    type: object
                                    parameters:
                                        id:
                                            type: number
                        required:
                            - action
                            - clubs
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                success:
                                    type: boolean
                                    description: >
                                        Whether or not this club has been registered.
                                message:
                                    type: string
                                    description: >
                                        A success message. Only set if operation passes.
                                error:
                                    type: string
                                    description: >
                                        An error message. Only set if an error occurs.
        ---
        """
        if not request.user.is_authenticated or not request.user.has_perm(
            "clubs.manage_club"
        ):
            return Response(
                {"error": "You do not have permission to perform this action."}
            )

        action = request.data.get("action")
        if action is None:
            return Response({"error": "You must specify the action to perform!"})

        # lookup clubs by code
        clubs = [
            code.strip()
            for code in re.split(r"[,\t\n]", request.data.get("clubs", "").strip())
        ]
        clubs = [code for code in clubs if code]
        if not clubs:
            return Response(
                {
                    "error": "You must specify the list of codes "
                    "you want to apply this action to."
                }
            )
        club_objs = Club.objects.filter(code__in=clubs)
        missing_clubs = set(clubs) - set(club_objs.values_list("code", flat=True))

        # abort if none exist
        if not club_objs.exists():
            clubs_str = ", ".join(clubs)
            return Response(
                {
                    "error": "No objects were found matching those codes. "
                    f"Codes tried: {clubs_str}"
                }
            )

        tags = request.data.get("tags", [])
        badges = request.data.get("badges", [])
        fairs = request.data.get("fairs", [])

        if not tags and not badges and not fairs:
            return Response(
                {"error": "You must specify some related objects to manipulate!"}
            )

        tags = Tag.objects.filter(id__in=[tag["id"] for tag in tags])
        badges = Badge.objects.filter(id__in=[badge["id"] for badge in badges])
        fairs = ClubFair.objects.filter(id__in=[fair["id"] for fair in fairs])

        count = 0
        if tags or badges:
            for club in club_objs:
                if action == "add":
                    club.tags.add(*tags)
                    club.badges.add(*badges)
                    count += 1
                elif action == "remove":
                    club.tags.remove(*tags)
                    club.badges.remove(*badges)
                    count += 1

        if fairs:
            for fair in fairs:
                if action == "add":
                    registered_clubs = set(
                        ClubFairRegistration.objects.filter(fair=fair).values_list(
                            "club__code", flat=True
                        )
                    )
                    unregistered_clubs = [
                        club for club in club_objs if club.code not in registered_clubs
                    ]
                    ClubFairRegistration.objects.bulk_create(
                        [
                            ClubFairRegistration(
                                club=club, fair=fair, registrant=request.user
                            )
                            for club in unregistered_clubs
                        ]
                    )
                    count += len(unregistered_clubs)
                elif action == "remove":
                    count += ClubFairRegistration.objects.filter(
                        club__in=club_objs, fair=fair
                    ).delete()[0]

        msg = f"{count} object(s) have been updated!"
        if missing_clubs:
            msg += (
                f" Could not find {len(missing_clubs)} club(s) by code: "
                f"{', '.join(missing_clubs)}"
            )

        return Response({"success": True, "message": msg})

    def get_filename(self):
        """
        For excel spreadsheets, return the user-specified filename if it exists
        or the default filename otherwise.
        """
        name = self.request.query_params.get("xlsx_name")
        if name:
            return "{}.xlsx".format(slugify(name))
        return super().get_filename()

    def check_approval_permission(self, request):
        """
        Only users with specific permissions can modify the approval field.
        """
        if (
            request.data.get("approved", None) is not None
            or request.data.get("approved_comment", None) is not None
        ):
            # users without approve permission cannot approve
            if not request.user.has_perm("clubs.approve_club"):
                raise PermissionDenied

            # an approval request must not modify any other fields
            if set(request.data.keys()) - {"approved", "approved_comment"}:
                raise DRFValidationError(
                    "You can only pass the approved and approved_comment fields "
                    "when performing club approval."
                )

        if request.data.get("fair", None) is not None:
            if set(request.data.keys()) - {"fair"}:
                raise DRFValidationError(
                    "You can only pass the fair field when registering "
                    "or deregistering for the SAC fair."
                )

    def list(self, *args, **kwargs):
        """
        Return a list of all clubs. Responses cached for 1 hour

        Responses are only cached for people with specific permissions
        """
        key = self.request.build_absolute_uri()
        cached_object = cache.get(key)
        if (
            cached_object
            and not self.request.user.groups.filter(name="Approvers").exists()
            and not self.request.user.has_perm("clubs.approve_club")
        ):
            return Response(cached_object)

        resp = super().list(*args, **kwargs)
        cache.set(key, resp.data, 60 * 60)
        return resp

    def retrieve(self, *args, **kwargs):
        """
        Retrieve data about a specific club. Responses cached for 1 hour. Caching is
        disabled for users with elevated view perms so that changes without approval
        granted don't spill over to public.
        """
        club = self.get_object()

        # don't cache if user has elevated view perms
        if self._has_elevated_view_perms(club):
            return super().retrieve(*args, **kwargs)

        key = f"""clubs:{club.id}-{
            "authed" if self.request.user.is_authenticated else "anon"
        }"""
        cached = cache.get(key)
        if cached:
            return Response(cached)

        resp = super().retrieve(*args, **kwargs)
        cache.set(key, resp.data, 60 * 60)
        return resp

    def update(self, request, *args, **kwargs):
        """
        Invalidate caches
        """
        self.check_approval_permission(request)
        cache.delete(f"clubs:{self.get_object().id}-authed")
        cache.delete(f"clubs:{self.get_object().id}-anon")
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """
        Invalidate caches
        """
        self.check_approval_permission(request)
        cache.delete(f"clubs:{self.get_object().id}-authed")
        cache.delete(f"clubs:{self.get_object().id}-anon")
        return super().partial_update(request, *args, **kwargs)

    def perform_destroy(self, instance):
        """
        Set archived boolean to be True so that the club appears to have been deleted
        """
        club = self.get_object()

        instance.archived = True
        instance.archived_by = self.request.user
        instance.archived_on = timezone.now()
        instance.save()

        # Send notice to club officers and executor
        context = {
            "name": club.name,
            "reply_emails": settings.OSA_EMAILS + [settings.BRANDING_SITE_EMAIL],
        }
        emails = club.get_officer_emails() + [self.request.user.email]
        send_mail_helper(
            name="club_deletion",
            subject="{} status update on {}".format(
                club.name, settings.BRANDING_SITE_NAME
            ),
            emails=emails,
            context=context,
            reply_to=settings.OSA_EMAILS + [settings.BRANDING_SITE_EMAIL],
        )

    def _get_club_diff_queryset(self):
        """
        Returns a queryset of clubs annotated with the latest and latest approved values
        for specific fields (name, description, image) from their historical records.

        The annotations include:
        - `latest_<field>`: The most recent value of the field.
        - `latest_approved_<field>`: The most recent approved value of the field.
        """
        latest_version_qs = Club.history.filter(code=OuterRef("code")).order_by(
            "-history_date"
        )

        latest_approved_version_qs = Club.history.filter(
            code=OuterRef("code"), approved=True
        ).order_by("-history_date")

        qs = Club.objects.annotate(
            latest_name=Subquery(latest_version_qs.values("name")[:1]),
            latest_description=Subquery(latest_version_qs.values("description")[:1]),
            latest_image=Subquery(latest_version_qs.values("image")[:1]),
            latest_approved_name=Subquery(
                latest_approved_version_qs.values("name")[:1]
            ),
            latest_approved_description=Subquery(
                latest_approved_version_qs.values("description")[:1]
            ),
            latest_approved_image=Subquery(
                latest_approved_version_qs.values("image")[:1]
            ),
        )

        return qs

    @action(detail=True, methods=["GET"])
    def club_detail_diff(self, request, *args, **kwargs):
        """
        Return old and new data for a club that is pending approval.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                club_code:
                                    type: object
                                    description: club code
                                    properties:
                                        name:
                                            type: object
                                            description: Changes in the name field
                                            properties:
                                                old:
                                                    type: string
                                                    description: >
                                                        Old name of the club
                                                new:
                                                    type: string
                                                    description: >
                                                        New name of the club
                                                diff:
                                                    type: string
                                                    description: >
                                                        Diffed name of the club
                                        description:
                                            type: object
                                            description: >
                                                Changes in the club description
                                            properties:
                                                old:
                                                    type: string
                                                    description: >
                                                        Old description of the club
                                                new:
                                                    type: string
                                                    description: >
                                                        New description of the club
                                                diff:
                                                    type: string
                                                    description: >
                                                        Diffed description of the club
                                        image:
                                            type: object
                                            description: >
                                                Changes in the image of the club
                                            properties:
                                                old:
                                                    type: string
                                                    description: >
                                                        Old image URL of the club
                                                new:
                                                    type: string
                                                    description: >
                                                        New image URL of the club
        ---
        """
        club = self.get_object()

        club = self._get_club_diff_queryset().get(pk=club.pk)
        serializer = ClubDiffSerializer(club)
        return Response(serializer.data)

    @action(detail=False, methods=["GET"])
    def fields(self, request, *args, **kwargs):
        """
        Return the list of fields that can be exported in the Excel file.
        The list of fields is taken from the associated serializer, with model names
        overriding the serializer names if they exist. Custom fields are also available
        with certain permission levels.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            additionalProperties:
                                type: object
                                additionalProperties:
                                    type: string
        ---
        """
        # use the title given in the models.py if it exists,
        # fallback to the field name otherwise
        name_to_title = {}
        name_to_relation = {}
        for f in Club._meta._get_fields(reverse=False):
            name_to_title[f.name] = f.verbose_name.title()
            name_to_relation[f.name] = f.is_relation

        # return a list of additional dynamically generated fields
        serializer_class = self.get_serializer_class()
        if hasattr(serializer_class, "get_additional_fields"):
            fields = serializer_class.get_additional_fields()
        else:
            fields = {}

        # compute list of fields on Club
        club_fields = serializer_class().get_fields()
        for field, obj in club_fields.items():
            if isinstance(
                obj, (serializers.ModelSerializer, serializers.ListSerializer)
            ):
                name_to_relation[field] = True

        fields.update(
            {
                "basic": {
                    name_to_title.get(f, f.replace("_", " ").title()): f
                    for f in serializer_class.Meta.fields
                    if not name_to_relation.get(f, False)
                },
                "related": {
                    name_to_title.get(f, f.replace("_", " ").title()): f
                    for f in serializer_class.Meta.fields
                    if name_to_relation.get(f, False)
                },
            }
        )

        return Response(fields)

    @action(detail=False, methods=["post"])
    def email_blast(self, request, *args, **kwargs):
        """
        Send email blast to targeted (active) club members.
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            content:
                                type: string
                                description: The content of the email blast to send
                            target:
                                type: string
                                description: Must be one of leaders, officers, or all
                        required:
                            - content
                            - target
        responses:
            "200":
                description: Email blast was sent successfully
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: A message indicating how many
                                        recipients received the blast
            "400":
                description: Content or target field was empty or missing
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: Error message indicating content
                                        or target was not provided correctly
        ---
        """
        if "target" not in request.data:
            return Response(
                {"detail": "Target must be specified"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target = request.data.get("target").lower().strip()
        roles = {
            "leaders": Membership.ROLE_OWNER,
            "officers": Membership.ROLE_OFFICER,
            "all": Membership.ROLE_MEMBER,
        }

        if target not in roles:
            return Response(
                {"detail": "Target must be one of: leaders, officers, all"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content = request.data.get("content", "").strip()
        if not content:
            return Response(
                {"detail": "Content must be specified"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_role = roles[target]

        emails = list(
            Membership.objects.filter(role__lte=target_role, active=True)
            .values_list("person__email", flat=True)
            .distinct()
        )

        send_mail_helper(
            name="blast",
            subject=f"Update from {settings.BRANDING_SITE_NAME}",
            emails=emails,
            context={
                "sender": settings.BRANDING_SITE_NAME,
                "content": content,
                "reply_emails": settings.OSA_EMAILS + [settings.BRANDING_SITE_EMAIL],
            },
            reply_to=settings.OSA_EMAILS + [settings.BRANDING_SITE_EMAIL],
        )

        return Response({"detail": (f"Blast sent to {len(emails)} recipients")})

    def get_serializer_class(self):
        """
        Return a serializer class that is appropriate for the action being performed.
        Some serializer classes return less information, either for permission reasons
        or to improve performance.
        """
        if self.action == "upload":
            return AssetSerializer
        if self.action == "subscription":
            return SubscribeSerializer
        if self.action == "directory":
            return ClubMinimalSerializer
        if self.action == "constitutions":
            return ClubConstitutionSerializer
        if self.action == "notes_about":
            return NoteSerializer
        if self.action == "history":
            return ApprovalHistorySerializer
        if self.action in {"list", "fields"}:
            if self.request is not None and (
                self.request.accepted_renderer.format == "xlsx"
                or self.action == "fields"
            ):
                if (
                    self.request.user.has_perm("clubs.generate_reports")
                    or self.request.user.is_superuser
                ):
                    return ReportClubSerializer
                else:
                    return ClubSerializer
            return ClubListSerializer

        if self.request is not None and self.request.user.is_authenticated:
            if self.request.user.is_superuser:
                return AdminClubSerializer

            see_pending = self.request.user.has_perm("clubs.see_pending_clubs")
            manage_club = self.request.user.has_perm("clubs.manage_club")
            is_member = (
                "code" in self.kwargs
                and Membership.objects.filter(
                    person=self.request.user, club__code=self.kwargs["code"]
                ).exists()
            )
            if see_pending or manage_club or is_member:
                return AuthenticatedClubSerializer
        return ClubSerializer

    @action(detail=False, methods=["get"])
    def group_activity_options(self, request):
        """
        Get all active group activity assessment options.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: object
                                properties:
                                    text:
                                        type: string
                                        description: The text content of the option
                                    is_active:
                                        type: boolean
                                        description: Whether this option is
                                            currently available
                                    order:
                                        type: integer
                                        description: Display order for the frontend
        ---
        """
        options = GroupActivityOption.objects.filter(is_active=True).order_by(
            "order", "text"
        )
        serializer = GroupActivityOptionSerializer(options, many=True)
        return Response(serializer.data)


class SchoolViewSet(viewsets.ModelViewSet):
    """
    list:
    Retrieve a list of all of the schools (ex: Wharton, Engineering).

    retrieve:
    Retrieve a single school by ID.

    create:
    Add a new school to the list of schools.

    destroy:
    Delete a school from the list of schools.
    """

    serializer_class = SchoolSerializer
    permission_classes = [ReadOnly | IsSuperuser]
    queryset = School.objects.all().order_by("is_graduate", "name")


class MajorViewSet(viewsets.ModelViewSet):
    """
    list:
    Retrieve a list of all the majors (ex: Computer Science, BAS).

    retrieve:
    Retrieve a single major by ID.

    create:
    Add a new major to the list of majors.

    destroy:
    Remove a major from the list of majors.
    """

    serializer_class = MajorSerializer
    permission_classes = [ReadOnly | IsSuperuser]
    queryset = Major.objects.all()


class StudentTypeViewSet(viewsets.ModelViewSet):
    """
    list:
    Retrieve a list of all the student types
    (ex: Online Student, Transfer Student, etc).

    retrieve:
    Retrieve a single student type by ID.

    create:
    Add a new student type to the list of student types.

    destroy:
    Remove a student type from the list of student types.
    """

    serializer_class = StudentTypeSerializer
    permission_classes = [ReadOnly | IsSuperuser]
    queryset = StudentType.objects.all().order_by("name")


class YearViewSet(viewsets.ModelViewSet):
    """
    list:
    Retrieve a list of all of the graduation years
    (ex: Freshman, Sophomore, Junior, Senior).

    retrieve:
    Retrieve a single graduation year by ID.

    create:
    Add a new graduation year to the list of graduation years.

    destroy:
    Remove a graduation year from the list of graduation years.
    """

    serializer_class = YearSerializer
    permission_classes = [ReadOnly | IsSuperuser]
    queryset = Year.objects.all()

    def list(self, request, *args, **kwargs):
        """
        Sort items by reverse year. Since this calculation is done in Python, we need
        to apply it after the SQL query has been processed.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer_class()(queryset, many=True)
        return Response(sorted(serializer.data, key=lambda k: k["year"], reverse=True))


class AdvisorSearchFilter(filters.BaseFilterBackend):
    """
    A DRF filter to implement custom filtering logic for advisor objects.
    """

    def filter_queryset(self, request, queryset, view):
        public = request.GET.get("public")
        if public is not None:
            public = public.strip().lower()
            if public in {"true", "false"}:
                queryset = queryset.filter(
                    visibility__gte=Advisor.ADVISOR_VISIBILITY_STUDENTS
                    if public == "true"
                    else Advisor.ADVISOR_VISIBILITY_ADMIN
                )

        return queryset


class AdvisorViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of advisors for this club for club administrators.

    create:
    Add an advisor to this club.

    put:
    Update an advisor for this club. All fields are required.

    patch:
    Update an advisor for this club. Only specified fields are updated.

    retrieve:
    Return a single advisor.

    destroy:
    Delete an advisor.
    """

    serializer_class = AdvisorSerializer
    permission_classes = [ClubSensitiveItemPermission | IsSuperuser]
    filter_backends = [AdvisorSearchFilter]
    lookup_field = "id"
    http_method_names = ["get", "post", "put", "patch", "delete"]

    def get_queryset(self):
        return Advisor.objects.filter(club__code=self.kwargs.get("club_code")).order_by(
            "name"
        )


class ClubEventViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of events for this club.

    retrieve:
    Return a single event.

    create:
    Create a new event for this club.

    update:
    Update all fields in an event.

    partial_update:
    Update certain fields in an event.

    destroy:
    Delete an event.

    upload:
    Upload a picture for the event.
    """

    permission_classes = [EventPermission | IsSuperuser]
    filter_backends = [filters.SearchFilter, ClubsSearchFilter, ClubsOrderingFilter]
    search_fields = [
        "name",
        "club__name",
        "club__subtitle",
        "description",
        "club__code",
    ]
    lookup_field = "id"
    http_method_names = ["get", "post", "put", "patch", "delete"]
    pagination_class = RandomPageNumberPagination

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return EventWriteSerializer
        return EventSerializer

    @action(detail=True, methods=["post"])
    def upload(self, request, *args, **kwargs):
        """
        Upload a picture for the event.
        ---
        requestBody:
            content:
                multipart/form-data:
                    schema:
                        type: object
                        properties:
                            file:
                                type: object
                                format: binary
        responses:
            "200":
                description: Returned if the file was successfully uploaded.
                content: &upload_resp
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: The status of the file upload.
                                url:
                                    type: string
                                    description: >
                                        The URL of the newly uploaded file.
                                        Only exists if the file was successfully
                                        uploaded.
            "400":
                description: Returned if there was an error while uploading the file.
                content: *upload_resp
        ---
        """
        event = Event.objects.get(id=kwargs["id"])
        self.check_object_permissions(request, event)

        resp = upload_endpoint_helper(request, Event, "image", "image", pk=event.pk)

        # if image uploaded, create thumbnail
        if status.is_success(resp.status_code):
            event.create_thumbnail(request)

        return resp

    def create(self, request, *args, **kwargs):
        """
        Has the option to create a recurring event by specifying an offset and an
        end date. Additionaly, do not let non-superusers create events with the
        `FAIR` type through the API.
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        allOf:
                            - $ref: "#/components/schemas/EventWrite"
                            - type: object
                              properties:
                                offset:
                                    type: number
                                    description: >
                                        The offset between recurring events, in days.
                                        Only specify this if the event is recurring.
                                end_date:
                                    type: string
                                    format: date-time
                                    description: >
                                        The date when all items in the recurring event
                                        series should end. Only specify this if the
                                        event is recurring.

        ---
        """
        # get event type
        type = request.data.get("type", 0)
        if type == Event.FAIR and not self.request.user.is_superuser:
            raise DRFValidationError(
                detail="Approved activities fair events have already been created. "
                "See above for events to edit, and "
                f"please email {settings.FROM_EMAIL} if this is en error."
            )

        if "start_time" not in request.data or "end_time" not in request.data:
            raise DRFValidationError(detail="start_time and end_time are required")
        # if a recurring event, offset and end_date required
        if ("offset" in request.data) != ("end_date" in request.data):
            raise DRFValidationError(
                detail="both offset and end_date are required for recurring events"
            )

        event_data = request.data.copy()
        start_time = parse(event_data.pop("start_time"))
        end_time = parse(event_data.pop("end_time"))
        location = event_data.pop("location", None)

        # offset and end_date default to create a single event
        offset = event_data.pop("offset", 1)
        end_date = (
            parse(event_data.pop("end_date"))
            if "end_date" in event_data
            else (start_time + datetime.timedelta(days=offset))
        )

        event_serializer = EventWriteSerializer(
            data=event_data, context={"request": request, "view": self}
        )

        if event_serializer.is_valid():
            event = event_serializer.save()

            current_start = start_time
            current_end = end_time
            showings = []

            while current_start < end_date:
                showing_data = {
                    "start_time": current_start,
                    "end_time": current_end,
                    "location": location,
                    "event": event.id,
                }
                showing_serializer = EventShowingWriteSerializer(
                    data=showing_data,
                    context={"request": request},
                )

                if showing_serializer.is_valid(raise_exception=False):
                    showing = showing_serializer.save()
                    showings.append(showing)
                else:
                    event.delete()
                    # showings deleted via cascade
                    return Response(
                        showing_serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                current_start = current_start + datetime.timedelta(days=offset)
                current_end = current_end + datetime.timedelta(days=offset)

            return Response(EventSerializer(event).data)

    def destroy(self, request, *args, **kwargs):
        """
        Do not let non-superusers delete events with the FAIR type through the API.
        Check if there are bought or held tickets before deletion.
        """
        event = self.get_object()

        if event.type == Event.FAIR and not self.request.user.is_superuser:
            raise DRFValidationError(
                detail="You cannot delete activities fair events. "
                f"If you would like to do this, email {settings.FROM_EMAIL}."
            )

        # Check if any showing has bought or held tickets
        showings = EventShowing.objects.filter(event=event)
        if (
            Ticket.objects.filter(showing__in=showings)
            .filter(Q(owner__isnull=False) | Q(holder__isnull=False))
            .exists()
        ):
            raise DRFValidationError(
                detail=(
                    "This event cannot be deleted because there are tickets "
                    "that have been bought or are being checked out."
                )
            )

        # Deleting event will delete all showings
        return super().destroy(request, *args, **kwargs)

    def get_queryset(self):
        qs = Event.objects.all()
        is_club_specific = self.kwargs.get("club_code") is not None
        if is_club_specific:
            qs = qs.filter(club__code=self.kwargs["club_code"])
            # Check if the user is an officer or admin
            if not self.request.user.is_authenticated or (
                not self.request.user.has_perm("clubs.manage_club")
                and not Membership.objects.filter(
                    person=self.request.user,
                    club__code=self.kwargs["club_code"],
                    role__lte=Membership.ROLE_OFFICER,
                ).exists()
            ):
                qs = qs.filter(
                    Q(club__approved=True) | Q(type=Event.FAIR) | Q(club__ghost=True),
                    club__archived=False,
                )
        else:
            if not (
                self.request.user.is_authenticated
                and self.request.user.has_perm("clubs.manage_club")
            ):
                officer_clubs = (
                    Membership.objects.filter(
                        person=self.request.user, role__lte=Membership.ROLE_OFFICER
                    ).values_list("club", flat=True)
                    if self.request.user.is_authenticated
                    else []
                )
                qs = qs.filter(
                    Q(club__approved=True)
                    | Q(club__id__in=list(officer_clubs))
                    | Q(type=Event.FAIR)
                    | Q(club__ghost=True)
                    | Q(club__isnull=True),
                    Q(club__isnull=True) | Q(club__archived=False),
                )
        # Order events by their earliest showing's start time
        return (
            qs.select_related("club", "creator")
            .prefetch_related(
                Prefetch(
                    "eventshowing_set",
                    queryset=EventShowing.objects.all(),
                ),
                Prefetch(
                    "eventshowing_set__tickets",
                    queryset=Ticket.objects.select_related("owner", "holder"),
                ),
                Prefetch(
                    "club__badges",
                    queryset=(
                        Badge.objects.filter(
                            fair__id=self.request.query_params.get("fair")
                        )
                        if "fair" in self.request.query_params
                        else Badge.objects.filter(visible=True)
                    ),
                ),
            )
            .annotate(
                earliest_start_time=Min("eventshowing__start_time"),
                latest_start_time=Max("eventshowing__start_time"),
                earliest_end_time=Min("eventshowing__end_time"),
                latest_end_time=Max("eventshowing__end_time"),
            )
            .order_by("earliest_start_time", "pk")
        )


class EventViewSet(ClubEventViewSet):
    """
    list:
    Return a list of events for the entire site.

    retrieve:
    Return a single event.

    destroy:
    Delete an event.

    fair:
    Get information about a fair listing

    owned:
    Return all events that the user has officer permissions over.
    """

    def get_operation_id(self, **kwargs):
        return f"{kwargs['operId']} (Global)"

    @action(detail=False, methods=["get"])
    def fair(self, request, *args, **kwargs):
        """
        Get the minimal information required for a fair directory listing.
        Groups by the start date of the event, and then the event category.
        Each event's club must have an associated fair badge in order to be displayed.
        ---
        parameters:
            - name: date
              in: query
              required: false
              description: >
                A date in YYYY-MM-DD format.
                If specified, will preview how this endpoint looked on the specified
                date.
              type: string
            - name: fair
              in: query
              required: false
              description: >
                A fair id. If specified, will preview how this endpoint will look for
                that fair. Overrides the date field if both are specified.
              type: number
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                fair:
                                    type: object
                                    $ref: "#/components/schemas/ClubFair"
                                events:
                                    type: array
                                    items:
                                        type: object
                                        properties:
                                            start_time:
                                                type: string
                                                format: date-time
                                            end_time:
                                                type: string
                                                format: date-time
                                            events:
                                                type: array
                                                items:
                                                    type: object
                                                    properties:
                                                        category:
                                                            type: string
                                                        events:
                                                            type: array
                                                            items:
                                                                type: object
                                                                properties:
                                                                    name:
                                                                        type: string
                                                                    code:
                                                                        type: string
        ---
        """
        # accept custom date for preview rendering
        date = request.query_params.get("date")
        if date in {"null", "undefined"}:
            date = None
        if date:
            date = parse(date)

        # accept custom fair for preview rendering
        fair = request.query_params.get("fair")
        if fair in {"null", "undefined"}:
            fair = None
        if fair:
            fair = int(re.sub(r"\D", "", fair))

        # cache the response for this endpoint with short timeout
        if date is None:
            key = f"events:fair:directory:{request.user.is_authenticated}:{fair}"
            cached = cache.get(key)
            if cached:
                return Response(cached)
        else:
            key = None

        # lookup fair from id
        if fair:
            fair = get_object_or_404(ClubFair, id=fair)
        else:
            fair = (
                ClubFair.objects.filter(
                    end_time__gte=timezone.now() - datetime.timedelta(minutes=30)
                )
                .order_by("start_time")
                .first()
            )
        if not date and fair is not None:
            date = fair.start_time.date()

        now = date or timezone.now()
        events = Event.objects.filter(
            type=Event.FAIR, club__badges__purpose="fair", club__badges__fair=fair
        )

        # Get event showings for these events
        event_showings = EventShowing.objects.filter(event__in=events)

        # filter event showings based on the fair times or provide a reasonable fallback
        if fair is None:
            event_showings = event_showings.filter(
                start_time__lte=now + datetime.timedelta(days=7),
                end_time__gte=now - datetime.timedelta(days=1),
            )
        else:
            event_showings = event_showings.filter(
                start_time__lte=fair.end_time, end_time__gte=fair.start_time
            )

        event_showings = event_showings.values_list(
            "start_time",
            "end_time",
            "event__club__name",
            "event__club__code",
            "event__club__badges__label",
        ).distinct()

        output = {}
        for showing in event_showings:
            # group by start date
            ts = int(showing[0].replace(second=0, microsecond=0).timestamp())
            if ts not in output:
                output[ts] = {
                    "start_time": showing[0],
                    "end_time": showing[1],
                    "events": {},
                }

            # group by category
            category = showing[4]
            if category not in output[ts]["events"]:
                output[ts]["events"][category] = {
                    "category": category,
                    "events": [],
                }

            output[ts]["events"][category]["events"].append(
                {"name": showing[2], "code": showing[3]}
            )

        for item in output.values():
            item["events"] = list(
                sorted(item["events"].values(), key=lambda cat: cat["category"])
            )
            for category in item["events"]:
                category["events"] = list(
                    sorted(category["events"], key=lambda e: e["name"].casefold())
                )

        output = list(sorted(output.values(), key=lambda cat: cat["start_time"]))
        final_output = {
            "events": output,
            "fair": ClubFairSerializer(instance=fair).data,
        }
        if key:
            cache.set(key, final_output, 60 * 5)

        return Response(final_output)

    @action(detail=False, methods=["get"])
    def owned(self, request, *args, **kwargs):
        """
        Return all events that the user has officer permissions over.
        """
        if not request.user.is_authenticated:
            return Response([])

        now = timezone.now()

        events = self.filter_queryset(self.get_queryset()).filter(
            club__membership__person=request.user,
            club__membership__role__lte=Membership.ROLE_OFFICER,
            eventshowing__start_time__gte=now,
        )

        return Response(EventSerializer(events, many=True).data)


class ClubEventShowingViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of showings for an event.

    retrieve:
    Return a single showing.

    create:
    Create a new showing for an event.

    update:
    Update all fields in a showing.

    partial_update:
    Update certain fields in a showing.

    destroy:
    Delete a showing.

    tickets:
    Get or create tickets for a particular showing.

    create_tickets:
    Create ticket offerings for showing.

    buyers:
    Get information about the buyers of a showing's tickets.

    remove_from_cart:
    Remove a ticket for this showing from cart.

    add_to_cart:
    Add a ticket for this showing to cart.

    issue_tickets:
    Issue tickets to users in bulk.

    email_blast:
    Send an email blast to all users holding tickets.
    """

    permission_classes = [EventShowingPermission | IsSuperuser]
    lookup_field = "id"
    http_method_names = ["get", "post", "put", "patch", "delete"]

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return EventShowingWriteSerializer
        return EventShowingSerializer

    def get_queryset(self):
        event_id = self.kwargs.get("event_id")
        is_club_specific = self.kwargs.get("club_code") is not None

        qs = EventShowing.objects.filter(event__id=event_id)

        if is_club_specific:
            club_code = self.kwargs.get("club_code")
            qs = qs.filter(event__club__code=club_code)

            # Check if the user is an officer or admin
            if not self.request.user.is_authenticated or (
                not self.request.user.has_perm("clubs.manage_club")
                and not Membership.objects.filter(
                    person=self.request.user,
                    club__code=club_code,
                    role__lte=Membership.ROLE_OFFICER,
                ).exists()
            ):
                qs = qs.filter(
                    Q(event__club__approved=True)
                    | Q(event__type=Event.FAIR)
                    | Q(event__club__ghost=True),
                    event__club__archived=False,
                )
        else:
            if not (
                self.request.user.is_authenticated
                and self.request.user.has_perm("clubs.manage_club")
            ):
                officer_clubs = (
                    Membership.objects.filter(
                        person=self.request.user, role__lte=Membership.ROLE_OFFICER
                    ).values_list("club", flat=True)
                    if self.request.user.is_authenticated
                    else []
                )
                qs = qs.filter(
                    Q(event__club__approved=True)
                    | Q(event__club__id__in=list(officer_clubs))
                    | Q(event__type=Event.FAIR)
                    | Q(event__club__ghost=True)
                    | Q(event__club__isnull=True),
                    Q(event__club__isnull=True) | Q(event__club__archived=False),
                )

        return qs.select_related("event", "event__club", "event__creator")

    def partial_update(self, request, *args, **kwargs):
        """
        Do not let club admins modify the ticket drop time
        if tickets have potentially been sold through the checkout process.
        """
        showing = self.get_object()
        if (
            "ticket_drop_time" in request.data
            and (
                showing.ticket_drop_time is None  # case where sales immediately start
                or showing.ticket_drop_time <= timezone.now()
            )
            and Ticket.objects.filter(showing=showing)
            .filter(Q(owner__isnull=False) | Q(holder__isnull=False))
            .exists()
        ):
            raise DRFValidationError(
                detail="Ticket drop times cannot be edited "
                "after tickets have been sold or held."
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Check if any showing has bought or held tickets
        """
        showing = self.get_object()
        if (
            Ticket.objects.filter(showing=showing)
            .filter(Q(owner__isnull=False) | Q(holder__isnull=False))
            .exists()
        ):
            raise DRFValidationError(
                detail=(
                    "This showing cannot be deleted because there are tickets "
                    "that have been bought or are being checked out."
                )
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    @update_holds
    def add_to_cart(self, request, *args, **kwargs):
        """
        Add tickets from this showing to cart
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            quantities:
                                type: array
                                items:
                                    type: object
                                    properties:
                                        type:
                                            type: string
                                            description: The ticket type
                                        count:
                                            type: integer
                                            description: Number of tickets to add
                        required:
                            - quantities
        responses:
            "200":
                description: Tickets successfully added to cart
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: Success message
                                success:
                                    type: boolean
                                    description: Whether the operation was successful
            "400":
                description: Invalid request parameters
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: Error message
                                success:
                                    type: boolean
                                    description: Always false
            "403":
                description: >
                    Forbidden - club not approved, showing ended,
                    or ticket limit exceeded
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: Error message
                                success:
                                    type: boolean
                                    description: Always false
            "404":
                description: Club not found
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: Error message
                                success:
                                    type: boolean
                                    description: Always false
        ---
        """
        showing = self.get_object()
        club = showing.event.club

        # Check if club is approved
        if not club:
            return Response(
                {"detail": "Related club does not exist", "success": False},
                status=status.HTTP_404_NOT_FOUND,
            )
        elif not club.approved and not club.ghost:
            return Response(
                {
                    "detail": "This club has not been approved "
                    "and cannot sell tickets.",
                    "success": False,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        cart, _ = Cart.objects.get_or_create(owner=self.request.user)

        # Check if the showing has already ended
        if showing.end_time < timezone.now():
            return Response(
                {"detail": "This showing has already ended", "success": False},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if tickets have dropped
        if showing.ticket_drop_time and timezone.now() < showing.ticket_drop_time:
            return Response(
                {"detail": "Ticket drop time has not yet elapsed", "success": False},
                status=status.HTTP_403_FORBIDDEN,
            )

        quantities = request.data.get("quantities")
        if not quantities:
            return Response(
                {"detail": "Quantities must be specified", "success": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        num_requested = sum(item["count"] for item in quantities)
        num_carted = cart.tickets.filter(showing=showing).count()

        if num_requested + num_carted > showing.ticket_order_limit:
            return Response(
                {
                    "detail": (
                        f"Order exceeds the maximum ticket limit of "
                        f"{showing.ticket_order_limit}."
                    ),
                    "success": False,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        for item in quantities:
            type = item["type"]
            count = item["count"]

            tickets = (
                Ticket.objects.filter(
                    showing=showing,
                    type=type,
                    owner__isnull=True,
                    holder__isnull=True,
                    buyable=True,
                )
                .prefetch_related("carts")
                .exclude(carts__owner=self.request.user)
            )

            if tickets.count() < count:
                return Response(
                    {
                        "detail": f"Not enough tickets of type {type} left!",
                        "success": False,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            cart.tickets.add(*tickets[:count])

        cart.save()
        return Response(
            {"detail": f"Successfully added {num_requested} to cart", "success": True}
        )

    @action(detail=True, methods=["post"])
    @transaction.atomic
    @update_holds
    def remove_from_cart(self, request, *args, **kwargs):
        """
        Remove tickets from cart
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            quantities:
                                type: array
                                items:
                                    type: object
                                    properties:
                                        type:
                                            type: string
                                            description: The ticket type
                                        count:
                                            type: integer
                                            description: Number of tickets to remove
                        required:
                            - quantities
        responses:
            "200":
                description: Tickets successfully removed from cart
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: Success message
                                success:
                                    type: boolean
                                    description: Whether the operation was successful
            "400":
                description: Invalid request parameters
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: Error message
                                success:
                                    type: boolean
                                    description: Always false
            "404":
                description: Cart not found
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: Error message
                                success:
                                    type: boolean
                                    description: Always false
        ---
        """
        showing = self.get_object()
        quantities = request.data.get("quantities")
        if not quantities:
            return Response(
                {
                    "detail": "Quantities must be specified",
                    "success": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not all(isinstance(item, dict) for item in quantities):
            return Response(
                {
                    "detail": "Quantities must be a list of dictionaries",
                    "success": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        cart = get_object_or_404(Cart, owner=self.request.user)

        total_removed = 0
        for item in quantities:
            type = item["type"]
            count = item["count"]
            tickets_to_remove = cart.tickets.filter(type=type, showing=showing)

            # Only remove as many as we have
            count = min(count, tickets_to_remove.count())
            cart.tickets.remove(*tickets_to_remove[:count])
            total_removed += count

        cart.save()
        return Response(
            {
                "detail": f"Successfully removed {total_removed} from cart",
                "success": True,
            }
        )

    @action(detail=True, methods=["get"])
    def buyers(self, request, *args, **kwargs):
        """
        Get information about ticket buyers
        ---
        responses:
            "200":
                description: List of ticket buyers
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                buyers:
                                    type: array
                                    items:
                                        type: object
                                        properties:
                                            fullname:
                                                type: string
                                                description: Full name of the buyer
                                            id:
                                                type: integer
                                                description: Ticket ID
                                            owner_id:
                                                type: integer
                                                description: User ID of the owner
                                            type:
                                                type: string
                                                description: Ticket type
                                            attended:
                                                type: boolean
                                                description: Whether the buyer attended
                                            owner__email:
                                                type: string
                                                description: Email of the buyer
        ---
        """
        showing = self.get_object()
        tickets = Ticket.objects.filter(showing=showing).annotate(
            fullname=Concat("owner__first_name", Value(" "), "owner__last_name")
        )

        buyers = tickets.filter(owner__isnull=False).values(
            "fullname", "id", "owner_id", "type", "attended", "owner__email"
        )

        return Response({"buyers": buyers})

    @action(detail=True, methods=["get"])
    def tickets(self, request, *args, **kwargs):
        """
        Get information about tickets for this showing
        ---
        responses:
            "200":
                description: Ticket information for this showing
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                totals:
                                    type: array
                                    description: Total tickets by type
                                    items:
                                        type: object
                                        properties:
                                            type:
                                                type: string
                                                description: Ticket type
                                            price:
                                                type: number
                                                description: Ticket price
                                            count:
                                                type: integer
                                                description: Number of tickets
                                available:
                                    type: array
                                    description: Available tickets by type
                                    items:
                                        type: object
                                        properties:
                                            type:
                                                type: string
                                                description: Ticket type
                                            price:
                                                type: number
                                                description: Ticket price
                                            count:
                                                type: integer
                                                description: Number of available tickets
        ---
        """
        showing = self.get_object()
        tickets = Ticket.objects.filter(showing=showing)

        totals = (
            tickets.values("type")
            .annotate(price=Max("price"))
            .annotate(count=Count("type"))
            .order_by("type")
        )
        available = (
            tickets.filter(owner__isnull=True, holder__isnull=True, buyable=True)
            .values("type")
            .annotate(price=Max("price"))
            .annotate(count=Count("type"))
            .order_by("type")
        )
        return Response({"totals": list(totals), "available": list(available)})

    @tickets.mapping.put
    @transaction.atomic
    def create_tickets(self, request, *args, **kwargs):
        """
        Create ticket offerings for showing
        """
        showing = self.get_object()

        # Tickets can't be edited after they've dropped
        if showing.ticket_drop_time and timezone.now() >= showing.ticket_drop_time:
            return Response(
                {"detail": "Tickets cannot be edited after they have dropped"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Tickets can't be edited after they've been sold or held
        if (
            Ticket.objects.filter(showing=showing)
            .filter(Q(owner__isnull=False) | Q(holder__isnull=False))
            .exists()
        ):
            return Response(
                {
                    "detail": "Tickets cannot be edited after they have been "
                    "sold or checked out"
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        quantities = request.data.get("quantities", [])
        if not quantities:
            return Response(
                {"detail": "Quantities must be specified"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate ticket parameters
        for item in quantities:
            if not item.get("type") or not item.get("count"):
                return Response(
                    {"detail": "Specify type and count to create some tickets."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if item.get("price", 0) < 0:
                return Response(
                    {"detail": "Ticket price cannot be negative"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if item.get("group_discount", 0) < 0 or item.get("group_discount", 0) > 1:
                return Response(
                    {"detail": "Group discount must be between 0 and 1"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if item.get("group_size", 2) <= 1:
                return Response(
                    {"detail": "Min group size must be greater than 1"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if ("group_discount" in item) != ("group_size" in item):
                return Response(
                    {
                        "detail": "Ticket must specify either both group_discount "
                        "and group_size or neither"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Delete existing tickets for this showing
        Ticket.objects.filter(showing=showing).delete()

        # Create tickets
        tickets = [
            Ticket(
                showing=showing,
                type=item["type"],
                price=item.get("price", 0),
                group_discount=item.get("group_discount", 0),
                group_size=item.get("group_size", None),
                transferable=item.get("transferable", True),
                buyable=item.get("buyable", True),
            )
            for item in quantities
            for _ in range(item["count"])
        ]

        Ticket.objects.bulk_create(tickets)

        # Update showing settings if provided
        order_limit = request.data.get("order_limit", None)
        if order_limit is not None:
            showing.ticket_order_limit = order_limit
            showing.save()

        drop_time = request.data.get("drop_time", None)
        if drop_time is not None:
            try:
                drop_time = datetime.datetime.strptime(drop_time, "%Y-%m-%dT%H:%M:%S%z")
            except ValueError as e:
                return Response(
                    {"detail": f"Invalid drop time: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if drop_time < timezone.now():
                return Response(
                    {"detail": "Specified drop time has already elapsed"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            showing.ticket_drop_time = drop_time
            showing.save()

        # Clear cache
        cache.delete(f"clubs:{showing.event.club.id}-authed")
        cache.delete(f"clubs:{showing.event.club.id}-anon")

        return Response({"detail": "Successfully created tickets"})

    @action(detail=True, methods=["post"])
    @transaction.atomic
    @update_holds
    def issue_tickets(self, request, *args, **kwargs):
        """
        Issue tickets that have already been created to users in bulk.
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            tickets:
                                type: array
                                items:
                                    type: object
                                    properties:
                                        username:
                                            type: string
                                            description: Username of the recipient
                                        ticket_type:
                                            type: string
                                            description: Type of ticket to issue
                        required:
                            - tickets
        responses:
            "200":
                description: Tickets successfully issued
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                success:
                                    type: boolean
                                    description: Whether the operation was successful
                                detail:
                                    type: string
                                    description: Success message
                                errors:
                                    type: array
                                    description: List of errors (empty on success)
                                    items:
                                        type: string
            "400":
                description: Invalid request parameters or insufficient tickets
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: Error message
                                errors:
                                    type: array
                                    description: List of specific errors
                                    items:
                                        type: string
        ---
        """
        showing = self.get_object()
        tickets_data = request.data.get("tickets", [])

        if not tickets_data:
            return Response(
                {"detail": "tickets must be specified", "errors": []},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for item in tickets_data:
            if not item.get("username") or not item.get("ticket_type"):
                return Response(
                    {
                        "detail": "Specify username and ticket type to issue tickets",
                        "errors": [],
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        usernames = [item.get("username") for item in tickets_data]
        ticket_types = [item.get("ticket_type") for item in tickets_data]

        # Validate all usernames
        invalid_usernames = set(usernames) - set(
            get_user_model()
            .objects.filter(username__in=usernames)
            .values_list("username", flat=True)
        )
        if invalid_usernames:
            return Response(
                {
                    "detail": "Invalid usernames",
                    "errors": sorted(list(invalid_usernames)),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate all ticket types
        invalid_types = set(ticket_types) - set(
            Ticket.objects.filter(showing=showing).values_list("type", flat=True)
        )
        if invalid_types:
            return Response(
                {
                    "detail": "Invalid ticket classes",
                    "errors": sorted(list(invalid_types)),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get available tickets
        available_tickets = []
        for ticket_type, num_requested in collections.Counter(ticket_types).items():
            tickets = Ticket.objects.select_for_update(skip_locked=True).filter(
                showing=showing,
                type=ticket_type,
                owner__isnull=True,
                holder__isnull=True,
            )[:num_requested]

            if tickets.count() < num_requested:
                return Response(
                    {
                        "detail": (
                            f"Not enough tickets available for type: {ticket_type}"
                        ),
                        "errors": [],
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            available_tickets.extend(tickets)

        # Assign tickets to users
        transaction_records = []

        for username, ticket_type in zip(usernames, ticket_types):
            user = get_user_model().objects.filter(username=username).first()
            ticket = next(
                ticket
                for ticket in available_tickets
                if ticket.type == ticket_type and ticket.owner is None
            )
            ticket.owner = user
            ticket.holder = None

            transaction_record = TicketTransactionRecord(
                total_amount=0.0,
                buyer_first_name=user.first_name,
                buyer_last_name=user.last_name,
                buyer_email=user.email,
            )
            ticket.transaction_record = transaction_record
            transaction_records.append(transaction_record)

        TicketTransactionRecord.objects.bulk_create(transaction_records)
        Ticket.objects.bulk_update(
            available_tickets, ["owner", "holder", "transaction_record"]
        )
        Ticket.objects.update_holds()

        for ticket in available_tickets:
            ticket.send_confirmation_email()

        return Response(
            {
                "success": True,
                "detail": f"Issued {len(available_tickets)} tickets",
                "errors": [],
            }
        )

    @action(detail=True, methods=["post"])
    def email_blast(self, request, *args, **kwargs):
        """
        Send an email blast to all users holding tickets.
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            content:
                                type: string
                                description: The content of the email blast to send
                        required:
                            - content
        responses:
            "200":
                description: Email blast was sent successfully
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: A message indicating how many
                                        recipients received the blast
            "400":
                description: Content field was empty or missing
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: Error message indicating content
                                        was not provided
            "404":
                description: Event not found
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: Error message indicating event was
                                        not found
        ---
        """
        showing = self.get_object()

        holder_emails = Ticket.objects.filter(
            showing=showing, owner__isnull=False
        ).values_list("owner__email", flat=True)
        officer_emails = showing.event.club.get_officer_emails()
        emails = list(holder_emails) + list(officer_emails)

        content = request.data.get("content", "").strip()
        if not content:
            return Response(
                {"detail": "Content must be specified"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reply_emails = showing.event.club.get_officer_emails()

        send_mail_helper(
            name="blast",
            subject=f"Update on {showing.event.name} from {showing.event.club.name}",
            emails=emails,
            context={
                "sender": showing.event.club.name,
                "content": content,
                "reply_emails": reply_emails,
            },
            reply_to=reply_emails,
        )

        return Response(
            {
                "detail": (
                    f"Blast sent to {len(holder_emails)} ticket holders "
                    f"and {len(officer_emails)} officers"
                )
            }
        )


class EventShowingViewSet(ClubEventShowingViewSet):
    def get_operation_id(self, **kwargs):
        return f"{kwargs['operId']} (Global)"


class TestimonialViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of testimonials for this club.

    create:
    Create a new testimonial for this club.

    update:
    Update a testimonial for this club.
    All fields must be specified.

    partial_update:
    Update a testimonial for this club.
    Specify only the fields you want to update.

    retrieve:
    Retrieve a single testimonial.

    destroy:
    Delete a testimonial.
    """

    serializer_class = TestimonialSerializer
    permission_classes = [ClubItemPermission | IsSuperuser]

    def get_queryset(self):
        return Testimonial.objects.filter(club__code=self.kwargs["club_code"])


class QuestionAnswerViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of questions and answers for this club.

    create:
    Create a new question for this club.

    update:
    Change the question or the answer for this club.

    retrieve:
    Return a single testimonial.

    destroy:
    Delete a testimonial.
    """

    serializer_class = QuestionAnswerSerializer
    permission_classes = [QuestionAnswerPermission | IsSuperuser]

    def get_queryset(self):
        club_code = self.kwargs["club_code"]
        questions = QuestionAnswer.objects.filter(
            club__code=club_code, club__archived=False
        )

        if not self.request.user.is_authenticated:
            # Hide responder if not authenticated
            return questions.filter(approved=True).extra(select={"responder": "NULL"})

        membership = Membership.objects.filter(
            club__code=club_code, person=self.request.user
        ).first()

        if self.request.user.is_superuser or (
            membership is not None and membership.role <= Membership.ROLE_OFFICER
        ):
            return questions

        return questions.filter(Q(approved=True) | Q(author=self.request.user))

    @action(detail=True, methods=["post"])
    def like(self, request, *args, **kwargs):
        """
        Endpoint used to like a question answer.
        ---
        requestBody: {}
        responses:
            "200":
                content: {}
        ---
        """

        question = QuestionAnswer.objects.get(
            club__code=self.kwargs["club_code"],
            id=self.get_object().id,
            club__archived=False,
        )
        question.users_liked.add(self.request.user)
        question.save()
        return Response({})

    @action(detail=True, methods=["post"])
    def unlike(self, request, *args, **kwargs):
        """
        Endpoint used to unlike a question answer.
        ---
        requestBody: {}
        responses:
            "200":
                content: {}
        ---
        """
        question = QuestionAnswer.objects.get(
            club__code=self.kwargs["club_code"],
            id=self.get_object().id,
            club__archived=False,
        )
        question.users_liked.remove(self.request.user)
        question.save()
        return Response({})


class MembershipViewSet(viewsets.ModelViewSet):
    """
    list: Return a list of clubs that the logged in user is a member of.
    """

    serializer_class = UserMembershipSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get"]

    def get_queryset(self):
        queryset = Membership.objects.filter(
            person=self.request.user, club__archived=False
        ).prefetch_related("club__tags")
        person = self.request.user
        queryset = queryset.prefetch_related(
            Prefetch(
                "club__favorite_set",
                queryset=Favorite.objects.filter(person=person),
                to_attr="user_favorite_set",
            ),
            Prefetch(
                "club__subscribe_set",
                queryset=Subscribe.objects.filter(person=person),
                to_attr="user_subscribe_set",
            ),
            Prefetch(
                "club__membership_set",
                queryset=Membership.objects.filter(person=person),
                to_attr="user_membership_set",
            ),
        )
        return queryset

    @action(detail=False, methods=["get"])
    def admin(self, request, *args, **kwargs):
        """
        Endpoint used to retrieve the clubs that the logged-in user is an admin of
        ---
        requestBody: {}
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                role:
                                    type: integer
                                    description: The enum value of the role of the user
                                club_code:
                                    type: string
                                    description: The club code of the membership
                                username:
                                    type: string
                                    description: The username of the logged in user
        ---
        """
        return Response(
            ClubMembershipSerializer(
                Membership.objects.filter(
                    person=self.request.user,
                    club__archived=False,
                    role__lte=Membership.ROLE_OFFICER,
                ),
                many=True,
            ).data
        )


class FavoriteViewSet(viewsets.ModelViewSet):
    """
    list: Return a list of clubs that the logged in user has favorited.

    create: Favorite a club.

    destroy: Unfavorite a club.
    """

    permission_classes = [IsAuthenticated]
    lookup_field = "club__code"
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        queryset = Favorite.objects.filter(
            person=self.request.user, club__archived=False
        ).prefetch_related("club__tags")

        person = self.request.user
        queryset = queryset.prefetch_related(
            Prefetch(
                "club__favorite_set",
                queryset=Favorite.objects.filter(person=person),
                to_attr="user_favorite_set",
            ),
            Prefetch(
                "club__subscribe_set",
                queryset=Subscribe.objects.filter(person=person),
                to_attr="user_subscribe_set",
            ),
            Prefetch(
                "club__membership_set",
                queryset=Membership.objects.filter(person=person),
                to_attr="user_membership_set",
            ),
        )

        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return FavoriteWriteSerializer
        return FavoriteSerializer


class UserUUIDAPIView(generics.RetrieveAPIView):
    """
    get: Retrieve the calendar URL with the appropriate uuid for the given user.
    """

    queryset = get_user_model().objects.all()
    serializer_class = UserUUIDSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get"]

    def get_operation_id(self, **kwargs):
        return "Retrieve Calendar Url"

    def get_object(self):
        user = self.request.user
        return user


class SubscribeViewSet(viewsets.ModelViewSet):
    """
    list: Return a list of clubs that the logged in user has subscribed to.

    create: Subscribe to a club.

    destroy: Unsubscribe from a club.
    """

    permission_classes = [IsAuthenticated]
    lookup_field = "club__code"
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        queryset = Subscribe.objects.filter(
            person=self.request.user, club__archived=False
        ).prefetch_related("club__tags")

        person = self.request.user
        queryset = queryset.prefetch_related(
            Prefetch(
                "club__favorite_set",
                queryset=Favorite.objects.filter(person=person),
                to_attr="user_favorite_set",
            ),
            Prefetch(
                "club__subscribe_set",
                queryset=Subscribe.objects.filter(person=person),
                to_attr="user_subscribe_set",
            ),
            Prefetch(
                "club__membership_set",
                queryset=Membership.objects.filter(person=person),
                to_attr="user_membership_set",
            ),
        )

        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return UserSubscribeWriteSerializer
        return UserSubscribeSerializer


class ClubVisitViewSet(viewsets.ModelViewSet):
    """
    list: Return a list of clubs that the logged in user has visited.

    create: Visit a club.
    """

    permission_classes = [IsAuthenticated]
    lookup_field = "club__code"
    http_method_names = ["get", "post"]

    def get_queryset(self):
        return ClubVisit.objects.filter(person=self.request.user, club__archived=False)

    def get_serializer_class(self):
        if self.action == "create":
            return UserClubVisitWriteSerializer
        return UserClubVisitSerializer


class SearchQueryViewSet(viewsets.ModelViewSet):
    """
    create: Add a new search query

    list: Superuser sees all queries, any other user sees only their own
    """

    serializer_class = SearchQuerySerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get"]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return SearchQuery.objects.all()
        else:
            return SearchQuery.objects.filter(person=self.request.user)


class MembershipRequestViewSet(viewsets.ModelViewSet):
    """
    list: Return a list of clubs that the logged in user has sent membership request to.

    create: Sent membership request to a club.

    destroy: Deleted a membership request from a club.
    """

    serializer_class = UserMembershipRequestSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "club__code"
    http_method_names = ["get", "post", "delete"]

    def create(self, request, *args, **kwargs):
        """
        If a membership request object already exists, reuse it.
        """
        club = request.data.get("club", None)
        club_instance = Club.objects.filter(code=club).first()
        if club_instance is None:
            return Response(
                {"detail": "Invalid club code"}, status=status.HTTP_400_BAD_REQUEST
            )

        create_defaults = {"club": club_instance, "requester": request.user}

        obj, created = MembershipRequest.objects.update_or_create(
            club__code=club,
            requester=request.user,
            defaults={"withdrawn": False, "created_at": timezone.now()},
            create_defaults=create_defaults,
        )

        if created:
            obj.send_request(request)

        serializer = self.get_serializer(obj, many=False)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        """
        Don't actually delete the membership request when it is withdrawn.

        This is to keep track of repeat membership requests and avoid spamming the club
        owners with requests.
        """
        obj = self.get_object()
        obj.withdrawn = True
        obj.save(update_fields=["withdrawn"])

        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_queryset(self):
        return MembershipRequest.objects.filter(
            requester=self.request.user,
            withdrawn=False,
            club__archived=False,
        )


class MembershipRequestOwnerViewSet(XLSXFormatterMixin, viewsets.ModelViewSet):
    """
    list:
    Return a list of users who have sent membership request to the club.

    destroy:
    Delete a membership request for a specific user.
    """

    serializer_class = MembershipRequestSerializer
    permission_classes = [MembershipRequestPermission | IsSuperuser]
    http_method_names = ["get", "post", "delete"]
    lookup_field = "requester__username"

    def get_queryset(self):
        return MembershipRequest.objects.filter(
            club__code=self.kwargs["club_code"], withdrawn=False
        )

    @action(detail=True, methods=["post"])
    def accept(self, request, *ages, **kwargs):
        """
        Accept a membership request as a club officer.
        ---
        requestBody: {}
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                success:
                                    type: boolean
                                    description: >
                                        True if this request was properly processed.
        ---
        """
        request_object = self.get_object()
        Membership.objects.get_or_create(
            person=request_object.requester, club=request_object.club
        )
        request_object.delete()
        return Response({"success": True})


class OwnershipRequestViewSet(viewsets.ModelViewSet):
    """
    list: Return a list of clubs that the logged in user has sent ownership request to.

    create: Send ownership request to a club.

    destroy: Delete a ownership request from a club.
    """

    serializer_class = UserOwnershipRequestSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "club__code"
    http_method_names = ["get", "post", "delete"]

    def create(self, request, *args, **kwargs):
        """
        If a withdrawn ownership request object already exists, reuse it.

        If a request has been accepted or denied, we do not recreate it.
        """
        club = request.data.get("club", None)
        club_instance = Club.objects.filter(code=club).first()
        if club_instance is None:
            return Response(
                {"detail": "Invalid club code"}, status=status.HTTP_400_BAD_REQUEST
            )

        request_instance = OwnershipRequest.objects.filter(
            club__code=club, requester=request.user
        ).first()

        if request_instance is None:
            request_instance = OwnershipRequest.objects.create(
                club=club_instance,
                requester=request.user,
                status=OwnershipRequest.PENDING,
            )
            request_instance.send_request(request)
        elif request_instance.status == OwnershipRequest.WITHDRAWN:
            request_instance.status = OwnershipRequest.PENDING
            request_instance.created_at = timezone.now()
            request_instance.save()
        elif request_instance.status == OwnershipRequest.PENDING:
            return Response(
                {"detail": "Ownership request to this club has already been sent"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        else:
            return Response(
                {"detail": "Request has already been handled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(request_instance, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        """
        Don't actually delete the ownership request when it is withdrawn.

        This is to keep track of repeat ownership requests and avoid spamming the club
        owners with requests.
        """
        obj = self.get_object()

        obj.status = OwnershipRequest.WITHDRAWN
        obj.save(update_fields=["status"])

        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_queryset(self):
        return OwnershipRequest.objects.filter(
            requester=self.request.user,
            status=OwnershipRequest.PENDING,
            club__archived=False,
        )


class OwnershipRequestManagementViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of users who have sent ownership request to the club.

    destroy:
    Delete a ownership request for a specific user.

    accept:
    Accept an ownership request as a club owner.

    all:
    Return a list of ownership requests. Used by Superusers.
    """

    serializer_class = OwnershipRequestSerializer

    permission_classes = [OwnershipRequestPermission | IsSuperuser]
    http_method_names = ["get", "post", "delete"]
    lookup_field = "requester__username"

    def get_queryset(self):
        if self.action != "all":
            return OwnershipRequest.objects.filter(
                status=OwnershipRequest.PENDING, club__code=self.kwargs["club_code"]
            )
        else:
            return OwnershipRequest.objects.filter(
                status=OwnershipRequest.PENDING
            ).order_by("created_at")

    @action(detail=True, methods=["post"])
    def accept(self, request, *args, **kwargs):
        """
        Accept an ownership request as a club owner.
        ---
        requestBody: {}
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                success:
                                    type: boolean
                                    description: >
                                        True if this request was properly processed.
        ---
        """
        request_object = self.get_object()

        Membership.objects.update_or_create(
            person=request_object.requester,
            club=request_object.club,
            defaults={"role": Membership.ROLE_OWNER},
        )

        request_object.status = OwnershipRequest.ACCEPTED
        request_object.save(update_fields=["status"])
        return Response({"success": True})

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.status = OwnershipRequest.DENIED
        obj.save(update_fields=["status"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], permission_classes=[IsSuperuser])
    def all(self, request, *args, **kwargs):
        """
        View unaddressed ownership requests, sorted by date.
        ---
        requestBody: {}
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: object
                                properties:
                                    club:
                                        type: string
                                    created_at:
                                        type: string
                                        format: date-time
                                    email:
                                        type: string
                                    graduation_year:
                                        type: integer
                                    major:
                                        type: array
                                        items:
                                            type: object
                                            properties:
                                                id:
                                                    type: integer
                                                name:
                                                    type: string
                                    name:
                                        type: string
                                    school:
                                        type: array
                                        items:
                                            type: object
                                            properties:
                                                id:
                                                    type: integer
                                                name:
                                                    type: string
                                                is_graduate:
                                                    type: boolean
                                    username:
                                        type: string
        ---
        """

        serializer = self.get_serializer(self.get_queryset(), many=True)

        return Response(serializer.data)


class MemberViewSet(XLSXFormatterMixin, viewsets.ModelViewSet):
    """
    list:
    Return a list of members that are in the club.
    Returns more information about each member if the logged in user
    is a superuser or in the club.

    update:
    Update the role/title/status for a membership.
    You must specify all fields or use a patch request.

    partial_update:
    Update the role/title/status for a membership.
    Specify only the fields you want to change.

    retrieve:
    Return information about a specific membership between a student and the club.

    create:
    Add a member to a club.

    destroy:
    Kick out a member from a club.
    """

    serializer_class = MembershipSerializer
    permission_classes = [MemberPermission | IsSuperuser]
    http_method_names = ["get", "post", "put", "patch", "delete"]
    lookup_field = "person__username"

    def get_queryset(self):
        return (
            Membership.objects.filter(club__code=self.kwargs["club_code"])
            .order_by("-active", "role", "person__last_name", "person__first_name")
            .select_related("person", "person__profile")
        )

    def get_serializer_class(self):
        if self.request is not None and self.request.user.is_authenticated:
            if self.request.user.has_perm("clubs.manage_club") or (
                "club_code" in self.kwargs
                and Membership.objects.filter(
                    person=self.request.user, club__code=self.kwargs["club_code"]
                ).exists()
            ):
                return AuthenticatedMembershipSerializer
        return MembershipSerializer


class AssetViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of files that belong to this club.

    retrieve:
    Retrieve the contents of the specific file that belongs to this club.

    create:
    Upload a new file to the club file repository.

    destroy:
    Delete a file from the club file repository.
    """

    serializer_class = AssetSerializer
    permission_classes = [AssetPermission | IsSuperuser]
    parser_classes = [parsers.MultiPartParser]
    http_method_names = ["get", "post", "delete"]

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        resp = HttpResponse(obj.file, content_type="application/octet-stream")
        resp["Content-Disposition"] = "attachment; filename={}".format(obj.name)
        return resp

    def get_queryset(self):
        return Asset.objects.filter(club__code=self.kwargs["club_code"])


class NoteViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of notes that this club has created for other clubs.

    retrieve:
    Return a specific note that this club has created for another club.

    create:
    Create a new note on another club.

    destroy:
    Destroy an existing note on another club.
    """

    serializer_class = NoteSerializer
    permission_classes = [NotePermission | IsSuperuser]
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        club = get_object_or_404(Club, code=self.kwargs["club_code"])

        queryset = Note.objects.filter(creating_club__code=self.kwargs["club_code"])
        queryset = filter_note_permission(queryset, club, self.request.user)

        return queryset


class TagViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of tags.

    get:
    Return details for a specific tag by name.
    """

    queryset = (
        Tag.objects.all().annotate(clubs=Count("club", distinct=True)).order_by("name")
    )
    serializer_class = TagSerializer
    permission_classes = [ReadOnly | IsSuperuser]
    http_method_names = ["get"]
    lookup_field = "name"


class ClassificationViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of classifications.
    """

    queryset = Classification.objects.all()
    serializer_class = ClassificationSerializer
    permission_classes = [ReadOnly | IsSuperuser]
    http_method_names = ["get"]
    lookup_field = "name"


class BadgeViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of badges.

    get:
    Return details for a specific badge by name.
    """

    serializer_class = BadgeSerializer
    permission_classes = [ReadOnly | IsSuperuser]
    http_method_names = ["get"]

    def get_queryset(self):
        show_all = self.request.query_params.get("all", "false") == "true"
        fair = self.request.query_params.get("fair", None)

        if show_all:
            return Badge.objects.all()
        elif fair and fair not in {"null", "undefined"}:
            return Badge.objects.filter(fair__id=fair)

        return Badge.objects.filter(visible=True)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of categories.
    """

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [ReadOnly | IsSuperuser]
    http_method_names = ["get"]


class EligibilityViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of eligibilities.
    """

    queryset = Eligibility.objects.all()
    serializer_class = EligibilitySerializer
    permission_classes = [ReadOnly | IsSuperuser]
    http_method_names = ["get"]


class DesignationViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of designations.
    """

    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer
    permission_classes = [ReadOnly | IsSuperuser]
    http_method_names = ["get"]
    lookup_field = "name"


class TypeViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of types.
    """

    queryset = Type.objects.all()
    serializer_class = TypeSerializer
    permission_classes = [ReadOnly | IsSuperuser]
    http_method_names = ["get"]
    lookup_field = "name"


class StatusViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of statuses.
    """

    queryset = Status.objects.all()
    serializer_class = StatusSerializer
    permission_classes = [ReadOnly | IsSuperuser]
    http_method_names = ["get"]
    lookup_field = "name"


class GroupActivityOptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing group activity assessment options.
    """

    queryset = GroupActivityOption.objects.all()
    serializer_class = GroupActivityOptionSerializer
    permission_classes = [ReadOnly | IsSuperuser]
    http_method_names = ["get"]


def parse_boolean(inpt):
    if not isinstance(inpt, str):
        return inpt
    inpt = inpt.strip().lower()
    if inpt in {"true", "yes", "y"}:
        return True
    elif inpt in {"false", "no", "n"}:
        return False
    return None


class FavoriteEventsAPIView(generics.ListAPIView):
    """
    Return a list of events, ordered in increasing order of start time (from time
    of API call) corresponding to clubs that a user has favourited
    """

    serializer_class = FavouriteEventSerializer
    permission_classes = [IsAuthenticated & ReadOnly]

    def get_queryset(self):
        date = datetime.date.today()
        today = datetime.datetime(date.year, date.month, date.day)

        return (
            Event.objects.filter(
                club__favorite__person=self.request.user.id,
                eventshowing__start_time__gte=today,
            )
            .select_related("club")
            .prefetch_related("club__badges")
            .order_by("eventshowing__start_time")
            .distinct()
        )


class ClubBoothsViewSet(viewsets.ModelViewSet):
    """
    get: Get club booths corresponding to club code

    post: Create or update a club booth
    """

    lookup_field = "club__code"
    serializer_class = ClubBoothSerializer
    http_methods_names = ["get", "post"]

    def get_queryset(self):
        return ClubFairBooth.objects.all()

    @action(detail=False, methods=["get"])
    def live(self, *args, **kwargs):
        """
        Show live booths at the club fair
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: object
                                properties:
                                    name:
                                        type: string
                                    subtitle:
                                        type: string
                                    club:
                                        type: string
                                    image_url:
                                        type: string
                                    lat:
                                        type: number
                                    long:
                                        type: number
                                    start_time:
                                        type: string
                                    end_time:
                                        type: string
        ---
        """
        today = datetime.date.today()
        today = datetime.datetime(today.year, today.month, today.day)

        booths = (
            ClubFairBooth.objects.filter(
                start_time__gte=today, end_time__gte=timezone.now()
            )
            .select_related("club")
            .prefetch_related("club__badges")
            .order_by("start_time")
            .all()
        )

        return Response(ClubBoothSerializer(booths, many=True).data)


class FavoriteCalendarAPIView(APIView):
    def get(self, request, *args, **kwargs):
        """
        Return a .ics file of the user's favorite club events.
        ---
        parameters:
            - name: global
              in: query
              required: false
              description: >
                If specified, either only show global events
                if true or exclude global events if false.
            - name: all
              in: query
              required: false
              description: >
                If set to true, show all events instead of only subscribed events.
        responses:
            "200":
                description: Return a calendar file in ICS format.
                content:
                    text/calendar:
                        schema:
                            type: string
        ---
        """
        is_global = parse_boolean(request.query_params.get("global"))
        is_all = parse_boolean(request.query_params.get("all"))

        calendar = ICSCal(
            creator=f"{settings.BRANDING_SITE_NAME} ({settings.DOMAINS[0]})"
        )
        calendar.extra.append(
            ICSParse.ContentLine(
                name="X-WR-CALNAME", value=f"{settings.BRANDING_SITE_NAME} Events"
            )
        )

        # only fetch events newer than the past month
        one_month_ago = timezone.now() - datetime.timedelta(days=30)

        # Get event showings that start after one month ago
        event_showings = EventShowing.objects.filter(start_time__gte=one_month_ago)

        # filter based on user supplied flags
        q = Q(
            event__club__favorite__person__profile__uuid_secret=kwargs[
                "user_secretuuid"
            ]
        )
        if is_global is None:
            q |= Q(event__club__isnull=True)

        if is_global:
            event_showings = event_showings.filter(event__club__isnull=True)
        elif not is_all:
            event_showings = event_showings.filter(q)

        event_showings = event_showings.distinct().select_related(
            "event", "event__club"
        )

        for showing in event_showings:
            event = showing.event
            e = ICSEvent()
            e.name = "{} - {}".format(
                event.club.name if event.club else "Global Event", event.name
            )
            e.begin = showing.start_time

            # ensure event is at least 15 minutes for display purposes
            e.end = (
                (showing.start_time + datetime.timedelta(minutes=15))
                if showing.start_time >= showing.end_time
                else showing.end_time
            )

            # put url in location if location does not exist, otherwise put url in body
            if showing.location:
                e.location = showing.location
            else:
                e.location = event.url
            e.url = event.url
            e.description = "{}\n\n{}".format(
                event.url or "" if not showing.location else "",
                html_to_text(event.description),
            ).strip()
            e.uid = f"{event.ics_uuid}@{settings.DOMAINS[0]}"
            e.created = event.created_at
            e.last_modified = event.updated_at
            e.categories = [event.club.name] if event.club else ["Global Event"]

            calendar.events.add(e)

        response = HttpResponse(calendar, content_type="text/calendar")
        response["Content-Disposition"] = "attachment; filename=favorite_events.ics"
        return response


class FakeView(object):
    """
    Dummy view used for permissions checking by the UserPermissionAPIView.
    """

    def __init__(self, action):
        self.action = action


class UserGroupAPIView(APIView):
    """
    get: Return the major permission groups and their members on the site.
    """

    permission_classes = [DjangoPermission("clubs.manage_club")]

    def get(self, request):
        """
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: object
                                properties:
                                    code:
                                        type: string
                                    members:
                                        type: object
                                        properties:
                                            username:
                                                type: string
                                            name:
                                                type: string
        ---
        """
        perms = [
            "approve_club",
            "generate_reports",
            "manage_club",
            "see_fair_status",
            "see_pending_clubs",
        ]
        output = {}
        for name in perms:
            perm = Permission.objects.get(codename=name)
            output[name] = (
                get_user_model()
                .objects.filter(Q(groups__permissions=perm) | Q(user_permissions=perm))
                .distinct()
                .values_list("username", "first_name", "last_name")
            )
        output["superuser"] = (
            get_user_model()
            .objects.filter(is_superuser=True)
            .values_list("username", "first_name", "last_name")
        )
        output = [
            {
                "code": k,
                "members": [
                    {"username": x[0], "name": f"{x[1]} {x[2]}".strip()} for x in v
                ],
            }
            for k, v in output.items()
        ]
        return Response(output)


class UserPermissionAPIView(APIView):
    """
    get: Check if a user has a specific permission or list of permissions separated by
    commas, or return a list of all user permissions.

    This endpoint can accept general Django permissions or per object Django
    permissions, with the permission name and lookup key for the object separated by a
    colon. A general Django permission will grant access to the per object version
    if the user has the general permission.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        """
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                permissions:
                                    type: object
                                    additionalProperties:
                                        type: boolean
        ---
        """
        raw_perms = [
            perm.strip()
            for perm in request.GET.get("perm", "").strip().split(",")
            if perm
        ]

        if not request.user.is_authenticated:
            return Response({"permissions": {k: False for k in raw_perms}})

        general_perms = [p for p in raw_perms if ":" not in p]
        object_perms = [p for p in raw_perms if ":" in p]

        # process general permissions
        ret = {}
        all_perms = request.user.get_all_permissions()
        if raw_perms:
            for perm in general_perms:
                ret[perm] = request.user.is_superuser or perm in all_perms
        else:
            for perm in all_perms:
                ret[perm] = True

        # process object specific permissions
        lookups = {}

        for perm in object_perms:
            key, value = perm.split(":", 1)

            # if user has the global permission for all objects
            if request.user.is_superuser or key in all_perms:
                ret[perm] = True
                continue

            # otherwise, add permission to individual lookup queue
            if key not in lookups:
                lookups[key] = []
            ret[perm] = None
            lookups[key].append(value)

        # lookup individual permissions grouped by permission
        for key, values in lookups.items():
            if key in {"clubs.manage_club", "clubs.delete_club"}:
                perm_checker = ClubPermission()
                view = FakeView("destroy" if key == "clubs.delete_club" else "update")
                objs = Club.objects.filter(code__in=values)
                global_perm = perm_checker.has_permission(request, view)
                for obj in objs:
                    perm = f"{key}:{obj.code}"
                    ret[perm] = global_perm and perm_checker.has_object_permission(
                        request, view, obj
                    )

        return Response({"permissions": ret})


def zoom_api_call(user, verb, url, *args, **kwargs):
    """
    Perform an API call to Zoom with various checks.

    If the call returns a token expired event,
    refresh the token and try the call one more time.
    """
    if not settings.SOCIAL_AUTH_ZOOM_OAUTH2_KEY:
        raise DRFValidationError(
            "Server is not configured with Zoom OAuth2 credentials."
        )

    if not user.is_authenticated:
        raise DRFValidationError("You are not authenticated.")

    social = user.social_auth.filter(provider="zoom-oauth2").first()
    if social is None:
        raise DRFValidationError("You have not linked your Zoom account yet.")

    is_retry = "retry" in kwargs
    if is_retry:
        del kwargs["retry"]

    out = requests.request(
        verb,
        url.format(uid=social.uid),
        *args,
        headers={"Authorization": f"Bearer {social.get_access_token(load_strategy())}"},
        **kwargs,
    )

    if out.status_code == 204:
        return out

    # check for token expired event
    data = out.json()
    if data.get("code") == 124 and not is_retry:
        social.refresh_token(load_strategy())
        kwargs["retry"] = True
        return zoom_api_call(user, verb, url, *args, **kwargs)

    return out


def generate_zoom_password():
    """
    Create a secure Zoom password for the meeting.
    """
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for i in range(10))


class MeetingZoomWebhookAPIView(APIView):
    """
    get: Given an event id, return the number of people on the Zoom call.

    post: Trigger this webhook. Should be triggered when a Zoom event occurs.
    Not available to the public, requires Zoom verification token.
    """

    def get(self, request):
        """
        ---
        parameters:
            - name: event
              in: query
              type: integer
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                attending:
                                    type: integer
                                    description: >
                                        Number of users currently attending the meeting.
                                        Includes the club officers.
                                officers:
                                    type: integer
                                    description: >
                                        Number of officers attending the meeting.
                                attended:
                                    type: integer
                                    description: >
                                        Number of users that attended the meeting
                                        before. Does not include currently attending
                                        users.
                                time:
                                    type: number
                                    description: >
                                        Number of seconds that the median user attended
                                        the meeting.
        ---
        """
        event_id = request.query_params.get("event")

        time_query = (
            ZoomMeetingVisit.objects.filter(
                event__id=event_id, leave_time__isnull=False
            )
            .annotate(
                time=ExpressionWrapper(
                    F("leave_time") - F("join_time"), DurationField()
                )
            )
            .order_by("time")
        )
        time_index = time_query.count()
        if time_index > 0:
            time_index //= 2
            median_time = time_query[time_index].time
        else:
            median_time = 0

        return Response(
            {
                "attending": ZoomMeetingVisit.objects.filter(
                    event__id=event_id, leave_time__isnull=True
                ).count(),
                "attended": ZoomMeetingVisit.objects.filter(
                    event__id=event_id, leave_time__isnull=False
                )
                .values("person")
                .distinct()
                .count(),
                "officers": ZoomMeetingVisit.objects.filter(
                    event__id=event_id,
                    leave_time__isnull=True,
                    person=F("event__club__membership__person"),
                )
                .values("person")
                .distinct()
                .count(),
                "time": median_time,
            }
        )

    def post(self, request):
        # security check to make sure request contains zoom provided token
        if settings.ZOOM_VERIFICATION_TOKEN:
            authorization = request.META.get("HTTP_AUTHORIZATION")
            if authorization != settings.ZOOM_VERIFICATION_TOKEN:
                return Response(
                    {
                        "detail": "Your authorization token is invalid!",
                        "success": False,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        action = request.data.get("event")
        event_id = None
        if action == "meeting.participant_joined":
            email = (
                request.data.get("payload", {})
                .get("object", {})
                .get("participant", {})
                .get("email", None)
            )

            if email:
                username = email.split("@")[0]
                person = get_user_model().objects.filter(username=username).first()
            else:
                person = None

            meeting_id = (
                request.data.get("payload", {}).get("object", {}).get("id", None)
            )
            regex = rf"""https?:\/\/([A-z]*\.)?zoom\.us/[^\/]*\/
                        {meeting_id}(\?pwd=[A-z,0-9]*)?"""
            event = Event.objects.filter(url__regex=regex).first()

            participant_id = (
                request.data.get("payload", {})
                .get("object", {})
                .get("participant", {})
                .get("user_id", None)
            )
            join_time = (
                request.data.get("payload", {})
                .get("object", {})
                .get("participant", {})
                .get("join_time", None)
            )

            if event:
                ZoomMeetingVisit.objects.create(
                    person=person,
                    event=event,
                    meeting_id=meeting_id,
                    participant_id=participant_id,
                    join_time=join_time,
                )
                event_id = event.id
        elif action == "meeting.participant_left":
            meeting_id = (
                request.data.get("payload", {}).get("object", {}).get("id", None)
            )
            participant_id = (
                request.data.get("payload", {})
                .get("object", {})
                .get("participant", {})
                .get("user_id", None)
            )
            leave_time = (
                request.data.get("payload", {})
                .get("object", {})
                .get("participant", {})
                .get("leave_time", None)
            )

            meeting = (
                ZoomMeetingVisit.objects.filter(
                    meeting_id=meeting_id,
                    participant_id=participant_id,
                    leave_time__isnull=True,
                )
                .order_by("-created_at")
                .first()
            )
            if meeting is not None:
                meeting.leave_time = leave_time
                meeting.save()
                event_id = meeting.event.id

        if event_id is not None:
            channel_layer = get_channel_layer()
            if channel_layer is not None:
                async_to_sync(channel_layer.group_send)(
                    f"events-live-{event_id}", {"type": "join_leave", "event": action}
                )

        return Response({"success": True})


class MeetingZoomAPIView(APIView):
    """
    get: Return a list of upcoming Zoom meetings for a user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                success:
                                    type: boolean
                                meetings:
                                    type: object
                                    additionalProperties:
                                        type: string
                                extra_details:
                                    type: object
                                    additionalProperties:
                                        type: string
        ---
        """
        refresh = request.query_params.get("refresh", "false").lower() == "true"

        if request.user.is_authenticated:
            key = f"zoom:meetings:{request.user.username}"
            if not refresh:
                res = cache.get(key)
                if res is not None:
                    return Response(res)

        try:
            data = zoom_api_call(
                request.user, "GET", "https://api.zoom.us/v2/users/{uid}/meetings"
            )
        except requests.exceptions.HTTPError as e:
            raise DRFValidationError(
                "An error occured while fetching meetings for current user."
            ) from e

        # get meeting ids
        body = data.json()
        meetings = [meeting["id"] for meeting in body.get("meetings", [])]

        # get user events
        if request.user.is_authenticated:
            events = Event.objects.filter(
                club__membership__role__lte=Membership.ROLE_OFFICER,
                club__membership__person=request.user,
            )
        else:
            events = []

        extra_details = {}
        for event in events:
            if event.url is not None and "zoom.us" in event.url:
                match = re.search(r"(\d+)", urlparse(event.url).path)
                if match is not None:
                    zoom_id = int(match[1])
                    if zoom_id in meetings:
                        try:
                            individual_data = zoom_api_call(
                                request.user,
                                "GET",
                                f"https://api.zoom.us/v2/meetings/{zoom_id}",
                            ).json()
                            extra_details[individual_data["id"]] = individual_data
                        except requests.exceptions.HTTPError:
                            pass

        response = {
            "success": data.ok,
            "meetings": body,
            "extra_details": extra_details,
        }
        if response["success"]:
            cache.set(key, response, 120)
        return Response(response)

    def delete(self, request):
        """
        Delete the Zoom meeting for this event.
        """
        event = get_object_or_404(Event, id=request.query_params.get("event"))

        if (
            not request.user.has_perm("clubs.manage_club")
            and not event.club.membership_set.filter(
                person=request.user, role__lte=Membership.ROLE_OFFICER
            ).exists()
        ):
            return Response(
                {
                    "success": False,
                    "detail": "You do not have permission to perform this action.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if event.url:
            match = re.search(r"(\d+)", urlparse(event.url).path)
            if "zoom.us" in event.url and match is not None:
                zoom_id = int(match[1])
                zoom_api_call(
                    request.user, "DELETE", f"https://api.zoom.us/v2/meetings/{zoom_id}"
                )

            event.url = None
            event.save()
            return Response(
                {
                    "success": True,
                    "detail": "The Zoom meeting has been unlinked and deleted.",
                }
            )
        else:
            return Response(
                {
                    "success": True,
                    "detail": "There is no Zoom meeting configured for this event.",
                }
            )

    def post(self, request):
        """
        Create a new Zoom meeting for this event
        or try to fix the existing zoom meeting.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                success:
                                    type: boolean
                                detail:
                                    type: string
        ---
        """
        try:
            event = Event.objects.get(id=request.query_params.get("event"))
        except Event.DoesNotExist as e:
            raise DRFValidationError(
                "The event you are trying to modify does not exist."
            ) from e

        event_showing = EventShowing.objects.filter(event=event).first()
        if not event_showing:
            raise DRFValidationError("This event does not have any scheduled showings.")

        eastern = pytz.timezone("America/New_York")

        # ensure user can do this
        if not request.user.has_perm(
            "clubs.manage_club"
        ) and not event.club.membership_set.filter(
            role__lte=Membership.ROLE_OFFICER, person=request.user
        ):
            return Response(
                {
                    "success": False,
                    "detail": "You are not allowed to perform this action!",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # add all other officers as alternative hosts
        alt_hosts = []
        for mship in event.club.membership_set.filter(
            role__lte=Membership.ROLE_OFFICER
        ):
            social = mship.person.social_auth.filter(provider="zoom-oauth2").first()
            if social is not None:
                alt_hosts.append(social.extra_data["email"])

        # recommended zoom meeting settings
        recommended_settings = {
            "audio": "both",
            "join_before_host": True,
            "mute_upon_entry": True,
            "waiting_room": False,
            "meeting_authentication": True,
            "authentication_domains": "upenn.edu,*.upenn.edu",
        }

        if alt_hosts:
            recommended_settings["alternative_hosts"] = ",".join(alt_hosts)

        if not event.url:
            password = generate_zoom_password()
            body = {
                "topic": f"Virtual Activities Fair - {event.club.name}",
                "type": 2,
                "start_time": event_showing.start_time.astimezone(eastern)
                .replace(tzinfo=None, microsecond=0, second=0)
                .isoformat(),
                "duration": (event_showing.end_time - event_showing.start_time)
                / datetime.timedelta(minutes=1),
                "timezone": "America/New_York",
                "agenda": f"Virtual Activities Fair Booth for {event.club.name}",
                "password": password,
                "settings": recommended_settings,
            }
            data = zoom_api_call(
                request.user,
                "POST",
                "https://api.zoom.us/v2/users/{uid}/meetings",
                json=body,
            )
            out = data.json()
            event.url = out.get("join_url", "")
            event.save(update_fields=["url"])
            return Response(
                {
                    "success": True,
                    "detail": "Your Zoom meeting has been created! "
                    "The following Zoom accounts have been made hosts:"
                    f" {', '.join(alt_hosts)}",
                }
            )
        else:
            parsed_url = urlparse(event.url)

            if "zoom.us" not in parsed_url.netloc:
                return Response(
                    {
                        "success": False,
                        "detail": "The current meeting link is not a Zoom link. "
                        "If you would like to have your Zoom link automatically "
                        "generated, please clear the URL field and try again.",
                    }
                )

            if "upenn.zoom.us" not in parsed_url.netloc:
                return Response(
                    {
                        "success": False,
                        "detail": "The current meeting link is not a Penn Zoom link. "
                        "If you would like to have your Penn Zoom link automatically "
                        "generated, login with your Penn Zoom account, clear the URL "
                        "from your event, and try this process again.",
                    }
                )

            match = re.search(r"(\d+)", parsed_url.path)
            if match is None:
                return Response(
                    {
                        "success": False,
                        "detail": "Failed to parse your URL, "
                        "are you sure this is a valid Zoom link?",
                    }
                )

            zoom_id = int(match[1])

            data = zoom_api_call(
                request.user, "GET", f"https://api.zoom.us/v2/meetings/{zoom_id}"
            )
            out = data.json()
            event.url = out.get("join_url", event.url)
            event.save(update_fields=["url"])

            start_time = (
                event_showing.start_time.astimezone(eastern)
                .replace(tzinfo=None, microsecond=0, second=0)
                .isoformat()
            )

            body = {
                "start_time": start_time,
                "duration": (event_showing.end_time - event_showing.start_time)
                / datetime.timedelta(minutes=1),
                "timezone": "America/New_York",
                "settings": recommended_settings,
            }

            out = zoom_api_call(
                request.user,
                "PATCH",
                f"https://api.zoom.us/v2/meetings/{zoom_id}",
                json=body,
            )

            return Response(
                {
                    "success": out.ok,
                    "detail": (
                        "Your Zoom meeting has been updated. "
                        "The following accounts have been made hosts:"
                        f" {', '.join(alt_hosts)}"
                        if out.ok
                        else "Your Zoom meeting has not been updated. "
                        "Are you the owner of the meeting?"
                    ),
                }
            )


class UserZoomAPIView(APIView):
    """
    get: Return information about the Zoom account associated with the logged in user.

    post: Update the Zoom account settings to be the recommended Penn Clubs settings.
    """

    def get(self, request):
        """
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                success:
                                    type: boolean
                                settings:
                                    type: object
                                    additionalProperties:
                                        type: string
                                email:
                                    type: string
        ---
        """
        refresh = request.query_params.get("refresh", "false").lower() == "true"
        no_cache = request.query_params.get("noCache", "false").lower() == "true"

        if request.user.is_authenticated:
            key = f"zoom:user:{request.user.username}"
            res = cache.get(key)
            if res is not None:
                if not refresh:
                    if res.get("success") is True:
                        return Response(res)
                    else:
                        cache.delete(key)
                if no_cache:
                    cache.delete(key)

        try:
            response = zoom_api_call(
                request.user,
                "GET",
                "https://api.zoom.us/v2/users/{uid}/settings",
            )
        except requests.exceptions.HTTPError as e:
            raise DRFValidationError(
                "An error occured while fetching user information. "
                "Your authentication with the Zoom API might have expired. "
                "Try reconnecting your account."
            ) from e

        social = request.user.social_auth.filter(provider="zoom-oauth2").first()
        if social is None:
            email = None
        else:
            email = social.extra_data.get("email")

        settings = response.json()
        res = {
            "success": settings.get("code") is None,
            "settings": settings,
            "email": email,
        }

        if res["success"]:
            cache.set(key, res, 900)
        return Response(res)

    def post(self, request):
        """
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                success:
                                    type: boolean
                                detail:
                                    type: string
        ---
        """
        if request.user.is_authenticated:
            key = f"zoom:user:{request.user.username}"
            cache.delete(key)

        response = zoom_api_call(
            request.user,
            "PATCH",
            "https://api.zoom.us/v2/users/{uid}/settings",
            json={
                "in_meeting": {
                    "breakout_room": True,
                    "waiting_room": False,
                    "co_host": True,
                    "screen_sharing": True,
                }
            },
        )

        return Response(
            {
                "success": response.ok,
                "detail": (
                    "Your user settings have been updated on Zoom."
                    if response.ok
                    else "Failed to update Zoom user settings."
                ),
            }
        )


class UserUpdateAPIView(generics.RetrieveUpdateAPIView):
    """
    get: Return information about the logged in user, including bookmarks,
    subscriptions, memberships, and school/major/graduation year information.

    put: Update information about the logged in user.
    All fields are required.

    patch: Update information about the logged in user.
    Only updates fields that are passed to the server.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request, *args, **kwargs):
        """
        Cache the settings endpoint for 5 minutes or until user data is updated.
        """
        key = f"user:settings:{request.user.username}"
        val = cache.get(key)
        if val:
            return Response(val)
        resp = super().get(request, *args, **kwargs)
        cache.set(key, resp.data, 5 * 60)
        return resp

    def put(self, request, *args, **kwargs):
        """
        Clear the cache when putting user settings.
        """
        key = f"user:settings:{request.user.username}"
        cache.delete(key)
        return super().put(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        """
        Clear the cache when patching user settings.
        """
        key = f"user:settings:{request.user.username}"
        cache.delete(key)
        return super().patch(request, *args, **kwargs)

    def get_operation_id(self, **kwargs):
        if kwargs["action"] == "get":
            return "Retrieve Self User"
        return None

    def get_object(self):
        user = self.request.user
        prefetch_related_objects(
            [user],
            "profile__school",
            "profile__major",
        )
        return user


class TicketViewSet(viewsets.ModelViewSet):
    """
    get:
    Get a specific ticket owned by a user

    list:
    List all tickets owned by a user

    partial_update:
    Update attendance for a ticket

    cart:
    List all unowned/unheld tickets currently in a user's cart

    initiate_checkout:
    Initiate a hold on the tickets in a user's cart and create a capture context

    complete_checkout:
    Complete the checkout process after we have obtained an auth on a user's card

    qr:
    Get a ticket's QR code

    transfer:
    Transfer a ticket to another user
    """

    permission_classes = [IsAuthenticated]
    serializer_class = TicketSerializer
    http_method_names = ["get", "post", "patch"]
    lookup_field = "id"

    @staticmethod
    def _calculate_cart_total(cart) -> float:
        """
        Calculate the total price of all tickets in a cart, applying discounts
        where appropriate. Does not validate that the cart is valid.

        :param cart: Cart object
        :return: Total price of all tickets in the cart
        """
        ticket_type_counts = {
            item["type"]: item["count"]
            for item in cart.tickets.values("type").annotate(count=Count("type"))
        }
        cart_total = sum(
            (
                ticket.price * (1 - ticket.group_discount)
                if ticket.group_size
                and ticket_type_counts[ticket.type] >= ticket.group_size
                else ticket.price
            )
            for ticket in cart.tickets.all()
        )
        return cart_total

    def partial_update(self, request, *args, **kwargs):
        """
        Update a ticket's attendance (only accessible by club officers)
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            attended:
                                type: boolean
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            $ref: '#/components/schemas/Ticket'
            "400":
                content:
                    application/json:
                        schema:
                           type: object
                           properties:
                                detail:
                                    type: string
        ---
        """
        attended = request.data.get("attended")
        if attended is None or not isinstance(attended, bool):
            return Response(
                {"detail": "Missing boolean attribute 'attended'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ticket = self.get_object()
        ticket.attended = attended
        ticket.save()
        return Response(TicketSerializer(ticket).data)

    @transaction.atomic
    @update_holds
    @action(detail=False, methods=["get"])
    def cart(self, request, *args, **kwargs):
        """
        Validate tickets in a cart and return them. Replace in-cart tickets that
        have been bought/held by someone else.
        ---
        requestBody:
            content: {}
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                tickets:
                                    allOf:
                                        - $ref: "#/components/schemas/Ticket"
                                sold_out:
                                    type: array
                                    items:
                                        type: object
                                        properties:
                                            type:
                                                type: string
                                            showing:
                                                type: object
                                                properties:
                                                    id:
                                                        type: integer
                                            event:
                                                type: object
                                                properties:
                                                    id:
                                                        type: integer
                                                    name:
                                                        type: string
                                            count:
                                                type: integer
        ---
        """

        cart, _ = Cart.objects.prefetch_related("tickets").get_or_create(
            owner=self.request.user
        )

        now = timezone.now()

        tickets_to_replace = cart.tickets.filter(
            Q(owner__isnull=False)
            | Q(showing__event__club__archived=True)
            | Q(holder__isnull=False)
            | Q(showing__end_time__lt=now)
            | (
                Q(showing__ticket_drop_time__gt=timezone.now())
                & Q(showing__ticket_drop_time__isnull=False)
            )
        ).exclude(holder=self.request.user)

        # In most cases, we won't need to replace, so exit early
        if not tickets_to_replace.exists():
            return Response(
                {
                    "tickets": TicketSerializer(cart.tickets.all(), many=True).data,
                    "sold_out": [],
                },
            )

        # Attempt to replace all tickets that have gone stale or are for elapsed events
        replacement_tickets, sold_out_tickets = [], []

        tickets_in_cart = cart.tickets.values_list("id", flat=True)
        tickets_to_replace = tickets_to_replace.select_related(
            "showing", "showing__event"
        )

        for ticket_class in tickets_to_replace.values(
            "type",
            "showing",
            "showing__event__name",
            "showing__end_time",
            "showing__event",
        ).annotate(count=Count("id")):
            # we don't need to lock, since we aren't updating holder/owner
            if ticket_class["showing__end_time"] < now:
                # Event has elapsed, mark all tickets as sold out
                sold_out_tickets.append(
                    {
                        "type": ticket_class["type"],
                        "showing": {
                            "id": ticket_class["showing"],
                        },
                        "event": {
                            "id": ticket_class["showing__event"],
                            "name": ticket_class["showing__event__name"],
                        },
                        "count": ticket_class["count"],
                    }
                )
                continue

            available_tickets = Ticket.objects.filter(
                Q(showing__ticket_drop_time__lte=timezone.now())
                | Q(showing__ticket_drop_time__isnull=True),
                showing=ticket_class["showing"],
                type=ticket_class["type"],
                buyable=True,  # should not be triggered as buyable is by ticket class
                owner__isnull=True,
                holder__isnull=True,
            ).exclude(id__in=tickets_in_cart)[: ticket_class["count"]]

            num_short = ticket_class["count"] - available_tickets.count()
            if num_short > 0:
                sold_out_tickets.append(
                    {
                        "type": ticket_class["type"],
                        "showing": {
                            "id": ticket_class["showing"],
                        },
                        "event": {
                            "id": ticket_class["showing__event"],
                            "name": ticket_class["showing__event__name"],
                        },
                        "count": num_short,
                    }
                )

            replacement_tickets.extend(list(available_tickets))

        cart.tickets.remove(*tickets_to_replace)
        if replacement_tickets:
            cart.tickets.add(*replacement_tickets)
        cart.save()

        return Response(
            {
                "tickets": TicketSerializer(cart.tickets.all(), many=True).data,
                "sold_out": sold_out_tickets,
            },
        )

    @action(detail=False, methods=["post"])
    @update_holds
    @transaction.atomic
    def initiate_checkout(self, request, *args, **kwargs):
        """
        Checkout all tickets in cart and create a Cybersource capture context

        NOTE: this does NOT buy tickets, it simply initiates a checkout process
        which includes a 10-minute ticket hold

        Once the user has entered their payment details and submitted the form
        the request will be routed to complete_checkout

        403 implies a stale cart.
        ---
        requestBody: {}
        responses:
            "200":
                content:
                    application/json:
                        schema:
                           type: object
                           properties:
                                detail:
                                    type: string
                                success:
                                    type: boolean
                                sold_free_tickets:
                                    type: boolean
            "403":
                content:
                    application/json:
                        schema:
                           type: object
                           properties:
                                detail:
                                    type: string
                                success:
                                    type: boolean
                                sold_free_tickets:
                                    type: boolean
        ---
        """
        cart = get_object_or_404(Cart, owner=self.request.user)

        # Cart must have at least one ticket
        if not cart.tickets.exists():
            return Response(
                {
                    "success": False,
                    "detail": "No tickets selected for checkout.",
                    "sold_free_tickets": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # skip_locked is important here because if any of the tickets in cart
        # are locked, we shouldn't block.
        tickets = cart.tickets.select_for_update(skip_locked=True).filter(
            Q(holder__isnull=True) | Q(holder=self.request.user),
            Q(showing__ticket_drop_time__lte=timezone.now())
            | Q(showing__ticket_drop_time__isnull=True),
            showing__event__club__archived=False,
            owner__isnull=True,
            buyable=True,
        )

        # Assert that the filter succeeded in freezing all the tickets for checkout
        if tickets.count() != cart.tickets.count():
            return Response(
                {
                    "success": False,
                    "detail": (
                        "Cart is stale or empty, invoke /api/tickets/cart to refresh"
                    ),
                    "sold_free_tickets": False,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        cart_total = self._calculate_cart_total(cart)

        # If all tickets are free, we can skip the payment process
        if not cart_total:
            order_info = {
                "amountDetails": {"totalAmount": "0.00"},
                "billTo": {
                    "firstName": self.request.user.first_name,
                    "lastName": self.request.user.last_name,
                    "phoneNumber": None,
                    "email": self.request.user.email,
                },
            }

            # Place hold on tickets for 10 mins
            self._place_hold_on_tickets(self.request.user, tickets)
            # Skip payment process and give tickets to user/buyer
            self._give_tickets(self.request.user, order_info, cart, None)

            return Response(
                {
                    "success": True,
                    "detail": "Free tickets sold.",
                    "sold_free_tickets": True,
                }
            )

        capture_context_request = {
            "_target_origins": [settings.CYBERSOURCE_TARGET_ORIGIN],
            "_client_version": settings.CYBERSOURCE_CLIENT_VERSION,
            "_allowed_card_networks": [
                "VISA",
                "MASTERCARD",
                "AMEX",
                "DISCOVER",
            ],
            "_allowed_payment_types": ["PANENTRY", "SRC"],
            "_country": "US",
            "_locale": "en_US",
            "_capture_mandate": {
                "_billing_type": "FULL",
                "_request_email": True,
                "_request_phone": True,
                "_request_shipping": True,
                "_show_accepted_network_icons": True,
            },
            "_order_information": {
                "_amount_details": {
                    "_total_amount": f"{cart_total:.2f}",
                    "_currency": "USD",
                }
            },
        }

        try:
            context, http_status, _ = UnifiedCheckoutCaptureContextApi(
                settings.CYBERSOURCE_CONFIG
            ).generate_unified_checkout_capture_context_with_http_info(
                json.dumps(capture_context_request)
            )
            if not context or http_status >= 400:
                raise ApiException(
                    reason=f"Received {context} with HTTP status {http_status}",
                )

            # Tie generated capture context to user cart
            if cart.checkout_context != context:
                cart.checkout_context = context
                cart.save()

            # Place hold on tickets for 10 mins
            self._place_hold_on_tickets(self.request.user, tickets)

            return Response(
                {
                    "success": True,
                    "detail": context,
                    "sold_free_tickets": False,
                }
            )

        except ApiException as e:
            return Response(
                {
                    "success": False,
                    "detail": f"Unable to generate capture context: {e}",
                    "sold_free_tickets": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["post"])
    @update_holds
    @transaction.atomic
    def complete_checkout(self, request, *args, **kwargs):
        """
        Complete the checkout after the user has entered their payment details
        and obtained a transient token on the frontend.

        403 implies a stale cart.
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            transient_token:
                                type: string
        responses:
            "200":
                content:
                    application/json:
                        schema:
                           type: object
                           properties:
                                detail:
                                    type: string
                                success:
                                    type: boolean
        ---
        """
        tt = request.data.get("transient_token")
        cart = get_object_or_404(
            Cart.objects.prefetch_related("tickets"), owner=self.request.user
        )

        cc = cart.checkout_context
        if cc is None:
            return Response(
                {"success": False, "detail": "Associated capture context not found"},
                status=status.HTTP_500_BAD_REQUEST,
            )

        ok, message = validate_transient_token(cc, tt)
        if not ok:
            # Cleanup state since the purchase failed
            cart.tickets.update(holder=None, owner=None)
            cart.checkout_context = None
            cart.save()
            return Response(
                {"success": False, "detail": message},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Guard against holds expiring before the capture context
        tickets = cart.tickets.filter(holder=self.request.user, owner__isnull=True)
        if tickets.count() != cart.tickets.count():
            return Response(
                {
                    "success": False,
                    "detail": "Cart is stale, invoke /api/tickets/cart to refresh",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            _, http_status, transaction_data = TransientTokenDataApi(
                settings.CYBERSOURCE_CONFIG
            ).get_transaction_for_transient_token(tt)

            if not transaction_data or http_status >= 400:
                raise ApiException(
                    reason=f"Received {transaction_data} with HTTP status {http_status}"
                )
            transaction_data = json.loads(transaction_data)
        except ApiException as e:
            # Cleanup state since the purchase failed
            cart.tickets.update(holder=None, owner=None)
            cart.checkout_context = None
            cart.save()

            return Response(
                {
                    "success": False,
                    "detail": f"Transaction failed: {e}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        create_payment_request = {"tokenInformation": {"transientTokenJwt": tt}}

        try:
            payment_response, http_status, _ = PaymentsApi(
                settings.CYBERSOURCE_CONFIG
            ).create_payment(json.dumps(create_payment_request))

            if payment_response.status != "AUTHORIZED":
                raise ApiException(reason="Payment response status is not authorized")
            reconciliation_id = payment_response.reconciliation_id

            if not payment_response or http_status >= 400:
                raise ApiException(
                    reason=f"Received {payment_response} with HTTP status {http_status}"
                )
        except ApiException as e:
            # Cleanup state since the purchase failed
            cart.tickets.update(holder=None, owner=None)
            cart.checkout_context = None
            cart.save()

            return Response(
                {
                    "success": False,
                    "detail": f"Transaction failed: {e}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        order_info = transaction_data["orderInformation"]
        self._give_tickets(self.request.user, order_info, cart, reconciliation_id)

        return Response(
            {
                "success": True,
                "detail": "Payment successful.",
            }
        )

    @action(detail=True, methods=["get"])
    def qr(self, request, *args, **kwargs):
        """
        Return a QR code png image representing a link to the ticket.
        ---
        operationId: Generate QR Code for ticket
        responses:
            "200":
                description: Return a png image representing a QR code to the ticket.
                content:
                    image/png:
                        schema:
                            type: binary
        ---
        """
        ticket = self.get_object()
        qr_image = ticket.get_qr()
        response = HttpResponse(content_type="image/png")
        qr_image.save(response, "PNG")
        return response

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def transfer(self, request, *args, **kwargs):
        """
        Transfer a ticket to another user
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            username:
                                type: string
                        required:
                            - username
        responses:
            "200":
                content:
                    application/json:
                        schema:
                           type: object
                           properties:
                                detail:
                                    type: string
            "403":
                content:
                    application/json:
                        schema:
                           type: object
                           properties:
                                detail:
                                    type: string
            "404":
                content:
                    application/json:
                        schema:
                           type: object
                           properties:
                                detail:
                                    type: string
        ---
        """
        receiver = get_object_or_404(
            get_user_model(), username=request.data.get("username")
        )

        # checking whether the request's user owns the ticket is handled by the queryset
        ticket = self.get_object()
        if not ticket.transferable:
            return Response(
                {"detail": "The ticket is non-transferable"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if self.request.user == receiver:
            return Response(
                {"detail": "You cannot transfer a ticket to yourself"},
                status=status.HTTP_403_FORBIDDEN,
            )

        ticket.owner = receiver
        ticket.save()
        TicketTransferRecord.objects.create(
            ticket=ticket, sender=self.request.user, receiver=receiver
        ).send_confirmation_email()
        ticket.send_confirmation_email()  # send event details to recipient

        return Response({"detail": "Successfully transferred ownership of ticket"})

    def get_queryset(self):
        officer_clubs = Membership.objects.filter(
            person=self.request.user, role__lte=Membership.ROLE_OFFICER
        ).values_list("club", flat=True)
        if self.action == "partial_update":
            return Ticket.objects.filter(
                showing__event__club__in=officer_clubs
            ).select_related("showing__event__club")
        elif self.action == "retrieve":
            return Ticket.objects.filter(
                Q(owner=self.request.user.id)
                | Q(showing__event__club__in=officer_clubs)
            ).select_related("showing__event__club")
        return Ticket.objects.filter(owner=self.request.user.id)

    @staticmethod
    def _give_tickets(user, order_info, cart, reconciliation_id):
        """
        Helper function that gives user/buyer their held tickets
        and archives the transaction data
        """

        # At this point, we have validated that the payment was authorized
        # Give the tickets to the user
        tickets = cart.tickets.select_for_update().filter(holder=user)

        # Archive transaction data for historical purposes.
        # We're explicitly using the response data over what's in self.request.user
        transaction_record = TicketTransactionRecord.objects.create(
            reconciliation_id=str(reconciliation_id),
            total_amount=float(order_info["amountDetails"]["totalAmount"]),
            buyer_first_name=order_info["billTo"]["firstName"],
            buyer_last_name=order_info["billTo"]["lastName"],
            # TODO: investigate why phone numbers don't show in test API
            buyer_phone=order_info["billTo"].get("phoneNumber", None),
            buyer_email=order_info["billTo"]["email"],
        )
        tickets.update(owner=user, holder=None, transaction_record=transaction_record)

        cart.tickets.clear()
        Ticket.objects.update_holds()
        cart.checkout_context = None
        cart.save()

        tickets = Ticket.objects.filter(
            owner=user, transaction_record=transaction_record
        )
        for ticket in tickets:
            ticket.send_confirmation_email()

    @staticmethod
    def _place_hold_on_tickets(user, tickets):
        """
        Helper function that places a 10 minute hold on tickets for a user
        """
        holding_expiration = timezone.now() + datetime.timedelta(minutes=10)
        tickets.update(holder=user, holding_expiration=holding_expiration)


class MemberInviteViewSet(viewsets.ModelViewSet):
    """
    update:
    Accept a membership invite.

    partial_update:
    Accept a membership invite.

    destroy:
    Rescind a membership invite.
    """

    permission_classes = [InvitePermission | IsSuperuser]
    serializer_class = MembershipInviteSerializer
    http_method_names = ["get", "put", "patch", "delete"]

    def get_operation_id(self, **kwargs):
        if kwargs["action"] == "resend":
            return f"{kwargs['operId']} ({kwargs['method']})"
        return None

    @action(detail=True, methods=["put", "patch"])
    def resend(self, request, *args, **kwargs):
        """
        Resend an email invitation that has already been issued.
        ---
        requestBody: {}
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string
                                    description: A success or error message.
        ---
        """
        invite = self.get_object()
        invite.send_mail(request)
        invite.updated_at = timezone.now()
        invite.save(update_fields=["updated_at"])

        return Response(
            {"detail": "Resent email invitation to {}!".format(invite.email)}
        )

    def destroy(self, request, *args, **kwargs):
        invite = self.get_object()

        if request.user.is_authenticated:
            membership = find_membership_helper(request.user, invite.club)
            is_officer = (
                membership is not None and membership.role <= Membership.ROLE_OFFICER
            )
        else:
            is_officer = False

        # if we're not an officer and haven't specified the token
        # don't let us delete this invite
        if (
            not request.data.get("token") == invite.token
            and not is_officer
            and not request.user.has_perm("clubs.manage_club")
        ):
            return Response(
                {"detail": "Invalid or missing token in request."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)

    def get_queryset(self):
        return MembershipInvite.objects.filter(
            club__code=self.kwargs["club_code"], active=True
        )


class ExternalMemberListViewSet(viewsets.ModelViewSet):
    """
    get: Retrieve members' nonsensitive information per club
    """

    http_method_names = ["get"]
    serializer_class = ExternalMemberListSerializer

    def get_queryset(self):
        return (
            Membership.objects.all()
            .select_related("person", "club")
            .filter(club__code=self.kwargs["code"])
        )


class UserViewSet(viewsets.ModelViewSet):
    """
    list: Retrieve a list of users.

    get: Retrieve the profile information for given user.
    """

    queryset = get_user_model().objects.all().select_related("profile")
    permission_classes = [ProfilePermission | IsSuperuser]
    filter_backends = [filters.SearchFilter]
    http_method_names = ["get", "post"]

    search_fields = [
        "email",
        "first_name",
        "last_name",
        "username",
    ]
    lookup_field = "username"

    @action(detail=False, methods=["post"])
    def question_response(self, *args, **kwargs):
        """
        Accepts a response to a question, this happens when the user submits the
        application form
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            prompt:
                                type: string
                            questionIds:
                                type: array
                                items:
                                    type: integer
                            committee:
                                type: string
                            text:
                                type: string
                            multipleChoice:
                                type: array
                                items:
                                    type: integer
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: object
                                properties:
                                    text:
                                        type: string
                                    multiple_choice:
                                        type: string
                                    question_type:
                                        type: integer
                                    question:
                                        type: object
                                        properties:
                                            id:
                                                type: integer
                                            question_type:
                                                type: integer
                                            prompt:
                                                type: string
                                            word_limit:
                                                type: integer
                                            multiple_choice:
                                                type: array
                                                items:
                                                    type: string
                                            committees:
                                                type: array
                                                items:
                                                    type: string
                                            committee_question:
                                                type: boolean
                                            precedence:
                                                type: integer
        ---
        """
        questions = self.request.data.get("questionIds", [])
        committee_name = self.request.data.get("committee", None)
        response = Response([])
        if len(questions) == 0:
            return response
        application = (
            ApplicationQuestion.objects.filter(pk=questions[0]).first().application
        )
        committee = application.committees.filter(name=committee_name).first()

        committees_applied = (
            ApplicationSubmission.objects.filter(
                user=self.request.user,
                committee__isnull=False,
                application=application,
            )
            .values_list("committee__name", flat=True)
            .distinct()
        )

        # prevent submissions outside of the open duration
        now = timezone.now()
        extension = application.extensions.filter(user=self.request.user).first()
        end_time = (
            max(extension.end_time, application.application_end_time)
            if extension
            else application.application_end_time
        )
        if now > end_time or now < application.application_start_time:
            return Response(
                {"success": False, "detail": "This application is not currently open!"}
            )

        # limit applicants to 2 committees
        if (
            committee
            and committees_applied.count() >= 2
            and committee_name not in committees_applied
        ):
            return Response(
                {
                    "success": False,
                    "detail": """You cannot submit to more than two committees for any
                    particular club application. In case you'd like to change the
                    committees you applied to, you can delete submissions on the
                    submissions page""",
                }
            )

        # check if user profile is complete before creating a submission
        user = self.request.user
        if (
            not user.profile.graduation_year
            or not user.profile.school.exists()
            or not user.profile.major.exists()
        ):
            return Response(
                {
                    "success": False,
                    "detail": """You need to set your graduation year, major, and
                    school before you can apply to a club!""",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        submission, _ = ApplicationSubmission.objects.get_or_create(
            user=user,
            application=application,
            committee=committee,
        )

        key = f"applicationsubmissions:{application.id}"
        cache.delete(key)

        for question_pk in questions:
            question = ApplicationQuestion.objects.filter(pk=question_pk).first()
            question_type = question.question_type
            question_data = self.request.data.get(question_pk, None)

            # skip the questions which do not belong to the current committee
            if (
                question.committee_question
                and committee not in question.committees.all()
            ):
                continue

            if (
                question_type == ApplicationQuestion.FREE_RESPONSE
                or question_type == ApplicationQuestion.SHORT_ANSWER
            ):
                text = question_data.get("text", None)
                if text is not None and text != "":
                    obj, _ = ApplicationQuestionResponse.objects.update_or_create(
                        question=question,
                        submission=submission,
                        defaults={"text": text},
                    )
                    response = Response(ApplicationQuestionResponseSerializer(obj).data)
            elif question_type == ApplicationQuestion.MULTIPLE_CHOICE:
                multiple_choice_value = question_data.get("multipleChoice", None)
                if multiple_choice_value is not None and multiple_choice_value != "":
                    multiple_choice_obj = ApplicationMultipleChoice.objects.filter(
                        question=question, value=multiple_choice_value
                    ).first()
                    obj, _ = ApplicationQuestionResponse.objects.update_or_create(
                        question=question,
                        submission=submission,
                        defaults={"multiple_choice": multiple_choice_obj},
                    )
                    response = Response(ApplicationQuestionResponseSerializer(obj).data)
        return response

    @action(detail=False, methods=["get"])
    def questions(self, *args, **kwargs):
        """
        Given a prompt lists the given users responses to this particular question.
        This allows us to populate the application form with the users'
        previous submissions.
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            prompt:
                                type: string
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: object
                                properties:
                                    text:
                                        type: string
                                    multiple_choice:
                                        type: string
                                    question_type:
                                        type: integer
                                    question:
                                        type: object
                                        properties:
                                            id:
                                                type: integer
                                            question_type:
                                                type: integer
                                            prompt:
                                                type: string
                                            word_limit:
                                                type: integer
                                            multiple_choice:
                                                type: array
                                                items:
                                                    type: string
                                            committees:
                                                type: array
                                                items:
                                                    type: string
                                            committee_question:
                                                type: boolean
                                            precedence:
                                                type: integer
        ---
        """
        question_id_param = self.request.GET.get("question_id")
        if question_id_param is None or not question_id_param.isnumeric():
            return Response([])
        question_id = int(question_id_param)
        question = ApplicationQuestion.objects.filter(pk=question_id).first()
        if question is None:
            return Response([])

        response = (
            ApplicationQuestionResponse.objects.filter(
                question=question,
                submission__user=self.request.user,
            )
            .select_related("submission", "multiple_choice", "question")
            .prefetch_related("question__committees", "question__multiple_choice")
            .first()
        )

        if response is None:
            return Response([])
        else:
            return Response(ApplicationQuestionResponseSerializer(response).data)

    def get_serializer_class(self):
        if self.action in {"list"}:
            return MinimalUserProfileSerializer
        return UserProfileSerializer


class ClubApplicationViewSet(viewsets.ModelViewSet):
    """
    create: Create an application for the club.

    list: Retrieve a list of applications of the club.

    retrieve: Retrieve information about a single application

    current: Retrieve a list of active applications of the club.

    send_emails: Send out acceptance/rejection emails
    """

    permission_classes = [ClubItemPermission | IsSuperuser]
    serializer_class = ClubApplicationSerializer
    http_method_names = ["get", "post", "put", "patch", "delete"]

    def destroy(self, *args, **kwargs):
        """
        Invalidate cache before deleting
        """
        app = self.get_object()
        key = f"clubapplication:{app.id}"
        cache.delete(key)
        return super().destroy(*args, **kwargs)

    def update(self, *args, **kwargs):
        """
        Invalidate cache before updating
        """
        app = self.get_object()
        key = f"clubapplication:{app.id}"
        cache.delete(key)
        return super().update(*args, **kwargs)

    def retrieve(self, *args, **kwargs):
        """
        Cache responses for one hour. This is what people
        see when viewing an individual club's application
        """

        pk = self.kwargs["pk"]
        key = f"clubapplication:{pk}"
        cached = cache.get(key)
        if cached:
            return Response(cached)
        app = self.get_object()
        data = ClubApplicationSerializer(app).data
        cache.set(key, data, 60 * 60)
        return Response(data)

    @action(detail=True, methods=["post"])
    def send_emails(self, *args, **kwargs):
        """
        Send out acceptance/rejection emails for a particular application

        Dry run will validate that all emails have nonempty variables

        Allow resend will renotify submissions that have already been emailed
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            allow_resend:
                                type: boolean
                            dry_run:
                                type: boolean
                            email_type:
                                type: object
                                properties:
                                    id:
                                        type: string
                                    name:
                                        type: string
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string

        ---

        """

        app = self.get_object()

        # Query for recent submissions with user and committee joined
        submissions = ApplicationSubmission.objects.filter(
            application=app
        ).select_related("user", "committee")

        dry_run = self.request.data.get("dry_run")

        if not dry_run:
            # Invalidate submission viewset cache
            key = f"applicationsubmissions:{app.id}"
            cache.delete(key)

        email_type = self.request.data.get("email_type")["id"]

        subject = f"Application Update for {app.name}"
        n, skip = 0, collections.defaultdict(int)

        allow_resend = self.request.data.get("allow_resend")

        acceptance_template = Template(app.acceptance_email)
        rejection_template = Template(app.rejection_email)

        mass_emails = []
        invitee_emails = []
        for submission in submissions:
            if not allow_resend and submission.notified:
                skip["already_notified"] += 1
                continue
            elif submission.status == ApplicationSubmission.PENDING:
                skip["pending"] += 1
                continue
            elif not (submission.reason and submission.user.email):
                skip["no_reason"] += 1
                continue
            elif (
                submission.status == ApplicationSubmission.ACCEPTED
                and email_type == "acceptance"
            ):
                template = acceptance_template
                invitee_emails.append(submission.user.email)

            elif (
                email_type == "rejection"
                and submission.status != ApplicationSubmission.ACCEPTED
            ):
                template = rejection_template
            else:
                continue

            data = {
                "reason": submission.reason,
                "name": submission.user.first_name or "",
                "committee": submission.committee.name if submission.committee else "",
            }

            html_content = template.render(data)
            text_content = html_to_text(html_content)

            contact_email = app.club.email

            msg = EmailMultiAlternatives(
                subject,
                text_content,
                settings.FROM_EMAIL,
                [submission.user.email],
                reply_to=[contact_email],
            )
            msg.attach_alternative(html_content, "text/html")
            mass_emails.append(msg)

            if not dry_run:
                submission.notified = True
            n += 1

        if not dry_run:
            with mail.get_connection() as conn:
                conn.send_messages(mass_emails)
            ApplicationSubmission.objects.bulk_update(submissions, ["notified"])

            # Send out membership invites after sending acceptance emails
            expiry_time = timezone.now() + datetime.timedelta(days=5)
            invites = [
                MembershipInvite(
                    creator=self.request.user,
                    club=app.club,
                    email=email,
                    # programmatically generated invites should expire after some time
                    expires_at=expiry_time,
                )
                for email in invitee_emails
            ]

            # Create all the membership invitations in the database
            MembershipInvite.objects.bulk_create(invites)

            for invite in invites:
                invite.send_mail(self.request)

        dry_run_msg = "Would have sent" if dry_run else "Sent"
        skip_msg = []
        if skip["already_notified"]:
            skip_msg.append(f" {skip['already_notified']} already notified")
        if skip["pending"]:
            skip_msg.append(f" {skip['pending']} still marked as pending")
        if skip["no_reason"]:
            skip_msg.append(f" {skip['no_reason']} have no reason provided")
        return Response(
            {
                "detail": f"{dry_run_msg} emails to {n} people"
                f"{(': ' + ', '.join(skip_msg)) if len(skip_msg) > 0 else ''}",
            }
        )

    @action(detail=False, methods=["get"])
    def current(self, *args, **kwargs):
        """
        Return the ongoing application(s) for this club
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            allOf:
                                - $ref: "#/components/schemas/ClubApplication"
        ---
        """
        qs = self.get_queryset().prefetch_related("extensions")
        now = timezone.now()
        user = self.request.user
        q = Q(application_end_time__gte=now)
        if user.is_authenticated:
            q |= Q(extensions__end_time__gte=now, extensions__user=user)

        return Response(ClubApplicationSerializer(qs.filter(q), many=True).data)

    @action(detail=True, methods=["post"])
    def duplicate(self, *args, **kwargs):
        """
        Duplicate an application, setting the start and end time arbitrarily.
        ---
        requestBody: {}
        responses:
            "200":
                content: {}
        ---
        """
        obj = self.get_object()

        clone = obj.make_clone()

        now = timezone.now()
        clone.application_start_time = now + datetime.timedelta(days=1)
        clone.application_end_time = now + datetime.timedelta(days=30)
        clone.result_release_time = now + datetime.timedelta(days=40)
        clone.external_url = (
            f"https://pennclubs.com/club/{clone.club.code}/application/{clone.pk}"
        )
        # django-clone may create duplicate committees with "copy 1"
        # suffixes due to double-cloning (app O2M + question M2M),
        # so normalize them
        clone.normalize_committees()
        clone.save()
        return Response([])

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            if "club_code" in self.kwargs:
                club = (
                    Club.objects.filter(code=self.kwargs["club_code"])
                    .prefetch_related("badges")
                    .first()
                )
                if club and club.is_wharton:
                    return ManagedClubApplicationSerializer
            return WritableClubApplicationSerializer
        return ClubApplicationSerializer

    def get_queryset(self):
        return (
            ClubApplication.objects.filter(
                club__code=self.kwargs["club_code"],
            )
            .select_related("application_cycle", "club")
            .prefetch_related(
                "questions__multiple_choice",
                "questions__committees",
                "committees",
            )
        )


class WhartonCyclesView(viewsets.ModelViewSet):
    """
    get: Return information about all Wharton Council application cycles
    patch: Update application cycle and WC applications with cycle
    clubs: list clubs with cycle
    add_clubs: add clubs to cycle
    applications: list application submissions for cycle
    remove_clubs_from_all: remove clubs from all cycles
    """

    permission_classes = [WhartonApplicationPermission | IsSuperuser]
    # Designed to support partial updates, but ModelForm sends all fields here
    http_method_names = ["get", "post", "patch", "delete"]
    serializer_class = ApplicationCycleSerializer

    def get_queryset(self):
        return ApplicationCycle.objects.all().order_by("end_date")

    def update(self, *args, **kwargs):
        """
        Updates times for all applications with cycle
        """
        applications = ClubApplication.objects.filter(
            application_cycle=self.get_object()
        )
        str_start_date = self.request.data.get("start_date").replace("T", " ")
        str_end_date = self.request.data.get("end_date").replace("T", " ")
        str_release_date = self.request.data.get("release_date").replace("T", " ")
        time_format = "%Y-%m-%d %H:%M:%S%z"
        start = (
            datetime.datetime.strptime(str_start_date, time_format)
            if str_start_date
            else self.get_object().start_date
        )
        end = (
            datetime.datetime.strptime(str_end_date, time_format)
            if str_end_date
            else self.get_object().end_date
        )
        release = (
            datetime.datetime.strptime(str_release_date, time_format)
            if str_release_date
            else self.get_object().release_date
        )
        for app in applications:
            app.application_start_time = start
            if app.application_end_time_exception:
                continue
            app.application_end_time = end
            app.result_release_time = release
        f = ["application_start_time", "application_end_time", "result_release_time"]
        ClubApplication.objects.bulk_update(applications, f)
        return super().update(*args, **kwargs)

    @action(detail=True, methods=["GET"])
    def get_clubs(self, *args, **kwargs):
        """
        Retrieve clubs associated with given cycle
        ---
        requestBody:
            content: {}
        responses:
            "200":
                content: {}
        ---
        """
        cycle = self.get_object()

        return Response(
            ClubApplication.objects.filter(application_cycle=cycle)
            .select_related("club")
            .values("club__name", "club__code")
        )

    @action(detail=True, methods=["PATCH"])
    def edit_clubs(self, *args, **kwargs):
        """
        Edit clubs associated with given cycle
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            clubs:
                                type: array
                                items:
                                    type: string
        responses:
            "200":
                content: {}
        ---

        """
        cycle = self.get_object()
        club_codes = self.request.data.get("clubs")
        start = cycle.start_date
        end = cycle.end_date
        release = cycle.release_date

        # Remove cycle for club applications from non-included clubs
        ClubApplication.objects.filter(application_cycle=cycle).exclude(
            club__code__in=club_codes
        ).update(application_cycle=None)

        # Some apps need to be created - use the default Wharton Template
        prompt_one = (
            "Tell us about a time you took initiative or demonstrated leadership"
        )
        prompt_two = "Tell us about a time you faced a challenge and how you solved it"
        prompt_three = "Tell us about a time you collaborated well in a team"
        created_apps_clubs = (
            ClubApplication.objects.filter(
                application_cycle=cycle, club__code__in=club_codes
            )
            .select_related("club")
            .values_list("club__code", flat=True)
        )
        creation_pending_clubs = Club.objects.filter(
            code__in=set(club_codes) - set(created_apps_clubs)
        )

        for club in creation_pending_clubs:
            name = f"{club.name} Application"
            most_recent = (
                ClubApplication.objects.filter(club=club)
                .order_by("-created_at")
                .first()
            )

            if most_recent:
                # If an application for this club exists, clone it
                application = most_recent.make_clone()
                application.application_start_time = start
                application.application_end_time = end
                application.result_release_time = release
                application.application_cycle = cycle
                application.is_wharton_council = True
                application.external_url = (
                    f"https://pennclubs.com/club/{club.code}/"
                    f"application/{application.pk}"
                )
                # django-clone may create duplicate committees with "copy 1"
                # suffixes due to double-cloning (app O2M + question M2M),
                # so normalize them
                application.normalize_committees()
                application.save()
            else:
                # Otherwise, start afresh
                application = ClubApplication.objects.create(
                    name=name,
                    club=club,
                    application_start_time=start,
                    application_end_time=end,
                    result_release_time=release,
                    application_cycle=cycle,
                    is_wharton_council=True,
                )
                external_url = (
                    f"https://pennclubs.com/club/{club.code}/"
                    f"application/{application.pk}"
                )
                application.external_url = external_url
                application.save()
                prompt = (
                    "Choose one of the following prompts for your personal statement"
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

        return Response([])

    @action(detail=False, methods=["post"])
    def add_clubs_to_exception(self, *args, **kwargs):
        """
        Exempt selected clubs from application cycle deadline
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            clubs:
                                type: array
                                items:
                                    type: object
                                    properties:
                                        id:
                                            type: integer
                                        application_end_time:
                                            type: string
        responses:
            "200":
                content: {}
        ---
        """
        clubs = self.request.data.get("clubs")
        apps = []
        for club in clubs:
            app = ClubApplication.objects.get(pk=club["id"])
            apps.append(app)
            app.application_end_time = club["end_date"]
            app.application_end_time_exception = True
        ClubApplication.objects.bulk_update(
            apps,
            ["application_end_time", "application_end_time_exception"],
        )
        return Response([])

    @action(detail=False, methods=["post"])
    def remove_clubs_from_exception(self, *args, **kwargs):
        """
        Remove selected clubs from application cycle deadline exemption
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            clubs:
                                type: array
                                items:
                                    type: string
        responses:
            "200":
                content: {}
        ---
        """
        club_ids = self.request.data.get("clubs", [])
        apps = ClubApplication.objects.filter(pk__in=club_ids)
        for app in apps:
            app.application_end_time_exception = False
            app.application_end_time = app.application_cycle.end_date
        ClubApplication.objects.bulk_update(
            apps,
            ["application_end_time", "application_end_time_exception"],
        )
        return Response([])

    @action(detail=True, methods=["GET"])
    def club_applications(self, *args, **kwargs):
        """
        Retrieve club applications for given cycle
        ---
        requestBody:
            content: {}
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: object
                                properties:
                                    name:
                                        type: string
                                    id:
                                        type: integer
                                    application_end_time:
                                        type: string
                                        format: date-time
                                    application_end_time_exception:
                                        type: string
                                    club__name:
                                        type: string
                                    club__code:
                                        type: string
        ---
        """
        cycle = self.get_object()

        return Response(
            ClubApplication.objects.filter(application_cycle=cycle)
            .select_related("club")
            .values(
                "name",
                "id",
                "application_end_time",
                "application_end_time_exception",
                "club__name",
                "club__code",
            )
        )

    @action(detail=True, methods=["GET"])
    def applications(self, *args, **kwargs):
        """
        Retrieve applications for given cycle
        ---
        requestBody: {}
        responses:
            "200":
                content:
                    text/csv:
                        schema:
                            type: string
        ---
        """
        cycle = self.get_object()
        data = (
            ApplicationSubmission.objects.filter(
                Q(application__is_wharton_council=True)
                | Q(application__club__name__icontains="Wharton"),
                application__application_cycle=cycle,
            )
            .select_related(
                "user__profile", "application", "application__application_cycle"
            )
            .annotate(
                annotated_name=F("application__name"),
                annotated_committee=F("committee__name"),
                annotated_club=F("application__club__name"),
                annotated_grad_year=F("user__profile__graduation_year"),
                annotated_school=F("user__profile__school__name"),
                annotated_wc=F("application__is_wharton_council"),
                status_name=Case(
                    When(status=1, then=Value("Pending")),
                    When(status=2, then=Value("Rejected after written application")),
                    When(status=3, then=Value("Rejected after interview(s)")),
                    When(status=4, then=Value("Accepted")),
                    default=Value("Unknown"),
                    output_field=CharField(),
                ),
            )
            .values(
                "annotated_name",
                "application",
                "annotated_committee",
                "annotated_club",
                "annotated_grad_year",
                "annotated_school",
                "annotated_wc",
                "status_name",
                "user",
            )
        )
        df = pd.DataFrame(data)
        resp = HttpResponse(
            content_type="text/csv",
            headers={"Content-Disposition": "attachment;filename=submissions.csv"},
        )
        df.to_csv(index=True, path_or_buf=resp)
        return resp


class WhartonApplicationAPIView(viewsets.ModelViewSet):
    """
    list: Return information about all Wharton Council club applications which are
    currently on going
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ClubApplicationSerializer

    def get_operation_id(self, **kwargs):
        return f"{kwargs['operId']} Wharton Application"

    def get_queryset(self):
        now = timezone.now()

        qs = (
            ClubApplication.objects.filter(
                is_wharton_council=True,
                application_start_time__lte=now,
                application_end_time__gte=now,
            )
            .select_related("club")
            .prefetch_related(
                "committees", "questions__multiple_choice", "questions__committees"
            )
        )

        # Order applications randomly for viewing (consistent and unique per user).
        key = str(self.request.user.id)
        qs = qs.annotate(
            random=SHA1(Concat("name", Value(key), output_field=TextField()))
        ).order_by("random")
        return qs

    @method_decorator(cache_page(60 * 20))
    @method_decorator(vary_on_cookie)
    def list(self, *args, **kwargs):
        """
        Cache responses for 20 minutes. Vary cache by user.
        """
        return super().list(*args, **kwargs)


class WhartonApplicationStatusAPIView(generics.ListAPIView):
    """
    get: Return aggregate status for Wharton application submissions
    """

    permission_class = [WhartonApplicationPermission | IsSuperuser]
    serializer_class = WhartonApplicationStatusSerializer

    def get_operation_id(self, **kwargs):
        return "List statuses for Wharton application submissions"

    def get_queryset(self):
        return (
            ApplicationSubmission.objects.filter(application__is_wharton_council=True)
            .annotate(
                annotated_name=F("application__name"),
                annotated_committee=F("committee__name"),
                annotated_club=F("application__club__name"),
            )
            .values(
                "annotated_name",
                "application",
                "annotated_committee",
                "annotated_club",
                "status",
            )
            .annotate(count=Count("status"))
        )


class ApplicationExtensionViewSet(viewsets.ModelViewSet):
    permission_classes = [ClubSensitiveItemPermission | IsSuperuser]
    serializer_class = ApplicationExtensionSerializer

    def get_queryset(self):
        return ApplicationExtension.objects.filter(
            application__pk=self.kwargs["application_pk"]
        )


class ApplicationSubmissionViewSet(viewsets.ModelViewSet):
    """
    list: List submissions for a given club application.

    status: Changes status of a submission

    export: export applications
    """

    permission_classes = [ClubSensitiveItemPermission | IsSuperuser]
    http_method_names = ["get", "post"]

    def get_queryset(self):
        app_id = self.kwargs["application_pk"]
        submissions = (
            ApplicationSubmission.objects.filter(application=app_id)
            .select_related("user__profile", "committee", "application__club")
            .prefetch_related(
                Prefetch(
                    "responses",
                    queryset=ApplicationQuestionResponse.objects.select_related(
                        "multiple_choice", "question"
                    ),
                ),
                "responses__question__committees",
                "responses__question__multiple_choice",
            )
        )
        return submissions

    def list(self, *args, **kwargs):
        """
        Manually cache responses (to support invalidation)
        Responses are invalidated on status / reason updates and email sending
        """

        app_id = self.kwargs["application_pk"]
        key = f"applicationsubmissions:{app_id}"

        cached = cache.get(key)
        if cached is not None:
            return Response(cached)
        else:
            serializer = self.get_serializer_class()
            qs = self.get_queryset()
            data = serializer(qs, many=True).data
            cache.set(key, data, 60 * 60)

        return Response(data)

    @action(detail=False, methods=["get"])
    def export(self, *args, **kwargs):
        """
        Given some application submissions, export them to CSV.

        Cached for 2 hours.
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            submissions:
                                type: array
                                items:
                                    type: integer
                            status:
                                type: integer
        responses:
            "200":
                content:
                    text/csv:
                        schema:
                            type: string
        ---
        """
        app_id = int(self.kwargs["application_pk"])
        data = (
            ApplicationSubmission.objects.filter(application=app_id)
            .select_related("user__profile", "committee", "application__club")
            .prefetch_related(
                Prefetch(
                    "responses",
                    queryset=ApplicationQuestionResponse.objects.select_related(
                        "multiple_choice", "question"
                    ),
                ),
                "responses__question__committees",
                "responses__question__multiple_choice",
            )
        )
        df = pd.DataFrame(ApplicationSubmissionCSVSerializer(data, many=True).data)
        resp = HttpResponse(
            content_type="text/csv; charset=utf-8-sig",  # support special chars
            headers={"Content-Disposition": "attachment;filename=submissions.csv"},
        )
        df.to_csv(index=True, path_or_buf=resp, encoding="utf-8-sig")
        return resp

    @action(detail=False, methods=["get"])
    def exportall(self, *args, **kwargs):
        """
        Export all application submissions for a particular cycle
        ---
        requestBody: {}
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                output:
                                    type: string
        ---
        """

        app_id = int(self.kwargs["application_pk"])
        cycle = ClubApplication.objects.get(id=app_id).application_cycle
        data = (
            ApplicationSubmission.objects.filter(
                application__is_wharton_council=True,
                application__application_cycle=cycle,
            )
            .select_related("application", "application__application_cycle")
            .annotate(
                annotated_name=F("application__name"),
                annotated_committee=F("committee__name"),
                annotated_club=F("application__club__name"),
            )
            .values(
                "annotated_name",
                "application",
                "annotated_committee",
                "annotated_club",
                "status",
                "user",
            )
        )
        serialized_q = json.dumps(list(data.values()), cls=DjangoJSONEncoder)
        return Response(serialized_q)

    @action(detail=False, methods=["post"])
    def status(self, *args, **kwargs):
        """
        Given some application submissions, change their status to a new one
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            submissions:
                                type: array
                                items:
                                    type: integer
                            status:
                                type: integer
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string

        ---
        """
        submission_pks = self.request.data.get("submissions", [])
        status = self.request.data.get("status", None)
        if (
            status in map(lambda x: x[0], ApplicationSubmission.STATUS_TYPES)
            and len(submission_pks) > 0
        ):
            # Invalidate submission viewset cache
            submissions = ApplicationSubmission.objects.filter(pk__in=submission_pks)
            app_id = submissions.first().application.id if submissions.first() else None
            if not app_id:
                return Response({"detail": "No submissions found"})
            key = f"applicationsubmissions:{app_id}"
            cache.delete(key)

            submissions.update(status=status)

            return Response(
                {
                    "detail": f"Successfully updated submissions' {submission_pks}"
                    f"status {status}"
                }
            )
        else:
            return Response({"detail": "Invalid request"})

    @action(detail=False, methods=["post"])
    def reason(self, *args, **kwargs):
        """
        Given some application submissions, update their acceptance/rejection
        reasons
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            submissions:
                                type: array
                                items:
                                    type: object
                                    properties:
                                        id:
                                            type: integer
                                        reason:
                                            type: string

        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                detail:
                                    type: string

        ---
        """
        submissions = self.request.data.get("submissions", [])
        pks = list(map(lambda x: x["id"], submissions))
        reasons = list(map(lambda x: x["reason"], submissions))

        submission_objs = ApplicationSubmission.objects.filter(pk__in=pks)

        # Invalidate submission viewset cache
        app_id = (
            submission_objs.first().application.id if submission_objs.first() else None
        )
        if not app_id:
            return Response({"detail": "No submissions found"})
        key = f"applicationsubmissions:{app_id}"
        cache.delete(key)

        for idx, pk in enumerate(pks):
            obj = submission_objs.filter(pk=pk).first()
            if obj:
                obj.reason = reasons[idx]
                obj.save()
            else:
                return Response({"detail": "Object not found"})

        return Response({"detail": "Successfully updated submissions' reasons"})

    def get_serializer_class(self):
        if self.request and self.request.query_params.get("format") == "xlsx":
            return ApplicationSubmissionCSVSerializer
        else:
            return ApplicationSubmissionSerializer


class ApplicationSubmissionUserViewSet(viewsets.ModelViewSet):
    """
    get: Return list of submitted applications

    delete: Remove a specific application
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ApplicationSubmissionUserSerializer
    http_method_names = ["get", "delete"]

    def get_queryset(self):
        submissions = (
            ApplicationSubmission.objects.filter(user=self.request.user)
            .select_related("user__profile", "committee", "application__club")
            .prefetch_related(
                Prefetch(
                    "responses",
                    queryset=ApplicationQuestionResponse.objects.select_related(
                        "multiple_choice", "question"
                    ),
                ),
                "responses__question__committees",
                "responses__question__multiple_choice",
            )
        )
        return submissions


class ApplicationQuestionViewSet(viewsets.ModelViewSet):
    """
    create: Create a question for a club application.

    list: List questions in a given club application.
    """

    permission_classes = [ClubItemPermission | IsSuperuser]
    serializer_class = ApplicationQuestionSerializer
    http_method_names = ["get", "post", "put", "patch", "delete"]

    def get_queryset(self):
        return ApplicationQuestion.objects.filter(
            application__pk=self.kwargs["application_pk"]
        ).order_by("precedence")

    def destroy(self, *args, **kwargs):
        """
        Invalidate caches before destroying
        """
        app_id = self.kwargs["application_pk"]
        key1 = f"applicationquestion:{app_id}"
        key2 = f"clubapplication:{app_id}"
        cache.delete(key1)
        cache.delete(key2)
        return super().destroy(*args, **kwargs)

    def create(self, *args, **kwargs):
        """
        Invalidate caches before creating
        """
        app_id = self.kwargs["application_pk"]
        key1 = f"applicationquestion:{app_id}"
        key2 = f"clubapplication:{app_id}"
        cache.delete(key1)
        cache.delete(key2)
        return super().create(*args, **kwargs)

    def update(self, *args, **kwargs):
        """
        Invalidate caches before updating
        """
        app_id = self.kwargs["application_pk"]
        key1 = f"applicationquestion:{app_id}"
        key2 = f"clubapplication:{app_id}"
        cache.delete(key1)
        cache.delete(key2)
        return super().update(*args, **kwargs)

    def list(self, *args, **kwargs):
        """
        Manually cache responses for one hour
        """

        app_id = self.kwargs["application_pk"]
        key = f"applicationquestion:{app_id}"
        cached = cache.get(key)
        if cached:
            return Response(cached)

        data = ApplicationQuestionSerializer(self.get_queryset(), many=True).data
        cache.set(key, data, 60 * 60)
        return Response(data)

    @action(detail=False, methods=["post"])
    def precedence(self, *args, **kwargs):
        """
        Updates the precedence of questions so they are ordered the same way as
        arranged by the officer creating the application after they drag and drop
        the different questions to re-order them
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: array
                        items:
                            type: integer
        responses:
            "200":
                content: {}
        ---
        """
        precedence = self.request.data.get("precedence", [])
        for index, question_pk in enumerate(precedence):
            question = ApplicationQuestion.objects.filter(pk=question_pk).first()
            if question is not None:
                question.precedence = index
                question.save()
        return Response([])


class BadgeClubViewSet(viewsets.ModelViewSet):
    """
    create: Add this badge to a club.

    list: List the clubs with this badge.

    destroy: Remove this badge from a club.
    """

    permission_classes = [ClubBadgePermission | IsSuperuser]
    serializer_class = ClubMinimalSerializer
    http_method_names = ["get", "post", "delete"]
    lookup_field = "code"

    def create(self, request, *args, **kwargs):
        badge = get_object_or_404(Badge, pk=self.kwargs["badge_pk"])
        club = get_object_or_404(Club, code=request.data["club"])
        club.badges.add(badge)
        return Response({"success": True})

    def destroy(self, request, *args, **kwargs):
        club = self.get_object()
        badge = get_object_or_404(Badge, pk=self.kwargs["badge_pk"])
        club.badges.remove(badge)
        return Response({"success": True})

    def get_queryset(self):
        return Club.objects.filter(badges__id=self.kwargs["badge_pk"]).order_by("name")


class MassInviteAPIView(APIView):
    """
    Send out invites and add invite objects
    given a list of comma or newline separated emails.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        club = get_object_or_404(Club, code=kwargs["club_code"])

        mem = Membership.objects.filter(club=club, person=request.user).first()

        if not request.user.has_perm("clubs.manage_club") and (
            not mem or not mem.role <= Membership.ROLE_OFFICER
        ):
            return Response(
                {
                    "detail": "You do not have permission to invite new members!",
                    "success": False,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        role = request.data.get("role", Membership.ROLE_MEMBER)
        title = request.data.get("title")

        if not title:
            return Response(
                {
                    "detail": "You must enter a title for the members "
                    "that you are inviting.",
                    "success": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if mem and mem.role > role and not request.user.is_superuser:
            return Response(
                {
                    "detail": "You cannot send invites "
                    "for a role higher than your own!",
                    "success": False,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        emails = [x.strip() for x in re.split(r"\n|,", request.data.get("emails", ""))]
        emails = [x for x in emails if x]

        original_count = len(emails)

        # remove users that are already in the club
        exist = Membership.objects.filter(
            club=club, person__email__in=emails
        ).values_list("person__email", flat=True)
        emails = list(set(emails) - set(exist))

        # remove users that have already been invited
        exist = MembershipInvite.objects.filter(
            club=club, email__in=emails, active=True
        ).values_list("email", flat=True)
        emails = list(set(emails) - set(exist))

        # ensure all emails are valid
        try:
            for email in emails:
                validate_email(email)
        except ValidationError:
            return Response(
                {
                    "detail": "The email address '{}' is not valid!".format(email),
                    "success": False,
                }
            )

        # send invites to all emails
        for email in emails:
            invite = MembershipInvite.objects.create(
                email=email, club=club, creator=request.user, role=role, title=title
            )
            if role <= Membership.ROLE_OWNER and not mem:
                invite.send_owner_invite(request)
            else:
                invite.send_mail(request)

        sent_emails = len(emails)
        skipped_emails = original_count - len(emails)

        return Response(
            {
                "detail": "Sent invite{} to {} email{}! {} email{} skipped.".format(
                    "" if sent_emails == 1 else "s",
                    sent_emails,
                    "" if sent_emails == 1 else "s",
                    skipped_emails,
                    "" if skipped_emails == 1 else "s",
                ),
                "sent": sent_emails,
                "skipped": skipped_emails,
                "success": True,
            }
        )


class EmailInvitesAPIView(generics.ListAPIView):
    """
    get: Return the club code, invite id and token of
    the email invitations for the current user.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = UserMembershipInviteSerializer

    def get_operation_id(self, **kwargs):
        return "List Email Invitations for Self"

    def get_queryset(self):
        return MembershipInvite.objects.filter(
            email=self.request.user.email, active=True, club__archived=False
        ).order_by("-created_at")


class OptionListView(APIView):
    def get(self, request):
        """
        Return a list of options, with some options dynamically generated.
        This response is intended for site-wide global variables.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            additionalProperties:
                                type: string
        ---
        """
        # compute base django options
        options = {
            k: v
            for k, v in Option.objects.filter(public=True).values_list("key", "value")
        }

        # add in activities fair information
        now = timezone.now()

        fairs = ClubFair.objects.filter(
            Q(start_time__lte=now + datetime.timedelta(weeks=1))
            | Q(registration_start_time__lte=now),
            end_time__gte=now - datetime.timedelta(minutes=15),
        ).order_by("start_time")

        fair = fairs.first()
        if fair:
            happening = fair.start_time <= now - datetime.timedelta(minutes=3)
            close = fair.start_time >= now - datetime.timedelta(weeks=1)
            options["FAIR_NAME"] = fair.name
            options["FAIR_CONTACT"] = fair.contact
            options["FAIR_ID"] = fair.id
            options["FAIR_OPEN"] = happening
            options["FAIR_VIRTUAL"] = fair.virtual
            options["PRE_FAIR"] = not happening and close
        else:
            options["FAIR_OPEN"] = False
            options["PRE_FAIR"] = False

        return Response(options)


class LoggingArgumentParser(argparse.ArgumentParser):
    """
    An argument parser that logs added arguments.
    """

    def __init__(self, *args, **kwargs):
        self._arguments = {}
        self._pos_count = 0
        super().__init__(*args, **kwargs)

    def add_argument(self, *args, **kwargs):
        super().add_argument(*args, **kwargs)

        if kwargs.get("default") == "==SUPPRESS==":
            return

        name = kwargs.get("dest", args[0].strip(" -").replace("-", "_"))
        default = kwargs.get("default")
        typ = kwargs.get(
            "type",
            (
                bool
                if kwargs.get("action") == "store_true"
                else type(default)
                if default is not None
                else str
            ),
        )
        pos = -1
        if not args[0].startswith("-"):
            pos = self._pos_count
            self._pos_count += 1
        self._arguments[name] = {
            "position": pos,
            "type": typ.__name__ if typ is not None else typ,
            "help": re.sub(r"\s+", " ", kwargs.get("help", "")) or None,
            "default": default,
            "choices": kwargs.get("choices"),
        }

    def set_defaults(self, *args, **kwargs):
        super().set_defaults(*args, **kwargs)
        for arg, value in kwargs.items():
            if arg in self._arguments:
                self._arguments[arg]["default"] = value

    def get_arguments(self):
        return self._arguments


@functools.lru_cache(maxsize=None)
def get_scripts():
    """
    Return a list of Django management commands and some associated metadata.
    """
    commands = get_commands()
    scripts = []
    for name, path in commands.items():
        cls = load_command_class(path, name)
        parser = LoggingArgumentParser()
        cls.add_arguments(parser)
        scripts.append(
            {
                "name": name,
                "path": path,
                "description": re.sub(r"\s+", " ", cls.help),
                "execute": hasattr(cls, "web_execute") and cls.web_execute,
                "arguments": parser.get_arguments(),
            }
        )
    scripts.sort(key=lambda s: (not s["execute"], s["name"]))
    return scripts


def parse_script_parameters(script, parameters):
    """
    Turn a list of user specified parameters into a set of args and kwargs that can
    be passed to call_command(), given the corresponding script.

    Use the script that is returned from get_scripts().
    """
    args = []
    kwargs = {}
    for arg, details in script["arguments"].items():
        if parameters.get(arg) is not None:
            value = {"str": str, "bool": bool, "int": int}.get(details["type"], str)(
                parameters[arg]
            )
            if details["position"] == -1:
                kwargs[arg] = value
            else:
                args.append((details["position"], value))
    args = [arg[1] for arg in sorted(args)]
    return args, kwargs


class AdminNoteViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of admin notes.

    create:
    Add an admin note.

    put:
    Update an admin note. All fields are required.

    patch:
    Update an admin note. Only specified fields are updated.

    retrieve:
    Return a single admin note.

    destroy:
    Delete an admin note.
    """

    serializer_class = AdminNoteSerializer
    permission_classes = [IsSuperuser]
    lookup_field = "id"
    http_method_names = ["get", "post", "put", "patch", "delete"]

    def get_queryset(self):
        return AdminNote.objects.filter(
            club__code=self.kwargs.get("club_code")
        ).order_by("-created_at")


class ClubApprovalResponseTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = ClubApprovalResponseTemplateSerializer
    permission_classes = [IsSuperuser]
    lookup_field = "id"

    def get_queryset(self):
        return ClubApprovalResponseTemplate.objects.all().order_by("-created_at")


class ScriptExecutionView(APIView):
    """
    View and execute Django management scripts using these endpoints.
    """

    permission_classes = [DjangoPermission("clubs.manage_club") | IsSuperuser]

    def get(self, request):
        """
        Return a list of valid management scripts to execute.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: object
                                properties:
                                    name:
                                        type: string
                                    path:
                                        type: string
                                    description:
                                        type: string
                                    execute:
                                        type: boolean
                                    arguments:
                                        type: object
                                        additionalProperties:
                                            type: object
                                            properties:
                                                type:
                                                    type: string
                                                help:
                                                    type: string
                                                position:
                                                    type: integer
                                                default:
                                                    type: string
                                                choices:
                                                    type: array
                                                    items:
                                                        type: string
                                                    nullable: true
        ---
        """
        scripts = get_scripts()
        return Response(scripts)

    def post(self, request):
        """
        Execute a management script.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                output:
                                    type: string
        ---
        """
        action = request.data.get("action")
        parameters = request.data.get("parameters", {})
        scripts = get_scripts()
        script = next((s for s in scripts if s["name"] == action), None)

        # check for validity and permission
        if script is None:
            return Response({"output": f"'{action}' is not a valid script to execute."})
        if not script["execute"]:
            return Response(
                {
                    "output": "You are not allowed to "
                    f"execute '{action}' from the web interface."
                }
            )

        args, kwargs = parse_script_parameters(script, parameters)

        # execute command and return output
        with io.StringIO() as output:
            call_command(action, *args, **kwargs, stdout=output, stderr=output)
            return Response({"output": output.getvalue()})


class HealthView(APIView):
    def get(self, request):
        """
        Health check endpoint to confirm the backend is running.
        ---
        summary: Health Check
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                message:
                                    type: string
                                    enum: ["OK"]
        ---
        """
        return Response({"message": "OK"}, status=status.HTTP_200_OK)


def get_initial_context_from_types(types):
    """
    Generate a sample context given the specified types.
    """
    # handle edge case where user explicitly says there are no types
    if isinstance(types, str) and types == "None":
        return {}

    # this allows for tuples to work properly
    context = collections.OrderedDict()

    for name, value in types.items():
        is_array = value["type"] == "array"
        if is_array:
            value = value["items"]

        if value["type"] == "string":
            context[name] = value.get("default", f"[{name}]")
        elif value["type"] == "number":
            context[name] = int(value.get("default", 0))
        elif value["type"] == "boolean":
            context[name] = bool(value.get("default", False))
        elif value["type"] == "object":
            context[name] = get_initial_context_from_types(value["properties"])
        elif value["type"] == "tuple":
            context[name] = tuple(
                get_initial_context_from_types(value["properties"]).values()
            )
        else:
            raise ValueError(f"Unknown email variable type '{value['type']}'!")

        # if is array, duplicate value three times as a sample
        if is_array:
            context[name] = [context[name]] * 3

    return context


def email_preview(request):
    """
    Debug endpoint used for previewing how email templates will look.
    """
    prefix = "fyh_emails" if settings.BRANDING == "fyh" else "emails"
    email_templates = os.listdir(os.path.join(settings.BASE_DIR, "templates", prefix))
    email_templates = [
        e.rsplit(".", 1)[0] for e in email_templates if e.endswith(".html")
    ]

    email = None
    text_email = None
    initial_context = {}
    template_error = False

    if "email" in request.GET:
        email_path = os.path.basename(request.GET.get("email"))

        # initial values
        try:
            types = get_mail_type_annotation(email_path)
            if types is not None:
                initial_context = get_initial_context_from_types(types)
        except (FileNotFoundError, OSError):
            # Template file doesn't exist, continue with empty context
            types = None

        # set specified values
        variables = request.GET.get("variables")
        if variables is not None:
            initial_context.update(json.loads(variables))

        try:
            email = render_to_string(f"{prefix}/{email_path}.html", initial_context)
            text_email = html_to_text(email)
        except TemplateDoesNotExist:
            template_error = True
            email = (
                f'<div style="color: red; padding: 20px; border: 1px solid red; '
                f'background-color: #ffe6e6; border-radius: 4px;">'
                f"<strong>Template Not Found:</strong><br>"
                f'The email template "{email_path}.html" does not exist in the '
                f"{prefix} directory.<br><br>Please check that the template file "
                f"exists and try again.</div>"
            )
            text_email = (
                f"Template Not Found: The email template '{email_path}.html' "
                f"does not exist in the {prefix} directory."
            )

    return render(
        request,
        "preview.html",
        {
            "templates": email_templates,
            "email": email,
            "text_email": text_email,
            "variables": json.dumps(initial_context, indent=4),
            "template_error": template_error,
        },
    )


class RegistrationQueueSettingsView(APIView):
    """
    View to get and update registration queue settings.
    Only superusers can update settings.
    """

    def get_permissions(self):
        """
        Allow any authenticated user to read settings,
        but only superusers can update them.
        """
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsSuperuser()]

    def get(self, request):
        """
        Return the current queue settings.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                reapproval_queue_open:
                                    type: boolean
                                new_approval_queue_open:
                                    type: boolean
                                updated_at:
                                    type: string
                                    format: date-time
                                updated_by:
                                    type: string
        ---
        """
        queue_setting = RegistrationQueueSettings.get()
        serializer = RegistrationQueueSettingsSerializer(queue_setting)
        return Response(serializer.data)

    def patch(self, request):
        """
        Update the queue settings.
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            reapproval_queue_open:
                                type: boolean
                            new_approval_queue_open:
                                type: boolean
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                reapproval_queue_open:
                                    type: boolean
                                new_approval_queue_open:
                                    type: boolean
                                updated_at:
                                    type: string
                                    format: date-time
                                updated_by:
                                    type: string
            "400":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                error:
                                    type: string
        ---
        """
        queue_setting = RegistrationQueueSettings.get()
        serializer = RegistrationQueueSettingsSerializer(
            queue_setting, data=request.data, partial=True
        )

        if serializer.is_valid():
            queue_setting = serializer.save(updated_by=request.user)
            return Response(RegistrationQueueSettingsSerializer(queue_setting).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RankingWeightsView(APIView):
    """
    View to get and update ranking weights settings.
    Only superusers can read and update settings.
    """

    def get_permissions(self):
        """
        Only superusers can read and update ranking weights settings.
        """
        return [IsSuperuser()]

    def get(self, request):
        """
        Return the current ranking weights.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                inactive_penalty:
                                    type: number
                                favorites_per:
                                    type: number
                                tags_good:
                                    type: number
                                tags_many:
                                    type: number
                                officer_bonus:
                                    type: number
                                member_base:
                                    type: number
                                member_per:
                                    type: number
                                logo_bonus:
                                    type: number
                                subtitle_bad:
                                    type: number
                                subtitle_good:
                                    type: number
                                images_bonus:
                                    type: number
                                desc_short:
                                    type: number
                                desc_med:
                                    type: number
                                desc_long:
                                    type: number
                                fair_bonus:
                                    type: number
                                application_bonus:
                                    type: number
                                today_event_base:
                                    type: number
                                today_event_good:
                                    type: number
                                week_event_base:
                                    type: number
                                week_event_good:
                                    type: number
                                email_bonus:
                                    type: number
                                social_bonus:
                                    type: number
                                howto_penalty:
                                    type: number
                                outdated_penalty:
                                    type: number
                                testimonial_one:
                                    type: number
                                testimonial_three:
                                    type: number
                                random_scale:
                                    type: number
                                updated_at:
                                    type: string
                                    format: date-time
                                updated_by:
                                    type: string
        ---
        """
        ranking_weights = RankingWeights.get()
        serializer = RankingWeightsSerializer(ranking_weights)
        return Response(serializer.data)

    def patch(self, request):
        """
        Update the ranking weights.
        ---
        requestBody:
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            inactive_penalty:
                                type: number
                            favorites_per:
                                type: number
                            tags_good:
                                type: number
                            tags_many:
                                type: number
                            officer_bonus:
                                type: number
                            member_base:
                                type: number
                            member_per:
                                type: number
                            logo_bonus:
                                type: number
                            subtitle_bad:
                                type: number
                            subtitle_good:
                                type: number
                            images_bonus:
                                type: number
                            desc_short:
                                type: number
                            desc_med:
                                type: number
                            desc_long:
                                type: number
                            fair_bonus:
                                type: number
                            application_bonus:
                                type: number
                            today_event_base:
                                type: number
                            today_event_good:
                                type: number
                            week_event_base:
                                type: number
                            week_event_good:
                                type: number
                            email_bonus:
                                type: number
                            social_bonus:
                                type: number
                            howto_penalty:
                                type: number
                            outdated_penalty:
                                type: number
                            testimonial_one:
                                type: number
                            testimonial_three:
                                type: number
                            random_scale:
                                type: number
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                inactive_penalty:
                                    type: number
                                favorites_per:
                                    type: number
                                tags_good:
                                    type: number
                                tags_many:
                                    type: number
                                officer_bonus:
                                    type: number
                                member_base:
                                    type: number
                                member_per:
                                    type: number
                                logo_bonus:
                                    type: number
                                subtitle_bad:
                                    type: number
                                subtitle_good:
                                    type: number
                                images_bonus:
                                    type: number
                                desc_short:
                                    type: number
                                desc_med:
                                    type: number
                                desc_long:
                                    type: number
                                fair_bonus:
                                    type: number
                                application_bonus:
                                    type: number
                                today_event_base:
                                    type: number
                                today_event_good:
                                    type: number
                                week_event_base:
                                    type: number
                                week_event_good:
                                    type: number
                                email_bonus:
                                    type: number
                                social_bonus:
                                    type: number
                                howto_penalty:
                                    type: number
                                outdated_penalty:
                                    type: number
                                testimonial_one:
                                    type: number
                                testimonial_three:
                                    type: number
                                random_scale:
                                    type: number
                                updated_at:
                                    type: string
                                    format: date-time
                                updated_by:
                                    type: string
            "400":
                content:
                    application/json:
                        schema:
                            type: object
                            properties:
                                error:
                                    type: string
        ---
        """
        ranking_weights = RankingWeights.get()
        serializer = RankingWeightsSerializer(
            ranking_weights, data=request.data, partial=True
        )

        if serializer.is_valid():
            ranking_weights = serializer.save(updated_by=request.user)
            return Response(RankingWeightsSerializer(ranking_weights).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
