"""
User models for the new API structure.
"""

from django.db import models
from django.contrib.auth.models import User

INSTRUMENT_CHOICES = [
    ("flet", "Flet"),
    ("klarnet", "Klarnet"),
    ("obój", "Obój"),
    ("saksofon", "Saksofon"),
    ("waltornia", "Waltornia"),
    ("eufonium", "Eufonium"),
    ("trąbka", "Trąbka"),
    ("puzon", "Puzon"),
    ("tuba", "Tuba"),
    ("fagot", "Fagot"),
    ("gitara", "Gitara"),
    ("perkusja", "Perkusja"),
]

class MusicianProfile(models.Model):
    """
    Musician profile model for the new API structure.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    instrument = models.CharField(max_length=20, choices=INSTRUMENT_CHOICES)
    birthday = models.DateField(null=True, blank=True)
    photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        db_table = 'main_musicianprofile'  # Use the same database table as the old model
        verbose_name = 'Profil muzyka'
        verbose_name_plural = 'Profile muzyków'

    def __str__(self):
        return f"{self.user.username} - {self.instrument}"
