from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView
from rest_framework.schemas import get_schema_view


admin.site.site_header = 'Clubs Backend Admin'

urlpatterns = [
    path('', include('clubs.urls')),
    path('', TemplateView.as_view(template_name='splash.html'), name='homepage'),
    path('openapi/', get_schema_view(
        title='Clubs Backend Documentation',
        public=settings.DEBUG
    ), name='openapi-schema'),
    path('documentation/', TemplateView.as_view(
        template_name='redoc.html',
        extra_context={'schema_url': 'openapi-schema'}
    ), name='documentation'),
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls', namespace='accounts')),
    path('test_s', include('clubs.urls'))
]

