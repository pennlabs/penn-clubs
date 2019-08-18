from rest_framework import permissions
from clubs.models import Membership


class IsSuperuser(permissions.BasePermission):
    """
    Grants permission if the current user is a superuser.
    """
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.is_superuser

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser


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
            return membership.role <= Membership.ROLE_OWNER
        else:
            return membership.role <= Membership.ROLE_OFFICER

    def has_permission(self, request, view):
        if view.action in ['update', 'partial_update', 'destroy']:
            return request.user.is_authenticated
        elif view.action in ['create']:
            # TODO: more strict permissions for creating clubs
            return request.user.is_authenticated
        else:
            return True


class MemberPermission(permissions.BasePermission):
    """
    Members of a higher role can update/delete members of equal or lower roles, except ordinary members.
    Officers and above can add new members.
    Anyone can view membership.
    """
    def has_object_permission(self, request, view, obj):
        membership = Membership.objects.filter(person=request.user, club=view.kwargs['club_pk']).first()
        if membership is None:
            return False

        if view.action in ['retrieve']:
            return membership.role <= Membership.ROLE_MEMBER

        if membership.role >= Membership.ROLE_MEMBER:
            return False

        if view.action in ['destroy'] and membership.pk == obj.pk and membership.role <= Membership.ROLE_OWNER:
            return False

        return membership.role <= obj.role

    def has_permission(self, request, view):
        if view.action in ['update', 'partial_update', 'destroy']:
            return request.user.is_authenticated
        elif view.action in ['create']:
            if not request.user.is_authenticated:
                return False
            membership = Membership.objects.filter(person=request.user, club=view.kwargs['club_pk']).first()
            return membership is not None and membership.role <= Membership.ROLE_OFFICER
        else:
            return True


class EventPermission(permissions.BasePermission):
    """
    Officers and above can create/update/delete events.
    Everyone else can view and list events.
    """
    def has_permission(self, request, view):
        if view.action in ['create', 'update', 'partial_update', 'destroy']:
            membership = Membership.objects.filter(person=request.user, club=view.kwargs['club_pk']).first()
            return membership is not None and membership.role <= Membership.ROLE_OFFICER
        else:
            return True
