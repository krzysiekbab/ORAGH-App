from django.urls import path
from . import views
urlpatterns = [
    path('', views.view_concerts, name='concerts'),
    path('concert/<int:concert_id>/', views.concert, name='concert'),
    path('create/', views.add_concert, name='add_concert'),
    path('edit/<int:concert_id>/', views.change_concert, name='edit_concert'),
    path('delete/<int:concert_id>/', views.delete_concert, name='delete_concert'),
]