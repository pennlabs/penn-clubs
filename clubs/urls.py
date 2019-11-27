
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from rest_framework_nested import routers

from clubs.views import (AssetViewSet, ClubReportViewSet, ClubViewSet, EventViewSet, FavoriteViewSet, MajorViewSet,
                         MassInviteAPIView, MemberInviteViewSet, MemberViewSet, NoteViewSet, SchoolViewSet,
                         SubscribeViewSet, TagViewSet, UserUpdateAPIView, YearViewSet, email_preview)


router = routers.SimpleRouter()
router.register(r'clubs', ClubViewSet, basename='clubs')
router.register(r'tags', TagViewSet)
router.register(r'favorites', FavoriteViewSet, basename='favorites')
router.register(r'subscribe', SubscribeViewSet, basename='subscribe')
router.register(r'reports', ClubReportViewSet)

router.register(r'schools', SchoolViewSet, basename='schools')
router.register(r'majors', MajorViewSet, basename='majors')
router.register(r'years', YearViewSet, basename='years')

clubs_router = routers.NestedSimpleRouter(router, r'clubs', lookup='club')
clubs_router.register(r'members', MemberViewSet, basename='club-members')
clubs_router.register(r'events', EventViewSet, basename='club-events')
clubs_router.register(r'invites', MemberInviteViewSet, basename='club-invites')
clubs_router.register(r'assets', AssetViewSet, basename='club-assets')
clubs_router.register(r'notes', NoteViewSet, basename='club-notes')

urlpatterns = [
    path(r'settings/', UserUpdateAPIView.as_view(), name='users-detail'),
    path(r'clubs/<slug:club_code>/invite/', MassInviteAPIView.as_view(), name='club-invite'),
    path(r'emailpreview/', email_preview, name='email-preview'),
]

urlpatterns += router.urls
urlpatterns += clubs_router.urls

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
