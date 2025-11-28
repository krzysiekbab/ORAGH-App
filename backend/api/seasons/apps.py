"""
Seasons app configuration.
"""
from django.apps import AppConfig


class SeasonsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api.seasons'
    verbose_name = 'Sezony'
