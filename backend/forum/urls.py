from django.urls import path
from . import views

app_name = 'forum'

urlpatterns = [
    path('', views.forum_index, name='index'),
    path('directory/<int:directory_id>/', views.directory_view, name='directory'),
    path('post/<int:post_id>/', views.post_view, name='post'),
    
    # Post management
    path('directory/<int:directory_id>/create-post/', views.create_post, name='create_post_in_directory'),
    path('post/<int:post_id>/edit/', views.edit_post, name='edit_post'),
    path('post/<int:post_id>/delete/', views.delete_post, name='delete_post'),
    
    # Directory management
    path('create-directory/', views.create_directory, name='create_directory'),
    path('directory/<int:parent_id>/create-subdirectory/', lambda request, parent_id: views.create_directory(request, parent_id=parent_id), name='create_subdirectory'),
    
    # Comment management
    path('post/<int:post_id>/reply/', views.create_comment, name='create_comment'),
    path('comment/<int:comment_id>/edit/', views.edit_comment, name='edit_comment'),
    path('comment/<int:comment_id>/delete/', views.delete_comment, name='delete_comment'),
    
    # Announcement management
    path('announcements/', views.manage_announcements, name='manage_announcements'),
    path('announcements/create/', views.create_announcement, name='create_announcement'),
    path('announcements/<int:announcement_id>/edit/', views.edit_announcement, name='edit_announcement'),
    path('announcements/<int:announcement_id>/delete/', views.delete_announcement, name='delete_announcement'),
]