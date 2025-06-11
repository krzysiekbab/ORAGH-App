from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm

# Create your views here.
def register(request):
    """
    Render the registration page.
    """
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            # user = form.save()
            # username = form.cleaned_data.get("username")
            # raw_password = form.cleaned_data.get("password1")
            # user = authenticate(username=username, password=raw_password)
            # login(request, user)
            # return render(request, "registration/success.jinja", {"user": user})
            return redirect("/login")
        
    form = UserCreationForm(request.POST or None)
    return render(request, "register.jinja", {"form": form})