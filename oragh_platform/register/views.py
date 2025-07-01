from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.models import Group
from .forms import CustomUserCreationForm
from main.models import MusicianProfile
from django.contrib.auth import views as auth_views

def register(request):
    """
    Render the registration page.
    """
    if request.user.is_authenticated:
        return redirect("/")
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
            instrument = form.cleaned_data["instrument"]
            birthday = form.cleaned_data["birthday"]
            MusicianProfile.objects.create(user=user, instrument=instrument, birthday=birthday)

            return redirect("/login")
    else:
        form = CustomUserCreationForm()
    return render(request, "register.jinja", {"form": form})

def login_view(request, *args, **kwargs):
    if request.user.is_authenticated:
        return redirect("/")
    return auth_views.LoginView.as_view(template_name="registration/login.html")(request, *args, **kwargs)

def logout_view(request, *args, **kwargs):
    logout(request)
    return redirect("/login")