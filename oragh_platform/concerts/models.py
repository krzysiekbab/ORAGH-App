from django.db import models
from django.contrib.auth.models import User
from main.models import MusicianProfile  # Import the model

class Concert(models.Model):
    """
    Model representing a concert.
    """
    name = models.CharField(max_length=100)
    date = models.DateTimeField()
    description = models.TextField(blank=True, null=True)
    date_created = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='concerts')
    musicians = models.ManyToManyField(MusicianProfile, related_name='concerts', blank=True)  # Add this line

    def __str__(self):
        return self.name