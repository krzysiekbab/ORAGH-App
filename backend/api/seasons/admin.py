"""
Admin configuration for seasons models.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse

from .models import Season


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    """Admin interface for Season model."""
    
    list_display = ['name', 'start_date', 'end_date', 'is_active', 'events_count', 'musicians_count', 'duration_display', 'created_at']
    list_filter = ['is_active', 'created_at', 'start_date']
    search_fields = ['name']
    ordering = ['-start_date']
    readonly_fields = ['created_at', 'updated_at', 'events_count', 'musicians_count']
    
    fieldsets = (
        ('Podstawowe informacje', {
            'fields': ('name', 'start_date', 'end_date', 'is_active')
        }),
        ('Statystyki', {
            'fields': ('events_count', 'musicians_count'),
            'classes': ('collapse',)
        }),
        ('Muzycy', {
            'fields': ('musicians',),
            'classes': ('collapse',)
        }),
        ('Daty', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ['musicians']
    
    def events_count(self, obj):
        """Display number of events in this season."""
        count = obj.events.count()
        if count > 0:
            url = reverse('admin:attendance_event_changelist') + f'?season__id__exact={obj.id}'
            return format_html('<a href="{}">{} wydarzeń</a>', url, count)
        return f'{count} wydarzeń'
    events_count.short_description = 'Wydarzenia'
    
    def musicians_count(self, obj):
        """Display number of musicians in this season."""
        count = obj.musicians.count()
        if count > 0:
            # Create a link to edit this season to manage musicians
            url = reverse('admin:seasons_season_change', args=[obj.id]) + '#musicians'
            return format_html('<a href="{}" title="Kliknij aby zarządzać muzykami sezonu">{} muzyków</a>', url, count)
        return f'{count} muzyków'
    musicians_count.short_description = 'Muzycy'
    
    def duration_display(self, obj):
        """Display season duration in a readable format."""
        if obj.start_date and obj.end_date:
            duration = obj.end_date - obj.start_date
            return f'{duration.days} dni'
        return '-'
    duration_display.short_description = 'Czas trwania'
    
    actions = ['make_active', 'make_inactive']
    
    def make_active(self, request, queryset):
        """Make selected seasons active."""
        # Only allow one active season at a time
        if queryset.count() > 1:
            self.message_user(request, "Można aktywować tylko jeden sezon na raz.", level='ERROR')
            return
        
        # Deactivate all seasons first
        Season.objects.all().update(is_active=False)
        # Activate the selected season
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} sezon został ustawiony jako aktywny.')
    make_active.short_description = "Ustaw jako aktywny sezon"
    
    def make_inactive(self, request, queryset):
        """Make selected seasons inactive."""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} sezon(y) zostały dezaktywowane.')
    make_inactive.short_description = "Dezaktywuj sezony"
