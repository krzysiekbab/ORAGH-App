from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.http import HttpResponseForbidden
from .models import Announcement, Category, Directory, Thread, Comment


@login_required
def forum_index(request):
    """Main forum page showing categories and announcements"""
    # Get active announcements
    announcements = Announcement.objects.filter(is_active=True)
    
    # Get categories that user can access
    categories = []
    for category in Category.objects.all():
        if category.can_user_access(request.user):
            # Get some stats for each category
            threads_count = category.threads.count()
            comments_count = sum(thread.get_comments_count() for thread in category.threads.all())
            last_thread = category.threads.first()  # Due to ordering, this is the most recent
            
            categories.append({
                'category': category,
                'threads_count': threads_count,
                'comments_count': comments_count,
                'last_thread': last_thread,
            })
    
    context = {
        'announcements': announcements,
        'categories': categories,
        'user_is_board': (request.user.groups.filter(name__in=['board', 'zarząd']).exists() or 
                         request.user.is_staff or request.user.is_superuser),
    }
    return render(request, 'forum_index.jinja', context)


@login_required
def category_view(request, category_id):
    """View threads and directories in a specific category"""
    category = get_object_or_404(Category, id=category_id)
    
    # Check if user can access this category
    if not category.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tej kategorii.")
    
    # Get top-level directories (without parent)
    directories = Directory.objects.filter(category=category, parent=None)
    
    # Get threads that are not in any directory
    threads = Thread.objects.filter(category=category, directory=None).select_related('author')
    paginator = Paginator(threads, 20)  # 20 threads per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'category': category,
        'directories': directories,
        'threads': page_obj,
        'can_create_thread': True,  # All logged in users can create threads in accessible categories
        'can_create_directory': True,
    }
    return render(request, 'category_view.jinja', context)


@login_required
def thread_view(request, thread_id):
    """View comments in a specific thread"""
    thread = get_object_or_404(Thread, id=thread_id)
    
    # Check if user can access this thread's category
    if not thread.category.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tej kategorii.")
    
    # Get comments with pagination
    comments = Comment.objects.filter(thread=thread).select_related('author', 'author__musicianprofile')
    paginator = Paginator(comments, 10)  # 10 comments per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Add permission info to each comment
    for comment in page_obj:
        comment.user_can_delete = comment.can_user_delete(request.user)
    
    context = {
        'thread': thread,
        'comments': page_obj,
        'can_reply': not thread.is_locked,  # Users can reply if thread is not locked
        'can_edit_thread': request.user.is_staff or request.user == thread.author,
        'can_delete_thread': thread.can_user_delete(request.user),
    }
    return render(request, 'thread_view.jinja', context)


@login_required
def create_thread(request, category_id=None, directory_id=None):
    """Create a new thread in a category or directory"""
    category = None
    directory = None
    
    if category_id:
        category = get_object_or_404(Category, id=category_id)
    elif directory_id:
        directory = get_object_or_404(Directory, id=directory_id)
        category = directory.category
    else:
        return HttpResponseForbidden("Nieprawidłowe parametry.")
    
    # Check if user can access this category
    if not category.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tej kategorii.")
    
    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        content = request.POST.get('content', '').strip()
        
        if not title or not content:
            messages.error(request, 'Tytuł i treść są wymagane.')
            context = {
                'category': category,
                'directory': directory,
                'title': title,
                'content': content,
            }
            return render(request, 'create_thread.jinja', context)
        
        # Create thread
        thread = Thread.objects.create(
            title=title,
            category=category,
            directory=directory,
            author=request.user
        )
        
        # Create first comment
        Comment.objects.create(
            thread=thread,
            author=request.user,
            content=content
        )
        
        messages.success(request, f'Wątek "{title}" został utworzony.')
        return redirect('forum:thread', thread_id=thread.id)
    
    context = {
        'category': category,
        'directory': directory,
    }
    return render(request, 'create_thread.jinja', context)


@login_required
def create_comment(request, thread_id):
    """Create a new comment in a thread"""
    thread = get_object_or_404(Thread, id=thread_id)
    
    # Check if user can access this thread's category
    if not thread.category.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tej kategorii.")
    
    # Check if thread is locked
    if thread.is_locked:
        messages.error(request, 'Ten wątek jest zablokowany.')
        return redirect('forum:thread', thread_id=thread.id)
    
    if request.method == 'POST':
        content = request.POST.get('content', '').strip()
        
        if not content:
            messages.error(request, 'Treść komentarza jest wymagana.')
            return redirect('forum:thread', thread_id=thread.id)
        
        # Create comment
        comment = Comment.objects.create(
            thread=thread,
            author=request.user,
            content=content
        )
        
        messages.success(request, 'Komentarz został dodany.')
        
        # Redirect to last page of thread
        comments_count = thread.get_comments_count()
        last_page = (comments_count - 1) // 10 + 1  # 10 comments per page
        return redirect(f"{thread.get_absolute_url()}?page={last_page}#{comment.id}")
    
    return redirect('forum:thread', thread_id=thread.id)


@login_required
def edit_comment(request, comment_id):
    """Edit an existing comment"""
    comment = get_object_or_404(Comment, id=comment_id)
    
    # Check if user can access this thread's category
    if not comment.thread.category.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tej kategorii.")
    
    # Check if user can edit this comment (only comment owner can edit)
    if request.user != comment.author:
        return HttpResponseForbidden("Nie możesz edytować tego komentarza.")
    
    if request.method == 'POST':
        content = request.POST.get('content', '').strip()
        
        if not content:
            messages.error(request, 'Treść komentarza jest wymagana.')
            return redirect('forum:thread', thread_id=comment.thread.id)
        
        comment.content = content
        comment.save()
        
        messages.success(request, 'Komentarz został zaktualizowany.')
        return redirect('forum:thread', thread_id=comment.thread.id)
    
    context = {
        'comment': comment,
        'thread': comment.thread,
    }
    return render(request, 'edit_comment.jinja', context)


@login_required
def delete_comment(request, comment_id):
    """Delete a comment"""
    comment = get_object_or_404(Comment, id=comment_id)
    
    # Check if user can access this thread's category
    if not comment.thread.category.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tej kategorii.")
    
    # Check if user can delete this comment (only comment owner can delete)
    if not comment.can_user_delete(request.user):
        return HttpResponseForbidden("Nie możesz usunąć tego komentarza.")
    
    thread = comment.thread
    
    # Check if this is the only comment in thread
    if thread.get_comments_count() == 1:
        # Delete the entire thread
        thread.delete()
        messages.success(request, 'Wątek został usunięty.')
        return redirect('forum:category', category_id=thread.category.id)
    
    if request.method == 'POST':
        comment.delete()
        messages.success(request, 'Komentarz został usunięty.')
        return redirect('forum:thread', thread_id=thread.id)
    
    context = {
        'comment': comment,
        'thread': thread,
    }
    return render(request, 'delete_comment.jinja', context)


@login_required
def directory_view(request, directory_id):
    """View threads in a specific directory"""
    directory = get_object_or_404(Directory, id=directory_id)
    
    # Check if user can access this directory's category
    if not directory.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tej kategorii.")
    
    # Get threads and subdirectories
    threads = Thread.objects.filter(directory=directory).select_related('author')
    subdirectories = Directory.objects.filter(parent=directory)
    
    # Paginate threads
    paginator = Paginator(threads, 20)  # 20 threads per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'directory': directory,
        'subdirectories': subdirectories,
        'threads': page_obj,
        'can_create_thread': True,
        'can_create_directory': True,
    }
    return render(request, 'directory_view.jinja', context)


@login_required
def create_directory(request, category_id=None, parent_id=None):
    """Create a new directory in a category or subdirectory"""
    category = None
    parent = None
    
    if category_id:
        category = get_object_or_404(Category, id=category_id)
    elif parent_id:
        parent = get_object_or_404(Directory, id=parent_id)
        category = parent.category
    else:
        return HttpResponseForbidden("Nieprawidłowe parametry.")
    
    # Check if user can access this category
    if not category.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tej kategorii.")
    
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        description = request.POST.get('description', '').strip()
        
        if not name:
            messages.error(request, 'Nazwa katalogu jest wymagana.')
            context = {
                'category': category,
                'parent': parent,
                'name': name,
                'description': description,
            }
            return render(request, 'create_directory.jinja', context)
        
        # Create directory
        directory = Directory.objects.create(
            name=name,
            description=description,
            category=category,
            parent=parent,
            author=request.user
        )
        
        messages.success(request, f'Katalog "{name}" został utworzony.')
        
        if parent:
            return redirect('forum:directory', directory_id=parent.id)
        else:
            return redirect('forum:category', category_id=category.id)
    
    context = {
        'category': category,
        'parent': parent,
    }
    return render(request, 'create_directory.jinja', context)


@login_required
def delete_thread(request, thread_id):
    """Delete a thread"""
    thread = get_object_or_404(Thread, id=thread_id)
    
    # Check if user can access this thread's category
    if not thread.category.can_user_access(request.user):
        return HttpResponseForbidden("Nie masz dostępu do tej kategorii.")
    
    # Check if user can delete this thread
    if not thread.can_user_delete(request.user):
        return HttpResponseForbidden("Nie możesz usunąć tego wątku.")
    
    category = thread.category
    directory = thread.directory
    
    if request.method == 'POST':
        thread.delete()
        messages.success(request, 'Wątek został usunięty.')
        
        if directory:
            return redirect('forum:directory', directory_id=directory.id)
        else:
            return redirect('forum:category', category_id=category.id)
    
    context = {
        'thread': thread,
    }
    return render(request, 'delete_thread.jinja', context)


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
    return render(request, 'manage_announcements.jinja', context)


@login_required
def create_announcement(request):
    """Create a new announcement (board members only)"""
    # Check if user is board member, staff, or superuser
    if not (request.user.groups.filter(name__in=['board', 'zarząd']).exists() or 
           request.user.is_staff or request.user.is_superuser):
        return HttpResponseForbidden("Nie masz uprawnień do tworzenia ogłoszeń.")
    
    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        content = request.POST.get('content', '').strip()
        priority = request.POST.get('priority', 0)
        
        try:
            priority = int(priority)
        except (ValueError, TypeError):
            priority = 0
        
        if not title or not content:
            messages.error(request, 'Tytuł i treść są wymagane.')
            context = {
                'title': title,
                'content': content,
                'priority': priority,
            }
            return render(request, 'create_announcement.jinja', context)
        
        # Create announcement
        announcement = Announcement.objects.create(
            title=title,
            content=content,
            priority=priority,
            author=request.user
        )
        
        messages.success(request, f'Ogłoszenie "{title}" zostało utworzone.')
        return redirect('forum:manage_announcements')
    
    context = {}
    return render(request, 'create_announcement.jinja', context)


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
        return redirect('forum:manage_announcements')
    
    context = {
        'announcement': announcement,
    }
    return render(request, 'delete_announcement.jinja', context)
