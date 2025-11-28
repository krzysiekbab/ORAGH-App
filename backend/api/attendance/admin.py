"""
Admin configuration for attendance models.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from django.urls import reverse
from django.utils import timezone

from .models import Event, Attendance


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """Admin interface for Event model."""
    
    list_display = ['name', 'date', 'type', 'season', 'attendance_count', 'attendance_percentage', 'created_by', 'created_at']
    list_filter = ['type', 'season', 'date', 'created_at']
    search_fields = ['name', 'season__name']
    ordering = ['-date']
    readonly_fields = ['created_at', 'updated_at', 'attendance_count', 'present_count', 'attendance_percentage']
    
    fieldsets = (
        ('Podstawowe informacje', {
            'fields': ('name', 'date', 'type', 'season', 'created_by')
        }),
        ('Statystyki obecności', {
            'fields': ('attendance_count', 'present_count', 'attendance_percentage'),
            'classes': ('collapse',)
        }),
        ('Znaczniki czasowe', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def attendance_count(self, obj):
        """Display total attendance records for this event."""
        count = obj.attendances.count()
        if count > 0:
            url = reverse('admin:attendance_attendance_changelist') + f'?event__id__exact={obj.id}'
            return format_html('<a href="{}">{} obecności</a>', url, count)
        return f'{count} obecności'
    attendance_count.short_description = 'Łącznie obecności'
    
    def present_count(self, obj):
        """Display number of present attendances."""
        count = obj.attendances.filter(present__gt=0).count()
        return f'{count} obecnych'
    present_count.short_description = 'Obecni'
    
    def attendance_percentage(self, obj):
        """Display attendance percentage."""
        total = obj.attendances.count()
        if total > 0:
            present = obj.attendances.filter(present__gt=0).count()
            percentage = (present / total) * 100
            return f'{percentage:.1f}%'
        return '-'
    attendance_percentage.short_description = 'Frekwencja'
    
    actions = ['duplicate_events']
    
    def duplicate_events(self, request, queryset):
        """Duplicate selected events."""
        duplicated = 0
        for event in queryset:
            event.pk = None  # Create new instance
            event.name = f"{event.name} (kopia)"
            event.save()
            duplicated += 1
        self.message_user(request, f'{duplicated} wydarzeń zostało zduplikowanych.')
    duplicate_events.short_description = "Duplikuj wydarzenia"


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    """Admin interface for Attendance model."""
    
    list_display = ['event', 'user_display', 'present_display', 'marked_by', 'created_at']
    list_filter = ['present', 'event__type', 'event__season', 'event__date', 'created_at']
    search_fields = ['event__name', 'user__first_name', 'user__last_name', 'user__username']
    ordering = ['-event__date', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('event', 'user', 'present')
        }),
        ('Additional Details', {
            'fields': ('marked_by',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_display(self, obj):
        """Display user's full name."""
        user = obj.user
        if user.first_name and user.last_name:
            return f'{user.first_name} {user.last_name}'
        return user.username
    user_display.short_description = 'Użytkownik'
    
    def present_display(self, obj):
        """Display attendance status with color coding."""
        if obj.present == 1.0:
            return format_html('<span style="color: green; font-weight: bold;">✓ Obecny</span>')
        elif obj.present == 0.5:
            return format_html('<span style="color: orange; font-weight: bold;">~ Połowa</span>')
        else:
            return format_html('<span style="color: red; font-weight: bold;">✗ Nieobecny</span>')
    present_display.short_description = 'Obecność'
    
    actions = ['mark_present', 'mark_absent', 'mark_half_present']
    
    def mark_present(self, request, queryset):
        """Mark selected attendances as present."""
        updated = queryset.update(present=1.0)
        self.message_user(request, f'{updated} obecności zostały oznaczone jako "obecny".')
    mark_present.short_description = "Oznacz jako obecny"
    
    def mark_absent(self, request, queryset):
        """Mark selected attendances as absent."""
        updated = queryset.update(present=0.0)
        self.message_user(request, f'{updated} obecności zostały oznaczone jako "nieobecny".')
    mark_absent.short_description = "Oznacz jako nieobecny"
    
    def mark_half_present(self, request, queryset):
        """Mark selected attendances as half present."""
        updated = queryset.update(present=0.5)
        self.message_user(request, f'{updated} obecności zostały oznaczone jako "połowa".')
    mark_half_present.short_description = "Oznacz jako połowa"


# Customize admin site header
admin.site.site_header = "ORAGH - Panel Administracyjny"
admin.site.site_title = "ORAGH Admin"
admin.site.index_title = "Zarządzanie Orkiestrą ORAGH"
