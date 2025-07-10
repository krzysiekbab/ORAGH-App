from django.shortcuts import render, HttpResponse, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, permission_required
from django.urls import reverse
from .models import Concert
from main.models import MusicianProfile, INSTRUMENT_CHOICES
from urllib.parse import urlencode

@login_required
@permission_required('concerts.view_concert', raise_exception=True)
def view_concerts(request):
    """
    Render the concerts page.
    """
    # Order concerts by date (upcoming first)
    concerts = Concert.objects.all().order_by('date')
    return render(request, "view_concerts.jinja", {"concerts": concerts})

@login_required
@permission_required('concerts.view_concert', raise_exception=True)
def concert(request, concert_id):
    """
    Render a specific concert page.
    """
    try:
        concert = Concert.objects.get(id=concert_id)
    except Concert.DoesNotExist:
        return HttpResponse("Concert not found.", status=404)

    is_joined = False
    if request.user.is_authenticated:
        try:
            musician = MusicianProfile.objects.get(user=request.user)
            is_joined = concert.musicians.filter(id=musician.id).exists()
        except MusicianProfile.DoesNotExist:
            pass

    # Map instrument values to display names
    instrument_map = dict(INSTRUMENT_CHOICES)
    
    # Define all sections in logical order (woodwinds, brass, other)
    section_names = [
        "Flet", "Obój", "Klarnet", "Fagot", "Saksofon",  # Woodwinds
        "Trąbka", "Waltornia", "Puzon", "Eufonium", "Tuba",  # Brass
        "Gitara", "Perkusja"  # Other
    ]
    
    # Initialize all sections (empty lists for all sections)
    sections = {name: [] for name in section_names}

    for musician in concert.musicians.all():
        # Get display name for instrument, default to "Perkusja" if not found
        instrument_value = getattr(musician, "instrument", None)
        instrument_display = instrument_map.get(instrument_value, "Perkusja")
        
        # If instrument is not in our predefined sections, add to "Perkusja"
        if instrument_display not in sections:
            instrument_display = "Perkusja"
        
        sections[instrument_display].append(musician)

    return render(request, "view_concert.jinja", {
        "concert": concert,
        "is_joined": is_joined,
        "sections": sections,
    })

@login_required
@permission_required('concerts.add_concert', raise_exception=True)
def add_concert(request):
    """
    Handle concert creation.
    """
    if request.method == "POST":
        name = request.POST.get("name")
        date = request.POST.get("date")
        description = request.POST.get("description")

        if not name or not date:
            return HttpResponse("Name and date are required.", status=400)

        concert = Concert(name=name, date=date, description=description, created_by=request.user)
        concert.save()
        params = urlencode({'success': f'Koncert "{concert.name}" został pomyślnie utworzony.'})
        return redirect(f'{reverse("concerts")}?{params}')

    return render(request, "add_concert.jinja")

@login_required
@permission_required('concerts.change_concert', raise_exception=True)
def change_concert(request, concert_id):
    """
    Handle concert editing.
    """
    try:
        concert = Concert.objects.get(id=concert_id)
    except Concert.DoesNotExist:
        return HttpResponse("Concert not found.", status=404)

    if request.method == "POST":
        name = request.POST.get("name")
        date = request.POST.get("date")
        description = request.POST.get("description")

        if not name or not date:
            return render(request, "error.jinja", {"error": "Name and date are required."})

        concert.name = name
        concert.date = date
        concert.description = description
        concert.save()
        params = urlencode({'success': f'Koncert "{concert.name}" został pomyślnie zaktualizowany.'})
        return redirect(f'{reverse("concerts")}?{params}')

    return render(request, "edit_concert.jinja", {"concert": concert})

@login_required
@permission_required('concerts.delete_concert', raise_exception=True)
def delete_concert(request, concert_id):
    """
    Handle concert deletion.
    """
    try:
        concert = Concert.objects.get(id=concert_id)
    except Concert.DoesNotExist:
        params = urlencode({'error': 'Nie znaleziono koncertu do usunięcia.'})
        return redirect(f'{reverse("concerts")}?{params}')

    if request.method == "POST":
        concert.delete()
        params = urlencode({'success': 'Koncert został pomyślnie usunięty.'})
        return redirect(f'{reverse("concerts")}?{params}')

    return HttpResponse(status=405)  # Method Not Allowed

@login_required
def join_concert(request, concert_id):
    try:
        concert = Concert.objects.get(id=concert_id)
    except Concert.DoesNotExist:
        return HttpResponse("Concert not found.", status=404)

    try:
        musician = MusicianProfile.objects.get(user=request.user)
    except MusicianProfile.DoesNotExist:
        return HttpResponse("You must have a musician profile to join.", status=403)
    
    if musician in concert.musicians.all():
        # Pass error to the concert page
        return render(request, "view_concert.jinja", {
            "concert": concert,
            "error": "Jesteś już zapisany na ten koncert."
        })
    
    concert.musicians.add(musician)
    return redirect('concert', concert_id=concert.id)

@login_required
def leave_concert(request, concert_id):
    try:
        concert = Concert.objects.get(id=concert_id)
    except Concert.DoesNotExist:
        return HttpResponse("Concert not found.", status=404)

    try:
        musician = MusicianProfile.objects.get(user=request.user)
    except MusicianProfile.DoesNotExist:
        return HttpResponse("You must have a musician profile to leave.", status=403)

    if musician not in concert.musicians.all():
        return render(request, "view_concert.jinja", {
            "concert": concert,
            "error": "Nie jesteś zapisany na ten koncert."
        })

    if request.method == "POST":
        concert.musicians.remove(musician)
        return redirect('concert', concert_id=concert.id)

    return render(request, "view_concert.jinja", {
        "concert": concert,
        "error": "Potwierdź wypisanie się z koncertu."
    })
