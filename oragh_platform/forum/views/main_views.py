from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from ..models import Announcement, Directory


@login_required
def forum_index(request):
    """Main forum page showing root directories and announcements"""
    # Get active announcements
    announcements = Announcement.objects.filter(is_active=True)
    
    # Get root directories that user can access with normalized data structure
    directories = []
    for directory in Directory.objects.filter(parent=None):
        if directory.can_user_access(request.user):
            # Get some stats for each directory
            posts_count = directory.posts.count()
            comments_count = sum(post.get_comments_count() for post in directory.posts.all())
            last_post = directory.posts.first()  # Due to ordering, this is the most recent
            subdirectories_count = directory.subdirectories.count()
            
            directories.append({
                'id': directory.id,
                'name': directory.name,
                'description': directory.description,
                'access_level': directory.access_level,
                'get_highlight_classes': directory.get_highlight_classes(),
                'get_highlight_icon': directory.get_highlight_icon(),
                'get_absolute_url': directory.get_absolute_url(),
                'posts_count': posts_count,
                'comments_count': comments_count,
                'subdirectories_count': subdirectories_count,
                'last_post': last_post,
            })
    
    context = {
        'announcements': announcements,
        'directories': directories,
        'user_is_board': (request.user.groups.filter(name__in=['board', 'zarząd']).exists() or 
                         request.user.is_staff or request.user.is_superuser),
    }
    return render(request, 'forum_index.jinja', context)
