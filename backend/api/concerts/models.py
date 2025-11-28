"""
Concert models for the new API structure.
"""

from django.db import models
from django.contrib.auth.models import User
from api.users.models import MusicianProfile


class Concert(models.Model):
    """
    Concert model for the new API structure.
    """
    name = models.CharField(max_length=100)
    date = models.DateField()
    location = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    setlist = models.TextField(blank=True, null=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='concerts_created')
    participants = models.ManyToManyField(MusicianProfile, related_name='concerts', blank=True)
    
    # Concert status
    STATUS_CHOICES = [
        ('planned', 'Planowany'),
        ('confirmed', 'Potwierdzony'),
        ('completed', 'Zakończony'),
        ('cancelled', 'Odwołany'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')

    class Meta:
        db_table = 'concerts_concert'
        ordering = ['date', 'date_created']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['status']),
            models.Index(fields=['created_by']),
        ]

    def __str__(self):
        return f"{self.name} - {self.date}"

    @property
    def participants_count(self):
        """Return the number of participants."""
        return self.participants.count()

    def is_user_registered(self, user):
        """Check if a user is registered for this concert."""
        if not user or not user.is_authenticated:
            return False
        if not hasattr(user, 'musicianprofile'):
            return False
        return self.participants.filter(user=user).exists()

    def can_user_edit(self, user):
        """Check if user can edit this concert."""
        if not user or not user.is_authenticated:
            return False
        # Check Django permission for changing concerts
        return user.has_perm('concerts.change_concert')

    def can_user_delete(self, user):
        """Check if user can delete this concert."""
        if not user or not user.is_authenticated:
            return False
        # Check Django permission for deleting concerts
        return user.has_perm('concerts.delete_concert')

    @classmethod
    def can_user_create(cls, user):
        """Check if user can create concerts."""
        if not user or not user.is_authenticated:
            return False
        # Check Django permission for adding concerts
        return user.has_perm('concerts.add_concert')



