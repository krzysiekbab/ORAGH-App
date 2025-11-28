"""
Season-related serializers for the API.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import Season
from api.users.models import MusicianProfile
from api.users.serializers import MusicianProfileDetailSerializer


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


class SeasonAttendanceGridSerializer(serializers.Serializer):
    """Serializer for season attendance grid display."""
    season = SeasonListSerializer(read_only=True)
    events = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of events in this season"
    )
    attendance_grid = serializers.ListField(
        child=serializers.DictField(),
        help_text="Grid of attendance data organized by sections and users"
    )
