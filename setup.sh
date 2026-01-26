#!/bin/bash

# ==============================================================================
# ORAGH Platform - Deployment Script
# ==============================================================================
# Description: Automates the setup and deployment of the ORAGH infrastructure.
# Environment: Linux (Ubuntu/Debian recommended)
# ==============================================================================

set -e  # Exit immediately if a command exits with a non-zero status

# --- Helper Functions ---

log_info() {
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo "[WARN] $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "Command '$1' is not installed or not in PATH."
        return 1
    fi
}

# --- Main Execution ---

log_info "Starting deployment process..."

# 1. System Requirements Check
log_info "Verifying system requirements..."

if ! check_command docker; then
    exit 1
fi

if ! docker compose version &> /dev/null; then
    log_error "Docker Compose (plugin) is required but not found."
    exit 1
fi

# 2. Environment Configuration
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        log_info "Creating .env file from template..."
        cp .env.example .env
        log_warn ".env file created. Ensure you populate it with production secrets before proceeding."
    else
        log_error ".env.example template not found. Cannot proceed."
        exit 1
    fi
else
    log_info "Environment file (.env) detected."
fi

# 3. Security: Secret Key Rotation
# Only generates a new key if the placeholder is detected
if grep -q "your-secret-key-here" .env; then
    log_info "Detected default Django secret key. Generating a secure replacement..."
    # Generate a cryptographically secure random string (50 chars)
    NEW_KEY=$(tr -dc 'A-Za-z0-9!#$%&()*+,-./:;<=>?@[\]^_`{|}~' < /dev/urandom | head -c 50)
    
    # Safely replace in .env using | as delimiter to avoid conflict with special chars
    sed -i "s|SECRET_KEY=your-secret-key-here|SECRET_KEY=$NEW_KEY|" .env
    log_info "Secret key updated successfully."
fi

# 4. Directory Structure Initialization
log_info "Initializing directory structure..."
mkdir -p backend/media
mkdir -p backend/logs
mkdir -p docker/nginx/conf.d

# 5. SSL Certificate Verification
DOMAIN="oragh-app.me"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

if [ ! -d "$CERT_PATH" ]; then
    log_warn "SSL certificates for $DOMAIN not found at $CERT_PATH."
    log_warn "Nginx container may fail to start. Ensure Certbot has been run."
else
    log_info "SSL certificates verified for $DOMAIN."
fi

# 6. Service Deployment
log_info "Building and starting services..."

# Remove orphaned containers to ensure clean state
docker compose down --remove-orphans

# Build and start in detached mode
docker compose up -d --build

log_info "Services started. Waiting for stabilization (5s)..."
sleep 5

# 7. Status Check
if docker compose ps | grep -q "Up"; then
    log_info "Deployment completed successfully."
    log_info "Application status:"
    docker compose ps
else
    log_error "Deployment appeared to fail. Check logs using: docker compose logs"
    exit 1
fi
