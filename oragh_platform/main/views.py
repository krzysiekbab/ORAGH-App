from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .forms import UserProfileForm
from django.contrib import messages
from .models import MusicianProfile, INSTRUMENT_CHOICES
from collections import defaultdict

@login_required
def home(request):
    """
    Render the home page.
    """
    return render(request, "home.jinja")

@login_required
def edit_profile(request):
    user = request.user
    profile = user.musicianprofile

    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=profile, user=user)
        birthday = request.POST.get('birthday', '').strip()
        if form.is_valid():
            profile = form.save(commit=False, user=user)
            if birthday:
                profile.birthday = birthday
            profile.save()
            messages.success(request, "Profil został zaktualizowany.")
            return redirect('/')
    else:
        form = UserProfileForm(instance=profile, user=user)

    return render(request, 'edit_profile.jinja', {
        'form': form,
        'profile': profile,
    })

def show_profiles(request):
    sort = request.GET.get('sort', 'surname')
    instrument_filter = request.GET.get('instrument', None)
    active_filter = request.GET.get('active', '')
    profiles = MusicianProfile.objects.select_related('user')
    if active_filter == 'active':
        profiles = profiles.filter(active=True)
    elif active_filter == 'inactive':
        profiles = profiles.filter(active=False)
    if sort == 'surname':
        profiles = profiles.order_by('user__last_name', 'user__first_name')
    elif sort == 'instrument':
        profiles = profiles.order_by('instrument', 'user__last_name')
        if instrument_filter:
            profiles = profiles.filter(instrument=instrument_filter)
    elif sort == 'join':
        profiles = profiles.order_by('user__date_joined')
    elif sort == 'active':
        profiles = profiles.order_by('-active', 'user__last_name', 'user__first_name')
    else:
        profiles = profiles.all()
    return render(
        request,
        'show_profiles.jinja',
        {
            'profiles': profiles,
            'sort': sort,
            'instrument_choices': INSTRUMENT_CHOICES,
            'instrument_filter': instrument_filter,
            'active_filter': active_filter,
        }
    )

def show_profile(request, profile_id):
    profile = MusicianProfile.objects.get(id=profile_id)
    return render(request, 'show_profile.jinja', {'profile': profile})

def show_band(request):
    # Use instrument display names from INSTRUMENT_CHOICES for section names
    section_names = [choice[1] for choice in INSTRUMENT_CHOICES]
    sections = {name: [] for name in section_names}
    # Create a mapping for quick lookup (case-insensitive)
    section_map = {name.lower(): name for name in section_names}
    # Group musicians by instrument
    for profile in MusicianProfile.objects.select_related('user').filter(active=True):
        instrument = (profile.instrument or '').strip().lower()
        section = section_map.get(instrument, "Inne")
        sections[section].append(profile)

    total_members = sum(len(profiles) for profiles in sections.values())

    return render(
        request,
        "show_band.jinja",
        {
            "sections": sections,
            "total_members": total_members,
        }
    )