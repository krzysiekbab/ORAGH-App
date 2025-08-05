"""
Base settings for ORAGH Platform.
"""

from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-&b8%$j5)s#56it58k^d$^zronp6)hmv54q#gh%ogyju-9hp@2*')

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'crispy_forms',
    'crispy_bootstrap5',
    'django_ckeditor_5',
    'drf_yasg',
]

LOCAL_APPS = [
    'main',
    'register',
    'concerts',
    'attendance',
    'forum',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'oragh_platform.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'oragh_platform.wsgi.application'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'pl'
TIME_ZONE = 'Europe/Warsaw'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
}

# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Crispy Forms
CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap5"
CRISPY_TEMPLATE_PACK = "bootstrap5"

# Login URLs
LOGIN_URL = '/api/auth/login/'
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

# CKEditor 5 settings
CKEDITOR_5_CONFIGS = {
    'default': {
        'toolbar': ['heading', '|', 'bold', 'italic', 'link',
                    'bulletedList', 'numberedList', 'blockQuote', 'imageUpload', ],
    },
    'advanced': {
        'toolbar': ['heading', '|', 'bold', 'italic', 'underline', 'strikethrough',
                    'subscript', 'superscript', '|', 'link', 'linkImage', '|',
                    'bulletedList', 'numberedList', 'todoList', '|',
                    'blockQuote', 'insertTable', '|',
                    'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor',
                    'highlight', '|', 'alignment', '|',
                    'outdent', 'indent', '|', 'imageUpload', 'mediaEmbed',
                    'removeFormat', 'insertTable', 'tableColumn', 'tableRow',
                    'mergeTableCells', '|', 'undo', 'redo'],
        'height': 300,
        'width': '100%',
        'removePlugins': ['Title'],
        'heading': {
            'options': [
                { 'model': 'paragraph', 'title': 'Paragraph', 'class': 'ck-heading_paragraph' },
                { 'model': 'heading1', 'view': 'h1', 'title': 'Heading 1', 'class': 'ck-heading_heading1' },
                { 'model': 'heading2', 'view': 'h2', 'title': 'Heading 2', 'class': 'ck-heading_heading2' },
                { 'model': 'heading3', 'view': 'h3', 'title': 'Heading 3', 'class': 'ck-heading_heading3' },
                { 'model': 'heading4', 'view': 'h4', 'title': 'Heading 4', 'class': 'ck-heading_heading4' }
            ]
        },
        'fontSize': {
            'options': ['tiny', 'small', 'default', 'big', 'huge']
        },
        'fontFamily': {
            'options': [
                'default',
                'Arial, Helvetica, sans-serif',
                'Courier New, Courier, monospace',
                'Georgia, serif',
                'Lucida Sans Unicode, Lucida Grande, sans-serif',
                'Tahoma, Geneva, sans-serif',
                'Times New Roman, Times, serif',
                'Trebuchet MS, Helvetica, sans-serif',
                'Verdana, Geneva, sans-serif'
            ]
        },
        'fontColor': {
            'colors': [
                {
                    'color': 'hsl(0, 0%, 0%)',
                    'label': 'Black'
                },
                {
                    'color': 'hsl(0, 0%, 30%)',
                    'label': 'Dim grey'
                },
                {
                    'color': 'hsl(0, 0%, 60%)',
                    'label': 'Grey'
                },
                {
                    'color': 'hsl(0, 0%, 90%)',
                    'label': 'Light grey'
                },
                {
                    'color': 'hsl(0, 0%, 100%)',
                    'label': 'White',
                    'hasBorder': True
                },
                {
                    'color': 'hsl(0, 75%, 60%)',
                    'label': 'Red'
                },
                {
                    'color': 'hsl(30, 75%, 60%)',
                    'label': 'Orange'
                },
                {
                    'color': 'hsl(60, 75%, 60%)',
                    'label': 'Yellow'
                },
                {
                    'color': 'hsl(90, 75%, 60%)',
                    'label': 'Light green'
                },
                {
                    'color': 'hsl(120, 75%, 60%)',
                    'label': 'Green'
                },
                {
                    'color': 'hsl(150, 75%, 60%)',
                    'label': 'Aquamarine'
                },
                {
                    'color': 'hsl(180, 75%, 60%)',
                    'label': 'Turquoise'
                },
                {
                    'color': 'hsl(210, 75%, 60%)',
                    'label': 'Light blue'
                },
                {
                    'color': 'hsl(240, 75%, 60%)',
                    'label': 'Blue'
                },
                {
                    'color': 'hsl(270, 75%, 60%)',
                    'label': 'Purple'
                },
            ]
        },
        'fontBackgroundColor': {
            'colors': [
                {
                    'color': 'hsl(0, 0%, 100%)',
                    'label': 'White',
                    'hasBorder': True
                },
                {
                    'color': 'hsl(0, 0%, 90%)',
                    'label': 'Light grey'
                },
                {
                    'color': 'hsl(0, 0%, 60%)',
                    'label': 'Grey'
                },
                {
                    'color': 'hsl(0, 0%, 30%)',
                    'label': 'Dim grey'
                },
                {
                    'color': 'hsl(0, 0%, 0%)',
                    'label': 'Black'
                },
                {
                    'color': 'hsl(0, 75%, 60%)',
                    'label': 'Red'
                },
                {
                    'color': 'hsl(30, 75%, 60%)',
                    'label': 'Orange'
                },
                {
                    'color': 'hsl(60, 75%, 60%)',
                    'label': 'Yellow'
                },
                {
                    'color': 'hsl(90, 75%, 60%)',
                    'label': 'Light green'
                },
                {
                    'color': 'hsl(120, 75%, 60%)',
                    'label': 'Green'
                },
                {
                    'color': 'hsl(150, 75%, 60%)',
                    'label': 'Aquamarine'
                },
                {
                    'color': 'hsl(180, 75%, 60%)',
                    'label': 'Turquoise'
                },
                {
                    'color': 'hsl(210, 75%, 60%)',
                    'label': 'Light blue'
                },
                {
                    'color': 'hsl(240, 75%, 60%)',
                    'label': 'Blue'
                },
                {
                    'color': 'hsl(270, 75%, 60%)',
                    'label': 'Purple'
                },
            ]
        },
        'image': {
            'toolbar': [
                'imageTextAlternative', 'toggleImageCaption', '|',
                'imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText', '|',
                'resizeImage'
            ]
        },
        'table': {
            'contentToolbar': [ 'tableColumn', 'tableRow', 'mergeTableCells' ]
        }
    }
}
