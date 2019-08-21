from django.urls import path
from rest_framework_nested import routers

from clubs.views import (ClubViewSet, EventViewSet, FavoriteViewSet, MassInviteAPIView,
                         MemberInviteAPIView, MemberViewSet, TagViewSet, UserUpdateAPIView)


router = routers.SimpleRouter()
router.register(r'clubs', ClubViewSet, basename='clubs')
router.register(r'tags', TagViewSet)
router.register(r'favorites', FavoriteViewSet, basename='favorites')

clubs_router = routers.NestedSimpleRouter(router, r'clubs', lookup='club')
clubs_router.register(r'members', MemberViewSet, base_name='club-members')
clubs_router.register(r'events', EventViewSet, base_name='club-events')

urlpatterns = [
    path(r'settings/', UserUpdateAPIView.as_view(), name='users-detail'),
    path(r'clubs/<slug:club_pk>/invites/<slug:token>/', MemberInviteAPIView.as_view(), name='club-invites-detail'),
    path(r'clubs/<slug:club_pk>/invite/', MassInviteAPIView.as_view(), name='club-invite')
]

urlpatterns += router.urls
urlpatterns += clubs_router.urls
