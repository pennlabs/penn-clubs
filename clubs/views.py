from rest_framework import viewsets
from clubs.models import Club, Event
from clubs.serializers import ClubSerializer


class ClubViewSet(viewsets.ModelViewSet):
    """
    retrieve:
    Return a single club.
    list:
    Return a list of clubs.
    """
    queryset = Club.objects.all()
    serializer_class = ClubSerializer
    http_method_names = ['get']
