from django.urls import path
from rest_framework_nested import routers

from clubs.views import (
    AssetViewSet,
    ClubViewSet,
    EventViewSet,
    FavoriteViewSet,
    MajorViewSet,
    MassInviteAPIView,
    MemberInviteViewSet,
    MembershipRequestOwnerViewSet,
    MembershipRequestViewSet,
    MembershipViewSet,
    MemberViewSet,
    NoteViewSet,
    QuestionAnswerViewSet,
    ReportViewSet,
    SchoolViewSet,
    SubscribeViewSet,
    TagViewSet,
    TestimonialViewSet,
    UserUpdateAPIView,
    YearViewSet,
    email_preview,
    fair_jwt_generator,
)


router = routers.SimpleRouter()
router.register(r"clubs", ClubViewSet, basename="clubs")
router.register(r"tags", TagViewSet, basename="tags")
router.register(r"favorites", FavoriteViewSet, basename="favorites")
router.register(r"subscriptions", SubscribeViewSet, basename="subscribes")
router.register(r"memberships", MembershipViewSet, basename="members")
router.register(r"requests", MembershipRequestViewSet, basename="requests")

router.register(r"schools", SchoolViewSet, basename="schools")
router.register(r"majors", MajorViewSet, basename="majors")
router.register(r"reports", ReportViewSet, basename="reports")
router.register(r"years", YearViewSet, basename="years")

clubs_router = routers.NestedSimpleRouter(router, r"clubs", lookup="club")
clubs_router.register(r"members", MemberViewSet, basename="club-members")
clubs_router.register(r"events", EventViewSet, basename="club-events")
clubs_router.register(r"invites", MemberInviteViewSet, basename="club-invites")
clubs_router.register(r"assets", AssetViewSet, basename="club-assets")
clubs_router.register(r"notes", NoteViewSet, basename="club-notes")
clubs_router.register(r"testimonials", TestimonialViewSet, basename="club-testimonials")
clubs_router.register(r"questions", QuestionAnswerViewSet, basename="club-questions")
clubs_router.register(
    r"membershiprequests", MembershipRequestOwnerViewSet, basename="club-membership-requests"
)

urlpatterns = [
    path(r"settings/", UserUpdateAPIView.as_view(), name="users-detail"),
    path(r"clubs/<slug:club_code>/invite/", MassInviteAPIView.as_view(), name="club-invite"),
    path(r"emailpreview/", email_preview, name="email-preview"),
    path(r"fair/jwt/", fair_jwt_generator, name="jwt-generator"),
]

urlpatterns += router.urls
urlpatterns += clubs_router.urls
