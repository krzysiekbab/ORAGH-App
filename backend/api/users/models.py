"""
User models for the new API structure.
"""

import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

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


class AccountActivationToken(models.Model):
    """
    Token for admin-based account activation.
    When a new user registers, a token is created and sent to admin.
    Admin clicks the link to activate the account.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='activation_token')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    is_used = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'Token aktywacyjny'
        verbose_name_plural = 'Tokeny aktywacyjne'
    
    def __str__(self):
        status = "aktywowany" if self.is_used else "oczekujący"
        return f"Token dla {self.user.username} ({status})"
    
    @property
    def is_expired(self):
        """Token expires after 30 days if not used."""
        expiry_days = 30
        return timezone.now() > self.created_at + timedelta(days=expiry_days)
    
    def activate(self):
        """Activate the user account."""
        if not self.is_used and not self.is_expired:
            self.user.is_active = True
            self.user.save()
            self.is_used = True
            self.activated_at = timezone.now()
            self.save()
            return True
        return False
