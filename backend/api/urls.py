"""
Main API URLs configuration.
"""

from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from api.users.views import CustomLoginView
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

# API Documentation
schema_view = get_schema_view(
   openapi.Info(
      title="ORAGH Platform API",
      default_version='v1',
      description="API for ORAGH Orchestra Management Platform",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contact@oragh.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # API Documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # Authentication - using custom login view for better error messages
    path('auth/token/', CustomLoginView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Registration & Profiles
    path('users/', include('api.users.urls')),
    
    # Home Page  
    path('home/', include('api.home.urls')),
    
    # Concerts
    path('concerts/', include('api.concerts.urls')),
    
    # Seasons
    path('seasons/', include('api.seasons.urls')),
    
    # Attendance
    path('attendance/', include('api.attendance.urls')),
    
    # Forum
    path('forum/', include('api.forum.urls')),  
    
    # Health check
    path('health/', lambda request: HttpResponse('OK'), name='health_check'),
]

from django.http import HttpResponse
