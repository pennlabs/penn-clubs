from rest_framework_nested import routers
from django.urls import path
from clubs.views import ClubViewSet, TagViewSet, MemberViewSet


router = routers.SimpleRouter()
router.register(r'clubs', ClubViewSet)
router.register(r'tags', TagViewSet)

clubs_router = routers.NestedSimpleRouter(router, r'clubs', lookup='club')
clubs_router.register(r'members', MemberViewSet, base_name='club-members')

urlpatterns = [
]

urlpatterns += router.urls
urlpatterns += clubs_router.urls
