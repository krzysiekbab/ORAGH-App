from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import Group

# Create your views here.
def register(request):
    """
    Render the registration page.
    """
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Add user to "musican" group
            musican_group, created = Group.objects.get_or_create(name="musician")
            user.groups.add(musican_group)
            user.refresh_from_db()
            return redirect("/login")
        
    form = UserCreationForm(request.POST or None)
    return render(request, "register.jinja", {"form": form})