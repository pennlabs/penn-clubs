from rest_framework_nested import routers
from django.urls import path
from clubs.views import splash, ClubViewSet, TagViewSet, MemberViewSet, EventViewSet, FavoriteViewSet

from django.views.generic import TemplateView
from rest_framework.schemas import get_schema_view


router = routers.SimpleRouter()
router.register(r'clubs', ClubViewSet, basename='clubs')
router.register(r'tags', TagViewSet)
router.register(r'favorites', FavoriteViewSet, basename='favorites')

clubs_router = routers.NestedSimpleRouter(router, r'clubs', lookup='club')
clubs_router.register(r'members', MemberViewSet, base_name='club-members')
clubs_router.register(r'events', EventViewSet, base_name='club-events')

urlpatterns = [
    path('', splash, name='homepage'),
    path('openapi/', get_schema_view(
        title='Clubs Backend Documentation'
    ), name='openapi-schema'),
    path('documentation/', TemplateView.as_view(
        template_name='redoc.html',
        extra_context={'schema_url': 'openapi-schema'}
    ), name='documentation'),
]

urlpatterns += router.urls
urlpatterns += clubs_router.urls
