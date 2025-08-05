#!/bin/bash

# ORAGH Platform Migration Starter Script
# This script helps you get started with the migration process

set -e

echo "🎵 ORAGH Platform Migration Setup 🎵"
echo "=================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your settings."
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/logs
mkdir -p docker/postgres/init
mkdir -p docker/nginx/ssl

# Generate a random secret key for Django
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    SECRET_KEY=$(LC_ALL=C tr -dc 'A-Za-z0-9!"#$%&'\''()*+,-./:;<=>?@[\]^_`{|}~' < /dev/urandom | head -c 50)
else
    # Linux
    SECRET_KEY=$(tr -dc 'A-Za-z0-9!"#$%&'\''()*+,-./:;<=>?@[\]^_`{|}~' < /dev/urandom | head -c 50)
fi

# Update .env with generated secret key
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/SECRET_KEY=your-secret-key-here/SECRET_KEY=$SECRET_KEY/" .env
else
    # Linux
    sed -i "s/SECRET_KEY=your-secret-key-here/SECRET_KEY=$SECRET_KEY/" .env
fi

echo "✅ Generated and set Django secret key"

echo ""
echo "🚀 Setup complete! Next steps:"
echo ""
echo "1. Review and edit .env file if needed:"
echo "   nano .env"
echo ""
echo "2. Start the development environment:"
echo "   docker-compose -f docker-compose.dev.yml up --build"
echo ""
echo "3. In a new terminal, run database migrations:"
echo "   docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate"
echo ""
echo "4. Create a superuser:"
echo "   docker-compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser"
echo ""
echo "5. Access the applications:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000/api"
echo "   - Django Admin: http://localhost:8000/admin"
echo ""
echo "📖 For detailed instructions, see README.md"
echo ""
echo "Happy coding! 🎼"
