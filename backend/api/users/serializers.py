"""
User-related serializers for the API.
"""
from rest_framework import serializers
from django.contrib.auth.models import User, Group
from django.contrib.auth.password_validation import validate_password
from .models import MusicianProfile, INSTRUMENT_CHOICES


class MusicianProfileSerializer(serializers.ModelSerializer):
    """Serializer for MusicianProfile model."""
    photo = serializers.SerializerMethodField()
    
    class Meta:
        model = MusicianProfile
        fields = ['instrument', 'birthday', 'photo', 'active']
    
    def get_photo(self, obj):
        """Return the full URL for the photo."""
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with musician profile."""
    musician_profile = MusicianProfileSerializer(source='musicianprofile', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                 'date_joined', 'musician_profile']
        read_only_fields = ['id', 'date_joined']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password1 = serializers.CharField(write_only=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, style={'input_type': 'password'})
    instrument = serializers.ChoiceField(choices=INSTRUMENT_CHOICES)
    birthday = serializers.DateField()
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 
                 'password1', 'password2', 'instrument', 'birthday']
    
    def validate_username(self, value):
        """Check that username is unique."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Użytkownik o takiej nazwie już istnieje.")
        return value
    
    def validate_email(self, value):
        """Check that email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Użytkownik o takim emailu już istnieje.")
        return value
    
    def validate(self, attrs):
        """Validate password confirmation."""
        password1 = attrs.get('password1')
        password2 = attrs.get('password2')
        
        if password1 != password2:
            raise serializers.ValidationError({"password2": "Hasła nie są identyczne."})
        
        # Validate password strength
        try:
            validate_password(password1)
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"password1": e.messages})
        
        return attrs
    
    def create(self, validated_data):
        """Create user with musician profile."""
        # Extract profile data
        instrument = validated_data.pop('instrument')
        birthday = validated_data.pop('birthday')
        password1 = validated_data.pop('password1')
        validated_data.pop('password2')  # Remove confirmation password
        
        # Create user
        user = User.objects.create_user(
            password=password1,
            **validated_data
        )
        
        # Add user to musician group
        musician_group, created = Group.objects.get_or_create(name="musician")
        user.groups.add(musician_group)
        
        # Create musician profile
        MusicianProfile.objects.create(
            user=user,
            instrument=instrument,
            birthday=birthday
        )
        
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    musician_profile = MusicianProfileSerializer(source='musicianprofile')
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'musician_profile']
    
    def validate_email(self, value):
        """Check that email is unique (excluding current user)."""
        if User.objects.filter(email=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("Użytkownik o takim emailu już istnieje.")
        return value
    
    def update(self, instance, validated_data):
        """Update user and musician profile."""
        musician_profile_data = validated_data.pop('musicianprofile', {})
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update musician profile
        if musician_profile_data:
            musician_profile = instance.musicianprofile
            for attr, value in musician_profile_data.items():
                setattr(musician_profile, attr, value)
            musician_profile.save()
        
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    old_password = serializers.CharField(write_only=True)
    new_password1 = serializers.CharField(write_only=True)
    new_password2 = serializers.CharField(write_only=True)
    
    def validate_old_password(self, value):
        """Check that old password is correct."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Nieprawidłowe obecne hasło.")
        return value
    
    def validate(self, attrs):
        """Validate new password confirmation."""
        new_password1 = attrs.get('new_password1')
        new_password2 = attrs.get('new_password2')
        
        if new_password1 != new_password2:
            raise serializers.ValidationError({"new_password2": "Nowe hasła nie są identyczne."})
        
        # Validate password strength
        try:
            validate_password(new_password1)
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"new_password1": e.messages})
        
        return attrs
    
    def save(self):
        """Change user password."""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password1'])
        user.save()
        return user
