from rest_framework import viewsets
from clubs.models import Club, Event, Tag
from clubs.serializers import ClubSerializer, TagSerializer


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


class TagViewSet(viewsets.ModelViewSet):
    """
    Return a list of tags.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    http_method_names = ['get']
