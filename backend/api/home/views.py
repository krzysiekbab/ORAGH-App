from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import datetime, timedelta

# TODO: Import new models when created in future phases:
# Phase 4: from api.concerts.models import Concert
# Phase 5: from api.attendance.models import Season, Event, Attendance  
# Phase 6: from api.forum.models import Post, Announcement
# Note: api.users.models already exist and can be used


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def home_stats(request):
    """Get home statistics - Mock data for Phase 3
    
    TODO Phase 4+: Replace with real data from:
    - Concerts model for totalConcerts
    - Season/Event models for upcoming events
    - Attendance model for user attendance rate
    - MusicianProfile for musician counts
    """
    try:
        # Mock statistics for now
        stats = {
            'totalMusicians': 45,
            'activeMusicians': 42,
            'upcomingEvents': 3,
            'totalConcerts': 12,
            'userAttendanceRate': 85.5,
            'currentSeason': '2024/2025',
        }
        
        return Response(stats)
        
    except Exception as e:
        return Response(
            {'error': f'Error fetching home stats: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upcoming_events(request):
    """Get upcoming events - Mock data for Phase 3
    
    TODO Phase 5: Replace with real data from Event model:
    - Query Event.objects.filter(date__gte=today, date__lte=thirty_days_from_now)
    - Include season information and event types
    """
    try:
        # Mock events data
        events_data = [
            {
                'id': 1,
                'name': 'Próba generalna przed koncertem',
                'date': (timezone.now().date() + timedelta(days=7)).isoformat(),
                'type': 'rehearsal',
                'season': '2024/2025',
            },
            {
                'id': 2,
                'name': 'Koncert letni w parku',
                'date': (timezone.now().date() + timedelta(days=12)).isoformat(),
                'type': 'concert',
                'season': '2024/2025',
            },
            {
                'id': 3,
                'name': 'Soundcheck',
                'date': (timezone.now().date() + timedelta(days=11)).isoformat(),
                'type': 'soundcheck',
                'season': '2024/2025',
            }
        ]
        
        return Response(events_data)
        
    except Exception as e:
        return Response(
            {'error': f'Error fetching upcoming events: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_activity(request):
    """Get recent activity - Mock data for Phase 3
    
    TODO Phase 6+: Replace with real data from:
    - Post model for forum posts
    - Announcement model for announcements  
    - Concert model for new concerts
    - Event model for new events
    """
    try:
        # Mock activity data
        activities = [
            {
                'id': 'announcement_1',
                'type': 'announcement',
                'title': 'Nowy repertuar na koncert letni',
                'author': 'Zarząd ORAGH',
                'created_at': (timezone.now() - timedelta(hours=2)).isoformat(),
                'description': 'Dodano nowe utwory do repertuaru koncertu letniego',
            },
            {
                'id': 'post_1',
                'type': 'forum_post',
                'title': 'Pytanie o transport na koncert',
                'author': 'Jan Kowalski',
                'created_at': (timezone.now() - timedelta(hours=8)).isoformat(),
                'description': 'Nowy post w dziale organizacyjnym',
            },
            {
                'id': 'concert_1',
                'type': 'concert',
                'title': 'Dodano koncert "Wieczór muzyki filmowej"',
                'author': 'Anna Nowak',
                'created_at': (timezone.now() - timedelta(days=1)).isoformat(),
                'description': 'Nowy koncert zaplanowany na październik',
            },
            {
                'id': 'event_1',
                'type': 'event',
                'title': 'Próba dodana do kalendarza',
                'author': 'Dyrygent',
                'created_at': (timezone.now() - timedelta(days=2)).isoformat(),
                'description': 'Dodano próbę przed koncertem',
            }
        ]
        
        return Response(activities)
        
    except Exception as e:
        return Response(
            {'error': f'Error fetching recent activity: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
