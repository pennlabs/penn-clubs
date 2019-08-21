from urllib.parse import urlparse

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.template.defaultfilters import slugify
from rest_framework import serializers

from clubs.models import Club, Event, Favorite, Membership, MembershipInvite, Tag
from clubs.utils import clean


class TagSerializer(serializers.ModelSerializer):
    clubs = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = ('id', 'name', 'clubs')


class MembershipInviteSerializer(serializers.ModelSerializer):
    id = serializers.CharField(max_length=8, read_only=True)
    email = serializers.EmailField(read_only=True)
    token = serializers.CharField(max_length=128, write_only=True)

    def update(self, instance, validated_data):
        user = self.context['request'].user

        if not self.validated_data.get('token') == self.instance.token:
            raise serializers.ValidationError('Missing or invalid token in request!')

        if self.instance.email.endswith('.upenn.edu'):
            invite_username = self.instance.email.rsplit('@', 1)[0]
            if not invite_username.lower() == user.username.lower():
                raise serializers.ValidationError('This invitation was meant for "{}", but you are logged in as "{}"!'
                                                  .format(invite_username, user.username))

        instance.claim(user)
        return instance

    class Meta:
        model = MembershipInvite
        fields = ['email', 'token', 'id']


class UserMembershipSerializer(serializers.ModelSerializer):
    """
    Used for listing which clubs a user is in.
    """
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
        fields = ('id', 'name', 'title', 'role', 'role_display', 'active')


class MembershipSerializer(serializers.ModelSerializer):
    """
    Used for listing which users are in a club.
    """
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
        user = self.context['request'].user
        mem_user_id = self.instance.person.id if self.instance else self.initial_data['person']
        club_pk = self.context['view'].kwargs.get('club_pk')
        membership = Membership.objects.filter(person=user, club=club_pk).first()
        if user.is_superuser:
            return value
        if membership is None:
            raise serializers.ValidationError('You must be a member of this club to modify roles!')
        if membership.role > value:
            raise serializers.ValidationError('You cannot promote someone above your own level.')
        if value > Membership.ROLE_OWNER and user.id == mem_user_id:
            if Membership.objects.filter(club=club_pk, role__lte=Membership.ROLE_OWNER).count() <= 1:
                raise serializers.ValidationError('You cannot demote yourself if you are the only owner!')
        return value

    def save(self):
        if 'club' not in self.validated_data:
            self.validated_data['club'] = Club.objects.get(pk=self.context['view'].kwargs.get('club_pk'))

        return super().save()

    class Meta:
        model = Membership
        fields = ['name', 'title', 'person', 'role', 'active']


class AuthenticatedMembershipSerializer(MembershipSerializer):
    """
    Provides additional information about members, such as email address.
    Should only be available to users in the club.
    """
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
            raise serializers.ValidationError('A club with that name already exists.')

        return value

    def validate_description(self, value):
        """
        Allow the description to have HTML tags that come from a whitelist.
        """
        return clean(value)

    def validate_facebook(self, value):
        """
        Ensure that URL is actually a Facebook link.
        """
        if value:
            parsed = urlparse(value)
            return 'https://www.facebook.com{}'.format(
                parsed.path if parsed.path.startswith('/') else '/groups/{}/'.format(parsed.path)
            )
        return value

    def validate_twitter(self, value):
        """
        Ensure that URL is actually a Twitter link.
        """
        if value:
            parsed = urlparse(value)
            return 'https://twitter.com{}'.format(
                parsed.path if parsed.path.startswith('/') else '/{}'.format(parsed.path)
            )
        return value

    def validate_instagram(self, value):
        """
        Ensure that the URL is actually a instagram link.
        """
        if value:
            parsed = urlparse(value)
            return 'https://www.instagram.com{}'.format(
                parsed.path if parsed.path.startswith('/') else '/{}/'.format(parsed.path)
            )
        return value

    def validate_linkedin(self, value):
        """
        Ensure that URL is actually a LinkedIn URL. Attempt to convert into correct format with limited information.
        """
        if value:
            parsed = urlparse(value)
            return 'https://www.linkedin.com{}'.format(
                parsed.path if parsed.path.startswith('/') else '/company/{}/'.format(parsed.path)
            )
        return value

    def validate_github(self, value):
        """
        Ensure that URL is actually a GitHub URL.
        """
        if value:
            parsed = urlparse(value)
            return 'https://github.com{}'.format(
                parsed.path if parsed.path.startswith('/') else '/{}'.format(parsed.path)
            )
        return value

    def validate_active(self, value):
        """
        Only owners and superusers may change the active status of a club.
        """
        user = self.context['request'].user
        club_pk = self.context['view'].kwargs.get('pk')
        membership = Membership.objects.filter(person=user, club=club_pk).first()
        if (membership and membership.role <= Membership.ROLE_OWNER) or user.is_superuser:
            return value
        raise serializers.ValidationError('You do not have permissions to change the active status of the club.')

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
        fields = [
            'name', 'id', 'description', 'founded', 'size', 'email', 'facebook', 'twitter', 'instagram', 'linkedin',
            'github', 'website', 'how_to_get_involved', 'tags', 'subtitle', 'application_required',
            'application_available', 'listserv_available', 'image_url', 'members', 'favorite_count', 'active'
        ]


class AuthenticatedClubSerializer(ClubSerializer):
    """
    Provides additional information about the club to members in the club.
    """
    members = AuthenticatedMembershipSerializer(many=True, source='membership_set', read_only=True)

    class Meta:
        model = ClubSerializer.Meta.model
        fields = ClubSerializer.Meta.fields


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
            raise serializers.ValidationError('You have already favorited this club!')

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
    is_superuser = serializers.BooleanField(read_only=True)

    def get_full_name(self, obj):
        return obj.get_full_name()

    class Meta:
        model = get_user_model()
        fields = ('username', 'name', 'email', 'membership_set', 'favorite_set', 'is_superuser')
