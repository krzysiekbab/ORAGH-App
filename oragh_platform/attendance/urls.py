from django.urls import path
from . import views

urlpatterns = [
    path('', views.attendance_view, name='attendance'),
    path('add/', views.add_attendance_view, name='add_attendance'),
    path('edit/<int:event_id>/', views.edit_attendance_view, name='edit_attendance'),
    path('delete/<int:event_id>/', views.delete_attendance_view, name='delete_attendance'),
]
