from django.contrib import admin
from .models import Attendance, Event, Season

# Register your models here.
@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'is_active', 'events_count')
    search_fields = ('name',)
    list_filter = ('is_active', 'start_date')
    ordering = ['-start_date']
    
    def events_count(self, obj):
        return obj.events.count()
    events_count.short_description = 'Wydarzenia'
    
    def save_model(self, request, obj, form, change):
        """Add a message when activating a season that will deactivate others"""
        if obj.is_active and not change:
            # New season being created as active
            active_seasons = Season.objects.filter(is_active=True).count()
            if active_seasons > 0:
                self.message_user(request, f'Sezon "{obj.name}" został ustawiony jako aktywny. Pozostałe sezony zostały automatycznie dezaktywowane.')
        elif obj.is_active and change:
            # Existing season being set to active
            other_active = Season.objects.exclude(pk=obj.pk).filter(is_active=True)
            if other_active.exists():
                deactivated_names = [s.name for s in other_active]
                self.message_user(request, f'Sezon "{obj.name}" został ustawiony jako aktywny. Dezaktywowano sezony: {", ".join(deactivated_names)}.')
        super().save_model(request, obj, form, change)

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('name', 'date', 'type', 'season')
    search_fields = ('name',)
    list_filter = ('type', 'date', 'season')

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'present')
    search_fields = ('user__first_name', 'user__last_name', 'event__name')
    list_filter = ('event__type', 'present', 'event__season')
