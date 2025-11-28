"""
Season models for organizing orchestra activities.
"""

from django.db import models
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
    musicians = models.ManyToManyField(MusicianProfile, blank=True, related_name='seasons')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'seasons_season'
        verbose_name = 'Sezon'
        verbose_name_plural = 'Sezony'
        ordering = ['-start_date']  # Most recent season first
        permissions = [
            ('manage_seasons', 'Can manage seasons'),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """Ensure only one season can be active at a time and validate dates"""
        from django.core.exceptions import ValidationError
        
        # Validate that start_date is before end_date
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError("Data rozpoczęcia musi być wcześniejsza niż data zakończenia.")
        
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
        from api.attendance.models import Attendance
        
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
