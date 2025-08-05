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
            return redirect('profile')
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
    # Define all sections in logical order (matching concerts app)
    section_names = [
        "Flet", "Obój", "Klarnet", "Fagot", "Saksofon",  # Woodwinds
        "Trąbka", "Waltornia", "Puzon", "Eufonium", "Tuba",  # Brass
        "Gitara", "Perkusja"  # Other
    ]
    
    # Initialize all sections (empty lists for all sections)
    sections = {name: [] for name in section_names}
    
    # Map instrument values to display names
    instrument_map = dict(INSTRUMENT_CHOICES)
    
    # Group musicians by instrument
    for profile in MusicianProfile.objects.select_related('user').filter(active=True):
        instrument_value = getattr(profile, "instrument", None)
        instrument_display = instrument_map.get(instrument_value, "Perkusja")
        
        # If instrument is not in our predefined sections, add to "Perkusja"
        if instrument_display not in sections:
            instrument_display = "Perkusja"
        
        sections[instrument_display].append(profile)

    total_members = sum(len(profiles) for profiles in sections.values())

    return render(
        request,
        "show_band.jinja",
        {
            "sections": sections,
            "total_members": total_members,
        }
    )

@login_required
def profile_overview(request):
    """
    Display the profile overview/settings page with an edit button.
    """
    user = request.user
    profile = user.musicianprofile
    return render(request, 'profile_overview.jinja', {
        'profile': profile,
        'user': user,
    })