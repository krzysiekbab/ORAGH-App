from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.models import Group
from .forms import CustomUserCreationForm
from main.models import MusicianProfile

def register(request):
    """
    Render the registration page.
    """
    if request.method == "POST":
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.first_name = form.cleaned_data["first_name"]
            user.last_name = form.cleaned_data["last_name"]
            user.email = form.cleaned_data["email"]
            user.save()
            # Add user to "musician" group
            musician_group, created = Group.objects.get_or_create(name="musician")
            user.groups.add(musician_group)
            # Create MusicianProfile
            instrument = form.cleaned_data["instrument"]
            MusicianProfile.objects.create(user=user, instrument=instrument)
            return redirect("/login")
    else:
        form = CustomUserCreationForm()
    return render(request, "register.jinja", {"form": form})