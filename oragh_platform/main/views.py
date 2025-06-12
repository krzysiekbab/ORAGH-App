from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def home(request):
    """
    Render the home page.
    """
    return render(request, "home.jinja")
