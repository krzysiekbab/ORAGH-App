# Production Dockerfile for Django Backend
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=oragh_platform.settings.production

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
        gettext \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy project
COPY . /app/

# Create media subdirectories and static directories
RUN mkdir -p /app/media/profile_photos /app/media/general /app/staticfiles /app/logs

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
# Uwaga 1: obraz python:3.11-slim nie zawiera curl, dlatego uzywamy wbudowanego
#          interpretera Pythona. urlopen() rzuca wyjatek dla kodow != 2xx -> exit 1.
# Uwaga 2: produkcja ma SECURE_SSL_REDIRECT=True, wiec czyste HTTP dostaje 302 na HTTPS.
#          Wysylamy X-Forwarded-Proto: https (SECURE_PROXY_SSL_HEADER), by Django
#          potraktowal zadanie jak ruch zza proxy i zwrocil 200 bez przekierowania.
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request as u; u.urlopen(u.Request('http://localhost:8000/api/health/', headers={'X-Forwarded-Proto': 'https'}))" || exit 1

# Run gunicorn
CMD ["gunicorn", "oragh_platform.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
