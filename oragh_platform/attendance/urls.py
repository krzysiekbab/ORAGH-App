from django.urls import path
from . import views

urlpatterns = [
    path('', views.attendance_view, name='attendance'),
    path('add/', views.add_attendance_view, name='add_attendance'),
    path('edit/<int:event_id>/', views.edit_attendance_view, name='edit_attendance'),
    path('delete/<int:event_id>/', views.delete_attendance_view, name='delete_attendance'),
    path('seasons/', views.manage_seasons_view, name='manage_seasons'),
    path('seasons/add/', views.add_season_view, name='add_season'),
    path('seasons/edit/<int:season_id>/', views.edit_season_view, name='edit_season'),
    path('seasons/delete/<int:season_id>/', views.delete_season_view, name='delete_season'),
]
