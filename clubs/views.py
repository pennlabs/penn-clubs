import re

from django.core.validators import validate_email
from django.db.models import Count, Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import filters, generics, parsers, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from clubs.models import Asset, Club, Event, Favorite, Membership, MembershipInvite, Tag
from clubs.permissions import ClubPermission, EventPermission, InvitePermission, IsSuperuser, MemberPermission
from clubs.serializers import (AssetSerializer, AuthenticatedClubSerializer, AuthenticatedMembershipSerializer,
                               ClubSerializer, EventSerializer, FavoriteSerializer, MembershipInviteSerializer,
                               MembershipSerializer, TagSerializer, UserSerializer)


class ClubViewSet(viewsets.ModelViewSet):
    """
    retrieve:
    Return a single club.
    list:
    Return a list of clubs.
    """
    queryset = (Club.objects.all()
                            .order_by('-active', 'name')
                            .annotate(favorite_count=Count('favorite'))
                            .prefetch_related(
                                Prefetch('members', queryset=Membership.objects.order_by('role'))
                            ))
    permission_classes = [ClubPermission | IsSuperuser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'subtitle']
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def get_serializer_class(self):
        if self.request is not None and self.request.user.is_authenticated:
            if self.request.user.is_superuser or ('pk' in self.kwargs and
               Membership.objects.filter(person=self.request.user, club=self.kwargs['pk']).exists()):
                return AuthenticatedClubSerializer
        return ClubSerializer


class EventViewSet(viewsets.ModelViewSet):
    """
    Return a list of events.
    """
    serializer_class = EventSerializer
    permission_classes = [EventPermission | IsSuperuser]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def get_queryset(self):
        return Event.objects.filter(club=self.kwargs['club_pk'])


class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'club__pk'
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return Favorite.objects.filter(person=self.request.user)


class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [MemberPermission | IsSuperuser]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']
    lookup_field = 'person__username'

    def get_queryset(self):
        return Membership.objects.filter(club=self.kwargs['club_pk'])

    def get_serializer_class(self):
        if self.request is not None and self.request.user.is_authenticated:
            if self.request.user.is_superuser or ('club_pk' in self.kwargs and
               Membership.objects.filter(person=self.request.user, club=self.kwargs['club_pk']).exists()):
                return AuthenticatedMembershipSerializer
        else:
            return MembershipSerializer


class AssetViewSet(viewsets.ModelViewSet):
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return Asset.objects.filter(creator=self.request.user)

    def perform_create(self, serializer):
        name = self.request.FILES.get('file').name
        serializer.save(name=name, creator=self.request.user)


class TagViewSet(viewsets.ModelViewSet):
    """
    Return a list of tags.
    """
    queryset = Tag.objects.all().annotate(clubs=Count('club')).order_by('name')
    serializer_class = TagSerializer
    http_method_names = ['get']
    lookup_field = 'name'


class UserUpdateAPIView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class MemberInviteViewSet(viewsets.ModelViewSet):
    permission_classes = [InvitePermission | IsSuperuser]
    serializer_class = MembershipInviteSerializer
    http_method_names = ['get', 'put', 'patch', 'delete']

    def get_queryset(self):
        return MembershipInvite.objects.filter(club=self.kwargs['club_pk'], active=True)


class MassInviteAPIView(APIView):
    """
    Send out invites and add invite objects given a list of emails.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        club = get_object_or_404(Club, pk=kwargs['club_pk'])

        mem = Membership.objects.filter(club=club, person=request.user).first()

        if not request.user.is_superuser and (not mem or not mem.role <= Membership.ROLE_OFFICER):
            return Response({
                'detail': 'You do not have permission to invite new members!'
            }, status=status.HTTP_403_FORBIDDEN)

        emails = [x.strip() for x in re.split('\n|,', request.POST.get('emails', request.data.get('emails', '')))]
        emails = [x for x in emails if x]

        # remove users that are already in the club
        exist = Membership.objects.filter(club=club, person__email__in=emails).values_list('person__email', flat=True)
        emails = list(set(emails) - set(exist))

        for email in emails:
            validate_email(email)

        for email in emails:
            MembershipInvite.objects.create(email=email, club=club, creator=request.user).send_mail(request)

        return Response({
            'detail': 'Sent invite(s) to {} email(s)!'.format(len(emails))
        })
