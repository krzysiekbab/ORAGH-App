"""
Forum URL patterns for the API.
"""
from django.urls import path
from . import views

app_name = 'forum'

urlpatterns = [
    # Directories
    path('directories/tree/', views.DirectoryTreeView.as_view(), name='directory-tree'),
    path('directories/', views.DirectoryListCreateView.as_view(), name='directory-list-create'),
    path('directories/<int:pk>/', views.DirectoryDetailUpdateDeleteView.as_view(), name='directory-detail'),
    path('directories/<int:pk>/move/', views.move_directory, name='directory-move'),
    
    # Posts
    path('posts/', views.PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<int:pk>/', views.PostDetailUpdateDeleteView.as_view(), name='post-detail'),
    path('posts/<int:pk>/move/', views.move_post, name='post-move'),
    path('posts/<int:pk>/toggle-pin/', views.toggle_post_pin, name='post-toggle-pin'),
    path('posts/<int:pk>/toggle-lock/', views.toggle_post_lock, name='post-toggle-lock'),
    
    # Comments
    path('posts/<int:post_id>/comments/', views.CommentListCreateView.as_view(), name='comment-list-create'),
    path('comments/<int:pk>/', views.CommentDetailUpdateDeleteView.as_view(), name='comment-detail'),
    
    # Stats and permissions
    path('stats/', views.forum_stats, name='forum-stats'),
    path('permissions/', views.forum_permissions, name='forum-permissions'),
]
