from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .forms import UserProfileForm
from django.contrib import messages

@login_required
def home(request):
    """
    Render the home page.
    """
    return render(request, "home.jinja")

@login_required
def profile_view(request):
    user = request.user
    profile = user.musicianprofile

    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=profile, user=user)
        if form.is_valid():
            form.save(user=user)
            messages.success(request, "Profil został zaktualizowany.")
            return redirect('/')
    else:
        form = UserProfileForm(instance=profile, user=user)

    return render(request, 'profile.jinja', {
        'form': form,
        'profile': profile,
    })
