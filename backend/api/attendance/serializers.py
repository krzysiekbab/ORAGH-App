"""
Attendance-related serializers for the API.
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Season, Event, Attendance
from api.users.models import MusicianProfile
from api.users.serializers import UserSerializer, MusicianProfileSerializer, MusicianProfileDetailSerializer


class SeasonListSerializer(serializers.ModelSerializer):
    """Serializer for season list view."""
    events_count = serializers.ReadOnlyField()
    musicians_count = serializers.ReadOnlyField()
    is_current = serializers.SerializerMethodField()
    
    class Meta:
        model = Season
        fields = [
            'id', 'name', 'start_date', 'end_date', 'is_active', 
            'events_count', 'musicians_count', 'is_current', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'events_count', 'musicians_count', 'is_current']
    
    def get_is_current(self, obj):
        """Check if this is the current season."""
        current_season = Season.get_current_season()
        return current_season and current_season.id == obj.id


class SeasonDetailSerializer(serializers.ModelSerializer):
    """Serializer for season detail view."""
    events_count = serializers.ReadOnlyField()
    musicians_count = serializers.ReadOnlyField()
    is_current = serializers.SerializerMethodField()
    attendance_stats = serializers.SerializerMethodField()
    musicians = MusicianProfileDetailSerializer(many=True, read_only=True)
    
    class Meta:
        model = Season
        fields = [
            'id', 'name', 'start_date', 'end_date', 'is_active', 
            'events_count', 'musicians_count', 'is_current', 'attendance_stats',
            'musicians', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'events_count', 'musicians_count', 'is_current', 'attendance_stats']
    
    def get_is_current(self, obj):
        """Check if this is the current season."""
        current_season = Season.get_current_season()
        return current_season and current_season.id == obj.id
    
    def get_attendance_stats(self, obj):
        """Get attendance statistics for this season."""
        return obj.get_attendance_stats()


class SeasonCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating seasons."""
    musician_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of musician profile IDs to assign to this season"
    )
    
    class Meta:
        model = Season
        fields = [
            'name', 'start_date', 'end_date', 'is_active', 'musician_ids'
        ]
    
    def validate_start_date(self, value):
        """Validate start date."""
        if value > timezone.now().date():
            # Allow future start dates for planning purposes
            pass
        return value
    
    def validate_end_date(self, value):
        """Validate end date."""
        if value < timezone.now().date():
            # Allow past end dates for historical seasons
            pass
        return value
    
    def validate(self, attrs):
        """Cross-field validation."""
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError("Data rozpoczęcia musi być wcześniejsza niż data zakończenia.")
        
        return attrs
    
    def create(self, validated_data):
        """Create season with musicians."""
        musician_ids = validated_data.pop('musician_ids', [])
        season = Season.objects.create(**validated_data)
        
        if musician_ids:
            musicians = MusicianProfile.objects.filter(id__in=musician_ids, active=True)
            season.musicians.set(musicians)
        
        return season
    
    def update(self, instance, validated_data):
        """Update season with musicians."""
        musician_ids = validated_data.pop('musician_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if musician_ids is not None:
            musicians = MusicianProfile.objects.filter(id__in=musician_ids, active=True)
            instance.musicians.set(musicians)
        
        return instance


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


class AttendanceStatsSerializer(serializers.Serializer):
    """Serializer for attendance statistics."""
    user = UserSerializer(read_only=True)
    musician_profile = MusicianProfileSerializer(read_only=True)
    total_events = serializers.IntegerField()
    attended_events = serializers.IntegerField()
    half_attended_events = serializers.IntegerField()
    full_attended_events = serializers.IntegerField()
    absent_events = serializers.IntegerField()
    attendance_rate = serializers.FloatField()
    effective_attendance_rate = serializers.FloatField()  # Includes half attendance as 0.5


class SeasonAttendanceGridSerializer(serializers.Serializer):
    """Serializer for season attendance grid display."""
    season = SeasonListSerializer(read_only=True)
    events = EventListSerializer(many=True, read_only=True)
    attendance_grid = serializers.ListField(
        child=serializers.DictField(),
        help_text="Grid of attendance data organized by sections and users"
    )
