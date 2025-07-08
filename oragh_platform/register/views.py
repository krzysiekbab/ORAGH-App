from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.models import Group
from .forms import CustomUserCreationForm
from main.models import MusicianProfile
from django.contrib.auth import views as auth_views
from django.contrib.auth.models import User
from django.conf import settings
import csv
import os
from dotenv import load_dotenv
from django.contrib import messages

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

def register_all_musicians(request):
    if not request.user.is_superuser:
        messages.error(request, "Nie masz uprawnień do wykonania tej operacji.")
        return redirect("/")

    # Explicitly load .env from the correct directory
    env_path = os.path.join(settings.BASE_DIR, ".env")
    load_dotenv(dotenv_path=env_path)
    default_password = os.getenv("MUSICIAN_DEFAULT_PASSWORD")

    csv_path = os.path.join(
        settings.BASE_DIR,
        "data/oragh_musicians.csv"
    )
    created_count = 0
    skipped_count = 0
    with open(csv_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            username = row["username"].strip()
            email = row["email"].strip()
            first_name = row["first_name"].strip()
            last_name = row["last_name"].strip()
            birthday = row["birthday"].strip()
            instrument = row["instrument"].strip()
            if User.objects.filter(username=username).exists():
                skipped_count += 1
                continue
            user = User.objects.create_user(
                username=username,
                email=email,
                password=default_password,
                first_name=first_name,
                last_name=last_name,
            )
            # Add user to "musician" group
            musician_group, _ = Group.objects.get_or_create(name="musician")
            user.groups.add(musician_group)
            MusicianProfile.objects.create(
                user=user,
                instrument=instrument,
                birthday=birthday if birthday else None
            )
            created_count += 1
    return render(request, "register_all_musicians_result.jinja", {
        "created_count": created_count,
        "skipped_count": skipped_count
    })

def delete_all_musicians(request):
    if not request.user.is_superuser:
        messages.error(request, "Nie masz uprawnień do wykonania tej operacji.")
        return redirect("/")

    musician_group, _ = Group.objects.get_or_create(name="musician")
    users = User.objects.filter(groups=musician_group, is_superuser=False)
    deleted_count = users.count()
    users.delete()
    return render(request, "delete_all_musicians_result.jinja", {
        "deleted_count": deleted_count
    })