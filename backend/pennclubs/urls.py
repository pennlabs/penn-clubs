from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView
from rest_framework.schemas import get_schema_view

from .doc_settings import CustomJSONOpenAPIRenderer


admin.site.site_header = "Clubs Backend Admin"

urlpatterns = [
    path("", include("clubs.urls")),
    path(
        "",
        TemplateView.as_view(
            template_name="splash.html",
            extra_context={
                "BRANDING_SITE_NAME": settings.BRANDING_SITE_NAME,
                "DOMAIN": settings.DEFAULT_DOMAIN,
            },
        ),
        name="homepage",
    ),
    path("admin/", admin.site.urls),
    path("accounts/", include("accounts.urls", namespace="accounts")),
    path(
        "openapi/",
        get_schema_view(
            title=f"{settings.BRANDING_SITE_NAME} Documentation",
            public=True,
            renderer_classes=[CustomJSONOpenAPIRenderer],
        ),
        name="openapi-schema",
    ),
    path(
        "documentation/",
        TemplateView.as_view(
            template_name="redoc.html", extra_context={"schema_url": "openapi-schema"}
        ),
        name="documentation",
    ),
]

urlpatterns = [path("api/", include(urlpatterns))]

if settings.DEBUG:
    try:
        import debug_toolbar
    except ImportError:
        debug_toolbar = None

    if debug_toolbar is not None:
        urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]
        urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
