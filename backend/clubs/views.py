import json
import os
import random
import re
from collections import OrderedDict
from urllib.parse import quote

import qrcode
from django.conf import settings
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
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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


DEFAULT_PAGE_SIZE = 15
DEFAULT_SEED = 1234


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


class ClubPagination(PageNumberPagination):
    """
    Custom pagination for club list view.
    """

    page_size = DEFAULT_PAGE_SIZE
    page_size_query_param = "page_size"

    def paginate_queryset(self, queryset, request, view=None):
        if "random" in request.query_params.get("ordering", "").split(","):
            rng = random.Random(request.GET.get("seed", DEFAULT_SEED))
            results = list(queryset)
            rng.shuffle(results)

            self._random_count = Club.objects.count()

            page = int(request.GET.get("page", 1))
            page_size = int(request.GET.get("page_size", DEFAULT_PAGE_SIZE))

            if (page - 1) * page_size >= self._random_count:
                self._random_next_page = None
            else:
                new_params = request.GET.dict()
                new_params["page"] = str(page + 1)
                self._random_next_page = "{}?{}".format(
                    request.build_absolute_uri(request.path),
                    "&".join(["{}={}".format(k, quote(v)) for k, v in new_params.items()]),
                )
            return results

        if self.page_query_param not in request.query_params:
            return None

        return super().paginate_queryset(queryset, request, view)

    def get_paginated_response(self, data):
        if hasattr(self, "_random_next_page"):
            return Response(
                OrderedDict(
                    [
                        ("count", self._random_count),
                        ("next", self._random_next_page),
                        ("results", data),
                    ]
                )
            )

        return super().get_paginated_response(data)


class ClubsSearchFilter(filters.BaseFilterBackend):
    """
    A DRF filter to implement custom filtering logic for the frontend.
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

        def parse_tags(field, value, operation, queryset):
            tags = value.strip().split(",")
            if operation == "or":
                if tags[0].isdigit():
                    tags = [int(tag) for tag in tags if tag]
                    return {f"{field}__id__in": tags}
                else:
                    return {f"{field}__name__in": tags}

            if tags[0].isdigit() or operation == "id":
                tags = [int(tag) for tag in tags if tag]
                for tag in tags:
                    queryset = queryset.filter(**{f"{field}__id": tag})
            else:
                for tag in tags:
                    queryset = queryset.filter(**{f"{field}__name": tag})
            return queryset

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
            "target_schools": parse_tags,
            "target_majors": parse_tags,
            "target_years": parse_tags,
            "active": parse_boolean,
            "approved": parse_boolean,
            "accepting_members": parse_boolean,
        }

        query = {}

        for param, value in params.items():
            field = param.split("__")
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


class ClubsOrderingFilter(filters.OrderingFilter):
    """
    Custom ordering filter for club objects.
    """

    def filter_queryset(self, request, queryset, view):
        new_queryset = super().filter_queryset(request, queryset, view)
        ordering = request.GET.get("ordering", "").split(",")

        if "random" in ordering:
            page = int(request.GET.get("page", 1)) - 1
            page_size = int(request.GET.get("page_size", DEFAULT_PAGE_SIZE))
            rng = random.Random(request.GET.get("seed", DEFAULT_SEED))

            all_ids = list(Club.objects.values_list("id", flat=True))
            rng.shuffle(all_ids)

            start_index = page * page_size
            end_index = (page + 1) * page_size
            page_ids = all_ids[start_index:end_index]

            return new_queryset.filter(id__in=page_ids)

        if "featured" in ordering:
            return queryset.order_by("-rank")

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
        .annotate(favorite_count=Count("favorite"))
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

    filter_backends = [filters.SearchFilter, ClubsOrderingFilter, ClubsSearchFilter]
    search_fields = ["name", "subtitle"]
    ordering_fields = ["favorite_count", "name"]
    ordering = "-favorite_count"

    lookup_field = "code"
    http_method_names = ["get", "post", "put", "patch", "delete"]
    pagination_class = ClubPagination

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
        club = Club.objects.get(code=kwargs["code"])
        resp = upload_endpoint_helper(request, Club, "image", code=kwargs["code"])
        if status.is_success(resp.status_code):
            club.approved = None
            club.approved_by = None
            club.approved_on = None
            club.save(update_fields=["approved", "approved_by", "approved_on"])
        return resp

    @action(detail=True, methods=["post"])
    def upload_file(self, request, *args, **kwargs):
        """
        Upload a file for the club.
        """
        return file_upload_endpoint_helper(request, code=kwargs["code"])

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
        url = f"https://{settings.DEFAULT_DOMAIN}/club/{self.kwargs['code']}/fair"
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
        serializer = SubscribeSerializer(
            Subscribe.objects.filter(club__code=self.kwargs["code"]), many=True
        )
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

    def partial_update(self, request, *args, **kwargs):
        if (
            request.data.get("accepted", None) is not None
            or request.data.get("accepted_comment", None) is not None
        ) and not request.user.has_perm("clubs.approve_club"):
            raise PermissionDenied
        return super().partial_update(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if (
            request.data.get("accepted", None) is not None
            or request.data.get("accepted_comment", None) is not None
        ) and not request.user.has_perm("clubs.approve_club"):
            raise PermissionDenied
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
                parameters = json.dumps(dict(request.query_params))
                Report.objects.create(
                    name=name,
                    description=desc,
                    parameters=parameters,
                    creator=request.user,
                    public=public,
                )

        return super().list(request, *args, **kwargs)

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
                for f in ClubSerializer.Meta.fields
            }
        )

    def get_serializer_class(self):
        if self.action == "upload":
            return AssetSerializer
        if self.action == "subscription":
            return SubscribeSerializer
        if self.action == "list":
            if self.request is not None and self.request.accepted_renderer.format == "xlsx":
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
    lookup_field = "id"
    http_method_names = ["get", "post", "put", "patch", "delete"]

    @action(detail=True, methods=["post"])
    def upload(self, request, *args, **kwargs):
        """
        Upload a picture for the event.
        """
        return upload_endpoint_helper(request, Event, "image", code=kwargs["id"])

    @action(detail=False, methods=["get"])
    def live(self, request, *args, **kwargs):
        """
        Get all events happening now.
        """
        now = timezone.now()
        return Response(
            EventSerializer(
                self.get_queryset().filter(start_time__lte=now, end_time__gte=now), many=True
            ).data
        )

    @action(detail=False, methods=["get"])
    def upcoming(self, request, *args, **kwargs):
        """
        Get all events happening in the future.
        """
        now = timezone.now()
        return Response(
            EventSerializer(self.get_queryset().filter(start_time__gte=now), many=True).data
        )

    @action(detail=False, methods=["get"])
    def ended(self, request, *args, **kwargs):
        """
        Get events which have ended.
        """
        now = timezone.now()
        return Response(
            EventSerializer(self.get_queryset().filter(end_time__lt=now), many=True).data
        )

    def get_queryset(self):
        qs = Event.objects.all()
        if self.kwargs.get("club_code") is not None:
            qs = qs.filter(club__code=self.kwargs["club_code"])

        now = timezone.now()
        if self.action in ["list"]:
            qs = qs.filter(end_time__gte=now)

        return qs.select_related("club", "creator",)


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
    permission_field = [MemberPermission | IsSuperuser]
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

    queryset = Tag.objects.all().annotate(clubs=Count("club")).order_by("name")
    serializer_class = TagSerializer
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

        return Response(
            {"detail": "Sent invite(s) to {} email(s)!".format(len(emails)), "success": True}
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
            return Response(
                {
                    "code": club_code,
                    "id": "{}".format(email_id),
                    "token": "{}".format(email_token),
                },
            )
        else:
            return Response(
                {
                    "detail": "You can only access invitation token that matches your email credentials",
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
