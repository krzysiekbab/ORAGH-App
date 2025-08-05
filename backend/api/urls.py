"""
Main API URLs configuration.
"""

from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
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
    
    # Authentication
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # App URLs
    path('users/', include('api.users.urls')),
    path('concerts/', include('api.concerts.urls')),
    path('forum/', include('api.forum.urls')),
    path('attendance/', include('api.attendance.urls')),
    
    # Health check
    path('health/', lambda request: HttpResponse('OK'), name='health_check'),
]

from django.http import HttpResponse
