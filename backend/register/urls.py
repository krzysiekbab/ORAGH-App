from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
from .views import register, login_view, logout_view, register_all_musicians, delete_all_musicians

urlpatterns = [
    path('', register, name='register'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('register_all_musicians/', register_all_musicians, name='register_all_musicians'),
    path('delete-all-musicians/', delete_all_musicians, name='delete_all_musicians'),
]