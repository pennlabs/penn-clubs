from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand

from clubs.models import Club


class Command(BaseCommand):
    help = "Give superuser to hard-coded user accounts affiliated with OSA."

    def handle(self, *args, **kwargs):
        User = get_user_model()
        content_type = ContentType.objects.get_for_model(Club)
        approve_perm = Permission.objects.get(
            codename="approve_club", content_type=content_type
        )
        pending_perm = Permission.objects.get(
            codename="see_pending_clubs", content_type=content_type
        )
        if not settings.OSA_KEYS:
            raise ValueError("OSA_KEYS not set in settings")
        if not (approvers := Group.objects.filter(name="Approvers").first()):
            raise ValueError("Approvers group not found")
        for key in settings.OSA_KEYS:
            if not key or not (user := User.objects.get(username=key)):
                continue
            user.is_superuser = True
            user.is_staff = True
            user.user_permissions.add(approve_perm)
            user.user_permissions.add(pending_perm)
            approvers.user_set.add(user)
            user.save()
        approvers.save()
