from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, permission_required
from django.utils import timezone

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
            return render(request, 'seasons/add_season.jinja', context)
    
    context = {}
    return render(request, 'seasons/add_season.jinja', context)


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
            return render(request, 'seasons/edit_season.jinja', context)
    
    context = {
        'season': season,
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
