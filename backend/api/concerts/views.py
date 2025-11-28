"""
Concert-related API views.
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import Group
from django.db import transaction
from .models import Concert
from .serializers import (
    ConcertListSerializer,
    ConcertDetailSerializer,
    ConcertCreateUpdateSerializer,
    ConcertRegistrationSerializer
)


class ConcertPagination(PageNumberPagination):
    """Custom pagination for concerts."""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class ConcertListCreateView(generics.ListCreateAPIView):
    """List all concerts or create a new concert."""
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = ConcertPagination
    
    def get_queryset(self):
        """Get concerts queryset with filters and optimizations."""
        queryset = Concert.objects.select_related('created_by').prefetch_related('participants__user').order_by('date', 'date_created')
        
        # Prefetch user registration status to avoid N+1 queries
        if self.request.user.is_authenticated and hasattr(self.request.user, 'musicianprofile'):
            user_registrations = Concert.objects.filter(
                participants=self.request.user.musicianprofile
            ).values_list('id', flat=True)
            
            # Annotate each concert with user registration status
            for concert in queryset:
                concert._prefetched_user_registration = concert.id in user_registrations
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for list and create."""
        if self.request.method == 'POST':
            return ConcertCreateUpdateSerializer
        return ConcertListSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Set the created_by field when creating a concert."""
        # Check if user can create concerts using Django permissions
        if not self.request.user.has_perm('concerts.add_concert'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Nie masz uprawnień do tworzenia koncertów.")
        serializer.save(created_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Override create to return list serializer response."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return the created concert using the list serializer to include calculated fields
        concert = serializer.instance
        list_serializer = ConcertListSerializer(concert, context={'request': request})
        
        headers = self.get_success_headers(serializer.data)
        return Response(list_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ConcertDetailUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a concert."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get concert with optimized queries."""
        return Concert.objects.select_related('created_by').prefetch_related(
            'participants__user'
        )
    
    def get_serializer_class(self):
        """Use different serializers for retrieve and update."""
        if self.request.method == 'GET':
            return ConcertDetailSerializer
        return ConcertCreateUpdateSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def check_object_permissions(self, request, obj):
        """Check if user can edit/delete this concert."""
        if request.method in ['PUT', 'PATCH']:
            if not obj.can_user_edit(request.user):
                self.permission_denied(
                    request, 
                    message="Nie masz uprawnień do edytowania tego koncertu."
                )
        elif request.method == 'DELETE':
            if not obj.can_user_delete(request.user):
                self.permission_denied(
                    request, 
                    message="Nie masz uprawnień do usuwania tego koncertu."
                )
        
        super().check_object_permissions(request, obj)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def concert_registration(request, pk):
    """Handle concert registration/unregistration."""
    concert = get_object_or_404(Concert, pk=pk)
    
    # Check if user has musician profile
    if not hasattr(request.user, 'musicianprofile'):
        return Response(
            {'error': 'Musisz mieć profil muzyka aby zapisać się na koncert.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Use atomic transaction to prevent race conditions
    with transaction.atomic():
        # Get fresh concert instance to avoid stale data
        concert = Concert.objects.select_for_update().get(pk=pk)
        
        serializer = ConcertRegistrationSerializer(
            data=request.data,
            context={'concert': concert, 'user': request.user}
        )
        
        if serializer.is_valid():
            action = serializer.validated_data['action']
            musician_profile = request.user.musicianprofile
            
            if action == 'register':
                # Double-check if user is not already registered (prevent race condition)
                if concert.participants.filter(user=request.user).exists():
                    return Response(
                        {'error': 'Jesteś już zapisany na ten koncert.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                concert.participants.add(musician_profile)
                message = 'Pomyślnie zapisałeś się na koncert.'
            else:  # unregister
                # Double-check if user is registered (prevent race condition)
                if not concert.participants.filter(user=request.user).exists():
                    return Response(
                        {'error': 'Nie jesteś zapisany na ten koncert.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                concert.participants.remove(musician_profile)
                message = 'Pomyślnie wypisałeś się z koncertu.'
            
            # Refresh concert to get updated counts
            concert.refresh_from_db()
            
            return Response({
                'message': message,
                'participants_count': concert.participants_count,
                'is_registered': concert.is_user_registered(request.user)
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def concert_participants(request, pk):
    """Get list of concert participants."""
    concert = get_object_or_404(Concert, pk=pk)
    
    from api.users.serializers import MusicianProfileSerializer
    
    participants = concert.participants.all()
    serializer = MusicianProfileSerializer(participants, many=True, context={'request': request})
    
    return Response({
        'participants': serializer.data,
        'count': len(serializer.data)
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_permissions(request):
    """Get current user's concert permissions."""
    user = request.user
    
    # Check if user can create concerts (board members only)
    can_create = Concert.can_user_create(user)
    
    return Response({
        'can_create': can_create
    })
