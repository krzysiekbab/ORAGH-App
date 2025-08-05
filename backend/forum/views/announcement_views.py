from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponseForbidden
from ..models import Announcement
from ..forms import AnnouncementForm


@login_required
def manage_announcements(request):
    """Manage announcements (board members only)"""
    # Check if user is board member, staff, or superuser
    if not (request.user.groups.filter(name__in=['board', 'zarząd']).exists() or 
           request.user.is_staff or request.user.is_superuser):
        return HttpResponseForbidden("Nie masz uprawnień do zarządzania ogłoszeniami.")
    
    announcements = Announcement.objects.all()
    
    context = {
        'announcements': announcements,
    }
    return render(request, 'announcements/manage_announcements.jinja', context)


@login_required
def create_announcement(request):
    """Create a new announcement (board members only)"""
    # Check if user is board member, staff, or superuser
    if not (request.user.groups.filter(name__in=['board', 'zarząd']).exists() or 
           request.user.is_staff or request.user.is_superuser):
        return HttpResponseForbidden("Nie masz uprawnień do tworzenia ogłoszeń.")
    
    if request.method == 'POST':
        form = AnnouncementForm(request.POST)
        if form.is_valid():
            announcement = form.save(commit=False)
            announcement.author = request.user
            announcement.save()
            messages.success(request, f'Ogłoszenie "{announcement.title}" zostało utworzone.')
            return redirect('forum:index')
    else:
        form = AnnouncementForm()
    
    context = {
        'form': form,
    }
    return render(request, 'announcements/create_announcement.jinja', context)


@login_required
def edit_announcement(request, announcement_id):
    """Edit an announcement (board members only)"""
    announcement = get_object_or_404(Announcement, id=announcement_id)
    
    # Check if user is board member, staff, or superuser
    if not (request.user.groups.filter(name__in=['board', 'zarząd']).exists() or 
           request.user.is_staff or request.user.is_superuser):
        return HttpResponseForbidden("Nie masz uprawnień do edytowania ogłoszeń.")
    
    if request.method == 'POST':
        form = AnnouncementForm(request.POST, instance=announcement)
        if form.is_valid():
            form.save()
            messages.success(request, f'Ogłoszenie "{announcement.title}" zostało zaktualizowane.')
            return redirect('forum:index')
    else:
        form = AnnouncementForm(instance=announcement)
    
    context = {
        'form': form,
        'announcement': announcement,
        'editing': True,
    }
    return render(request, 'announcements/create_announcement.jinja', context)


@login_required
def delete_announcement(request, announcement_id):
    """Delete an announcement (board members only)"""
    announcement = get_object_or_404(Announcement, id=announcement_id)
    
    # Check if user is board member, staff, or superuser
    if not (request.user.groups.filter(name__in=['board', 'zarząd']).exists() or 
           request.user.is_staff or request.user.is_superuser):
        return HttpResponseForbidden("Nie masz uprawnień do usuwania ogłoszeń.")
    
    if request.method == 'POST':
        announcement.delete()
        messages.success(request, 'Ogłoszenie zostało usunięte.')
        return redirect('forum:index')
    
    context = {
        'announcement': announcement,
    }
    return render(request, 'announcements/delete_announcement.jinja', context)
