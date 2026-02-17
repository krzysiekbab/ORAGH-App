"""
Attendance models for the new API structure.
"""

from django.db import models
from django.contrib.auth.models import User


class Event(models.Model):
    """
    Event model for tracking attendance.
    """
    EVENT_TYPES = [
        ('concert', 'Koncert'),
        ('rehearsal', 'Próba'),
        ('soundcheck', 'Soundcheck'),
    ]
    
    name = models.CharField(max_length=255)
    date = models.DateField()
    type = models.CharField(max_length=20, choices=EVENT_TYPES)
    season = models.ForeignKey('seasons.Season', on_delete=models.CASCADE, related_name='events')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_events_created')

    class Meta:
        db_table = 'attendance_event'
        verbose_name = 'Wydarzenie'
        verbose_name_plural = 'Wydarzenia'
        ordering = ['date', 'created_at']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['type']),
            models.Index(fields=['season']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_type_display()}) - {self.date} [{self.season}]"

    @property
    def attendance_count(self):
        """Return the number of attendance records for this event."""
        return self.attendances.count()

    @property
    def present_count(self):
        """Return the number of people present (including half attendance)."""
        return self.attendances.filter(present__gt=0).count()

    @property
    def absent_count(self):
        """Return the number of people absent."""
        return self.attendances.filter(present=0).count()

    @property
    def half_count(self):
        """Return the number of people with half attendance."""
        return self.attendances.filter(present=0.5).count()

    @property
    def full_count(self):
        """Return the number of people with full attendance."""
        return self.attendances.filter(present=1.0).count()

    def get_attendance_stats(self):
        """Get detailed attendance statistics for this event."""
        total = self.attendance_count
        present = self.present_count  # Number of people with any attendance (for compatibility)
        absent = self.absent_count
        half = self.half_count
        full = self.full_count
        
        # Calculate effective attendance rate (0.5 counts as 50%, 1.0 as 100%)
        from django.db.models import Sum
        total_attendance_value = self.attendances.aggregate(total=Sum('present'))['total'] or 0
        attendance_rate = (total_attendance_value / total * 100) if total > 0 else 0
        
        return {
            'total': total,
            'present': present,
            'absent': absent,
            'half': half,
            'full': full,
            'attendance_rate': round(attendance_rate, 2)
        }


class Attendance(models.Model):
    """
    Attendance tracking model.
    """
    ATTENDANCE_CHOICES = [
        (0.0, 'Nieobecny'),
        (0.5, 'Połowa'),  # Half attendance, only for rehearsals
        (1.0, 'Obecny'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendances')
    present = models.DecimalField(max_digits=3, decimal_places=1, choices=ATTENDANCE_CHOICES, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    marked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_marks_made')

    class Meta:
        db_table = 'attendance_attendance'
        verbose_name = 'Obecność'
        verbose_name_plural = 'Obecności'
        unique_together = ('user', 'event')
        indexes = [
            models.Index(fields=['user', 'event']),
            models.Index(fields=['present']),
            models.Index(fields=['event']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.event.name} - {self.get_present_display()}"

    @property
    def is_present(self):
        """For backward compatibility - returns True if attendance > 0"""
        return self.present > 0
    
    @property
    def is_half(self):
        """Returns True if half attendance"""
        return self.present == 0.5
    
    @property
    def is_full(self):
        """Returns True if full attendance"""
        return self.present == 1.0

    @property
    def is_absent(self):
        """Returns True if absent"""
        return self.present == 0
