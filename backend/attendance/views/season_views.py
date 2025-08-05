from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, permission_required
from django.utils import timezone
from django.http import JsonResponse

from main.models import MusicianProfile, INSTRUMENT_CHOICES
from ..models import Season


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
    return render(request, 'seasons/manage_seasons.jinja', context)


@login_required
@permission_required('attendance.manage_seasons', raise_exception=True)
def add_season_view(request):
    """
    Add a new season with musician selection.
    """
    # Get all active musicians
    all_musicians = MusicianProfile.objects.select_related('user').filter(active=True)
    
    # Group musicians by instrument sections
    section_names = [choice[1] for choice in INSTRUMENT_CHOICES]
    sections = {name: [] for name in section_names}
    section_map = {name.lower(): name for name in section_names}
    
    for musician in all_musicians:
        instrument = (musician.instrument or '').strip().lower()
        section = section_map.get(instrument, "Inne")
        sections[section].append(musician)

    # Create sectioned data for template
    sectioned_musicians = []
    for section_name, section_musicians in sections.items():
        if section_musicians:  # Only include sections that have musicians
            sectioned_musicians.append({
                'section_name': section_name,
                'musicians': section_musicians
            })
    
    # Get previous seasons for import option
    previous_seasons = Season.objects.all().order_by('-start_date')
    
    if request.method == 'POST':
        name = request.POST.get('name')
        start_date = request.POST.get('start_date')
        end_date = request.POST.get('end_date')
        is_active = request.POST.get('is_active') == 'on'
        import_from_season_id = request.POST.get('import_from_season')
        
        if not name or not start_date or not end_date:
            context = {
                'error_message': 'Wszystkie pola są wymagane.',
                'sectioned_musicians': sectioned_musicians,
                'previous_seasons': previous_seasons,
            }
            return render(request, 'seasons/add_season.jinja', context)
        
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
            
            # Handle musician selection
            selected_musician_ids = []
            if import_from_season_id:
                # Import musicians from previous season
                try:
                    previous_season = Season.objects.get(id=import_from_season_id)
                    selected_musician_ids = list(previous_season.musicians.values_list('id', flat=True))
                except Season.DoesNotExist:
                    pass
            else:
                # Get selected musicians from form
                selected_musician_ids = request.POST.getlist('selected_musicians')
                selected_musician_ids = [int(id) for id in selected_musician_ids if id.isdigit()]
            
            # Add selected musicians to season
            if selected_musician_ids:
                season.musicians.set(selected_musician_ids)
            
            from django.contrib import messages
            musician_count = len(selected_musician_ids)
            if is_active and other_active_seasons:
                deactivated_names = [s.name for s in other_active_seasons]
                messages.success(request, f'Sezon "{season.name}" został dodany jako aktywny z {musician_count} muzykami.')
                messages.info(request, f'Automatycznie dezaktywowano sezony: {", ".join(deactivated_names)}.')
            else:
                messages.success(request, f'Sezon "{season.name}" został dodany z {musician_count} muzykami.')
            
            return redirect('manage_seasons')
        except Exception as e:
            context = {
                'error_message': f'Błąd podczas tworzenia sezonu: {str(e)}',
                'sectioned_musicians': sectioned_musicians,
                'previous_seasons': previous_seasons,
            }
            return render(request, 'seasons/add_season.jinja', context)
    
    context = {
        'sectioned_musicians': sectioned_musicians,
        'previous_seasons': previous_seasons,
    }
    return render(request, 'seasons/add_season.jinja', context)


@login_required
@permission_required('attendance.manage_seasons', raise_exception=True)
def edit_season_view(request, season_id):
    """
    Edit an existing season and its musicians.
    """
    season = get_object_or_404(Season, id=season_id)
    
    # Get all active musicians
    all_musicians = MusicianProfile.objects.select_related('user').filter(active=True)
    
    # Group musicians by instrument sections
    section_names = [choice[1] for choice in INSTRUMENT_CHOICES]
    sections = {name: [] for name in section_names}
    section_map = {name.lower(): name for name in section_names}
    
    # Get currently selected musicians for this season
    current_musician_ids = set(season.musicians.values_list('id', flat=True))
    
    for musician in all_musicians:
        instrument = (musician.instrument or '').strip().lower()
        section = section_map.get(instrument, "Inne")
        sections[section].append(musician)

    # Create sectioned data for template
    sectioned_musicians = []
    for section_name, section_musicians in sections.items():
        if section_musicians:  # Only include sections that have musicians
            sectioned_musicians.append({
                'section_name': section_name,
                'musicians': section_musicians
            })
    
    if request.method == 'POST':
        name = request.POST.get('name')
        start_date = request.POST.get('start_date')
        end_date = request.POST.get('end_date')
        is_active = request.POST.get('is_active') == 'on'
        
        if not name or not start_date or not end_date:
            context = {
                'season': season,
                'sectioned_musicians': sectioned_musicians,
                'current_musician_ids': current_musician_ids,
                'error_message': 'Wszystkie pola są wymagane.'
            }
            return render(request, 'seasons/edit_season.jinja', context)
        
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
            
            # Handle musician selection
            selected_musician_ids = request.POST.getlist('selected_musicians')
            selected_musician_ids = [int(id) for id in selected_musician_ids if id.isdigit()]
            season.musicians.set(selected_musician_ids)
            
            from django.contrib import messages
            musician_count = len(selected_musician_ids)
            if is_active and other_active_seasons:
                deactivated_names = [s.name for s in other_active_seasons]
                messages.success(request, f'Sezon "{season.name}" został zaktualizowany z {musician_count} muzykami.')
                messages.info(request, f'Automatycznie dezaktywowano sezony: {", ".join(deactivated_names)}.')
            else:
                messages.success(request, f'Sezon "{season.name}" został zaktualizowany z {musician_count} muzykami.')
            
            return redirect('manage_seasons')
        except Exception as e:
            context = {
                'season': season,
                'sectioned_musicians': sectioned_musicians,
                'current_musician_ids': current_musician_ids,
                'error_message': f'Błąd podczas aktualizacji sezonu: {str(e)}'
            }
            return render(request, 'seasons/edit_season.jinja', context)
    
    context = {
        'season': season,
        'sectioned_musicians': sectioned_musicians,
        'current_musician_ids': current_musician_ids,
    }
    return render(request, 'seasons/edit_season.jinja', context)


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
    return render(request, 'seasons/delete_season.jinja', context)


@login_required
@permission_required('attendance.manage_seasons', raise_exception=True)
def get_season_musicians_api(request, season_id):
    """
    API endpoint to get musicians from a specific season for import functionality.
    """
    try:
        season = Season.objects.get(id=season_id)
        musicians = list(season.musicians.values_list('id', flat=True))
        return JsonResponse({
            'musicians': musicians,
            'count': len(musicians),
            'season_name': season.name
        })
    except Season.DoesNotExist:
        return JsonResponse({'error': 'Season not found'}, status=404)
