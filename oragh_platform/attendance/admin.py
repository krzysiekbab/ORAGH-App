from django.contrib import admin
from .models import Attendance, Event

# Register your models here.
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('name', 'date', 'type')
    search_fields = ('name',)
    list_filter = ('type', 'date')

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'present')
    search_fields = ('user__first_name', 'user__last_name', 'event__name')
    list_filter = ('event__type', 'present')
