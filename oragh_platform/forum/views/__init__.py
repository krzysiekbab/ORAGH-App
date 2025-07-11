"""
Forum views package

This package contains all forum-related views organized by functionality:
- announcement_views: Announcement management (create, edit, delete, manage)
- directory_views: Directory navigation and management (view, create)
- post_views: Post management (view, create, edit, delete)
- comment_views: Comment management (create, edit, delete)
- main_views: Main forum views (index)
"""

# Import all views to maintain compatibility with existing URLs
from .main_views import forum_index
from .directory_views import directory_view, create_directory
from .post_views import post_view, create_post, edit_post, delete_post
from .comment_views import create_comment, edit_comment, delete_comment
from .announcement_views import (
    manage_announcements, 
    create_announcement, 
    edit_announcement, 
    delete_announcement
)

# Make all views available at package level
__all__ = [
    # Main views
    'forum_index',
    
    # Directory views
    'directory_view',
    'create_directory',
    
    # Post views
    'post_view',
    'create_post',
    'edit_post',
    'delete_post',
    
    # Comment views
    'create_comment',
    'edit_comment',
    'delete_comment',
    
    # Announcement views
    'manage_announcements',
    'create_announcement',
    'edit_announcement',
    'delete_announcement',
]
