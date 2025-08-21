from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.home_stats, name='home_stats'),
    path('upcoming-events/', views.upcoming_events, name='upcoming_events'),
    path('recent-activity/', views.recent_activity, name='recent_activity'),
]
