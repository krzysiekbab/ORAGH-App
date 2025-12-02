"""
Season-related API views.
"""
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import Season
from .serializers import (
    SeasonListSerializer, SeasonDetailSerializer, SeasonCreateUpdateSerializer,
    SeasonAttendanceGridSerializer
)
from .permissions import IsBoardMemberOrReadOnly
from api.users.models import MusicianProfile, INSTRUMENT_CHOICES


class SeasonPagination(PageNumberPagination):
    """Custom pagination for season views."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class SeasonViewSet(viewsets.ModelViewSet):
    """ViewSet for managing seasons."""
    queryset = Season.objects.all()
    permission_classes = [IsBoardMemberOrReadOnly]
    pagination_class = SeasonPagination
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SeasonListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return SeasonCreateUpdateSerializer
        return SeasonDetailSerializer
    
    def get_queryset(self):
        """Filter seasons based on query parameters."""
        queryset = Season.objects.all()
        
        # Filter by active status
        is_active = self.request.query_params.get('active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get the current active season."""
        current_season = Season.get_current_season()
        if current_season:
            serializer = SeasonDetailSerializer(current_season, context={'request': request})
            return Response(serializer.data)
        return Response({'detail': 'Brak aktywnego sezonu.'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'], permission_classes=[IsBoardMemberOrReadOnly])
    def set_current(self, request, pk=None):
        """Set this season as the current active season."""
        season = self.get_object()
        season.is_active = True
        season.save()  # The save method will automatically deactivate other seasons
        
        serializer = SeasonDetailSerializer(season, context={'request': request})
        return Response({
            'detail': f'Sezon "{season.name}" został ustawiony jako aktualny.',
            'season': serializer.data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def musicians(self, request, pk=None):
        """Get musicians in this season grouped by sections."""
        season = self.get_object()
        sectioned_musicians = season.get_musicians_by_section()
        return Response({'sections': sectioned_musicians})
    
    @action(detail=True, methods=['get'])
    def events(self, request, pk=None):
        """Get events in this season."""
        from api.attendance.models import Event
        from api.attendance.serializers import EventListSerializer
        
        season = self.get_object()
        events = season.events.all()
        
        # Filter by event type
        event_type = request.query_params.get('type')
        if event_type:
            events = events.filter(type=event_type)
        
        # Filter by month
        month = request.query_params.get('month')
        if month:
            try:
                events = events.filter(date__month=int(month))
            except ValueError:
                pass
        
        serializer = EventListSerializer(events, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def attendance_grid(self, request, pk=None):
        """Get attendance grid for this season."""
        from api.attendance.models import Event, Attendance
        from api.attendance.serializers import EventListSerializer
        
        season = self.get_object()
        
        # Get events filtered by query parameters
        events = season.events.all()
        event_type = request.query_params.get('event_type')
        if event_type and event_type != 'all':
            events = events.filter(type=event_type)
        
        month = request.query_params.get('month')
        if month:
            try:
                events = events.filter(date__month=int(month))
            except ValueError:
                pass
        
        # Get musicians in this season
        musicians = season.musicians.select_related('user').filter(active=True)
        
        # Build attendance lookup
        attendances = Attendance.objects.filter(
            event__in=events
        ).select_related('user', 'event')
        
        attendance_lookup = {}
        for attendance in attendances:
            key = f"{attendance.user_id}_{attendance.event_id}"
            attendance_lookup[key] = attendance
        
        # Group musicians by sections
        section_names = [choice[1] for choice in INSTRUMENT_CHOICES]
        sections = {name: [] for name in section_names}
        section_map = {name.lower(): name for name in section_names}
        
        for musician in musicians:
            instrument = (musician.instrument or '').strip().lower()
            section = section_map.get(instrument, "Inne")
            sections[section].append(musician)
        
        # Build sectioned attendance grid
        sectioned_attendance_grid = []
        for section_name, section_musicians in sections.items():
            if not section_musicians:
                continue
            
            section_data = {
                'section_name': section_name,
                'user_rows': []
            }
            
            for musician in section_musicians:
                user = musician.user
                user_row = {
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'email': user.email
                    },
                    'musician_profile': {
                        'id': musician.id,
                        'instrument': musician.instrument,
                        'profile_photo': musician.photo.url if musician.photo else None
                    },
                    'attendances': []
                }
                
                for event in events:
                    key = f"{user.id}_{event.id}"
                    attendance = attendance_lookup.get(key)
                    user_row['attendances'].append({
                        'event_id': event.id,
                        'present': float(attendance.present) if attendance else 0.0,
                        'attendance_id': attendance.id if attendance else None
                    })
                
                section_data['user_rows'].append(user_row)
            
            sectioned_attendance_grid.append(section_data)
        
        response_data = {
            'season': SeasonListSerializer(season, context={'request': request}).data,
            'events': EventListSerializer(events, many=True, context={'request': request}).data,
            'attendance_grid': sectioned_attendance_grid
        }
        
        return Response(response_data)

    @action(detail=True, methods=['post'], permission_classes=[IsBoardMemberOrReadOnly])
    def add_musicians(self, request, pk=None):
        """Add musicians to this season and create attendance records for all events."""
        from api.attendance.models import Attendance
        
        season = self.get_object()
        musician_ids = request.data.get('musician_ids', [])
        
        if not musician_ids:
            return Response({'detail': 'Brak podanych ID muzyków.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get valid musician profiles
        musicians = MusicianProfile.objects.filter(id__in=musician_ids, active=True)
        if not musicians.exists():
            return Response({'detail': 'Nie znaleziono aktywnych muzyków.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Add musicians to season and create attendance records
        added_count = 0
        created_attendances_count = 0
        
        for musician in musicians:
            if not season.musicians.filter(id=musician.id).exists():
                # Add musician to season
                season.musicians.add(musician)
                added_count += 1
                
                # Create attendance records (as absent - 0.0) for all events in this season
                season_events = season.events.all()
                for event in season_events:
                    # Create attendance only if it doesn't exist
                    attendance, created = Attendance.objects.get_or_create(
                        user=musician.user,
                        event=event,
                        defaults={'present': 0.0}
                    )
                    if created:
                        created_attendances_count += 1
        
        return Response({
            'detail': f'Dodano {added_count} muzyków do sezonu "{season.name}".',
            'added_count': added_count,
            'created_attendances': created_attendances_count,
            'total_musicians': season.musicians.count()
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsBoardMemberOrReadOnly])
    def remove_musicians(self, request, pk=None):
        """Remove musicians from this season and delete their attendances."""
        from api.attendance.models import Attendance
        
        season = self.get_object()
        musician_ids = request.data.get('musician_ids', [])
        
        if not musician_ids:
            return Response({'detail': 'Brak podanych ID muzyków.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user IDs for musicians to be removed
        musicians_to_remove = season.musicians.filter(id__in=musician_ids)
        user_ids = list(musicians_to_remove.values_list('user_id', flat=True))
        
        # Remove musicians from season and delete their attendances
        removed_count = 0
        deleted_attendances_count = 0
        
        for musician_id in musician_ids:
            if season.musicians.filter(id=musician_id).exists():
                # Delete all attendances for this musician's user in events from this season
                musician = season.musicians.get(id=musician_id)
                deleted = Attendance.objects.filter(
                    user_id=musician.user_id,
                    event__season=season
                ).delete()
                deleted_attendances_count += deleted[0] if deleted[0] else 0
                
                # Remove musician from season
                season.musicians.remove(musician_id)
                removed_count += 1
        
        return Response({
            'detail': f'Usunięto {removed_count} muzyków z sezonu "{season.name}".',
            'removed_count': removed_count,
            'deleted_attendances': deleted_attendances_count,
            'total_musicians': season.musicians.count()
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def available_musicians(self, request, pk=None):
        """Get musicians not yet in this season."""
        season = self.get_object()
        
        # Get all active musicians not in this season
        season_musician_ids = season.musicians.values_list('id', flat=True)
        available_musicians = MusicianProfile.objects.filter(
            active=True
        ).exclude(
            id__in=season_musician_ids
        ).select_related('user').order_by('user__first_name', 'user__last_name')
        
        musicians_data = []
        for musician in available_musicians:
            profile_photo_url = None
            if musician.photo:
                profile_photo_url = request.build_absolute_uri(musician.photo.url)
            
            musicians_data.append({
                'id': musician.id,
                'user_id': musician.user.id,
                'full_name': f"{musician.user.first_name} {musician.user.last_name}",
                'instrument': musician.instrument,
                'email': musician.user.email,
                'profile_photo': profile_photo_url
            })
        
        return Response({
            'available_musicians': musicians_data,
            'count': len(musicians_data)
        })
