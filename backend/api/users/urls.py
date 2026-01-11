"""
User API URLs.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='user_register'),
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('musicians/', views.UserListView.as_view(), name='user_list'),
    path('change-password/', views.change_password, name='change_password'),
    path('upload-photo/', views.upload_profile_photo, name='upload_profile_photo'),
    path('current/', views.current_user, name='current_user'),
    path('permissions/', views.user_permissions, name='user_permissions'),
    
    # Account activation endpoints
    path('activate/<uuid:token>/', views.activate_account, name='activate_account'),
    path('pending-activations/', views.pending_activations, name='pending_activations'),
    
    path('<int:user_id>/', views.UserDetailView.as_view(), name='user_detail'),
]
