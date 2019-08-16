from django.urls import path
from clubs.views import ClubViewSet, TagViewSet

urlpatterns = [
    path("clubs/", ClubViewSet.as_view({
        'get': 'list',
        'post': 'create'
    })),
    path("clubs/<slug:pk>/", ClubViewSet.as_view({
        'get': 'retrieve',
        'post': 'partial_update',
        'delete': 'destroy'
    })),
    path("tags/", TagViewSet.as_view({
        'get': 'list'
    })),
]
