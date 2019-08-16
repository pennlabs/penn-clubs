from rest_framework import viewsets, permissions
from clubs.models import Club, Event, Tag, Membership
from clubs.serializers import ClubSerializer, TagSerializer


class ClubPermission(permissions.BasePermission):
    """
    Only club owners should be able to delete.
    Club owners and officers should be able to update.
    Anyone with permission should be able to create.
    """
    def has_object_permission(self, request, view, obj):
        if view.action in ['retrieve']:
            return True

        membership = Membership.objects.filter(person=request.user, club=obj).first()
        if membership is None:
            return False

        if view.action in ['destroy']:
            return membership.role == Membership.ROLE_OWNER
        else:
            return membership.role <= Membership.ROLE_OFFICER

    def has_permission(self, request, view):
        if view.action in ['update', 'partial_update', 'destroy', 'create']:
            return request.user.is_authenticated
        else:
            return True


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
    http_method_names = ['get', 'post', 'delete']


class TagViewSet(viewsets.ModelViewSet):
    """
    Return a list of tags.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    http_method_names = ['get']
