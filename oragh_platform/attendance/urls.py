from django.urls import path
from .views import attendance_views, season_views

urlpatterns = [
    path('', attendance_views.attendance_view, name='attendance'),
    path('add/', attendance_views.add_attendance_view, name='add_attendance'),
    path('edit/<int:event_id>/', attendance_views.edit_attendance_view, name='edit_attendance'),
    path('delete/<int:event_id>/', attendance_views.delete_attendance_view, name='delete_attendance'),
    path('seasons/', season_views.manage_seasons_view, name='manage_seasons'),
    path('seasons/add/', season_views.add_season_view, name='add_season'),
    path('seasons/edit/<int:season_id>/', season_views.edit_season_view, name='edit_season'),
    path('seasons/delete/<int:season_id>/', season_views.delete_season_view, name='delete_season'),
    path('seasons/<int:season_id>/musicians/', season_views.get_season_musicians_api, name='get_season_musicians_api'),
]
