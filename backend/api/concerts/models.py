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
    
    # Public concert settings
    is_public = models.BooleanField(default=True, help_text="Czy koncert jest publiczny")
    registration_open = models.BooleanField(default=True, help_text="Czy rejestracja na koncert jest otwarta")
    max_participants = models.PositiveIntegerField(null=True, blank=True, help_text="Maksymalna liczba uczestników")

    class Meta:
        db_table = 'concerts_concert'
        ordering = ['date', 'date_created']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['status']),
            models.Index(fields=['is_public', 'registration_open']),
            models.Index(fields=['created_by']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(max_participants__isnull=True) | models.Q(max_participants__gt=0),
                name='concerts_max_participants_positive'
            ),
        ]

    def __str__(self):
        return f"{self.name} - {self.date}"

    @property
    def participants_count(self):
        """Return the number of participants."""
        return self.participants.count()

    @property
    def can_register(self):
        """Check if registration is still possible."""
        if not self.registration_open:
            return False
        if self.status not in ['planned', 'confirmed']:
            return False
        if self.max_participants and self.participants_count >= self.max_participants:
            return False
        return True

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
        # Board members can edit any concert
        if user.groups.filter(name='board').exists():
            return True
        # Directors can edit any concert
        if user.groups.filter(name='director').exists():
            return True
        return False

    def can_user_delete(self, user):
        """Check if user can delete this concert."""
        if not user or not user.is_authenticated:
            return False
        # Only board members can delete concerts
        return user.groups.filter(name='board').exists()

    @classmethod
    def can_user_create(cls, user):
        """Check if user can create concerts."""
        if not user or not user.is_authenticated:
            return False
        # Only board members can create concerts
        return user.groups.filter(name='board').exists()

    def get_participants_display(self):
        """Get formatted participants count display."""
        count = self.participants_count
        if self.max_participants:
            return f"{count}/{self.max_participants}"
        return str(count)



