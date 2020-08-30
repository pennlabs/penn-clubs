import json
import os
import re

import qrcode
import requests
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile
from django.core.validators import validate_email
from django.db.models import Count, Prefetch, Q
from django.db.models.query import prefetch_related_objects
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import filters, generics, parsers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from social_django.utils import load_strategy

from clubs.filters import RandomOrderingFilter, RandomPageNumberPagination
from clubs.mixins import XLSXFormatterMixin
from clubs.models import (
    Asset,
    Badge,
    Club,
    Event,
    Favorite,
    Major,
    Membership,
    MembershipInvite,
    MembershipRequest,
    Note,
    QuestionAnswer,
    Report,
    School,
    Subscribe,
    Tag,
    Testimonial,
    Year,
)
from clubs.permissions import (
    AssetPermission,
    ClubItemPermission,
    ClubPermission,
    EventPermission,
    InvitePermission,
    IsSuperuser,
    MemberPermission,
    MembershipRequestPermission,
    NotePermission,
    QuestionAnswerPermission,
    ReadOnly,
)
from clubs.serializers import (
    AssetSerializer,
    AuthenticatedClubSerializer,
    AuthenticatedMembershipSerializer,
    BadgeSerializer,
    ClubListSerializer,
    ClubMinimalSerializer,
    ClubSerializer,
    EventSerializer,
    FavoriteSerializer,
    FavoriteWriteSerializer,
    MajorSerializer,
    MembershipInviteSerializer,
    MembershipRequestSerializer,
    MembershipSerializer,
    NoteSerializer,
    QuestionAnswerSerializer,
    ReportSerializer,
    SchoolSerializer,
    SubscribeSerializer,
    TagSerializer,
    TestimonialSerializer,
    UserMembershipRequestSerializer,
    UserMembershipSerializer,
    UserSerializer,
    UserSubscribeSerializer,
    UserSubscribeWriteSerializer,
    YearSerializer,
)
from clubs.utils import html_to_text


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
            {"detail": "No image file was uploaded!"}, status=status.HTTP_400_BAD_REQUEST
        )
    return Response({"detail": "Club file uploaded!", "id": asset.id})


def upload_endpoint_helper(request, cls, field, **kwargs):
    obj = get_object_or_404(cls, **kwargs)
    if "file" in request.data and isinstance(request.data["file"], UploadedFile):
        getattr(obj, field).delete(save=False)
        setattr(obj, field, request.data["file"])
        obj._change_reason = "Update '{}' image field".format(field)
        obj.save()
    else:
        return Response(
            {"detail": "No image file was uploaded!"}, status=status.HTTP_400_BAD_REQUEST
        )
    return Response({"detail": "{} image uploaded!".format(cls.__name__)})


def find_relationship_helper(relationship, club_object, found):
    """
    Format and retrieve all parents or children of a club into tree.
    """
    children = getattr(club_object, relationship).all().prefetch_related(relationship)
    children_recurse = []
    for child in children:
        if child.code not in found:
            found.add(child.code)
            children_recurse.append(find_relationship_helper(relationship, child, found))
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


class ReportViewSet(viewsets.ModelViewSet):
    """
    retrieve:
    Return a list of reports that can be generated.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ReportSerializer
    http_method_names = ["get", "delete"]

    def get_queryset(self):
        if not self.request.user.has_perm("clubs.generate_reports"):
            return Report.objects.none()

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

            if value in {"true", "yes"}:
                boolval = True
            elif value in {"false", "no"}:
                boolval = False
            elif value in {"null", "none"}:
                boolval = None

            if boolval is None:
                return {f"{field}__isnull": True}

            return {f"{field}": boolval}

        fields = {
            "founded": parse_year,
            "favorite_count": parse_int,
            "size": parse_int,
            "accepting_members": parse_boolean,
            "application_required": parse_int,
            "tags": parse_tags,
            "badges": parse_badges,
            "target_schools": parse_tags,
            "target_majors": parse_tags,
            "target_years": parse_tags,
            "active": parse_boolean,
            "approved": parse_boolean,
            "accepting_members": parse_boolean,
        }

        if not queryset.model == Club:
            fields = {f"club__{k}": v for k, v in fields.items()}

        if queryset.model == Event:
            fields.update({"type": parse_int})

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
                (field.name, field.verbose_name) for field in queryset.model._meta.fields
            ]
            valid_fields += [(key, key.title().split("__")) for key in queryset.query.annotations]
            valid_fields += [
                (f"club__{field.name}", f"Club - {field.verbose_name}")
                for field in Club._meta.fields
            ]
            return valid_fields

        # other people can order by whitelist
        return super().get_valid_fields(queryset, view, context)

    def filter_queryset(self, request, queryset, view):
        new_queryset = super().filter_queryset(request, queryset, view)
        ordering = request.GET.get("ordering", "").split(",")

        if "featured" in ordering:
            if queryset.model == Club:
                return queryset.order_by("-rank", "-favorite_count", "-id")
            return queryset.order_by("-club__rank", "-club__favorite_count", "-club__id")

        return new_queryset


class ClubViewSet(XLSXFormatterMixin, viewsets.ModelViewSet):
    """
    retrieve:
    Return a single club with all information fields present.

    list:
    Return a list of clubs with partial information for each club.

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
        Club.objects.all()
        .annotate(favorite_count=Count("favorite", distinct=True))
        .prefetch_related(
            "tags",
            "badges",
            "target_schools",
            "target_majors",
            "target_years",
            Prefetch(
                "membership_set",
                queryset=Membership.objects.order_by(
                    "role", "person__first_name", "person__last_name"
                ),
            ),
        )
        .order_by("-favorite_count", "name")
    )
    permission_classes = [ClubPermission | IsSuperuser]

    filter_backends = [filters.SearchFilter, ClubsSearchFilter, ClubsOrderingFilter]
    search_fields = ["name", "subtitle"]
    ordering_fields = ["favorite_count", "name"]
    ordering = "-favorite_count"

    lookup_field = "code"
    http_method_names = ["get", "post", "put", "patch", "delete"]
    pagination_class = RandomPageNumberPagination

    def get_queryset(self):
        queryset = super().get_queryset()

        # select subset of clubs if requested
        subset = self.request.query_params.get("in", None)
        if subset:
            subset = [x.strip() for x in subset.strip().split(",")]
            queryset = queryset.filter(code__in=subset)

        # filter by approved clubs
        if (
            self.request.user.has_perm("clubs.see_pending_clubs")
            or self.request.query_params.get("bypass", "").lower() == "true"
        ):
            return queryset
        elif self.request.user.is_authenticated:
            # Show approved clubs along with clubs that the logged-in user is a member of.
            return queryset.filter(Q(approved=True) | Q(members=self.request.user) | Q(ghost=True))
        else:
            return queryset.filter(Q(approved=True) | Q(ghost=True))

    @action(detail=True, methods=["post"])
    def upload(self, request, *args, **kwargs):
        """
        Upload the club logo.
        """
        # ensure user is allowed to upload image
        club = self.get_object()

        # reset approval status after upload
        resp = upload_endpoint_helper(request, Club, "image", code=club.code)
        if status.is_success(resp.status_code):
            club.approved = None
            club.approved_by = None
            club.approved_on = None
            if club.history.filter(approved=True).exists():
                club.ghost = True

            club.save(update_fields=["approved", "approved_by", "approved_on", "ghost"])
        return resp

    @action(detail=True, methods=["post"])
    def upload_file(self, request, *args, **kwargs):
        """
        Upload a file for the club.
        """
        # ensure user is allowed to upload file
        club = self.get_object()

        return file_upload_endpoint_helper(request, code=club.code)

    @action(detail=True, methods=["get"])
    def children(self, request, *args, **kwargs):
        """
        Return a recursive list of all children that this club is a parent of.
        """
        club = self.get_object()
        child_tree = find_relationship_helper("children_orgs", club, {club.code})
        return Response(child_tree)

    @action(detail=True, methods=["get"])
    def parents(self, request, *args, **kwargs):
        """
        Return a recursive list of all parents that this club is a child to.
        """
        club = self.get_object()
        parent_tree = find_relationship_helper("parent_orgs", club, {club.code})
        return Response(parent_tree)

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
        """
        club = self.get_object()
        serializer = SubscribeSerializer(Subscribe.objects.filter(club=club), many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def directory(self, request, *args, **kwargs):
        """
        Custom return endpoint for the directory page, allows the page to load faster.
        """
        serializer = ClubMinimalSerializer(Club.objects.all().order_by("name"), many=True)
        return Response(serializer.data)

    def get_filename(self):
        """
        For excel spreadsheets, return the user-specified filename if it exists
        or the default filename otherwise.
        """
        name = self.request.query_params.get("name")
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

    def partial_update(self, request, *args, **kwargs):
        self.check_approval_permission(request)
        return super().partial_update(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self.check_approval_permission(request)
        return super().update(request, *args, **kwargs)

    def list(self, request, *args, **kwargs):
        """
        Return a list of all clubs.
        Note that some fields are removed in order to improve response time.
        """
        # custom handling for spreadsheet format
        if request.accepted_renderer.format == "xlsx":
            # save request as new report if name is set
            if (
                request.user.is_authenticated
                and request.user.has_perm("clubs.generate_reports")
                and request.query_params.get("name")
                and not request.query_params.get("existing")
            ):
                name = request.query_params.get("name")
                desc = request.query_params.get("desc")
                public = request.query_params.get("public", "false").lower().strip() == "true"
                parameters = request.query_params.dict()

                # avoid storing redundant data
                for field in {"name", "desc", "public"}:
                    if field in parameters:
                        del parameters[field]

                Report.objects.create(
                    name=name,
                    description=desc,
                    parameters=json.dumps(parameters),
                    creator=request.user,
                    public=public,
                )

        return super().list(request, *args, **kwargs)

    def perform_destroy(self, instance):
        """
        Manually delete uploaded asset instances because of PostgreSQL integrity rules.
        """
        for asset in instance.asset_set.all():
            asset.delete()
        instance.delete()

    @action(detail=False, methods=["GET"])
    def fields(self, request, *args, **kwargs):
        """
        Return the list of fields that can be exported in the Excel file.
        """
        name_to_title = {
            f.name: f.verbose_name.title() for f in Club._meta._get_fields(reverse=False)
        }
        return Response(
            {
                name_to_title.get(f, f.replace("_", " ").title()): f
                for f in self.get_serializer_class().Meta.fields
            }
        )

    def get_serializer_class(self):
        if self.action == "upload":
            return AssetSerializer
        if self.action == "subscription":
            return SubscribeSerializer
        if self.action in {"list", "fields"}:
            if self.request is not None and (
                self.request.accepted_renderer.format == "xlsx" or self.action == "fields"
            ):
                if self.request.user.has_perm("clubs.generate_reports"):
                    return AuthenticatedClubSerializer
                else:
                    return ClubSerializer
            return ClubListSerializer
        if self.request is not None and self.request.user.is_authenticated:
            see_pending = self.request.user.has_perm("clubs.see_pending_clubs")
            is_member = (
                "code" in self.kwargs
                and Membership.objects.filter(
                    person=self.request.user, club__code=self.kwargs["code"]
                ).exists()
            )
            if see_pending or is_member:
                return AuthenticatedClubSerializer
        return ClubSerializer


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
    queryset = School.objects.all()


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


class YearViewSet(viewsets.ModelViewSet):
    """
    list:
    Retrieve a list of all of the graduation years (ex: Freshman, Sophomore, Junior, Senior).

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


class EventViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of events for this club.

    retrieve:
    Return a single event.

    destroy:
    Delete an event.
    """

    serializer_class = EventSerializer
    permission_classes = [EventPermission | IsSuperuser]
    filter_backends = [filters.SearchFilter, ClubsSearchFilter, ClubsOrderingFilter]
    search_fields = ["name", "club__name", "description"]
    lookup_field = "id"
    http_method_names = ["get", "post", "put", "patch", "delete"]

    @action(detail=True, methods=["post"])
    def upload(self, request, *args, **kwargs):
        """
        Upload a picture for the event.
        """
        event = Event.objects.get(id=kwargs["id"])
        self.check_object_permissions(request, event)

        return upload_endpoint_helper(request, Event, "image", pk=event.pk)

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
            start_time__gte=now,
        )

        return Response(EventSerializer(events, many=True).data)

    @action(detail=False, methods=["get"])
    def live(self, request, *args, **kwargs):
        """
        Get all events happening now.
        """
        now = timezone.now()
        return Response(
            EventSerializer(
                self.filter_queryset(self.get_queryset())
                .filter(start_time__lte=now, end_time__gte=now)
                .filter(type=Event.FAIR),
                many=True,
            ).data
        )

    @action(detail=False, methods=["get"])
    def upcoming(self, request, *args, **kwargs):
        """
        Get all events happening in the future.
        """
        now = timezone.now()
        return Response(
            EventSerializer(
                self.filter_queryset(self.get_queryset())
                .filter(start_time__gte=now)
                .filter(type=Event.FAIR),
                many=True,
            ).data
        )

    @action(detail=False, methods=["get"])
    def ended(self, request, *args, **kwargs):
        """
        Get events which have ended.
        """
        now = timezone.now()
        return Response(
            EventSerializer(
                self.filter_queryset(self.get_queryset()).filter(end_time__lt=now), many=True
            ).data
        )

    def create(self, request, *args, **kwargs):
        """
        Do not let non-superusers create events with the FAIR type through the API.
        """
        type = request.data.get("type", 0)
        if type == Event.FAIR and not self.request.user.is_superuser:
            raise DRFValidationError(
                detail="Approved activities fair events have already been created. "
                "See above for events to edit, and "
                "please email contact@pennclubs.com if this is en error."
            )

        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        qs = Event.objects.all()
        if self.kwargs.get("club_code") is not None:
            qs = qs.filter(club__code=self.kwargs["club_code"])

        now = timezone.now()
        if self.action in ["list"]:
            qs = qs.filter(end_time__gte=now)

        return (
            qs.select_related("club", "creator",)
            .prefetch_related("club__badges")
            .order_by("start_time")
        )


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
        questions = QuestionAnswer.objects.filter(club__code=club_code)

        if not self.request.user.is_authenticated:
            return questions.filter(approved=True)

        membership = Membership.objects.filter(
            club__code=club_code, person=self.request.user
        ).first()

        if self.request.user.is_superuser or (
            membership is not None and membership.role <= Membership.ROLE_OFFICER
        ):
            return questions

        return questions.filter(Q(approved=True) | Q(author=self.request.user))


class MembershipViewSet(viewsets.ModelViewSet):
    """
    list: Return a list of clubs that the logged in user is a member of.
    """

    serializer_class = UserMembershipSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get"]

    def get_queryset(self):
        return Membership.objects.filter(person=self.request.user)


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
        return Favorite.objects.filter(person=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return FavoriteWriteSerializer
        return FavoriteSerializer


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
        return Subscribe.objects.filter(person=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return UserSubscribeWriteSerializer
        return UserSubscribeSerializer


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
        obj = MembershipRequest.objects.filter(club__code=club, person=request.user).first()
        if obj is not None:
            obj.withdrew = False
            obj.save(update_fields=["withdrew"])
            return Response(UserMembershipRequestSerializer(obj).data)

        return super().create(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Don't actually delete the membership request when it is withdrawn.

        This is to keep track of repeat membership requests and avoid spamming the club owners
        with requests.
        """
        obj = self.get_object()
        obj.withdrew = True
        obj.save(update_fields=["withdrew"])

        return Response({"success": True})

    def get_queryset(self):
        return MembershipRequest.objects.filter(person=self.request.user, withdrew=False)


class MembershipRequestOwnerViewSet(XLSXFormatterMixin, viewsets.ModelViewSet):
    """
    list:
    Return a list of users who have sent membership request to the club
    """

    serializer_class = MembershipRequestSerializer
    permission_classes = [MembershipRequestPermission | IsSuperuser]
    http_method_names = ["get", "post", "delete"]
    lookup_field = "person__username"

    def get_queryset(self):
        return MembershipRequest.objects.filter(club__code=self.kwargs["club_code"], withdrew=False)

    @action(detail=True, methods=["post"])
    def accept(self, request, *ages, **kwargs):
        request_object = self.get_object()
        Membership.objects.create(person=request_object.person, club=request_object.club)
        request_object.delete()
        return Response({"success": True})


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
        return Membership.objects.filter(club__code=self.kwargs["club_code"])

    def get_serializer_class(self):
        if self.request is not None and self.request.user.is_authenticated:
            if self.request.user.is_superuser or (
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

    queryset = Tag.objects.all().annotate(clubs=Count("club", distinct=True)).order_by("name")
    serializer_class = TagSerializer
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

    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [ReadOnly | IsSuperuser]
    http_method_names = ["get"]
    lookup_field = "name"


class UserPermissionAPIView(APIView):
    """
    get: Check if a user has a specific permission, or return a list of all user permissions.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        perm = request.GET.get("perm", None)

        if perm is not None:
            if not request.user.is_authenticated:
                return Response({"allowed": False})
            return Response({"allowed": request.user.has_perm(perm)})

        if not request.user.is_authenticated:
            return Response({"permissions": []})

        return Response(
            {"permissions": list(request.user.user_permissions.values_list("codename", flat=True))}
        )


def zoom_api_call(user, verb, url, *args, **kwargs):
    """
    Perform an API call to Zoom with various checks.
    """
    if not settings.SOCIAL_AUTH_ZOOM_OAUTH2_KEY:
        raise DRFValidationError("Server is not configured with Zoom OAuth2 credentials.")

    if not user.is_authenticated:
        raise DRFValidationError("You are not authenticated.")

    social = user.social_auth.filter(provider="zoom-oauth2").first()
    if social is None:
        raise DRFValidationError("You have not linked your Zoom account yet.")

    out = requests.request(
        verb,
        url.format(uid=social.uid),
        *args,
        headers={"Authorization": f"Bearer {social.get_access_token(load_strategy())}"},
        **kwargs,
    )

    if out.status_code == 204:
        return out

    try:
        data = out.json()
    except json.decoder.JSONDecodeError as e:
        raise ValueError(f"{out.status_code} error parsing zoom api response: {out.content}") from e

    if data.get("code"):
        if "retry" not in kwargs:
            try:
                social.refresh_token(load_strategy())
            except requests.exceptions.HTTPError as e:
                raise ValueError(
                    f"Zoom API token renew {e.response.status_code}: {e.response.content}"
                ) from e
            kwargs["retry"] = True
            return zoom_api_call(user, verb, url, *args, **kwargs)
        else:
            raise ValueError(
                f"Zoom API returned response code {data.get('code')}: {data.get('message')}"
            )

    return out


class MeetingZoomAPIView(APIView):
    """
    get: Return a list of upcoming Zoom meetings for a user.
    """

    def get(self, request):
        response = zoom_api_call(request.user, "GET", "https://api.zoom.us/v2/users/{uid}/meetings")
        return Response({"success": True, "meetings": response.json()})


class UserZoomAPIView(APIView):
    """
    get: Return information about the Zoom account associated with the logged in user.

    post: Update the Zoom account settings to be the recommended Penn Clubs settings.
    """

    def get(self, request):
        if request.user.is_authenticated:
            key = f"zoom:user:{request.user.username}"
            res = cache.get(key)
            if (
                res is not None
                and not request.query_params.get("refresh", "false").lower() == "true"
            ):
                if res.get("success") is True:
                    return Response(res)
                else:
                    cache.delete(key)

        try:
            response = zoom_api_call(
                request.user, "GET", "https://api.zoom.us/v2/users/{uid}/settings",
            )
        except ValueError:
            raise DRFValidationError(
                "An error occured while fetching user information. "
                "Try reconnecting your account."
            )

        settings = response.json()
        res = {"success": settings.get("code") is None, "settings": settings}

        if res["success"]:
            cache.set(key, res, 900)
        return Response(res)

    def post(self, request):
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
                "detail": "Your user settings have been updated on Zoom."
                if response.ok
                else "Failed to update Zoom user settings.",
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

    def get_object(self):
        user = self.request.user
        prefetch_related_objects(
            [user],
            "favorite_set",
            "subscribe_set",
            "membershiprequest_set",
            "profile__school",
            "membership_set",
            "membership_set__club",
            "profile__major",
        )
        return user


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

    @action(detail=True, methods=["put", "patch"])
    def resend(self, request, *args, **kwargs):
        """
        Resend an email invitation that has already been issued.
        """
        invite = self.get_object()
        invite.send_mail(request)
        invite.updated_at = timezone.now()
        invite.save(update_fields=["updated_at"])

        return Response({"detail": "Resent email invitation to {}!".format(invite.email)})

    def get_queryset(self):
        return MembershipInvite.objects.filter(club__code=self.kwargs["club_code"], active=True)


class MassInviteAPIView(APIView):
    """
    Send out invites and add invite objects given a list of comma or newline separated emails.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        club = get_object_or_404(Club, code=kwargs["club_code"])

        mem = Membership.objects.filter(club=club, person=request.user).first()

        if not request.user.is_superuser and (not mem or not mem.role <= Membership.ROLE_OFFICER):
            return Response(
                {"detail": "You do not have permission to invite new members!", "success": False},
                status=status.HTTP_403_FORBIDDEN,
            )

        role = request.data.get("role", Membership.ROLE_MEMBER)
        title = request.data.get("title", "Member")

        if mem and mem.role > role and not request.user.is_superuser:
            return Response(
                {
                    "detail": "You cannot send invites for a role higher than your own!",
                    "success": False,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        emails = [x.strip() for x in re.split(r"\n|,", request.data.get("emails", ""))]
        emails = [x for x in emails if x]

        original_count = len(emails)

        # remove users that are already in the club
        exist = Membership.objects.filter(club=club, person__email__in=emails).values_list(
            "person__email", flat=True
        )
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
                {"detail": "The email address '{}' is not valid!".format(email), "success": False}
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
                "detail": "Sent invite{} to {} email{}! {} email{} were skipped.".format(
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


class LastEmailInviteTestAPIView(APIView):
    """
    get: Return the club code, invite id and token of the last sent email invite
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        latest_email_invite = MembershipInvite.objects.filter(active=True).latest("created_at")
        club_code = latest_email_invite.club.code
        email_id = latest_email_invite.id
        email_token = latest_email_invite.token

        if request.user.email == latest_email_invite.email:
            return Response({"code": club_code, "id": email_id, "token": email_token},)
        else:
            return Response(
                {
                    "detail": "You can only access tokens for invitations that match your email.",
                    "email": request.user.email,
                    "success": False,
                },
                status=status.HTTP_403_FORBIDDEN,
            )


class EmailPreviewContext(dict):
    """
    A dict class to keep track of which variables were actually used by the template.
    """

    def __init__(self, *args, **kwargs):
        self._called = set()
        super().__init__(*args, **kwargs)

    def __getitem__(self, k):
        try:
            preview = super().__getitem__(k)
        except KeyError:
            preview = None

        if preview is None:
            preview = "[{}]".format(k.replace("_", " ").title())

        self._called.add((k, preview))
        return preview

    def __contains__(self, k):
        return True

    def get_used_variables(self):
        return sorted(self._called)


def email_preview(request):
    """
    Debug endpoint used for previewing how email templates will look.
    """
    email_templates = os.listdir(os.path.join(settings.BASE_DIR, "templates", "emails"))
    email_templates = [e.rsplit(".", 1)[0] for e in email_templates if e.endswith(".html")]

    email = None
    text_email = None
    context = None

    if "email" in request.GET:
        email_path = os.path.basename(request.GET.get("email"))

        # initial values
        initial_context = {
            "name": "[Club Name]",
            "sender": {"username": "[Sender Username]", "email": "[Sender Email]"},
            "role": 0,
        }

        # set specified values
        for param, value in request.GET.items():
            if param not in {"email"}:
                # parse non-string representations
                if value.strip().lower() == "true":
                    value = True
                elif value.strip().lower() == "false":
                    value = False
                elif value.isdigit():
                    value = int(value)
                elif value.startswith("{"):
                    value = json.loads(value)

                initial_context[param] = value

        context = EmailPreviewContext(initial_context)
        email = render_to_string("emails/{}.html".format(email_path), context)
        text_email = html_to_text(email)

    return render(
        request,
        "preview.html",
        {
            "templates": email_templates,
            "email": email,
            "text_email": text_email,
            "variables": context.get_used_variables() if context is not None else [],
        },
    )
