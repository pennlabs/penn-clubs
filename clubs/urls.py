from django.urls import path
from clubs.views import ClubViewSet, TagViewSet

urlpatterns = [
    path("clubs/", ClubViewSet.as_view({'get': 'list'})),
    path("clubs/<slug:pk>/", ClubViewSet.as_view({'get': 'retrieve'})),
    path("tags/", TagViewSet.as_view({'get': 'list'})),
]
