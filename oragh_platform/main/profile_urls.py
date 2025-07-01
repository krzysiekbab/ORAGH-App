from django.urls import path
from .views import edit_profile

urlpatterns = [
    path('', edit_profile, name='profile'),
]
