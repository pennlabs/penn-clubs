from django.db import models


class Club(models.Model):
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
    application_required = models.BooleanField(default=True)
    accepting_applications = models.BooleanField(default=False)
    image_url = models.URLField(null=True, blank=True)
    tags = models.ManyToManyField("Tag")

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Event(models.Model):
    name = models.CharField(max_length=255)
    club = models.ForeignKey(Club, on_delete=models.DO_NOTHING)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=255)
    url = models.URLField(null=True, blank=True)
    image_url = models.URLField(null=True, blank=True)
    description = models.TextField()

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name
