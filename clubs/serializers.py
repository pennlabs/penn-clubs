from rest_framework import serializers
from django.template.defaultfilters import slugify
from django.contrib.auth import get_user_model
from django.db.models import Q
from clubs.models import Club, Event, Tag, Membership, Favorite
from clubs.utils import clean


class TagSerializer(serializers.ModelSerializer):
    clubs = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = ('id', 'name', 'clubs')


class UserMembershipSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField('get_id')
    name = serializers.SerializerMethodField('get_name')
    role_display = serializers.SerializerMethodField('get_role_display')

    def get_id(self, obj):
        return obj.club.id

    def get_name(self, obj):
        return obj.club.name

    def get_role_display(self, obj):
        return obj.get_role_display()

    class Meta:
        model = Membership
        fields = ('id', 'name', 'title', 'role', 'role_display')


class MembershipSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField('get_full_name')
    person = serializers.PrimaryKeyRelatedField(queryset=get_user_model().objects.all(), write_only=True)
    role = serializers.IntegerField(write_only=True, required=False)

    def get_full_name(self, obj):
        return obj.person.get_full_name()

    def validate_role(self, value):
        """
        Ensure that users cannot promote themselves to a higher role.
        Also ensure that owners can't demote themselves without leaving another owner.
        """
        club_pk = self.context['view'].kwargs.get('club_pk')
        membership = Membership.objects.filter(person=self.context['request'].user, club=club_pk).first()
        if membership is None:
            return value
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
        fields = ['name', 'title', 'person', 'role']


class AuthenticatedMembershipSerializer(MembershipSerializer):
    role = serializers.IntegerField(required=False)
    email = serializers.SerializerMethodField('get_email')
    username = serializers.SerializerMethodField('get_username')

    def get_email(self, obj):
        return obj.person.email

    def get_username(self, obj):
        return obj.person.username

    class Meta:
        model = Membership
        fields = MembershipSerializer.Meta.fields + ['email', 'username']


class ClubSerializer(serializers.ModelSerializer):
    id = serializers.SlugField(required=False)
    tags = TagSerializer(many=True)
    subtitle = serializers.CharField(required=False)
    members = MembershipSerializer(many=True, source='membership_set', read_only=True)
    favorite_count = serializers.IntegerField(read_only=True)

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

    def validate_name(self, value):
        """
        Ensure that the club name is unique.
        """
        value = value.strip()
        same_clubs = Club.objects.filter(Q(name__iexact=value) | Q(id=slugify(value)))

        if same_clubs.exists() and not same_clubs.first() == self.instance:
            raise serializers.ValidationError("A club with that name already exists.")

        return value

    def validate_description(self, value):
        """
        Allow the description to have HTML tags that come from a whitelist.
        """
        return clean(value)

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

        if not self.instance:
            if not self.validated_data.get('id') and self.validated_data.get('name'):
                self.validated_data['id'] = slugify(self.validated_data['name'])
        elif 'id' in self.validated_data:
            del self.validated_data['id']

        return super().save()

    class Meta:
        model = Club
        fields = (
            'name', 'id', 'description', 'founded', 'size', 'email', 'facebook', 'twitter', 'instagram', 'linkedin',
            'website', 'how_to_get_involved', 'tags', 'subtitle', 'application_required', 'application_available',
            'listserv_available', 'image_url', 'members', 'favorite_count'
        )


class EventSerializer(serializers.ModelSerializer):
    id = serializers.SlugField(required=False)
    club = serializers.PrimaryKeyRelatedField(queryset=Club.objects.all(), required=False)

    class Meta:
        model = Event
        fields = ('id', 'name', 'club', 'start_time', 'end_time', 'location', 'url', 'image_url', 'description')

    def validate_description(self, value):
        """
        Allow the description to have HTML tags that come from a whitelist.
        """
        return clean(value)

    def save(self):
        if 'club' not in self.validated_data:
            self.validated_data['club'] = Club.objects.get(pk=self.context['view'].kwargs.get('club_pk'))

        if not self.validated_data.get('id') and self.validated_data.get('name'):
            self.validated_data['id'] = slugify(self.validated_data['name'])

        self.validated_data['creator'] = self.context['request'].user

        return super().save()


class FavoriteSerializer(serializers.ModelSerializer):
    club = serializers.PrimaryKeyRelatedField(queryset=Club.objects.all())
    name = serializers.SerializerMethodField('get_name')

    def save(self):
        self.validated_data['person'] = self.context['request'].user

        return super().save()

    def validate_club(self, value):
        """
        Ensure that the user has not already favorited this club.
        """
        if self.context['request'].user.favorite_set.filter(club=value).exists():
            raise serializers.ValidationError("You have already favorited this club!")

        return value

    def get_name(self, obj):
        return obj.club.name

    class Meta:
        model = Favorite
        fields = ('club', 'name')


class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    name = serializers.SerializerMethodField('get_full_name')
    membership_set = UserMembershipSerializer(many=True, read_only=True)
    favorite_set = FavoriteSerializer(many=True, read_only=True)

    def get_full_name(self, obj):
        return obj.get_full_name()

    class Meta:
        model = get_user_model()
        fields = ('username', 'name', 'email', 'membership_set', 'favorite_set')
