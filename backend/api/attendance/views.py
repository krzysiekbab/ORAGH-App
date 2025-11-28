"""
Attendance-related API views.
"""
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Count, Q, Avg, Sum
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from rest_framework.pagination import PageNumberPagination

from .models import Event, Attendance
from .serializers import (
    EventListSerializer, EventDetailSerializer, EventCreateUpdateSerializer,
    AttendanceSerializer, AttendanceMarkSerializer
)
from .permissions import IsBoardMemberOrReadOnly, IsBoardMember


class AttendancePagination(PageNumberPagination):
    """Custom pagination for attendance views."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class EventViewSet(viewsets.ModelViewSet):
    """ViewSet for managing events."""
    queryset = Event.objects.all()
    permission_classes = [IsBoardMemberOrReadOnly]
    pagination_class = AttendancePagination
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return EventCreateUpdateSerializer
        return EventDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new event and return the full event details."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(created_by=request.user)
        
        # Return the full event details using EventDetailSerializer
        response_serializer = EventDetailSerializer(instance, context={'request': request})
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def get_queryset(self):
        """Filter events based on query parameters."""
        queryset = Event.objects.select_related('season', 'created_by')
        
        # Filter by season
        season_id = self.request.query_params.get('season')
        if season_id:
            try:
                queryset = queryset.filter(season_id=int(season_id))
            except ValueError:
                pass
        
        # Filter by event type
        event_type = self.request.query_params.get('type')
        if event_type:
            queryset = queryset.filter(type=event_type)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set created_by when creating an event."""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def attendances(self, request, pk=None):
        """Get attendance records for this event."""
        event = self.get_object()
        attendances = event.attendances.select_related('user', 'marked_by')
        serializer = AttendanceSerializer(attendances, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_attendance(self, request, pk=None):
        """Mark attendance for this event."""
        event = self.get_object()
        
        # Check permissions - only board members can mark attendance
        if not (request.user.is_superuser or 
                request.user.groups.filter(name='board').exists()):
            return Response(
                {'detail': 'Brak uprawnień do oznaczania obecności. Wymagane uprawnienia zarządu.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AttendanceMarkSerializer(data=request.data)
        if serializer.is_valid():
            attendances_data = serializer.validated_data['attendances']
            created_count = 0
            updated_count = 0
            
            for attendance_data in attendances_data:
                user_id = int(attendance_data['user_id'])
                present_value = float(attendance_data['present'])
                
                try:
                    user = User.objects.get(id=user_id)
                except User.DoesNotExist:
                    continue
                
                attendance, created = Attendance.objects.update_or_create(
                    user=user,
                    event=event,
                    defaults={
                        'present': present_value,
                        'marked_by': request.user
                    }
                )
                
                if created:
                    created_count += 1
                else:
                    updated_count += 1
            
            return Response({
                'detail': f'Oznaczono obecność dla {created_count + updated_count} osób.',
                'created': created_count,
                'updated': updated_count
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AttendanceViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing attendance records."""
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = AttendancePagination
    
    def get_queryset(self):
        """Filter attendance based on query parameters."""
        queryset = Attendance.objects.select_related('user', 'event', 'marked_by')
        
        # Filter by user
        user_id = self.request.query_params.get('user')
        if user_id:
            try:
                queryset = queryset.filter(user_id=int(user_id))
            except ValueError:
                pass
        
        # Filter by event
        event_id = self.request.query_params.get('event')
        if event_id:
            try:
                queryset = queryset.filter(event_id=int(event_id))
            except ValueError:
                pass
        
        # Filter by season
        season_id = self.request.query_params.get('season')
        if season_id:
            try:
                queryset = queryset.filter(event__season_id=int(season_id))
            except ValueError:
                pass
        
        # Filter by attendance type
        attendance_type = self.request.query_params.get('type')
        if attendance_type == 'present':
            queryset = queryset.filter(present__gt=0)
        elif attendance_type == 'absent':
            queryset = queryset.filter(present=0)
        elif attendance_type == 'half':
            queryset = queryset.filter(present=0.5)
        elif attendance_type == 'full':
            queryset = queryset.filter(present=1.0)
        
        return queryset
