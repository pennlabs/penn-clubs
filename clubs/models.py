from django.db import models

class Club(models.Model):
    name = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField()