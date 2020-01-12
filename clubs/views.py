import os
import re

import qrcode
from django.conf import settings
from django.core.cache import cache
from django.core.files.uploadedfile import UploadedFile
from django.core.validators import validate_email
from django.db.models import Count, Prefetch
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render
from django.template.loader import render_to_string
from rest_framework import filters, generics, parsers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from clubs.mixins import XLSXFormatterMixin
from clubs.models import (Asset, Club, Event, Favorite, Major, Membership,
                          MembershipInvite, Note, School, Subscribe, Tag, Year)
from clubs.permissions import (AssetPermission, ClubPermission, EventPermission, InvitePermission,
                               IsSuperuser, MemberPermission, NotePermission, ReadOnly)
from clubs.serializers import (AssetSerializer, AuthenticatedClubSerializer, AuthenticatedMembershipSerializer,
                               ClubListSerializer, ClubSerializer, EventSerializer, FavoriteSerializer, MajorSerializer,
                               MembershipInviteSerializer, MembershipSerializer, NoteSerializer, SchoolSerializer,
                               SubscribeSerializer, TagSerializer, UserSerializer, YearSerializer)


def upload_endpoint_helper(request, cls, field, **kwargs):
    obj = get_object_or_404(cls, **kwargs)
    if 'file' in request.data and isinstance(request.data['file'], UploadedFile):
        getattr(obj, field).delete(save=False)
        setattr(obj, field, request.data['file'])
        obj.save()
    else:
        return Response({
            'file': 'No image file was uploaded!'
        }, status=status.HTTP_400_BAD_REQUEST)
    return Response({
        'detail': 'Club image uploaded!'
    })


def find_children_helper(club_object):
    """
    Format and retrieve all children of a club into tree
    """
    children = (club_object.children_orgs.all()
                                         .prefetch_related('children_orgs'))
    children_recurse = []
    for child in children:
        children_recurse.append(find_children_helper(child))

    return {
        'name': club_object.name,
        'code': club_object.code,
        'children': children_recurse
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

    queryset = queryset.filter(creating_club_permission__gte=creating_club_membership) \
        | queryset.filter(outside_club_permission__gte=subject_club_membership)

    return queryset


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
    queryset = (Club.objects.all()
                            .annotate(favorite_count=Count('favorite'))
                            .prefetch_related(
                                'tags',
                                'badges',
                                'target_schools',
                                'target_majors',
                                'target_years',
                                Prefetch('membership_set', queryset=Membership.objects.order_by(
                                    'role',
                                    'person__first_name',
                                    'person__last_name'
                                ))
                            ))
    permission_classes = [ClubPermission | IsSuperuser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'subtitle']
    lookup_field = 'code'
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    @action(detail=True, methods=['post'])
    def upload(self, request, *args, **kwargs):
        """
        Upload the club logo.
        """
        return upload_endpoint_helper(request, Club, 'image', code=kwargs['code'])

    @action(detail=True, methods=['get'])
    def children(self, request, *args, **kwargs):
        """
        Return a recursive list of all children that this club is a parent of.
        """
        child_tree = find_children_helper(self.get_object())
        return Response(child_tree)

    @action(detail=True, methods=['get'], url_path='notes-about')
    def notes_about(self, request, *args, **kwargs):
        """
        Return a list of notes about this club, used by members of parent organizations.
        """
        club = self.get_object()
        queryset = Note.objects.filter(subject_club__code=club.code)
        queryset = filter_note_permission(queryset, club, self.request.user)
        serializer = NoteSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def qr(self, request, *args, **kwargs):
        """
        Return a QR code png image representing a link to the club on Penn Clubs.
        """
        url = f"https://{settings.DEFAULT_DOMAIN}/club/{self.kwargs['code']}/fair"
        response = HttpResponse(content_type='image/png')
        qr_image = qrcode.make(url, box_size=20, border=0)
        qr_image.save(response, 'PNG')
        return response

    @action(detail=True, methods=['get'])
    def subscription(self, request, *args, **kwargs):
        """
        Return a list of all students that have subscribed to the club, including their names and emails.
        """
        serializer = SubscribeSerializer(Subscribe.objects.filter(club__code=self.kwargs['code']), many=True)
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        """
        Return a list of all clubs. Results are cached and update every 5 minutes.
        Note that some fields are removed in order to improve the response time.
        """
        # don't cache requests for spreadsheet format
        if request.accepted_renderer.format == 'xlsx':
            resp = super().list(request, *args, **kwargs)
            return resp

        # return cached if cached
        key = 'club:list'
        val = cache.get(key)
        if val is not None:
            return Response(val)

        # save to cache if not
        resp = super().list(request, *args, **kwargs)
        if resp.status_code == 200:
            cache.set(key, resp.data, 60 * 5)
        return resp

    @action(detail=False, methods=['GET'])
    def fields(self, request, *args, **kwargs):
        """
        Return the list of fields that can be exported in the Excel file.
        """
        return Response({
            f.verbose_name.title(): f.name
            for f in Club._meta._get_fields(reverse=False)
        })

    def get_serializer_class(self):
        if self.action == 'upload':
            return AssetSerializer
        if self.action == 'subscription':
            return SubscribeSerializer
        if self.action == 'list':
            if self.request.accepted_renderer.format == 'xlsx':
                return ClubSerializer
            return ClubListSerializer
        if self.request is not None and self.request.user.is_authenticated:
            if 'code' in self.kwargs and (
                self.request.user.is_superuser or
                Membership.objects.filter(person=self.request.user, club__code=self.kwargs['code']).exists()
            ):
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
    lookup_field = 'code'
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    @action(detail=True, methods=['post'])
    def upload(self, request, *args, **kwargs):
        """
        Upload a picture for the event.
        """
        return upload_endpoint_helper(request, Event, 'image', code=kwargs['code'])

    def get_queryset(self):
        return Event.objects.filter(club__code=self.kwargs['club_code'])


class FavoriteViewSet(viewsets.ModelViewSet):
    """
    list: Return a list of clubs that the logged in user has favorited.

    create: Favorite a club.

    destroy: Unfavorite a club.
    """
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'club__code'
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return Favorite.objects.filter(person=self.request.user)


class SubscribeViewSet(viewsets.ModelViewSet):
    """
    list: Return a list of clubs that the logged in user has subscribed to.

    create: Subscribe to a club.

    destroy: Unsubscribe from a club.
    """
    serializer_class = SubscribeSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'club__code'
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return Subscribe.objects.filter(person=self.request.user)


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
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']
    lookup_field = 'person__username'

    def get_queryset(self):
        return Membership.objects.filter(club__code=self.kwargs['club_code'])

    def get_serializer_class(self):
        if self.request is not None and self.request.user.is_authenticated:
            if self.request.user.is_superuser or ('club_code' in self.kwargs and
               Membership.objects.filter(person=self.request.user, club__code=self.kwargs['club_code']).exists()):
                return AuthenticatedMembershipSerializer
        return MembershipSerializer


class AssetViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of files that belong to this club.

    retrieve:
    Retrieve information about a specific file that belongs to this club.

    create:
    Upload a new file to the club file repository.

    destroy:
    Delete a file from the club file repository.
    """
    serializer_class = AssetSerializer
    permission_classes = [AssetPermission | IsSuperuser]
    parser_classes = [parsers.MultiPartParser]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return Asset.objects.filter(club__code=self.kwargs['club_code'])


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
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        club = get_object_or_404(Club, code=self.kwargs['club_code'])

        queryset = Note.objects.filter(creating_club__code=self.kwargs['club_code'])
        queryset = filter_note_permission(queryset, club, self.request.user)

        return queryset


class TagViewSet(viewsets.ModelViewSet):
    """
    list:
    Return a list of tags.
    """
    queryset = Tag.objects.all().annotate(clubs=Count('club')).order_by('name')
    serializer_class = TagSerializer
    http_method_names = ['get']
    lookup_field = 'name'


class UserUpdateAPIView(generics.RetrieveUpdateAPIView):
    """
    get: Return information about the logged in user, including bookmarks,
    subscriptions, and school/major/graduation year information.

    put: Update information about the logged in user.
    All fields are required.

    patch: Update information about the logged in user.
    Only updates fields that are passed to the server.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


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
    http_method_names = ['get', 'put', 'patch', 'delete']

    @action(detail=True, methods=['put', 'patch'])
    def resend(self, request, *args, **kwargs):
        """
        Resend an email invitation that has already been issued.
        """
        invite = self.get_object()
        invite.send_mail(request)

        return Response({
            'detail': 'Resent email invitation to {}!'.format(invite.email)
        })

    def get_queryset(self):
        return MembershipInvite.objects.filter(club__code=self.kwargs['club_code'], active=True)


class MassInviteAPIView(APIView):
    """
    Send out invites and add invite objects given a list of comma or newline separated emails.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        club = get_object_or_404(Club, code=kwargs['club_code'])

        mem = Membership.objects.filter(club=club, person=request.user).first()

        if not request.user.is_superuser and (not mem or not mem.role <= Membership.ROLE_OFFICER):
            return Response({
                'detail': 'You do not have permission to invite new members!'
            }, status=status.HTTP_403_FORBIDDEN)

        role = request.data.get('role', Membership.ROLE_MEMBER)
        title = request.data.get('title', 'Member')

        if mem and mem.role > role:
            return Response({
                'detail': 'You cannot send invites for a role higher than your own!'
            }, status=status.HTTP_403_FORBIDDEN)

        emails = [x.strip() for x in re.split('\n|,', request.data.get('emails', ''))]
        emails = [x for x in emails if x]

        # remove users that are already in the club
        exist = Membership.objects.filter(club=club, person__email__in=emails).values_list('person__email', flat=True)
        emails = list(set(emails) - set(exist))

        for email in emails:
            validate_email(email)

        for email in emails:
            invite = MembershipInvite.objects.create(
                email=email,
                club=club,
                creator=request.user,
                role=role,
                title=title
            )
            if role <= Membership.ROLE_OWNER and not mem:
                invite.send_owner_invite(request)
            else:
                invite.send_mail(request)

        return Response({
            'detail': 'Sent invite(s) to {} email(s)!'.format(len(emails))
        })


def email_preview(request):
    """
    Debug endpoint used for previewing how email templates will look.
    """
    email_templates = os.listdir(os.path.join(settings.BASE_DIR, 'templates', 'emails'))
    email_templates = [e.rsplit('.', 1)[0] for e in email_templates if e.endswith('.html')]

    email = None
    text_email = None

    if 'email' in request.GET:
        email_path = os.path.basename(request.GET.get('email'))
        context = {
            'name': '[Club Name]',
            'url': '[URL]',
            'view_url': '[View URL]',
            'flyer_url': '[Flyer URL]',
            'sender': {
                'username': '[Sender Username]',
                'email': '[Sender Email]'
            },
            'role': 0
        }
        email = render_to_string('emails/{}.html'.format(email_path), context)
        text_email = render_to_string('emails/{}.txt'.format(email_path), context)

    return render(request, 'preview.html', {
        'templates': email_templates,
        'email': email,
        'text_email': text_email
    })
