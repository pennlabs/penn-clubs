from django.db import models
from users.models import Person


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
    name = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255)
    description = models.TextField()
    founded = models.DateField(null=True)
    size = models.IntegerField(choices=SIZE_CHOICES, default=SIZE_SMALL)
    email = models.EmailField(blank=True, null=True)
    facebook = models.URLField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    twitter = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    how_to_get_involved = models.TextField(blank=True)
    application_required = models.BooleanField(default=True)
    application_available = models.BooleanField(default=False)
    listserv_available = models.BooleanField(default=False)
    image_url = models.URLField(null=True, blank=True)
    tags = models.ManyToManyField('Tag')
    members = models.ManyToManyField(Person, through='Membership')

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Event(models.Model):
    """
    Represents an event hosted by a club.
    """
    id = models.SlugField(max_length=255, primary_key=True)
    creator = models.ForeignKey(Person, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=255)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=255, null=True, blank=True)
    url = models.URLField(null=True, blank=True)
    image_url = models.URLField(null=True, blank=True)
    description = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Tag(models.Model):
    """
    Represents general categories that clubs fit into.
    """
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


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

    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default='Member')
    role = models.IntegerField(choices=ROLE_CHOICES, default=ROLE_MEMBER)

    def __str__(self):
        return "<Membership: {} in {} ({})>".format(self.person.username, self.club.pk, self.get_role_display())


class Favorite(models.Model):
    """
    Used when people favorite a club to keep track of which clubs were favorited.
    """
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    club = models.ForeignKey(Club, on_delete=models.CASCADE)

    def __str__(self):
        return "<Favorite: {} for {}>".format(self.person.username, self.club.pk)

    class Meta:
        unique_together = (('person', 'club'),)
