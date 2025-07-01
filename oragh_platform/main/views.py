from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .forms import UserProfileForm
from django.contrib import messages
from .models import MusicianProfile, INSTRUMENT_CHOICES

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
    profiles = MusicianProfile.objects.select_related('user')
    if sort == 'surname':
        profiles = profiles.order_by('user__last_name', 'user__first_name')
    elif sort == 'instrument':
        profiles = profiles.order_by('instrument', 'user__last_name')
        if instrument_filter:
            profiles = profiles.filter(instrument=instrument_filter)
    elif sort == 'join':
        profiles = profiles.order_by('user__date_joined')
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
        }
    )

def show_profile(request, profile_id):
    profile = MusicianProfile.objects.get(id=profile_id)
    return render(request, 'show_profile.jinja', {'profile': profile})
