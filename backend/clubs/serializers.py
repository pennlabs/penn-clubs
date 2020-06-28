from urllib.parse import urlparse

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.template.defaultfilters import slugify
from django.utils import timezone
from rest_framework import serializers, validators

from clubs.mixins import ManyToManySaveMixin
from clubs.models import (
    Asset,
    Badge,
    Club,
    Event,
    Favorite,
    Major,
    Membership,
    MembershipInvite,
    MembershipRequest,
    Note,
    NoteTag,
    Profile,
    QuestionAnswer,
    Report,
    School,
    Subscribe,
    Tag,
    Testimonial,
    Year,
)
from clubs.utils import clean


class ClubRouteMixin(object):
    """
    Mixin for serializers that overrides the save method to
    properly handle the URL parameter for club.
    """

    def save(self):
        self.validated_data["club"] = Club.objects.get(
            code=self.context["view"].kwargs.get("club_code")
        )

        return super().save()


class TagSerializer(serializers.ModelSerializer):
    clubs = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = ("id", "name", "clubs")


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ("id", "label", "color", "description")


class SchoolSerializer(serializers.ModelSerializer):
    name = serializers.CharField()

    class Meta:
        model = School
        fields = ("id", "name")


class MajorSerializer(serializers.ModelSerializer):
    name = serializers.CharField()

    class Meta:
        model = Major
        fields = ("id", "name")


class TestimonialSerializer(ClubRouteMixin, serializers.ModelSerializer):
    text = serializers.CharField()

    class Meta:
        model = Testimonial
        fields = ("id", "text")


class QuestionAnswerSerializer(ClubRouteMixin, serializers.ModelSerializer):
    author = serializers.SerializerMethodField("get_author_name")
    responder = serializers.SerializerMethodField("get_responder_name")
    is_anonymous = serializers.BooleanField(write_only=True)

    def get_author_name(self, obj):
        if obj.is_anonymous or obj.author is None:
            return "Anonymous"
        return obj.author.get_full_name()

    def get_responder_name(self, obj):
        if obj.responder is None:
            return obj.club.name
        return obj.responder.get_full_name()

    class Meta:
        model = QuestionAnswer
        fields = ("id", "question", "answer", "author", "responder", "is_anonymous")


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ("id", "name", "description", "parameters")


class YearSerializer(serializers.ModelSerializer):
    name = serializers.CharField()
    year = serializers.ReadOnlyField()

    class Meta:
        model = Year
        fields = ("id", "name", "year")


class EventSerializer(serializers.ModelSerializer):
    id = serializers.SlugField(required=False)
    club = serializers.SlugRelatedField(
        queryset=Club.objects.all(), required=False, slug_field="code"
    )
    image = serializers.ImageField(write_only=True, required=False)
    image_url = serializers.SerializerMethodField("get_image_url")
    creator = serializers.HiddenField(default=serializers.CurrentUserDefault())

    def get_image_url(self, obj):
        if not obj.image:
            return None
        if obj.image.url.startswith("http"):
            return obj.image.url
        elif "request" in self.context:
            return self.context["request"].build_absolute_uri(obj.image.url)
        else:
            return obj.image.url

    def validate_description(self, value):
        """
        Allow the description to have HTML tags that come from a whitelist.
        """
        return clean(value)

    def save(self):
        if "club" not in self.validated_data:
            self.validated_data["club"] = Club.objects.get(
                code=self.context["view"].kwargs.get("club_code")
            )

        if not self.validated_data.get("code") and self.validated_data.get("name"):
            self.validated_data["code"] = slugify(self.validated_data["name"])

        return super().save()

    class Meta:
        model = Event
        fields = (
            "id",
            "name",
            "club",
            "creator",
            "start_time",
            "end_time",
            "location",
            "url",
            "type",
            "image_url",
            "description",
            "image",
        )


class MembershipInviteSerializer(serializers.ModelSerializer):
    id = serializers.CharField(max_length=8, read_only=True)
    email = serializers.EmailField(read_only=True)
    token = serializers.CharField(max_length=128, write_only=True)
    name = serializers.CharField(source="club.name", read_only=True)
    public = serializers.BooleanField(write_only=True, required=False)

    def create(self, validated_data):
        validated_data.pop("public", None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        user = self.context["request"].user
        public = validated_data.pop("public", False)

        if not self.validated_data.get("token") == self.instance.token:
            raise serializers.ValidationError("Missing or invalid token in request!")

        # if there is an owner and the invite is for a upenn email, do strict username checking
        if (
            self.instance.email.endswith((".upenn.edu", "@upenn.edu"))
            and self.instance.club.membership_set.count() > 0
        ):
            invite_username = self.instance.email.rsplit("@", 1)[0]
            if not invite_username.lower() == user.username.lower():
                raise serializers.ValidationError(
                    'This invitation was meant for "{}", but you are logged in as "{}"!'.format(
                        invite_username, user.username
                    )
                )

        # claim the invite and set the membership public status
        obj = instance.claim(user)
        obj.public = public
        obj.save()

        return instance

    class Meta:
        model = MembershipInvite
        fields = ["email", "token", "id", "name", "public"]


class UserMembershipSerializer(serializers.ModelSerializer):
    """
    Used for listing which clubs a user is in.
    """

    code = serializers.SlugField(source="club.code", read_only=True)
    name = serializers.CharField(source="club.name", read_only=True)
    role_display = serializers.SerializerMethodField("get_role_display")

    def get_role_display(self, obj):
        return obj.get_role_display()

    class Meta:
        model = Membership
        fields = ("code", "name", "title", "role", "role_display", "active", "public")


class MembershipSerializer(ClubRouteMixin, serializers.ModelSerializer):
    """
    Used for listing which users are in a club for members who are not in the club.
    """

    name = serializers.SerializerMethodField("get_full_name")
    person = serializers.PrimaryKeyRelatedField(
        queryset=get_user_model().objects.all(), write_only=True
    )
    role = serializers.IntegerField(write_only=True, required=False)
    image = serializers.SerializerMethodField("get_image")

    def get_full_name(self, obj):
        if not obj.public:
            return "Anonymous"
        return obj.person.get_full_name()

    def get_image(self, obj):
        if not obj.public:
            return None
        if not obj.person.profile.image:
            return None
        image_url = obj.person.profile.image.url
        if image_url.startswith("http"):
            return image_url
        elif "request" in self.context:
            return self.context["request"].build_absolute_uri(image_url)
        else:
            return image_url

    def validate_role(self, value):
        """
        Ensure that users cannot promote themselves to a higher role.
        Also ensure that owners can't demote themselves without leaving another owner.
        """
        user = self.context["request"].user
        mem_user_id = self.instance.person.id if self.instance else self.initial_data["person"]
        club_code = self.context["view"].kwargs.get(
            "club_code", self.context["view"].kwargs.get("code")
        )
        membership = Membership.objects.filter(person=user, club__code=club_code).first()
        if user.is_superuser:
            return value
        if membership is None:
            raise serializers.ValidationError("You must be a member of this club to modify roles!")
        if membership.role > value:
            raise serializers.ValidationError("You cannot promote someone above your own level.")
        if value > Membership.ROLE_OWNER and user.id == mem_user_id:
            if (
                Membership.objects.filter(
                    club__code=club_code, role__lte=Membership.ROLE_OWNER
                ).count()
                <= 1
            ):
                raise serializers.ValidationError(
                    "You cannot demote yourself if you are the only owner!"
                )
        return value

    def validate(self, data):
        """
        Normal members can only change a small subset of information.
        """
        user = self.context["request"].user
        club_code = self.context["view"].kwargs.get(
            "club_code", self.context["view"].kwargs.get("code")
        )

        membership = Membership.objects.filter(person=user, club__code=club_code).first()

        if not user.is_superuser and (
            membership is None or membership.role > Membership.ROLE_OFFICER
        ):
            for field in data:
                if field not in ["public", "active"]:
                    raise serializers.ValidationError(
                        'Normal members are not allowed to change "{}"!'.format(field)
                    )
        return data

    class Meta:
        model = Membership
        fields = ["name", "title", "person", "role", "active", "public", "image"]
        validators = [
            validators.UniqueTogetherValidator(
                queryset=Membership.objects.all(), fields=["person", "club"]
            )
        ]


class AuthenticatedMembershipSerializer(MembershipSerializer):
    """
    Provides additional information about members, such as email address.
    Should only be available to users in the club.
    """

    role = serializers.IntegerField(required=False)
    email = serializers.EmailField(source="person.email", read_only=True)
    username = serializers.CharField(source="person.username", read_only=True)

    def get_full_name(self, obj):
        return obj.person.get_full_name()

    class Meta:
        model = Membership
        fields = MembershipSerializer.Meta.fields + ["email", "username"]


class ClubListSerializer(serializers.ModelSerializer):
    """
    The club list serializer returns a subset of the information that the full serializer returns.
    This is done for a quicker response.
    """

    tags = TagSerializer(many=True)
    image_url = serializers.SerializerMethodField("get_image_url")
    favorite_count = serializers.IntegerField(read_only=True)

    target_schools = SchoolSerializer(many=True, required=False)
    target_majors = MajorSerializer(many=True, required=False)
    target_years = YearSerializer(many=True, required=False)

    def get_image_url(self, obj):
        if not obj.image:
            return None
        if obj.image.url.startswith("http"):
            return obj.image.url
        elif "request" in self.context:
            return self.context["request"].build_absolute_uri(obj.image.url)
        else:
            return obj.image.url

    def get_fields(self):
        all_fields = super().get_fields()
        fields_param = getattr(self.context.get("request", dict()), "GET", {}).get("fields", "")
        if fields_param:
            fields_param = fields_param.split(",")
        else:
            return all_fields

        fields_subset = dict()
        for k in fields_param:
            if k in all_fields:
                fields_subset[k] = all_fields[k]

        return fields_subset if len(fields_subset) > 0 else all_fields

    class Meta:
        model = Club
        fields = [
            "name",
            "code",
            "approved",
            "description",
            "founded",
            "size",
            "email",
            "tags",
            "subtitle",
            "application_required",
            "accepting_members",
            "image_url",
            "favorite_count",
            "active",
            "target_schools",
            "target_majors",
            "target_years",
        ]
        extra_kwargs = {
            "name": {
                "validators": [validators.UniqueValidator(queryset=Club.objects.all())],
                "help_text": "The name of the club.",
            },
            "code": {
                "required": False,
                "validators": [validators.UniqueValidator(queryset=Club.objects.all())],
                "help_text": "An alphanumeric string shown in the URL"
                + "and used to identify this club.",
            },
            "description": {
                "help_text": "A long description for the club. Certain HTML tags are allowed."
            },
            "email": {"help_text": "The primary contact email for the club."},
            "subtitle": {
                "required": False,
                "help_text": "The text shown to the user in a preview card."
                + "Short description of the club.",
            },
        }


class ClubSerializer(ManyToManySaveMixin, ClubListSerializer):
    members = MembershipSerializer(many=True, source="membership_set", read_only=True)
    image = serializers.ImageField(write_only=True, required=False)
    parent_orgs = serializers.SerializerMethodField("get_parent_orgs")
    badges = BadgeSerializer(many=True, required=False)
    testimonials = TestimonialSerializer(many=True, read_only=True)
    questions = QuestionAnswerSerializer(many=True, read_only=True)
    events = EventSerializer(many=True, read_only=True)

    def get_parent_orgs(self, obj):
        return []
        # return [c.slug for c in obj.parent_orgs.all()]

    def create(self, validated_data):
        """
        Ensure new clubs follow certain invariants.
        """
        # New clubs created through the API must always be approved.
        validated_data["approved"] = None

        obj = super().create(validated_data)

        # assign user who created as owner
        Membership.objects.create(
            person=self.context["request"].user, club=obj, role=Membership.ROLE_OWNER
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
            return "https://www.facebook.com{}".format(
                parsed.path if parsed.path.startswith("/") else "/groups/{}/".format(parsed.path)
            )
        return value

    def validate_twitter(self, value):
        """
        Ensure that URL is actually a Twitter link.
        """
        if value:
            parsed = urlparse(value)
            return "https://twitter.com{}".format(
                parsed.path if parsed.path.startswith("/") else "/{}".format(parsed.path)
            )
        return value

    def validate_instagram(self, value):
        """
        Ensure that the URL is actually a instagram link.
        """
        if value:
            parsed = urlparse(value)
            return "https://www.instagram.com{}".format(
                parsed.path if parsed.path.startswith("/") else "/{}/".format(parsed.path)
            )
        return value

    def validate_linkedin(self, value):
        """
        Ensure that URL is actually a LinkedIn URL. Attempt to convert into correct format with
        limited information.
        """
        if value:
            parsed = urlparse(value)
            return "https://www.linkedin.com{}".format(
                parsed.path if parsed.path.startswith("/") else "/company/{}/".format(parsed.path)
            )
        return value

    def validate_github(self, value):
        """
        Ensure that URL is actually a GitHub URL.
        """
        if value:
            parsed = urlparse(value)
            return "https://github.com{}".format(
                parsed.path if parsed.path.startswith("/") else "/{}".format(parsed.path)
            )
        return value

    def validate_youtube(self, value):
        """
        Ensure that URL is actually a YouTube URL.
        """
        if value:
            parsed = urlparse(value)
            path = parsed.path if parsed.path.startswith("/") else "/{}".format(parsed.path)
            if parsed.query:
                path = "{}?{}".format(path, parsed.query)
            if parsed.netloc == "youtu.be":
                return "https://youtu.be{}".format(path)
            else:
                return "https://youtube.com{}".format(path)
        return value

    def validate_active(self, value):
        """
        Only owners and superusers may change the active status of a club.
        """
        user = self.context["request"].user
        club_code = self.context["view"].kwargs.get("code")
        club = Club.objects.get(code=club_code)
        membership = Membership.objects.filter(person=user, club=club).first()
        if (membership and membership.role <= Membership.ROLE_OWNER) or user.is_superuser:
            return value
        raise serializers.ValidationError(
            "You do not have permissions to change the active status of the club."
        )

    def format_members_for_spreadsheet(self, value):
        """
        Specify the spreadsheet format for the membership ManyToMany field.
        """
        return "\n".join("{} - {}".format(v.get("name"), v.get("email")) for v in value)

    def save(self):
        """
        Override save in order to replace code with slugified name if not specified.
        """
        if "name" in self.validated_data:
            self.validated_data["name"] = self.validated_data["name"].strip()

        if not self.instance:
            if not self.validated_data.get("code") and self.validated_data.get("name"):
                self.validated_data["code"] = slugify(self.validated_data["name"])
        elif "code" in self.validated_data:
            del self.validated_data["code"]

        # if approved, update who and when club was approved
        if (
            self.instance
            and not self.instance.approved
            and self.validated_data.get("approved") is True
        ):
            self.validated_data["approved_by"] = self.context["request"].user
            self.validated_data["approved_on"] = timezone.now()

        return super().save()

    class Meta(ClubListSerializer.Meta):
        fields = ClubListSerializer.Meta.fields + [
            "facebook",
            "twitter",
            "instagram",
            "linkedin",
            "github",
            "website",
            "youtube",
            "how_to_get_involved",
            "listserv",
            "members",
            "parent_orgs",
            "badges",
            "image",
            "testimonials",
            "questions",
            "events",
        ]
        save_related_fields = [
            "tags",
            "badges",
            "target_schools",
            "target_majors",
            "target_years",
        ]


class AuthenticatedClubSerializer(ClubSerializer):
    """
    Provides additional information about the club to members in the club.
    """

    members = AuthenticatedMembershipSerializer(many=True, source="membership_set", read_only=True)

    class Meta(ClubSerializer.Meta):
        pass


class FavoriteSerializer(serializers.ModelSerializer):
    person = serializers.HiddenField(default=serializers.CurrentUserDefault())
    club = serializers.SlugRelatedField(
        queryset=Club.objects.all(),
        slug_field="code",
        help_text="The club code shown in the URL of the club page.",
    )
    name = serializers.CharField(source="club.name", read_only=True)

    class Meta:
        model = Favorite
        fields = ("club", "name", "person")
        validators = [
            validators.UniqueTogetherValidator(
                queryset=Favorite.objects.all(), fields=["club", "person"]
            )
        ]


class SubscribeSerializer(serializers.ModelSerializer):
    """
    Used by club owners/officers to see who has subscribed to their club.
    """

    person = serializers.HiddenField(default=serializers.CurrentUserDefault())
    club = serializers.SlugRelatedField(queryset=Club.objects.all(), slug_field="code")
    name = serializers.SerializerMethodField("get_full_name")
    username = serializers.CharField(source="person.username", read_only=True)
    email = serializers.EmailField(source="person.email", read_only=True)

    school = SchoolSerializer(many=True, source="person.profile.school", read_only=True)
    major = MajorSerializer(many=True, source="person.profile.major", read_only=True)
    graduation_year = serializers.IntegerField(
        source="person.profile.graduation_year", read_only=True
    )

    def get_full_name(self, obj):
        return obj.person.get_full_name()

    class Meta:
        model = Subscribe
        fields = (
            "club",
            "name",
            "username",
            "person",
            "email",
            "school",
            "major",
            "graduation_year",
            "created_at",
        )
        validators = [
            validators.UniqueTogetherValidator(
                queryset=Subscribe.objects.all(), fields=["club", "person"]
            )
        ]


class UserSubscribeSerializer(serializers.ModelSerializer):
    """
    Used by the UserSerializer to return the clubs that the user has favorited.
    """

    club = serializers.SlugRelatedField(queryset=Club.objects.all(), slug_field="code")

    class Meta:
        model = Subscribe
        fields = ("club",)


class MembershipRequestSerializer(serializers.ModelSerializer):
    """
    Used by club owners/officers to see who has requested to join the club.
    """

    person = serializers.HiddenField(default=serializers.CurrentUserDefault())
    club = serializers.SlugRelatedField(queryset=Club.objects.all(), slug_field="code")
    name = serializers.SerializerMethodField("get_full_name")
    username = serializers.CharField(source="person.username", read_only=True)
    email = serializers.EmailField(source="person.email", read_only=True)

    school = SchoolSerializer(many=True, source="person.profile.school", read_only=True)
    major = MajorSerializer(many=True, source="person.profile.major", read_only=True)
    graduation_year = serializers.IntegerField(
        source="person.profile.graduation_year", read_only=True
    )

    def get_full_name(self, obj):
        return obj.person.get_full_name()

    class Meta:
        model = MembershipRequest
        fields = (
            "club",
            "name",
            "username",
            "person",
            "email",
            "school",
            "major",
            "graduation_year",
            "created_at",
        )
        validators = [
            validators.UniqueTogetherValidator(
                queryset=MembershipRequest.objects.all(), fields=["club", "person"]
            )
        ]


class UserMembershipRequestSerializer(serializers.ModelSerializer):
    """
    Used by the UserSerializer to return the clubs that the user has sent request to.
    """

    club = serializers.SlugRelatedField(queryset=Club.objects.all(), slug_field="code")

    class Meta:
        model = MembershipRequest
        fields = ("club",)


class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    name = serializers.SerializerMethodField("get_full_name")
    membership_set = UserMembershipSerializer(many=True, read_only=True)
    favorite_set = FavoriteSerializer(many=True, read_only=True)
    subscribe_set = UserSubscribeSerializer(many=True, read_only=True)
    join_request_set = MembershipRequestSerializer(many=True, read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
    image = serializers.ImageField(source="profile.image", write_only=True, allow_null=True)
    image_url = serializers.SerializerMethodField("get_image_url")

    has_been_prompted = serializers.BooleanField(source="profile.has_been_prompted")
    graduation_year = serializers.IntegerField(source="profile.graduation_year", allow_null=True)
    school = SchoolSerializer(many=True, source="profile.school")
    major = MajorSerializer(many=True, source="profile.major")

    def get_image_url(self, obj):
        if not obj.profile.image:
            return None
        if obj.profile.image.url.startswith("http"):
            return obj.profile.image.url
        elif "request" in self.context:
            return self.context["request"].build_absolute_uri(obj.profile.image.url)
        else:
            return obj.profile.image.url

    def get_full_name(self, obj):
        return obj.get_full_name()

    def update(self, instance, validated_data):
        if "profile" in validated_data:
            profile_fields = validated_data.pop("profile")
            profile = instance.profile
            valid_fields = {f.name: f for f in Profile._meta.get_fields()}
            for key, value in profile_fields.items():
                if key in valid_fields:
                    field = valid_fields[key]
                    if isinstance(field, models.ManyToManyField):
                        related_objects = getattr(profile, field.get_attname())
                        related_objects.clear()
                        for item in value:
                            related_objects.add(field.related_model.objects.get(**item))
                    else:
                        setattr(profile, key, value)
            profile.save()

        return super().update(instance, validated_data)

    class Meta:
        model = get_user_model()
        fields = (
            "username",
            "name",
            "email",
            "membership_set",
            "favorite_set",
            "subscribe_set",
            "join_request_set",
            "is_superuser",
            "image_url",
            "image",
            "graduation_year",
            "school",
            "major",
            "has_been_prompted",
        )


class AssetSerializer(serializers.ModelSerializer):
    creator = serializers.HiddenField(default=serializers.CurrentUserDefault())
    file_url = serializers.SerializerMethodField("get_file_url")
    file = serializers.FileField(write_only=True)
    club = serializers.SlugRelatedField(queryset=Club.objects.all(), slug_field="code")
    name = serializers.CharField(max_length=255, required=True)

    def get_file_url(self, obj):
        if not obj.file:
            return None
        if obj.file.url.startswith("http"):
            return obj.file.url
        elif "request" in self.context:
            return self.context["request"].build_absolute_uri(obj.file.url)
        else:
            return obj.file.url

    # Cannot exceed maximum upload size
    def validate_file(self, data):
        if data.size <= settings.MAX_FILE_SIZE:
            return data
        else:
            max_file_size_in_gb = round((settings.MAX_FILE_SIZE / settings.FILE_SIZE_ONE_GB), 3)
            raise serializers.ValidationError(
                "You cannot upload a file that is more than {} GB of space!".format(
                    max_file_size_in_gb
                )
            )

    class Meta:
        model = Asset
        fields = ("id", "file_url", "file", "creator", "club", "name")


class NoteTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoteTag
        fields = ("id", "name")


class NoteSerializer(ManyToManySaveMixin, serializers.ModelSerializer):
    creator = serializers.HiddenField(default=serializers.CurrentUserDefault())
    creating_club = serializers.SlugRelatedField(queryset=Club.objects.all(), slug_field="code")
    subject_club = serializers.SlugRelatedField(queryset=Club.objects.all(), slug_field="code")
    title = serializers.CharField(max_length=255, default="Note")
    content = serializers.CharField(required=False)
    note_tags = NoteTagSerializer(many=True, required=False)

    class Meta:
        model = Note
        fields = (
            "id",
            "creator",
            "creating_club",
            "subject_club",
            "title",
            "content",
            "note_tags",
            "creating_club_permission",
            "outside_club_permission",
        )
        save_related_fields = [{"field": "note_tags", "mode": "create"}]
