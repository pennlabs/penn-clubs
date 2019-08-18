from rest_framework import filters, viewsets
from django.db.models import Q
from clubs.models import Club, Event, Tag, Membership, Favorite
from rest_framework.permissions import IsAuthenticated
from clubs.permissions import ClubPermission, EventPermission, MemberPermission, IsSuperuser
from clubs.serializers import ClubSerializer, TagSerializer, MembershipSerializer, AuthenticatedMembershipSerializer, EventSerializer, FavoriteSerializer


class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [MemberPermission | IsSuperuser]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']
    lookup_field = 'person__username'

    def get_queryset(self):
        return Membership.objects.filter(club=self.kwargs['club_pk'])

    def get_serializer_class(self):
        if self.request.user.is_superuser or (self.request.user.is_authenticated and Membership.objects.filter(person=self.request.user, club=self.kwargs['club_pk']).exists()):
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
    queryset = Club.objects.all().order_by('name')
    serializer_class = ClubSerializer
    permission_classes = [ClubPermission | IsSuperuser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'subtitle']
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']


class TagViewSet(viewsets.ModelViewSet):
    """
    Return a list of tags.
    """
    queryset = Tag.objects.all().order_by('name')
    serializer_class = TagSerializer
    http_method_names = ['get']
    lookup_field = 'name'


class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'club__pk'
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return Favorite.objects.filter(person=self.request.user)


class EventViewSet(viewsets.ModelViewSet):
    """
    Return a list of events.
    """
    serializer_class = EventSerializer
    permission_classes = [EventPermission | IsSuperuser]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def get_queryset(self):
        return Event.objects.filter(club=self.kwargs['club_pk'])
