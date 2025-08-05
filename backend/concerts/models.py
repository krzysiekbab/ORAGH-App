from django.db import models
from django.contrib.auth.models import User
from main.models import MusicianProfile
from django_ckeditor_5.fields import CKEditor5Field

class Concert(models.Model):
    """
    Model representing a concert.
    """
    name = models.CharField(max_length=100)
    date = models.DateField()
    description = CKEditor5Field('Description', blank=True, null=True, config_name='advanced')
    setlist = CKEditor5Field('Setlist', blank=True, null=True, config_name='advanced')
    date_created = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='concerts')
    musicians = models.ManyToManyField(MusicianProfile, related_name='concerts', blank=True)

    def __str__(self):
        return self.name