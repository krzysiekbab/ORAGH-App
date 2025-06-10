from django.shortcuts import render, HttpResponse

# Create your views here.
def home(request):
    """
    Render the home page.
    """
    return render(request, "home.jinja")
