from django.db import models
from django.conf import settings

class Season(models.Model):
    name = models.CharField(max_length=20, unique=True, help_text="e.g., 2024/2025")
    start_date = models.DateField(help_text="Start date of the season")
    end_date = models.DateField(help_text="End date of the season")
    is_active = models.BooleanField(default=True, help_text="Whether this season is currently active")
    musicians = models.ManyToManyField('main.MusicianProfile', blank=True, related_name='seasons')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
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
        from django.utils import timezone
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

    def get_musicians_by_section(self):
        """Get musicians grouped by instrument sections for this season"""
        from main.models import INSTRUMENT_CHOICES
        
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

class Event(models.Model):
    EVENT_TYPES = [
        ('concert', 'Koncert'),
        ('rehearsal', 'Próba'),
        ('soundcheck', 'Soundcheck'),
    ]
    name = models.CharField(max_length=255)
    date = models.DateField()
    type = models.CharField(max_length=20, choices=EVENT_TYPES)
    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name='events', null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()}) - {self.date} [{self.season}]"

class Attendance(models.Model):
    ATTENDANCE_CHOICES = [
        (0.0, 'Nieobecny'),
        (0.5, 'Połowa'),  # Half attendance, only for rehearsals
        (1.0, 'Obecny'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    present = models.DecimalField(max_digits=3, decimal_places=1, choices=ATTENDANCE_CHOICES, default=0.0)

    class Meta:
        unique_together = ('user', 'event')
    
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
