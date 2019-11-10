from urllib.parse import urlparse

from django.contrib.auth import get_user_model
from django.template.defaultfilters import slugify
from rest_framework import serializers, validators

from clubs.models import Asset, Badge, Club, Event, Favorite, Membership, MembershipInvite, Tag
from clubs.utils import clean


class TagSerializer(serializers.ModelSerializer):
    clubs = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = ('id', 'name', 'clubs')


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ('id', 'label', 'color', 'description')


class MembershipInviteSerializer(serializers.ModelSerializer):
    id = serializers.CharField(max_length=8, read_only=True)
    email = serializers.EmailField(read_only=True)
    token = serializers.CharField(max_length=128, write_only=True)
    name = serializers.CharField(source='club.name', read_only=True)

    def update(self, instance, validated_data):
        user = self.context['request'].user

        if not self.validated_data.get('token') == self.instance.token:
            raise serializers.ValidationError('Missing or invalid token in request!')

        if self.instance.email.endswith('.upenn.edu') and self.instance.club.membership_set.count() > 0:
            invite_username = self.instance.email.rsplit('@', 1)[0]
            if not invite_username.lower() == user.username.lower():
                raise serializers.ValidationError('This invitation was meant for "{}", but you are logged in as "{}"!'
                                                  .format(invite_username, user.username))

        instance.claim(user)
        return instance

    class Meta:
        model = MembershipInvite
        fields = ['email', 'token', 'id', 'name']


class UserMembershipSerializer(serializers.ModelSerializer):
    """
    Used for listing which clubs a user is in.
    """
    code = serializers.SlugField(source='club.code', read_only=True)
    name = serializers.CharField(source='club.name', read_only=True)
    role_display = serializers.SerializerMethodField('get_role_display')

    def get_role_display(self, obj):
        return obj.get_role_display()

    class Meta:
        model = Membership
        fields = ('code', 'name', 'title', 'role', 'role_display', 'active', 'public')


class MembershipSerializer(serializers.ModelSerializer):
    """
    Used for listing which users are in a club for members who are not in the club.
    """
    name = serializers.SerializerMethodField('get_full_name')
    person = serializers.PrimaryKeyRelatedField(queryset=get_user_model().objects.all(), write_only=True)
    role = serializers.IntegerField(write_only=True, required=False)
    image = serializers.SerializerMethodField('get_image')

    def get_full_name(self, obj):
        if not obj.public:
            return 'Anonymous'
        return obj.person.get_full_name()

    def get_image(self, obj):
        if not obj.public:
            return None
        if not obj.person.profile.image:
            return None
        image_url = obj.person.profile.image.url
        if image_url.startswith('http'):
            return image_url
        else:
            return self.context['request'].build_absolute_uri(image_url)

    def validate_role(self, value):
        """
        Ensure that users cannot promote themselves to a higher role.
        Also ensure that owners can't demote themselves without leaving another owner.
        """
        user = self.context['request'].user
        mem_user_id = self.instance.person.id if self.instance else self.initial_data['person']
        club_code = self.context['view'].kwargs.get('club_code', self.context['view'].kwargs.get('code'))
        membership = Membership.objects.filter(person=user, club__code=club_code).first()
        if user.is_superuser:
            return value
        if membership is None:
            raise serializers.ValidationError('You must be a member of this club to modify roles!')
        if membership.role > value:
            raise serializers.ValidationError('You cannot promote someone above your own level.')
        if value > Membership.ROLE_OWNER and user.id == mem_user_id:
            if Membership.objects.filter(club__code=club_code, role__lte=Membership.ROLE_OWNER).count() <= 1:
                raise serializers.ValidationError('You cannot demote yourself if you are the only owner!')
        return value

    def validate(self, data):
        """
        Normal members can only change a small subset of information.
        """
        user = self.context['request'].user
        club_code = self.context['view'].kwargs.get('club_code', self.context['view'].kwargs.get('code'))

        membership = Membership.objects.filter(person=user, club__code=club_code).first()

        if membership is None or membership.role > Membership.ROLE_OFFICER:
            for field in data:
                if field not in ['public']:
                    raise serializers.ValidationError('Normal members are not allowed to change "{}"!'.format(field))
        return data

    def save(self):
        if 'club' not in self.validated_data:
            club_code = self.context['view'].kwargs.get('club_code')
            if club_code is None:
                club_code = self.context['view'].kwargs.get('pk')
            self.validated_data['club'] = Club.objects.get(code=club_code)

        return super().save()

    class Meta:
        model = Membership
        fields = ['name', 'title', 'person', 'role', 'active', 'public', 'image']
        validators = [validators.UniqueTogetherValidator(queryset=Membership.objects.all(), fields=['person', 'club'])]


class AuthenticatedMembershipSerializer(MembershipSerializer):
    """
    Provides additional information about members, such as email address.
    Should only be available to users in the club.
    """
    role = serializers.IntegerField(required=False)
    email = serializers.EmailField(source='person.email', read_only=True)
    username = serializers.CharField(source='person.username', read_only=True)

    def get_full_name(self, obj):
        return obj.person.get_full_name()

    class Meta:
        model = Membership
        fields = MembershipSerializer.Meta.fields + ['email', 'username']


class ClubListSerializer(serializers.ModelSerializer):
    """
    The club list serializer returns a subset of the information that the full serializer returns.
    This is done for a quicker response.
    """
    code = serializers.SlugField(required=False, validators=[validators.UniqueValidator(queryset=Club.objects.all())])
    name = serializers.CharField(validators=[validators.UniqueValidator(queryset=Club.objects.all())])
    subtitle = serializers.CharField(required=False)
    tags = TagSerializer(many=True)
    image_url = serializers.SerializerMethodField('get_image_url')
    favorite_count = serializers.IntegerField(read_only=True)

    def get_image_url(self, obj):
        if not obj.image:
            return None
        if obj.image.url.startswith('http'):
            return obj.image.url
        else:
            return self.context['request'].build_absolute_uri(obj.image.url)

    class Meta:
        model = Club
        fields = [
            'name', 'code', 'description', 'founded', 'size', 'email', 'tags', 'subtitle',
            'application_required', 'accepting_members', 'image_url', 'favorite_count', 'active'
        ]


class ClubSerializer(ClubListSerializer):
    members = MembershipSerializer(many=True, source='membership_set', read_only=True)
    image = serializers.ImageField(write_only=True, required=False)
    parent_orgs = serializers.SerializerMethodField('get_parent_orgs')
    badges = BadgeSerializer(many=True, required=False)

    def get_parent_orgs(self, obj):
        return []
        # return [c.slug for c in obj.parent_orgs.all()]

    def create(self, validated_data):
        """
        Manual create method because DRF does not support writable nested fields by default.
        """
        # assign tags to new club
        tags = None
        parent_orgs = None
        badges = None

        if 'tags' in validated_data:
            tags = []
            for tag in validated_data.pop('tags'):
                tags.append(Tag.objects.get(**tag))

        # Don't let clubs add parent orgs for now; they will be added through the admin
        # interface.

        # if 'parent_orgs' in validated_data:
        #     parent_orgs = []
        #     for parent_org in validated_data.pop('parent_orgs'):
        #         parent_orgs.append(Club.objects.get(**parent_org))

        if 'badges' in validated_data:
            badges = []
            for badge in validated_data.pop('badges'):
                badges.append(Badge.objects.get(**badge))

        # Note: it's important that all nested fields are POPPED from the validated data at this point. Otherwise,
        # DRF will throw an error calling create on the superclass.
        obj = super().create(validated_data)

        if tags is not None:
            obj.tags.set(tags)

        if parent_orgs is not None:
            obj.parent_orgs.set(parent_orgs)

        if badges is not None:
            obj.badges.set(badges)

        # assign user who created as owner
        Membership.objects.create(
            person=self.context['request'].user,
            club=obj,
            role=Membership.ROLE_OWNER
        )

        return obj

    def validate_badges(self, value):
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
        club_code = self.context['view'].kwargs.get('pk')
        membership = Membership.objects.filter(person=user, club__code=club_code).first()
        if (membership and membership.role <= Membership.ROLE_OWNER) or user.is_superuser:
            return value
        raise serializers.ValidationError('You do not have permissions to change the active status of the club.')

    def update(self, instance, validated_data):
        """
        Nested serializers don't support update by default, need to override.
        """

        tags = None
        parent_orgs = None
        badges = None

        if 'tags' in validated_data:
            tags = []
            for tag in validated_data.pop('tags'):
                tags.append(Tag.objects.get(**tag))

        # Don't let clubs add parent orgs for now; they will be added through the admin
        # interface.

        # if 'parent_orgs' in validated_data:
        #     parent_orgs = []
        #     for parent_org in validated_data.pop('parent_orgs'):
        #         parent_orgs.append(Club.objects.get(**parent_org))

        if 'badges' in validated_data:
            badges = []
            for badge in validated_data.pop('badges'):
                badges.append(Badge.objects.get(**badge))

        # Note: it's important that all nested fields are POPPED from the validated data at this point. Otherwise,
        # DRF will throw an error calling create on the superclass.
        obj = super().update(instance, validated_data)

        if tags is not None:
            obj.tags.set(tags)

        if parent_orgs is not None:
            obj.parent_orgs.set(parent_orgs)

        if badges is not None:
            obj.badges.set(badges)

        return obj

    def save(self):
        """
        Override save in order to replace ID with slugified name if not specified.
        """
        if 'name' in self.validated_data:
            self.validated_data['name'] = self.validated_data['name'].strip()

        if not self.instance:
            if not self.validated_data.get('code') and self.validated_data.get('name'):
                self.validated_data['code'] = slugify(self.validated_data['name'])
        elif 'code' in self.validated_data:
            del self.validated_data['code']

        return super().save()

    class Meta(ClubListSerializer.Meta):
        fields = ClubListSerializer.Meta.fields + [
            'facebook', 'twitter', 'instagram', 'linkedin',
            'github', 'website', 'how_to_get_involved',
            'listserv', 'members', 'parent_orgs',
            'badges', 'image'
        ]


class AuthenticatedClubSerializer(ClubSerializer):
    """
    Provides additional information about the club to members in the club.
    """
    members = AuthenticatedMembershipSerializer(many=True, source='membership_set', read_only=True)

    class Meta(ClubSerializer.Meta):
        model = ClubSerializer.Meta.model
        fields = ClubSerializer.Meta.fields


class EventSerializer(serializers.ModelSerializer):
    id = serializers.SlugField(required=False)
    club = serializers.SlugRelatedField(queryset=Club.objects.all(), required=False, slug_field='code')
    image = serializers.ImageField(write_only=True, required=False)
    image_url = serializers.SerializerMethodField('get_image_url')
    creator = serializers.HiddenField(default=serializers.CurrentUserDefault())

    def get_image_url(self, obj):
        if not obj.image:
            return None
        if obj.image.url.startswith('http'):
            return obj.image.url
        else:
            return self.context['request'].build_absolute_uri(obj.image.url)

    def validate_description(self, value):
        """
        Allow the description to have HTML tags that come from a whitelist.
        """
        return clean(value)

    def save(self):
        if 'club' not in self.validated_data:
            self.validated_data['club'] = Club.objects.get(code=self.context['view'].kwargs.get('club_code'))

        if not self.validated_data.get('code') and self.validated_data.get('name'):
            self.validated_data['code'] = slugify(self.validated_data['name'])

        return super().save()

    class Meta:
        model = Event
        fields = ('id', 'name', 'club', 'creator', 'start_time', 'end_time', 'location', 'url',
                  'image_url', 'description', 'image')


class FavoriteSerializer(serializers.ModelSerializer):
    person = serializers.HiddenField(default=serializers.CurrentUserDefault())
    club = serializers.SlugRelatedField(queryset=Club.objects.all(), slug_field='code')
    name = serializers.CharField(source='club.name', read_only=True)

    class Meta:
        model = Favorite
        fields = ('club', 'name', 'person')
        validators = [validators.UniqueTogetherValidator(queryset=Favorite.objects.all(), fields=['club', 'person'])]

#Subscribe Serializer
class SubscribeSerializer(serializers.ModelSerializer):
    person = serializers.HiddenField(default=serializers.CurrentUserDefault())
    club = serializers.SlugRelatedField(queryset=Club.objects.all(), slug_field='code')
    name = serializers.CharField(source='club.name', read_only=True)



class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    name = serializers.SerializerMethodField('get_full_name')
    membership_set = UserMembershipSerializer(many=True, read_only=True)
    favorite_set = FavoriteSerializer(many=True, read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
    image = serializers.ImageField(source='profile.image', write_only=True)
    image_url = serializers.SerializerMethodField('get_image_url')

    def get_image_url(self, obj):
        if not obj.profile.image:
            return None
        if obj.profile.image.url.startswith('http'):
            return obj.profile.image.url
        else:
            return self.context['request'].build_absolute_uri(obj.profile.image.url)

    def get_full_name(self, obj):
        return obj.get_full_name()

    def update(self, instance, validated_data):
        if 'profile' in validated_data:
            profile_fields = validated_data.pop('profile')
            profile = instance.profile
            valid_fields = {'image'}
            for key, value in profile_fields.items():
                if key in valid_fields:
                    setattr(profile, key, value)
            profile.save()

        return super().update(instance, validated_data)

    class Meta:
        model = get_user_model()
        fields = ('username', 'name', 'email', 'membership_set', 'favorite_set', 'is_superuser', 'image_url', 'image')


class AssetSerializer(serializers.ModelSerializer):
    creator = serializers.HiddenField(default=serializers.CurrentUserDefault())
    file_url = serializers.SerializerMethodField('get_file_url')
    file = serializers.FileField(write_only=True)

    def get_file_url(self, obj):
        if not obj.file:
            return None
        if obj.file.url.startswith('http'):
            return obj.file.url
        else:
            return self.context['request'].build_absolute_uri(obj.file.url)

    class Meta:
        model = Asset
        fields = ('id', 'file_url', 'file', 'creator')
