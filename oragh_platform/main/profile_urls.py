from django.urls import path
from .views import edit_profile, profile_overview

urlpatterns = [
    path('', profile_overview, name='profile'),
    path('edit/', edit_profile, name='edit_profile'),
]
