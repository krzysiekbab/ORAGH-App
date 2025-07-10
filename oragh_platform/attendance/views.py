from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, permission_required
from django.utils import timezone

from main.models import MusicianProfile, INSTRUMENT_CHOICES
from concerts.models import Concert
from .models import Attendance, Event

@login_required
def attendance_view(request):
    event_type = request.GET.get('event_type', 'all')
    musicians = MusicianProfile.objects.select_related('user').filter(active=True)

    # Get events based on the selected type
    if event_type == 'all':
        events = Event.objects.all().order_by('-date')
    else:
        events = Event.objects.filter(type=event_type).order_by('-date')

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
    context = {
        'events': events,
        'sectioned_attendance_grid': sectioned_attendance_grid,
        'event_type': event_type,
        'can_check': can_check,
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
        
        if not event_name or not event_date:
            context = {
                'sectioned_musicians': sectioned_musicians,
                'event_type': event_type,
                'error_message': 'Nazwa wydarzenia i data są wymagane.'
            }
            return render(request, 'add_attendance.jinja', context)
        
        # Create new event
        event = Event.objects.create(
            name=event_name,
            date=event_date,
            type=event_type
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
        'today': timezone.now().date(),
    }
    return render(request, 'add_attendance.jinja', context)

@login_required
@permission_required('attendance.change_attendance', raise_exception=True)
def edit_attendance_view(request, event_id):
    """
    Edit an existing event and its attendance records.
    Allows changing event name, date, and attendance status for all musicians.
    """
    event = get_object_or_404(Event, id=event_id)
    musicians = MusicianProfile.objects.select_related('user').filter(active=True)
    
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
        
        if not event_name or not event_date:
            context = {
                'event': event,
                'sectioned_musicians': sectioned_musicians,
                'error_message': 'Nazwa wydarzenia i data są wymagane.'
            }
            return render(request, 'edit_attendance.jinja', context)
        
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
    }
    return render(request, 'edit_attendance.jinja', context)
