from django.urls import path
from clubs.views import ClubViewSet

urlpatterns = [
    path("", ClubViewSet.as_view({'get': 'list'})),
    path("<slug:pk>/", ClubViewSet.as_view({'get': 'retrieve'})),
]
