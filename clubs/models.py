import os
import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.db import models
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.utils.crypto import get_random_string


def get_asset_file_name(instance, fname):
    return os.path.join('assets', uuid.uuid4().hex, fname)


def get_club_file_name(instance, fname):
    return os.path.join('clubs', '{}.{}'.format(uuid.uuid4().hex, fname.rsplit('.', 1)[-1]))


def get_event_file_name(instance, fname):
    return os.path.join('events', '{}.{}'.format(uuid.uuid4().hex, fname.rsplit('.', 1)[-1]))


class Club(models.Model):
    """
    Represents a club at the University of Pennsylvania.
    """
    SIZE_SMALL = 1
    SIZE_MEDIUM = 2
    SIZE_LARGE = 3
    SIZE_VERY_LARGE = 4
    SIZE_CHOICES = (
        (SIZE_SMALL, '1-20'),
        (SIZE_MEDIUM, '21-50'),
        (SIZE_LARGE, '51-100'),
        (SIZE_VERY_LARGE, '101+'),
    )
    id = models.SlugField(max_length=255, primary_key=True)
    active = models.BooleanField(default=True)
    name = models.CharField(max_length=255)
    subtitle = models.CharField(blank=True, max_length=255)
    description = models.TextField(blank=True)
    founded = models.DateField(blank=True, null=True)
    size = models.IntegerField(choices=SIZE_CHOICES, default=SIZE_SMALL)
    email = models.EmailField(blank=True, null=True)
    facebook = models.URLField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    twitter = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    github = models.URLField(blank=True, null=True)
    how_to_get_involved = models.TextField(blank=True)
    application_required = models.BooleanField(default=True)
    application_available = models.BooleanField(default=False)
    listserv_available = models.BooleanField(default=False)
    image = models.ImageField(upload_to=get_club_file_name, null=True, blank=True)
    tags = models.ManyToManyField('Tag')
    members = models.ManyToManyField(get_user_model(), through='Membership')

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Event(models.Model):
    """
    Represents an event hosted by a club.
    """
    id = models.SlugField(max_length=255, primary_key=True)
    creator = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=255)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=255, null=True, blank=True)
    url = models.URLField(null=True, blank=True)
    image = models.ImageField(upload_to=get_event_file_name, null=True, blank=True)
    description = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Favorite(models.Model):
    """
    Used when people favorite a club to keep track of which clubs were favorited.
    """
    person = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)

    def __str__(self):
        return '<Favorite: {} for {}>'.format(self.person.username, self.club.pk)

    class Meta:
        unique_together = (('person', 'club'),)


class Membership(models.Model):
    """
    Represents the relationship between a member and a club.
    """
    ROLE_OWNER = 0
    ROLE_OFFICER = 10
    ROLE_MEMBER = 20
    ROLE_CHOICES = (
        (ROLE_OWNER, 'Owner'),
        (ROLE_OFFICER, 'Officer'),
        (ROLE_MEMBER, 'Member')
    )

    active = models.BooleanField(default=True)
    public = models.BooleanField(default=True)

    person = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default='Member')
    role = models.IntegerField(choices=ROLE_CHOICES, default=ROLE_MEMBER)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return '<Membership: {} in {} ({})>'.format(self.person.username, self.club.pk, self.get_role_display())

    class Meta:
        unique_together = (('club', 'person'),)


def get_token():
    """
    Generate a secure token for membership invites.
    Is a custom function because Django can't serialize lambdas.
    """
    return get_random_string(length=128)


def get_invite_id():
    """
    Generate a secure ID for membership invites.
    """
    return get_random_string(length=8)


class MembershipInvite(models.Model):
    """
    Represents an invitation to a club.
    """
    id = models.CharField(max_length=8, primary_key=True, default=get_invite_id)
    active = models.BooleanField(default=True)
    creator = models.ForeignKey(get_user_model(), null=True, on_delete=models.SET_NULL)

    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    email = models.EmailField()
    token = models.CharField(max_length=128, default=get_token)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    title = models.CharField(max_length=255, default='Member')
    role = models.IntegerField(default=Membership.ROLE_MEMBER)

    def __str__(self):
        return '<MembershipInvite: {} for {}>'.format(self.club.pk, self.email)

    def claim(self, user):
        """
        Claim an invitation using a user.
        """
        self.active = False
        self.save()

        Membership.objects.get_or_create(
            person=user,
            club=self.club,
            defaults={
                'role': self.role,
                'title': self.title
            }
        )

    def send_mail(self, request):
        """
        Send the email associated with this invitation to the user.
        """
        context = {
            'token': self.token,
            'name': self.club.name,
            'id': self.id,
            'club_id': self.club.id,
            'sender': request.user,
            'url': settings.INVITE_URL.format(id=self.id, token=self.token, club=self.club.id)
        }
        text_content = render_to_string('emails/invite.txt', context)
        html_content = render_to_string('emails/invite.html', context)

        msg = EmailMultiAlternatives(
            '{}Invitation to {}'.format(settings.EMAIL_SUBJECT_PREFIX, self.club.name),
            text_content,
            settings.FROM_EMAIL,
            [self.email]
        )
        msg.attach_alternative(html_content, 'text/html')
        msg.send(fail_silently=False)


class Tag(models.Model):
    """
    Represents general categories that clubs fit into.
    """
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class Asset(models.Model):
    """
    Represents an uploaded file object.
    """
    creator = models.ForeignKey(get_user_model(), null=True, on_delete=models.SET_NULL)
    file = models.FileField(upload_to=get_asset_file_name)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


@receiver(models.signals.post_delete, sender=Asset)
def asset_delete_cleanup(sender, instance, **kwargs):
    if instance.file:
        instance.file.delete(save=False)
