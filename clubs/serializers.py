from rest_framework import serializers
from clubs.models import Club, Event, Tag


class ClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Club
        fields = ('name', 'id', 'description', 'founded', 'fact', 'size', 'email', 'facebook', 'tags', 'subtitle',
                  'application_required', 'accepting_applications', 'image_url')


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ('name', 'club', 'start_time', 'end_time', 'location', 'url', 'image_url', 'description')


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ('id', 'name')
