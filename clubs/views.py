from rest_framework import viewsets
from django.db.models import Q
from clubs.models import Club, Event, Tag, Membership
from clubs.permissions import ClubPermission, EventPermission, MemberPermission
from clubs.serializers import ClubSerializer, TagSerializer, MembershipSerializer, AuthenticatedMembershipSerializer, EventSerializer


class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [MemberPermission]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']
    lookup_field = 'person__username'

    def get_queryset(self):
        return Membership.objects.filter(club=self.kwargs['club_pk'])

    def get_serializer_class(self):
        if self.request.user.is_superuser or Membership.objects.filter(person=self.request.user, club=self.kwargs['club_pk']).exists():
            return AuthenticatedMembershipSerializer
        else:
            return MembershipSerializer


class ClubViewSet(viewsets.ModelViewSet):
    """
    retrieve:
    Return a single club.
    list:
    Return a list of clubs.
    """
    serializer_class = ClubSerializer
    permission_classes = [ClubPermission]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def get_queryset(self):
        """
        If search parameters are specified, filter the queryset.
        """
        queryset = Club.objects.all()
        query = self.request.query_params.get('q', None)
        if query is not None:
            queryset = queryset.filter(Q(name__icontains=query) | Q(subtitle__icontains=query))
        return queryset


class TagViewSet(viewsets.ModelViewSet):
    """
    Return a list of tags.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    http_method_names = ['get']
    lookup_field = 'name'


class EventViewSet(viewsets.ModelViewSet):
    """
    Return a list of events.
    """
    serializer_class = EventSerializer
    permission_classes = [EventPermission]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def get_queryset(self):
        return Event.objects.filter(club=self.kwargs['club_pk'])
