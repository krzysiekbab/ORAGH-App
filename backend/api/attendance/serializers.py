"""
Attendance-related serializers for the API.
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Event, Attendance
from api.users.serializers import UserSerializer


class EventListSerializer(serializers.ModelSerializer):
    """Serializer for event list view."""
    season_name = serializers.SerializerMethodField()
    attendance_count = serializers.ReadOnlyField()
    present_count = serializers.ReadOnlyField()
    attendance_stats = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'name', 'date', 'type', 'season', 'season_name',
            'attendance_count', 'present_count', 'attendance_stats', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'season_name', 'attendance_count', 'present_count', 'attendance_stats']
    
    def get_season_name(self, obj):
        """Get season name."""
        return obj.season.name if obj.season else None
    
    def get_attendance_stats(self, obj):
        """Get attendance statistics for this event."""
        return obj.get_attendance_stats()


class EventDetailSerializer(serializers.ModelSerializer):
    """Serializer for event detail view."""
    season_name = serializers.SerializerMethodField()
    attendance_count = serializers.ReadOnlyField()
    present_count = serializers.ReadOnlyField()
    attendance_stats = serializers.SerializerMethodField()
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'name', 'date', 'type', 'season', 'season_name',
            'attendance_count', 'present_count', 'attendance_stats',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'season_name', 'attendance_count', 'present_count', 'attendance_stats', 'created_by']
    
    def get_season_name(self, obj):
        """Get season name."""
        return obj.season.name if obj.season else None
    
    def get_attendance_stats(self, obj):
        """Get attendance statistics for this event."""
        return obj.get_attendance_stats()


class EventCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating events."""
    
    class Meta:
        model = Event
        fields = [
            'name', 'date', 'type', 'season'
        ]
    
    def validate_date(self, value):
        """Validate event date."""
        # Allow past dates for historical event entry
        return value
    
    def create(self, validated_data):
        """Create event and auto-create attendance records for all musicians in season."""
        event = super().create(validated_data)
        
        # If event has a season, create attendance records for all musicians in that season
        if event.season:
            musicians = event.season.musicians.filter(active=True)
            attendance_records = []
            
            for musician in musicians:
                # Create attendance record as absent (0.0) for each musician
                attendance_records.append(
                    Attendance(
                        user=musician.user,
                        event=event,
                        present=0.0
                    )
                )
            
            # Bulk create all attendance records
            if attendance_records:
                Attendance.objects.bulk_create(attendance_records, ignore_conflicts=True)
        
        return event


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for attendance records."""
    user = UserSerializer(read_only=True)
    event = EventListSerializer(read_only=True)
    marked_by = UserSerializer(read_only=True)
    is_present = serializers.ReadOnlyField()
    is_half = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    is_absent = serializers.ReadOnlyField()
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'user', 'event', 'present', 'is_present', 'is_half', 
            'is_full', 'is_absent', 'marked_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'event', 'marked_by', 'created_at', 'updated_at', 'is_present', 'is_half', 'is_full', 'is_absent']


class AttendanceMarkSerializer(serializers.Serializer):
    """Serializer for marking attendance for multiple users."""
    attendances = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        ),
        help_text="List of attendance records with user_id and present value"
    )
    
    def validate_attendances(self, value):
        """Validate attendance data."""
        if not value:
            raise serializers.ValidationError("Lista obecności nie może być pusta.")
        
        for attendance_data in value:
            if 'user_id' not in attendance_data:
                raise serializers.ValidationError("Brak user_id w danych obecności.")
            
            if 'present' not in attendance_data:
                raise serializers.ValidationError("Brak wartości present w danych obecności.")
            
            try:
                user_id = int(attendance_data['user_id'])
            except (ValueError, TypeError):
                raise serializers.ValidationError("user_id musi być liczbą.")
            
            try:
                present_value = float(attendance_data['present'])
                if present_value not in [0.0, 0.5, 1.0]:
                    raise serializers.ValidationError("Wartość present musi być 0.0, 0.5 lub 1.0.")
            except (ValueError, TypeError):
                raise serializers.ValidationError("present musi być liczbą.")
        
        return value
