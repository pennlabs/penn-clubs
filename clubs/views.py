from rest_framework import viewsets
from clubs.models import Club, Event, Tag, Membership
from clubs.permissions import ClubPermission, EventPermission, MemberPermission
from clubs.serializers import ClubSerializer, TagSerializer, MembershipSerializer, EventSerializer


class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [MemberPermission]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']
    lookup_field = 'person__username'

    def get_queryset(self):
        return Membership.objects.filter(club=self.kwargs['club_pk'])


class ClubViewSet(viewsets.ModelViewSet):
    """
    retrieve:
    Return a single club.
    list:
    Return a list of clubs.
    """
    queryset = Club.objects.all()
    serializer_class = ClubSerializer
    permission_classes = [ClubPermission]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']


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
