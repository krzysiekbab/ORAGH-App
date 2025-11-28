"""
Concert-related serializers for the API.
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Concert
from api.users.models import MusicianProfile
from api.users.serializers import UserSerializer, MusicianProfileSerializer


class ConcertParticipantSerializer(serializers.ModelSerializer):
    """Serializer for concert participants with user data."""
    user = UserSerializer(read_only=True)
    profile_photo = serializers.SerializerMethodField()
    
    class Meta:
        model = MusicianProfile
        fields = ['id', 'user', 'instrument', 'profile_photo']
    
    def get_profile_photo(self, obj):
        """Return the full URL for the photo."""
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None


class ConcertListSerializer(serializers.ModelSerializer):
    """Serializer for concert list view."""
    created_by = UserSerializer(read_only=True)
    participants_count = serializers.ReadOnlyField()
    is_registered = serializers.SerializerMethodField()
    
    class Meta:
        model = Concert
        fields = [
            'id', 'name', 'date', 'location', 'status',
            'participants_count', 'is_registered', 'created_by', 'date_created'
        ]
        read_only_fields = ['id', 'created_by', 'date_created', 'participants_count', 'is_registered']
    
    def get_is_registered(self, obj):
        """Check if current user is registered for this concert."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # Use prefetched data if available to avoid N+1 queries
        if hasattr(obj, '_prefetched_user_registration'):
            return obj._prefetched_user_registration
        
        return obj.is_user_registered(request.user)


class ConcertDetailSerializer(serializers.ModelSerializer):
    """Serializer for concert detail view."""
    created_by = UserSerializer(read_only=True)
    participants = ConcertParticipantSerializer(many=True, read_only=True)
    participants_count = serializers.ReadOnlyField()
    is_registered = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = Concert
        fields = [
            'id', 'name', 'date', 'location', 'description', 'setlist',
            'status', 'participants', 'participants_count', 'is_registered', 
            'can_edit', 'can_delete', 'created_by', 'date_created', 'date_modified'
        ]
        read_only_fields = ['id', 'created_by', 'date_created', 'date_modified', 'participants_count', 'is_registered', 'can_edit', 'can_delete']
    
    def get_is_registered(self, obj):
        """Check if current user is registered for this concert."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # Use prefetched data if available to avoid N+1 queries
        if hasattr(obj, '_prefetched_user_registration'):
            return obj._prefetched_user_registration
        
        return obj.is_user_registered(request.user)
    
    def get_can_edit(self, obj):
        """Check if current user can edit this concert."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        return obj.can_user_edit(request.user)
    
    def get_can_delete(self, obj):
        """Check if current user can delete this concert."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        return obj.can_user_delete(request.user)


class ConcertCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating concerts."""
    
    class Meta:
        model = Concert
        fields = [
            'name', 'date', 'location', 'description', 'setlist',
            'status'
        ]
    
    def validate_date(self, value):
        """Validate concert date."""
        
        return value


class ConcertRegistrationSerializer(serializers.Serializer):
    """Serializer for concert registration/unregistration."""
    action = serializers.ChoiceField(choices=['register', 'unregister'])
    
    def validate(self, attrs):
        """Validate registration action."""
        concert = self.context['concert']
        user = self.context['user']
        action = attrs['action']
        
        if action == 'register':
            # Check if concert status allows registration
            if concert.status not in ['planned', 'confirmed']:
                raise serializers.ValidationError("Rejestracja na ten koncert jest zamknięta.")
            
            # Check if user is already registered
            if concert.participants.filter(user=user).exists():
                raise serializers.ValidationError("Jesteś już zapisany na ten koncert.")
        
        elif action == 'unregister':
            # Check if user is registered
            if not concert.participants.filter(user=user).exists():
                raise serializers.ValidationError("Nie jesteś zapisany na ten koncert.")
        
        return attrs
