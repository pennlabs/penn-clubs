import re

from django.core.validators import validate_email
from django.db.models import Count
from django.http.response import JsonResponse
from rest_framework import filters, generics, viewsets
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated

from clubs.models import Club, Event, Favorite, Membership, Tag
from clubs.permissions import ClubPermission, EventPermission, IsSuperuser, MemberPermission
from clubs.serializers import (AuthenticatedClubSerializer, AuthenticatedMembershipSerializer, ClubSerializer,
                               EventSerializer, FavoriteSerializer, MembershipSerializer, TagSerializer, UserSerializer)


class ClubViewSet(viewsets.ModelViewSet):
    """
    retrieve:
    Return a single club.
    list:
    Return a list of clubs.
    """
    queryset = Club.objects.all().annotate(favorite_count=Count('favorite')).order_by('name')
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


@api_view(['POST'])
def invite_view(request, pk):
    """
    Send out invites and add invite objects given a list of emails.
    """
    emails = [x.strip() for x in re.split('\n|,', request.POST.get('emails', ''))]
    emails = [x for x in emails if x]

    for email in emails:
        validate_email(email)

    # TODO: implement email invites

    return JsonResponse({
        'detail': 'Sent invite(s) to {} email(s)!'.format(len(emails))
    })
