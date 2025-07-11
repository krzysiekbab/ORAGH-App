from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from ..models import Announcement, Directory


@login_required
def forum_index(request):
    """Main forum page showing root directories and announcements"""
    # Get active announcements
    announcements = Announcement.objects.filter(is_active=True)
    
    # Get root directories that user can access
    directories = []
    for directory in Directory.objects.filter(parent=None):
        if directory.can_user_access(request.user):
            # Get some stats for each directory
            posts_count = directory.posts.count()
            comments_count = sum(post.get_comments_count() for post in directory.posts.all())
            last_post = directory.posts.first()  # Due to ordering, this is the most recent
            
            directories.append({
                'directory': directory,
                'posts_count': posts_count,
                'comments_count': comments_count,
                'last_post': last_post,
            })
    
    context = {
        'announcements': announcements,
        'directories': directories,
        'user_is_board': (request.user.groups.filter(name__in=['board', 'zarząd']).exists() or 
                         request.user.is_staff or request.user.is_superuser),
    }
    return render(request, 'forum_index.jinja', context)
