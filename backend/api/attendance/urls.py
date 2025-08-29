"""
URL configuration for attendance app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SeasonViewSet, EventViewSet, AttendanceViewSet

router = DefaultRouter()
router.register(r'seasons', SeasonViewSet)
router.register(r'events', EventViewSet)
router.register(r'attendances', AttendanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
