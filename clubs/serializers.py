from rest_framework import serializers
from django.template.defaultfilters import slugify
from users.models import Person
from clubs.models import Club, Event, Tag, Membership


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ('id', 'name')


class MembershipSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField('get_full_name')
    person = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), write_only=True)
    role = serializers.IntegerField(write_only=True, required=False)

    def get_full_name(self, obj):
        return obj.person.full_name

    def validate_role(self, value):
        club_pk = self.context['view'].kwargs.get('club_pk')
        membership = Membership.objects.get(person=self.context['request'].user, club=club_pk)
        if membership.role > value:
            raise serializers.ValidationError('You cannot promote someone above your own level.')
        if value > Membership.ROLE_OWNER and self.context['request'].user.username == self.context['view'].kwargs.get('person__username'):
            if Membership.objects.filter(club=club_pk, role__lte=Membership.ROLE_OWNER).count() <= 1:
                raise serializers.ValidationError('You cannot demote yourself if you are the only owner!')
        return value

    def save(self):
        if 'club' not in self.validated_data:
            self.validated_data['club'] = Club.objects.get(pk=self.context['view'].kwargs.get('club_pk'))

        return super().save()

    class Meta:
        model = Membership
        fields = ('name', 'title', 'person', 'role')


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
