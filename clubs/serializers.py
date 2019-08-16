from rest_framework import serializers
from django.template.defaultfilters import slugify
from clubs.models import Club, Event, Tag, Membership


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ('id', 'name')


class MembershipSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField('get_full_name')

    def get_full_name(self, obj):
        return "{} {}".format(obj.person.first_name, obj.person.last_name)

    class Meta:
        model = Membership
        fields = ('name', 'title')


class ClubSerializer(serializers.ModelSerializer):
    id = serializers.SlugField(required=False)
    tags = TagSerializer(many=True)
    subtitle = serializers.CharField(required=False)
    members = MembershipSerializer(many=True, source='membership_set', read_only=True)

    def create(self, validated_data):
        """
        Manual create method because DRF does not support writable nested fields by default.
        """
        # assign tags to new club
        has_tags = 'tags' in validated_data

        if has_tags:
            tags = []
            for tag in validated_data.pop('tags'):
                tags.append(Tag.objects.get(**tag))

        obj = super().create(validated_data)

        if has_tags:
            obj.tags.set(tags)

        # assign user who created as owner
        Membership.objects.create(
            person=self.context['request'].user,
            club=obj,
            role=Membership.ROLE_OWNER
        )

        return obj

    def update(self, instance, validated_data):
        """
        Nested serializers don't support update by default, need to override.
        """
        has_tags = 'tags' in validated_data

        if has_tags:
            tags = []
            for tag in validated_data.pop('tags'):
                tags.append(Tag.objects.get(**tag))

        obj = super().update(instance, validated_data)

        if has_tags:
            obj.tags.set(tags)

        return obj

    def save(self):
        """
        Override save in order to replace ID with slugified name if not specified.
        """
        if 'name' in self.validated_data:
            self.validated_data['name'] = self.validated_data['name'].strip()

        if not self.validated_data.get('id') and self.validated_data.get('name'):
            self.validated_data['id'] = slugify(self.validated_data['name'])

        return super().save()

    class Meta:
        model = Club
        fields = (
            'name', 'id', 'description', 'founded', 'size', 'email', 'facebook', 'twitter', 'instagram', 'linkedin',
            'how_to_get_involved', 'tags', 'subtitle', 'application_required', 'application_available',
            'listserv_available', 'image_url', 'members'
        )


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ('name', 'club', 'start_time', 'end_time', 'location', 'url', 'image_url', 'description')
