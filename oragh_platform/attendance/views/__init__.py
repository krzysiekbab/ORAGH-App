"""
Views package for the attendance app.

This package contains separate view modules for better organization:
- attendance_views: Views related to attendance management
- season_views: Views related to season management
"""

from .attendance_views import (
    attendance_view,
    add_attendance_view,
    edit_attendance_view,
    delete_attendance_view,
)

from .season_views import (
    manage_seasons_view,
    add_season_view,
    edit_season_view,
    delete_season_view,
)

__all__ = [
    'attendance_view',
    'add_attendance_view',
    'edit_attendance_view',
    'delete_attendance_view',
    'manage_seasons_view',
    'add_season_view',
    'edit_season_view',
    'delete_season_view',
]
