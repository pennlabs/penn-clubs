from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework.schemas import get_schema_view

from clubs.views import splash

admin.site.site_header = "Clubs Backend Admin"

urlpatterns = [
    path('', include('clubs.urls')),
    path('', splash, name='homepage'),
    path('openapi/', get_schema_view(
        title='Clubs Backend Documentation'
    ), name='openapi-schema'),
    path('documentation/', TemplateView.as_view(
        template_name='redoc.html',
        extra_context={'schema_url': 'openapi-schema'}
    ), name='documentation'),
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls', namespace='accounts')),
]
