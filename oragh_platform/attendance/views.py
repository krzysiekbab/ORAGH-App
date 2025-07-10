from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, permission_required
from django.utils import timezone

from main.models import MusicianProfile, INSTRUMENT_CHOICES
from concerts.models import Concert
from .models import Attendance, Event, Season

@login_required
def attendance_view(request):
    event_type = request.GET.get('event_type', 'all')
    season_id = request.GET.get('season', '')
    musicians = MusicianProfile.objects.select_related('user').filter(active=True)

    # Get all seasons for the filter dropdown
    seasons = Season.objects.all().order_by('-start_date')
    current_season = Season.get_current_season()
    
    # If no season specified, use current season
    # If there's no current season, use the most recent season
    if not season_id:
        if current_season:
            season_id = str(current_season.id)
        elif seasons.exists():
            season_id = str(seasons.first().id)
        else:
            # If no seasons exist at all, we can't filter by season
            season_id = None
    
    # Get events based on the selected type and season, sorted by date (oldest first)
    events_query = Event.objects.select_related('season')
    
    # Filter by season if specified and seasons exist
    if season_id and seasons.exists():
        try:
            season_id_int = int(season_id)
            events_query = events_query.filter(season_id=season_id_int)
        except (ValueError, TypeError):
            # If season_id is invalid, fall back to current season
            if current_season:
                season_id = str(current_season.id)
                events_query = events_query.filter(season_id=current_season.id)
            elif seasons.exists():
                season_id = str(seasons.first().id)
                events_query = events_query.filter(season_id=seasons.first().id)
    
    if event_type == 'all':
        events = events_query.order_by('date')
    else:
        events = events_query.filter(type=event_type).order_by('date')

    # Build attendance lookup dictionary
    attendances = Attendance.objects.select_related('event').all()
    attendance_lookup = {}
    for attendance in attendances:
        key = f"{attendance.user_id}_{attendance.event_id}"
        attendance_lookup[key] = attendance

    # Group musicians by instrument sections
    section_names = [choice[1] for choice in INSTRUMENT_CHOICES]
    sections = {name: [] for name in section_names}
    section_map = {name.lower(): name for name in section_names}
    
    for musician in musicians:
        instrument = (musician.instrument or '').strip().lower()
        section = section_map.get(instrument, "Inne")
        sections[section].append(musician)

    # Create sectioned user-event grid for template
    sectioned_attendance_grid = []
    for section_name, section_musicians in sections.items():
        if not section_musicians:  # Skip empty sections
            continue
            
        section_data = {
            'section_name': section_name,
            'user_rows': []
        }
        
        for musician in section_musicians:
            user = musician.user
            user_row = {
                'user': user,
                'attendances': []
            }
            for event in events:
                key = f"{user.id}_{event.id}"
                attendance = attendance_lookup.get(key)
                user_row['attendances'].append({
                    'event': event,
                    'attendance': attendance,
                    'present': attendance.present if attendance else None
                })
            section_data['user_rows'].append(user_row)
        
        sectioned_attendance_grid.append(section_data)

    can_check = request.user.has_perm('attendance.add_attendance')
    can_delete = request.user.has_perm('attendance.delete_attendance')
    can_manage_seasons = request.user.has_perm('attendance.manage_seasons')
    
    # Get the selected season object for display purposes
    selected_season = None
    if season_id:
        try:
            selected_season = Season.objects.get(id=int(season_id))
        except (Season.DoesNotExist, ValueError):
            # If selected season doesn't exist, fall back to current season
            if current_season:
                selected_season = current_season
                season_id = str(current_season.id)
            elif seasons.exists():
                selected_season = seasons.first()
                season_id = str(seasons.first().id)
    
    context = {
        'events': events,
        'sectioned_attendance_grid': sectioned_attendance_grid,
        'event_type': event_type,
        'seasons': seasons,
        'selected_season_id': season_id,
        'selected_season': selected_season,
        'current_season': current_season,
        'can_check': can_check,
        'can_delete': can_delete,
        'can_manage_seasons': can_manage_seasons,
    }
    return render(request, 'view_attendance.jinja', context)

@login_required
@permission_required('attendance.add_attendance', raise_exception=True)
def add_attendance_view(request):
    # Always default to 'rehearsal' (Próba) for add_attendance_view, regardless of URL parameter
    event_type = request.GET.get('event_type', 'rehearsal')
    # If event_type is 'all', change it to 'rehearsal' since 'all' doesn't make sense for adding attendance
    if event_type == 'all':
        event_type = 'rehearsal'
    
    concert_id = request.GET.get('concert_id')
    
    # Get current season and all seasons for selection
    current_season = Season.get_current_season()
    seasons = Season.objects.all().order_by('-start_date')
    
    # Pre-populate form data if coming from a specific concert
    selected_concert = None
    if concert_id:
        try:
            selected_concert = Concert.objects.get(id=concert_id)
        except Concert.DoesNotExist:
            pass

    # Get upcoming concerts if event type is concert
    upcoming_concerts = []
    if event_type == 'concert':
        upcoming_concerts = Concert.objects.filter(date__gte=timezone.now()).order_by('date')

    musicians = MusicianProfile.objects.select_related('user').filter(active=True)

    # Group musicians by instrument sections
    section_names = [choice[1] for choice in INSTRUMENT_CHOICES]
    sections = {name: [] for name in section_names}
    section_map = {name.lower(): name for name in section_names}
    
    for musician in musicians:
        instrument = (musician.instrument or '').strip().lower()
        section = section_map.get(instrument, "Inne")
        sections[section].append(musician)

    # Create sectioned data for template
    sectioned_musicians = []
    for section_name, section_musicians in sections.items():
        if not section_musicians:  # Skip empty sections
            continue
        sectioned_musicians.append({
            'section_name': section_name,
            'musicians': section_musicians
        })

    if request.method == 'POST':
        event_name = request.POST.get('event_name')
        event_date = request.POST.get('event_date')
        season_id = request.POST.get('season')
        
        if not event_name or not event_date:
            context = {
                'sectioned_musicians': sectioned_musicians,
                'event_type': event_type,
                'selected_concert': selected_concert,
                'upcoming_concerts': upcoming_concerts,
                'current_season': current_season,
                'seasons': seasons,
                'today': timezone.now().date(),
                'error_message': 'Nazwa wydarzenia i data są wymagane.'
            }
            return render(request, 'add_attendance.jinja', context)
        
        # Get selected season or use current season as fallback
        selected_season = None
        if season_id:
            try:
                selected_season = Season.objects.get(id=season_id)
            except Season.DoesNotExist:
                selected_season = current_season
        else:
            selected_season = current_season
        
        # Create new event with selected season
        event = Event.objects.create(
            name=event_name,
            date=event_date,
            type=event_type,
            season=selected_season
        )
        
        # Save attendance for all musicians
        for musician in musicians:
            present = request.POST.get(f'user_{musician.user.id}') == 'on'
            attendance = Attendance.objects.create(
                user=musician.user,
                event=event,
                present=present
            )
        
        return redirect('attendance')
    
    context = {
        'sectioned_musicians': sectioned_musicians,
        'event_type': event_type,
        'selected_concert': selected_concert,
        'upcoming_concerts': upcoming_concerts,
        'current_season': current_season,
        'seasons': seasons,
        'today': timezone.now().date(),
    }
    return render(request, 'add_attendance.jinja', context)

@login_required
@permission_required('attendance.change_attendance', raise_exception=True)
def edit_attendance_view(request, event_id):
    """
    Edit an existing event and its attendance records.
    Allows changing event name, date, season, and attendance status for all musicians.
    """
    event = get_object_or_404(Event, id=event_id)
    musicians = MusicianProfile.objects.select_related('user').filter(active=True)
    
    # Get seasons for selection
    seasons = Season.objects.all().order_by('-start_date')
    current_season = Season.get_current_season()
    
    # Group musicians by instrument sections
    section_names = [choice[1] for choice in INSTRUMENT_CHOICES]
    sections = {name: [] for name in section_names}
    section_map = {name.lower(): name for name in section_names}
    
    for musician in musicians:
        instrument = (musician.instrument or '').strip().lower()
        section = section_map.get(instrument, "Inne")
        sections[section].append(musician)

    # Create sectioned data with current attendance
    sectioned_musicians = []
    for section_name, section_musicians in sections.items():
        if not section_musicians:  # Skip empty sections
            continue
        section_data = {
            'section_name': section_name,
            'musicians': []
        }
        for musician in section_musicians:
            # Get current attendance for this musician and event
            try:
                attendance = Attendance.objects.get(user=musician.user, event=event)
                current_attendance = attendance.present
            except Attendance.DoesNotExist:
                current_attendance = False
            
            section_data['musicians'].append({
                'musician': musician,
                'current_attendance': current_attendance
            })
        sectioned_musicians.append(section_data)

    if request.method == 'POST':
        event_name = request.POST.get('event_name')
        event_date = request.POST.get('event_date')
        season_id = request.POST.get('season')
        
        if not event_name or not event_date:
            context = {
                'event': event,
                'sectioned_musicians': sectioned_musicians,
                'seasons': seasons,
                'current_season': current_season,
                'error_message': 'Nazwa wydarzenia i data są wymagane.'
            }
            return render(request, 'edit_attendance.jinja', context)
        
        # Get selected season or keep current season as fallback
        if season_id:
            try:
                selected_season = Season.objects.get(id=season_id)
                event.season = selected_season
            except Season.DoesNotExist:
                pass  # Keep current season if invalid season selected
        
        # Update event details
        event.name = event_name
        event.date = event_date
        event.save()
        
        # Update attendance for all musicians
        for musician in musicians:
            present = request.POST.get(f'user_{musician.user.id}') == 'on'
            attendance, created = Attendance.objects.get_or_create(
                user=musician.user, 
                event=event,
                defaults={'present': present}
            )
            if not created:
                attendance.present = present
                attendance.save()
        
        # Add success message
        from django.contrib import messages
        messages.success(request, f'Wydarzenie "{event.name}" zostało zaktualizowane.')
        return redirect('attendance')
    
    context = {
        'event': event,
        'sectioned_musicians': sectioned_musicians,
        'seasons': seasons,
        'current_season': current_season,
    }
    return render(request, 'edit_attendance.jinja', context)

@login_required
@permission_required('attendance.delete_attendance', raise_exception=True)
def delete_attendance_view(request, event_id):
    """
    Delete an existing event and all its related attendance records.
    Only users with delete_attendance permission can access this view.
    """
    event = get_object_or_404(Event, id=event_id)
    
    if request.method == 'POST':
        # Additional safety check - require confirmation parameter
        confirmation = request.POST.get('confirm_delete')
        if confirmation != 'yes':
            from django.contrib import messages
            messages.error(request, 'Usunięcie wydarzenia wymaga potwierdzenia.')
            return redirect('delete_attendance', event_id=event_id)
            
        event_name = event.name
        event_date = event.date
        
        # Delete all attendance records for this event
        Attendance.objects.filter(event=event).delete()
        
        # Delete the event itself
        event.delete()
        
        # Add success message
        from django.contrib import messages
        messages.success(request, f'Wydarzenie "{event_name}" z dnia {event_date} zostało usunięte.')
        return redirect('attendance')
    
    # For GET request, show confirmation page
    # Get attendance count for confirmation
    attendance_count = Attendance.objects.filter(event=event).count()
    
    context = {
        'event': event,
        'attendance_count': attendance_count,
        'today': timezone.now().date(),
    }
    return render(request, 'delete_attendance.jinja', context)

@login_required
@permission_required('attendance.manage_seasons', raise_exception=True)
def manage_seasons_view(request):
    """
    View for managing seasons - list, add, edit, delete seasons.
    Only users with manage_seasons permission can access this view.
    """
    seasons = Season.objects.all().order_by('-start_date')
    current_season = Season.get_current_season()
    
    context = {
        'seasons': seasons,
        'current_season': current_season,
    }
    return render(request, 'manage_seasons.jinja', context)

@login_required
@permission_required('attendance.manage_seasons', raise_exception=True)
def add_season_view(request):
    """
    Add a new season.
    """
    if request.method == 'POST':
        name = request.POST.get('name')
        start_date = request.POST.get('start_date')
        end_date = request.POST.get('end_date')
        is_active = request.POST.get('is_active') == 'on'
        
        if not name or not start_date or not end_date:
            context = {
                'error_message': 'Wszystkie pola są wymagane.'
            }
            return render(request, 'add_season.jinja', context)
        
        try:
            # Check if setting this season as active will deactivate others
            other_active_seasons = []
            if is_active:
                other_active_seasons = list(Season.objects.filter(is_active=True))
            
            season = Season.objects.create(
                name=name,
                start_date=start_date,
                end_date=end_date,
                is_active=is_active
            )
            
            from django.contrib import messages
            if is_active and other_active_seasons:
                deactivated_names = [s.name for s in other_active_seasons]
                messages.success(request, f'Sezon "{season.name}" został dodany jako aktywny.')
                messages.info(request, f'Automatycznie dezaktywowano sezony: {", ".join(deactivated_names)}.')
            else:
                messages.success(request, f'Sezon "{season.name}" został dodany.')
            
            return redirect('manage_seasons')
        except Exception as e:
            context = {
                'error_message': f'Błąd podczas tworzenia sezonu: {str(e)}'
            }
            return render(request, 'add_season.jinja', context)
    
    context = {}
    return render(request, 'add_season.jinja', context)

@login_required
@permission_required('attendance.manage_seasons', raise_exception=True)
def edit_season_view(request, season_id):
    """
    Edit an existing season.
    """
    season = get_object_or_404(Season, id=season_id)
    
    if request.method == 'POST':
        name = request.POST.get('name')
        start_date = request.POST.get('start_date')
        end_date = request.POST.get('end_date')
        is_active = request.POST.get('is_active') == 'on'
        
        if not name or not start_date or not end_date:
            context = {
                'season': season,
                'error_message': 'Wszystkie pola są wymagane.'
            }
            return render(request, 'edit_season.jinja', context)
        
        try:
            # Check if setting this season as active will deactivate others
            other_active_seasons = []
            if is_active and not season.is_active:
                # Season is being activated from inactive state
                other_active_seasons = list(Season.objects.exclude(pk=season.pk).filter(is_active=True))
            
            season.name = name
            season.start_date = start_date
            season.end_date = end_date
            season.is_active = is_active
            season.save()
            
            from django.contrib import messages
            if is_active and other_active_seasons:
                deactivated_names = [s.name for s in other_active_seasons]
                messages.success(request, f'Sezon "{season.name}" został zaktualizowany i ustawiony jako aktywny.')
                messages.info(request, f'Automatycznie dezaktywowano sezony: {", ".join(deactivated_names)}.')
            else:
                messages.success(request, f'Sezon "{season.name}" został zaktualizowany.')
            
            return redirect('manage_seasons')
        except Exception as e:
            context = {
                'season': season,
                'error_message': f'Błąd podczas aktualizacji sezonu: {str(e)}'
            }
            return render(request, 'edit_season.jinja', context)
    
    context = {
        'season': season,
    }
    return render(request, 'edit_season.jinja', context)

@login_required
@permission_required('attendance.manage_seasons', raise_exception=True)
def delete_season_view(request, season_id):
    """
    Delete an existing season and handle related events.
    Only users with manage_seasons permission can access this view.
    """
    season = get_object_or_404(Season, id=season_id)
    
    if request.method == 'POST':
        # Additional safety check - require confirmation parameter
        confirmation = request.POST.get('confirm_delete')
        if confirmation != 'yes':
            from django.contrib import messages
            messages.error(request, 'Usunięcie sezonu wymaga potwierdzenia.')
            return redirect('delete_season', season_id=season_id)
        
        season_name = season.name
        events_count = season.events.count()
        
        # Check if this is the current season
        current_season = Season.get_current_season()
        is_current_season = (season == current_season)
        
        # Delete all events related to this season (which will cascade delete attendance)
        season.events.all().delete()
        
        # Delete the season itself
        season.delete()
        
        # Add success message
        from django.contrib import messages
        if events_count > 0:
            messages.success(request, f'Sezon "{season_name}" został usunięty wraz z {events_count} wydarzeniami.')
        else:
            messages.success(request, f'Sezon "{season_name}" został usunięty.')
            
        if is_current_season:
            messages.warning(request, 'Uwaga: Usunięto aktywny sezon. Sprawdź ustawienia sezonów.')
        
        return redirect('manage_seasons')
    
    # For GET request, show confirmation page
    # Get related data for confirmation
    events_count = season.events.count()
    total_attendance_count = 0
    for event in season.events.all():
        total_attendance_count += event.attendance_set.count()
    
    current_season = Season.get_current_season()
    is_current_season = (season == current_season)
    
    context = {
        'season': season,
        'events_count': events_count,
        'total_attendance_count': total_attendance_count,
        'is_current_season': is_current_season,
        'current_season': current_season,
    }
    return render(request, 'delete_season.jinja', context)
