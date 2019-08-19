from django.urls import path
from rest_framework_nested import routers
from clubs.views import ClubViewSet, TagViewSet, MemberViewSet, EventViewSet, FavoriteViewSet, UserUpdateAPIView


router = routers.SimpleRouter()
router.register(r'clubs', ClubViewSet, basename='clubs')
router.register(r'tags', TagViewSet)
router.register(r'favorites', FavoriteViewSet, basename='favorites')

clubs_router = routers.NestedSimpleRouter(router, r'clubs', lookup='club')
clubs_router.register(r'members', MemberViewSet, base_name='club-members')
clubs_router.register(r'events', EventViewSet, base_name='club-events')

urlpatterns = [
    path(r'settings/', UserUpdateAPIView.as_view(), name='users-detail')
]

urlpatterns += router.urls
urlpatterns += clubs_router.urls
