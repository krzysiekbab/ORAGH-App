"""
User-related API views.
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from .models import MusicianProfile
from .serializers import (
    UserRegistrationSerializer, 
    UserSerializer, 
    UserProfileUpdateSerializer,
    ChangePasswordSerializer
)


class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        """Create user and return JWT tokens."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get and update user profile."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        """Use different serializers for GET and PUT operations."""
        if self.request.method == 'GET':
            return UserSerializer
        return UserProfileUpdateSerializer


class UserListView(generics.ListAPIView):
    """List all musicians."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return all users with musician profiles."""
        return User.objects.filter(
            musicianprofile__isnull=False,
            musicianprofile__active=True
        ).select_related('musicianprofile').order_by('first_name', 'last_name')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password."""
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Hasło zostało pomyślnie zmienione.'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_profile_photo(request):
    """Upload profile photo."""
    try:
        musician_profile = request.user.musicianprofile
    except MusicianProfile.DoesNotExist:
        return Response({
            'error': 'Profil muzyka nie istnieje.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if 'photo' not in request.FILES:
        return Response({
            'error': 'Nie przesłano pliku zdjęcia.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Update photo
    musician_profile.photo = request.FILES['photo']
    musician_profile.save()
    
    # Return updated user data with proper context
    user_serializer = UserSerializer(request.user, context={'request': request})
    return Response({
        'message': 'Zdjęcie profilowe zostało zaktualizowane.',
        'user': user_serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    """Get current authenticated user details."""
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)
