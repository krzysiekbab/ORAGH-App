"""
Attendance models for the new API structure.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from api.users.models import MusicianProfile


class Season(models.Model):
    """
    Season model for organizing attendance tracking.
    """
    name = models.CharField(max_length=20, unique=True, help_text="e.g., 2024/2025")
    start_date = models.DateField(help_text="Start date of the season")
    end_date = models.DateField(help_text="End date of the season")
    is_active = models.BooleanField(default=False, help_text="Whether this season is currently active")
    musicians = models.ManyToManyField(MusicianProfile, blank=True, related_name='attendance_seasons')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'attendance_season'
        ordering = ['-start_date']  # Most recent season first
        permissions = [
            ('manage_seasons', 'Can manage seasons'),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """Ensure only one season can be active at a time"""
        if self.is_active:
            # Deactivate all other seasons before saving this one as active
            Season.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    @classmethod
    def get_current_season(cls):
        """Get the current active season or the most recent one"""
        today = timezone.now().date()
        
        # Try to find a season that contains today's date
        current_season = cls.objects.filter(
            start_date__lte=today,
            end_date__gte=today,
            is_active=True
        ).first()
        
        if current_season:
            return current_season
        
        # If no season contains today, return the most recent active season
        return cls.objects.filter(is_active=True).first()

    @property
    def events_count(self):
        """Return the number of events in this season."""
        return self.events.count()

    @property
    def musicians_count(self):
        """Return the number of musicians in this season."""
        return self.musicians.count()

    def get_musicians_by_section(self):
        """Get musicians grouped by instrument sections for this season"""
        from api.users.models import INSTRUMENT_CHOICES
        
        musicians = self.musicians.select_related('user').filter(active=True)
        
        # Group musicians by instrument sections
        section_names = [choice[1] for choice in INSTRUMENT_CHOICES]
        sections = {name: [] for name in section_names}
        section_map = {name.lower(): name for name in section_names}
        
        for musician in musicians:
            instrument = (musician.instrument or '').strip().lower()
            section = section_map.get(instrument, "Inne")
            sections[section].append(musician)
        
        # Filter out empty sections and return as list of dictionaries
        sectioned_musicians = []
        for section_name, section_musicians in sections.items():
            if section_musicians:  # Only include sections that have musicians
                sectioned_musicians.append({
                    'section_name': section_name,
                    'musicians': section_musicians
                })
        
        return sectioned_musicians

    def get_attendance_stats(self):
        """Get attendance statistics for this season"""
        events = self.events.all()
        total_events = events.count()
        
        if total_events == 0:
            return {
                'total_events': 0,
                'total_attendances': 0,
                'average_attendance': 0,
                'attendance_rate': 0
            }
        
        total_attendances = Attendance.objects.filter(event__season=self).count()
        # Calculate effective attendance rate (0.5 counts as 50%, 1.0 as 100%)
        from django.db.models import Sum
        total_attendance_value = Attendance.objects.filter(
            event__season=self
        ).aggregate(total=Sum('present'))['total'] or 0
        
        attendance_rate = (total_attendance_value / total_attendances * 100) if total_attendances > 0 else 0
        
        return {
            'total_events': total_events,
            'total_attendances': total_attendances,
            'attendance_rate': round(attendance_rate, 2)
        }


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
    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name='events', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_events_created')

    class Meta:
        db_table = 'attendance_event'
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
