from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.http import HttpResponseForbidden
from ..models import Directory, Post


@login_required
def directory_view(request, directory_id):
    """View posts and subdirectories in a specific directory"""
    directory = get_object_or_404(Directory, id=directory_id)
    
    # Check if user can access this directory
    if not directory.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tego katalogu.")
    
    # Get subdirectories
    subdirectories = Directory.objects.filter(parent=directory)
    
    # Get posts in this directory
    posts = Post.objects.filter(directory=directory).select_related('author')
    paginator = Paginator(posts, 20)  # 20 posts per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'directory': directory,
        'subdirectories': subdirectories,
        'posts': page_obj,
        'can_create_post': True,  # All logged in users can create posts in accessible directories
        'can_create_directory': True,
    }
    return render(request, 'directories/directory_view.jinja', context)


@login_required
def create_directory(request, parent_id=None):
    """Create a new directory or subdirectory"""
    parent = None
    
    if parent_id:
        parent = get_object_or_404(Directory, id=parent_id)
        # Check if user can access the parent directory
        if not parent.can_user_access(request.user):
            return HttpResponseForbidden("Nie masz dostępu do tego katalogu.")
    
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        description = request.POST.get('description', '').strip()
        access_level = request.POST.get('access_level', 'all')
        highlight_style = request.POST.get('highlight_style', 'none')
        
        if not name:
            messages.error(request, 'Nazwa katalogu jest wymagana.')
            context = {
                'parent': parent,
                'name': name,
                'description': description,
                'access_level': access_level,
                'highlight_style': highlight_style,
            }
            return render(request, 'directories/create_directory.jinja', context)
        
        # Create directory
        directory = Directory.objects.create(
            name=name,
            description=description,
            parent=parent,
            access_level=access_level,
            highlight_style=highlight_style,
            author=request.user
        )
        
        messages.success(request, f'Katalog "{name}" został utworzony.')
        
        if parent:
            return redirect('forum:directory', directory_id=parent.id)
        else:
            return redirect('forum:index')
    
    context = {
        'parent': parent,
    }
    return render(request, 'directories/create_directory.jinja', context)
