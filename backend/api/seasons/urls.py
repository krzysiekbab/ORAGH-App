"""
URL configuration for seasons app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SeasonViewSet

router = DefaultRouter()
router.register(r'', SeasonViewSet, basename='season')

urlpatterns = [
    path('', include(router.urls)),
]
