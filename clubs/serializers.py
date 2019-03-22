from rest_framework import serializers
from clubs.models import Club, Event


class ClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ('name', 'id', 'description', 'founded', 'fact', 'size', 'email', 'facebook', 'tags', 'subtitle')


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ('name', 'club', 'start_time', 'end_time', 'location', 'url', 'image_url', 'description')
