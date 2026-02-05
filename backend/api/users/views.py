"""
User-related API views.
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
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
        """
        Create user account (inactive until admin approval).
        Does NOT return JWT tokens - user must wait for admin activation.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Return success message without tokens (user cannot login yet)
        return Response({
            'success': True,
            'message': 'Rejestracja przebiegła pomyślnie. Twoje konto oczekuje na zatwierdzenie przez administratora. Będziesz mógł się zalogować po zaakceptowaniu przez administratora.',
            'user': {
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }, status=status.HTTP_201_CREATED)


class CustomLoginView(TokenObtainPairView):
    """
    Custom login view that provides more detailed error messages.
    Distinguishes between:
    - Non-existent user / wrong password
    - Existing user with is_active=False (pending approval)
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({
                'detail': 'Nazwa użytkownika i hasło są wymagane.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user exists
        try:
            user = User.objects.get(username=username)
            
            # IMPORTANT: Check password FIRST (regardless of is_active status)
            # This prevents revealing account existence when wrong password is provided
            if not user.check_password(password):
                # Wrong password - use generic error message
                return Response({
                    'detail': 'Nieprawidłowa nazwa użytkownika lub hasło.'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Password is correct - now check if user is active
            if not user.is_active:
                # User exists with correct password but account is pending activation
                return Response({
                    'detail': 'Twoje konto oczekuje na zatwierdzenie przez administratora. Będziesz mógł się zalogować po zaakceptowaniu przez administratora.',
                    'account_status': 'pending'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # User is active and password is correct - use parent class to generate tokens
            return super().post(request, *args, **kwargs)
            
        except User.DoesNotExist:
            # User doesn't exist - use same generic error message
            return Response({
                'detail': 'Nieprawidłowa nazwa użytkownika lub hasło.'
            }, status=status.HTTP_401_UNAUTHORIZED)


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
        """Return all users with musician profiles, excluding superusers and incomplete profiles."""
        return User.objects.filter(
            musicianprofile__isnull=False,
            musicianprofile__active=True,
            is_superuser=False,
            first_name__isnull=False,
            last_name__isnull=False,
            musicianprofile__instrument__isnull=False
        ).exclude(
            first_name='',
            last_name='',
            musicianprofile__instrument=''
        ).select_related('musicianprofile').order_by('first_name', 'last_name')


class UserDetailView(generics.RetrieveAPIView):
    """Get specific user details."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'
    
    def get_queryset(self):
        """Return all users with musician profiles, excluding superusers."""
        return User.objects.filter(
            musicianprofile__isnull=False,
            is_superuser=False
        ).select_related('musicianprofile')


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
    import os
    from django.conf import settings
    
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
    
    # Delete old photo if it exists
    if musician_profile.photo:
        old_photo_path = os.path.join(settings.MEDIA_ROOT, str(musician_profile.photo))
        if os.path.exists(old_photo_path):
            try:
                os.remove(old_photo_path)
                print(f"Deleted old photo: {old_photo_path}")
            except OSError as e:
                print(f"Error deleting old photo {old_photo_path}: {e}")
    
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


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_permissions(request):
    """Get current user's permissions and groups."""
    user = request.user
    
    # Get user groups
    groups = list(user.groups.values_list('name', flat=True))
    
    # Get user permissions (both direct and through groups)
    permissions = list(user.get_all_permissions())
    
    return Response({
        'groups': groups,
        'permissions': permissions
    })


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def activate_account(request, token):
    """
    Activate a user account using the activation token.
    GET: Display activation confirmation page (for admin clicking email link)
    POST: Perform the actual activation
    
    This endpoint is called when admin clicks the activation link in their email.
    """
    from .models import AccountActivationToken
    from .emails import send_account_activated_email
    
    try:
        activation_token = AccountActivationToken.objects.select_related('user').get(token=token)
    except AccountActivationToken.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Nieprawidłowy token aktywacyjny.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if already used
    if activation_token.is_used:
        return Response({
            'success': False,
            'error': 'To konto zostało już aktywowane.',
            'activated_at': activation_token.activated_at
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if token expired
    if activation_token.is_expired:
        return Response({
            'success': False,
            'error': 'Token aktywacyjny wygasł. Użytkownik musi zarejestrować się ponownie.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = activation_token.user
    
    if request.method == 'GET':
        # Return user info for confirmation page
        return Response({
            'success': True,
            'action': 'confirm',
            'user': {
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'date_joined': user.date_joined,
            },
            'message': f'Czy chcesz aktywować konto użytkownika {user.first_name} {user.last_name}?'
        })
    
    # POST - perform activation
    if activation_token.activate():
        # Send confirmation email to user
        send_account_activated_email(user)
        
        return Response({
            'success': True,
            'message': f'Konto użytkownika {user.first_name} {user.last_name} zostało aktywowane. Użytkownik otrzymał email z potwierdzeniem.'
        })
    
    return Response({
        'success': False,
        'error': 'Nie udało się aktywować konta.'
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def pending_activations(request):
    """
    List all pending account activations (for admin panel).
    Only accessible by staff/superusers.
    """
    from .models import AccountActivationToken
    
    if not request.user.is_staff:
        return Response({
            'error': 'Brak uprawnień do przeglądania tej strony.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    pending = AccountActivationToken.objects.filter(
        is_used=False
    ).select_related('user', 'user__musicianprofile').order_by('-created_at')
    
    pending_list = []
    for token in pending:
        user = token.user
        pending_list.append({
            'token': str(token.token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'date_joined': user.date_joined,
            },
            'instrument': user.musicianprofile.instrument if hasattr(user, 'musicianprofile') else None,
            'created_at': token.created_at,
            'is_expired': token.is_expired,
        })
    
    return Response({
        'count': len(pending_list),
        'pending_activations': pending_list
    })
