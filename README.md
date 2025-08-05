# ORAGH Platform - Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- Git

## Quick Start

### 1. Clone and Setup
```bash
cd ORAGH-App
cp .env.example .env
# Edit .env file with your settings
```

### 2. Start Development Environment
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up --build

# In separate terminals:
# Initialize database
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate
docker-compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser

# Load sample data (optional)
docker-compose -f docker-compose.dev.yml exec backend python manage.py loaddata fixtures/sample_data.json
```

### 3. Access the Application
- Frontend (React): http://localhost:3000
- Backend API: http://localhost:8000/api
- API Documentation: http://localhost:8000/api/swagger/
- Django Admin: http://localhost:8000/admin/

### 4. Development Workflow

#### Backend Development
```bash
# Run Django commands
docker-compose -f docker-compose.dev.yml exec backend python manage.py makemigrations
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate

# Create new Django app
docker-compose -f docker-compose.dev.yml exec backend python manage.py startapp newapp

# Run tests
docker-compose -f docker-compose.dev.yml exec backend python manage.py test
```

#### Frontend Development
```bash
# Install new packages
docker-compose -f docker-compose.dev.yml exec frontend npm install package-name

# Run linting
docker-compose -f docker-compose.dev.yml exec frontend npm run lint

# Build for production
docker-compose -f docker-compose.dev.yml exec frontend npm run build
```

### 5. Data Migration from SQLite

```bash
# Export data from current SQLite database
cd oragh_platform
python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission --indent 2 > ../data_export.json

# Import into new PostgreSQL database
docker-compose -f docker-compose.dev.yml exec backend python manage.py loaddata data_export.json
```

### 6. Production Deployment
```bash
# Build and start production environment
docker-compose up --build -d

# Setup production database
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py collectstatic --noinput
docker-compose exec backend python manage.py createsuperuser
```

## Project Structure

```
ORAGH-App/
├── backend/                 # Django backend
│   ├── oragh_platform/     # Main Django project
│   ├── api/                # API endpoints
│   ├── main/               # User profiles app
│   ├── concerts/           # Concerts management
│   ├── forum/              # Forum system
│   ├── attendance/         # Attendance tracking
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   └── package.json       # Node dependencies
├── docker/                # Docker configurations
│   └── nginx/             # Nginx config
├── docker-compose.yml     # Production compose
├── docker-compose.dev.yml # Development compose
└── migration-plan.md      # Migration strategy
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose files if needed
2. **Database connection**: Ensure PostgreSQL container is running
3. **Permission issues**: Use `docker-compose exec` instead of `docker exec`
4. **Hot reload not working**: Ensure volumes are properly mounted

### Useful Commands
```bash
# View logs
docker-compose -f docker-compose.dev.yml logs backend
docker-compose -f docker-compose.dev.yml logs frontend

# Reset database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build

# Access container shell
docker-compose -f docker-compose.dev.yml exec backend bash
docker-compose -f docker-compose.dev.yml exec frontend sh
```

## Next Steps

1. **Phase 1**: Set up Docker environment and migrate database
2. **Phase 2**: Create API endpoints for existing models
3. **Phase 3**: Build React components for each feature
4. **Phase 4**: Implement authentication and state management
5. **Phase 5**: Add real-time features and optimize performance
