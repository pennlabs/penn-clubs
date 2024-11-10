from django.contrib.auth.models import User
from django.urls import resolve
from django.utils.functional import SimpleLazyObject


class LimitedPermissionsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        current_url = getattr(resolve(request.path_info), "url_name", None)

        if (
            request.user.is_authenticated
            and request.user.is_superuser
            and request.session.get("limited_permissions", False)
            and "limited-permissions" not in current_url
        ):
            limited_user = SimpleLazyObject(
                lambda: User.objects.get(pk=request.user.pk)
            )
            limited_user.is_superuser = False
            limited_user.is_staff = False
            request.user = limited_user

        response = self.get_response(request)
        return response
