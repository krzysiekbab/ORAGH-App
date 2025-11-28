"""
Admin configuration for concerts models.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse

from .models import Concert


@admin.register(Concert)
class ConcertAdmin(admin.ModelAdmin):
    """Admin interface for Concert model."""
    
    list_display = ['name', 'date', 'location', 'status', 'participants_count', 'created_by', 'date_created']
    list_filter = ['status', 'date', 'location', 'date_created']
    search_fields = ['name', 'description', 'location', 'setlist']
    ordering = ['-date']
    readonly_fields = ['date_created', 'date_modified', 'participants_count']
    filter_horizontal = ['participants']
    
    fieldsets = (
        ('Podstawowe informacje', {
            'fields': ('name', 'date', 'location', 'status')
        }),
        ('Szczegóły', {
            'fields': ('description', 'setlist'),
            'classes': ('collapse',)
        }),
        ('Uczestnicy', {
            'fields': ('participants', 'participants_count'),
        }),
        ('Metadane', {
            'fields': ('created_by', 'date_created', 'date_modified'),
            'classes': ('collapse',)
        }),
    )
    
    def participants_count(self, obj):
        """Display number of participants."""
        count = obj.participants.count()
        if count > 0:
            return format_html('<strong>{}</strong> uczestników', count)
        return '0 uczestników'
    participants_count.short_description = 'Liczba uczestników'
    
    actions = ['mark_as_confirmed', 'mark_as_completed', 'mark_as_cancelled']
    
    def mark_as_confirmed(self, request, queryset):
        """Mark selected concerts as confirmed."""
        updated = queryset.update(status='confirmed')
        self.message_user(request, f'{updated} koncert(ów) oznaczono jako potwierdzony.')
    mark_as_confirmed.short_description = "Oznacz jako potwierdzony"
    
    def mark_as_completed(self, request, queryset):
        """Mark selected concerts as completed."""
        updated = queryset.update(status='completed')
        self.message_user(request, f'{updated} koncert(ów) oznaczono jako zakończony.')
    mark_as_completed.short_description = "Oznacz jako zakończony"
    
    def mark_as_cancelled(self, request, queryset):
        """Mark selected concerts as cancelled."""
        updated = queryset.update(status='cancelled')
        self.message_user(request, f'{updated} koncert(ów) oznaczono jako odwołany.')
    mark_as_cancelled.short_description = "Oznacz jako odwołany"
