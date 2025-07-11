from django.urls import path
from . import views

app_name = 'forum'

urlpatterns = [
    path('', views.forum_index, name='index'),
    path('category/<int:category_id>/', views.category_view, name='category'),
    path('directory/<int:directory_id>/', views.directory_view, name='directory'),
    path('thread/<int:thread_id>/', views.thread_view, name='thread'),
    
    # Thread management
    path('category/<int:category_id>/create-thread/', views.create_thread, name='create_thread'),
    path('directory/<int:directory_id>/create-thread/', lambda request, directory_id: views.create_thread(request, directory_id=directory_id), name='create_thread_in_directory'),
    path('thread/<int:thread_id>/delete/', views.delete_thread, name='delete_thread'),
    
    # Directory management
    path('category/<int:category_id>/create-directory/', views.create_directory, name='create_directory'),
    path('directory/<int:parent_id>/create-subdirectory/', lambda request, parent_id: views.create_directory(request, parent_id=parent_id), name='create_subdirectory'),
    
    # Comment management
    path('thread/<int:thread_id>/reply/', views.create_comment, name='create_comment'),
    path('comment/<int:comment_id>/edit/', views.edit_comment, name='edit_comment'),
    path('comment/<int:comment_id>/delete/', views.delete_comment, name='delete_comment'),
    
    # Announcement management
    path('announcements/', views.manage_announcements, name='manage_announcements'),
    path('announcements/create/', views.create_announcement, name='create_announcement'),
    path('announcements/<int:announcement_id>/delete/', views.delete_announcement, name='delete_announcement'),
]