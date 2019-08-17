from rest_framework_nested import routers
from django.urls import path
from clubs.views import ClubViewSet, TagViewSet, MemberViewSet, EventViewSet


router = routers.SimpleRouter()
router.register(r'clubs', ClubViewSet, basename='clubs')
router.register(r'tags', TagViewSet)

clubs_router = routers.NestedSimpleRouter(router, r'clubs', lookup='club')
clubs_router.register(r'members', MemberViewSet, base_name='club-members')
clubs_router.register(r'events', EventViewSet, base_name='club-events')

urlpatterns = [
]

urlpatterns += router.urls
urlpatterns += clubs_router.urls
