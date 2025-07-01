from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('profiles/', views.show_profiles, name='show_profiles'),
    path('profiles/<int:profile_id>/', views.show_profile, name='profile_detail'),
]