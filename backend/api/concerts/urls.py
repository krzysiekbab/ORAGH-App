"""
URL configuration for concerts API.
"""
from django.urls import path
from . import views

app_name = 'concerts'

urlpatterns = [
    # Concert CRUD operations
    path('', views.ConcertListCreateView.as_view(), name='concert-list-create'),
    path('<int:pk>/', views.ConcertDetailUpdateDeleteView.as_view(), name='concert-detail'),
    
    # Concert registration
    path('<int:pk>/register/', views.concert_registration, name='concert-registration'),
    path('<int:pk>/participants/', views.concert_participants, name='concert-participants'),
    
    # User permissions
    path('permissions/', views.user_permissions, name='user-permissions'),
]
