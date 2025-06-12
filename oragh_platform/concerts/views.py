from django.shortcuts import render, HttpResponse
from django.contrib.auth.decorators import login_required, permission_required
from .models import Concert

@login_required
@permission_required('concerts.view_concert', raise_exception=True)
def view_concerts(request):
    """
    Render the concerts page.
    """

    concerts = Concert.objects.all()
    return render(request, "view_concerts.jinja", {"concerts": concerts})

@login_required
@permission_required('concerts.view_concert', raise_exception=True)
def concert(request, concert_id):
    """
    Render a specific concert page.
    """
    try:
        concert = Concert.objects.get(id=concert_id)
    except Concert.DoesNotExist:
        return HttpResponse("Concert not found.", status=404)

    return render(request, "view_concert.jinja", {"concert": concert})

@login_required
@permission_required('concerts.add_concert', raise_exception=True)
def add_concert(request):
    """
    Handle concert creation.
    """
    if request.method == "POST":
        name = request.POST.get("name")
        date = request.POST.get("date")
        description = request.POST.get("description")

        if not name or not date:
            return HttpResponse("Name and date are required.", status=400)

        concert = Concert(name=name, date=date, description=description, created_by=request.user)
        concert.save()
        return render(request, "success.jinja", {"concert": concert})

    return render(request, "add_concert.jinja")

@login_required
@permission_required('concerts.change_concert', raise_exception=True)
def change_concert(request, concert_id):
    """
    Handle concert editing.
    """
    try:
        concert = Concert.objects.get(id=concert_id)
    except Concert.DoesNotExist:
        return HttpResponse("Concert not found.", status=404)

    if request.method == "POST":
        name = request.POST.get("name")
        date = request.POST.get("date")
        description = request.POST.get("description")

        if not name or not date:
            return render(request, "error.jinja", {"error": "Name and date are required."})

        concert.name = name
        concert.date = date
        concert.description = description
        concert.save()
        return render(request, "success.jinja", {"concert": concert})

    return render(request, "edit_concert.jinja", {"concert": concert})

@login_required
@permission_required('concerts.delete_concert', raise_exception=True)
def delete_concert(request, concert_id):
    """
    Handle concert deletion.
    """
    try:
        concert = Concert.objects.get(id=concert_id)
    except Concert.DoesNotExist:
        return HttpResponse("Concert not found.", status=404)

    if request.method == "POST":
        concert.delete()
        return HttpResponse("Concert deleted successfully.", status=200)

    return render(request, "delete_concert.jinja", {"concert": concert})