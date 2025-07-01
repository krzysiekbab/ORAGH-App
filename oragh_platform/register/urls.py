from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
from .views import register, login_view, logout_view

urlpatterns = [
    path('', register, name='register'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
]