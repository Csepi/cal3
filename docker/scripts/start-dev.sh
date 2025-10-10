#!/bin/bash
# ===========================================
# Start Cal3 Development Environment
# ===========================================

set -e

echo "========================================="
echo "Starting Cal3 Development Environment"
echo "========================================="

# Navigate to docker directory
cd "$(dirname "$0")/.."

# Check if .env.dev exists in config folder
if [ ! -f config/.env.dev ]; then
    echo "Warning: config/.env.dev file not found!"
    echo "Creating from config/env.dev.example..."
    if [ -f config/env.dev.example ]; then
        cp config/env.dev.example config/.env.dev
        echo "✓ Created config/.env.dev with development defaults"
    else
        echo "ERROR: config/env.dev.example not found!"
        echo "Please ensure you're in the docker/ directory"
        exit 1
    fi
    echo ""
    echo "Development will use default values (postgres/postgres/cal3_dev)"
    echo "You can customize config/.env.dev if needed"
fi

echo ""
echo "Starting Docker containers in development mode..."
docker-compose -f docker-compose.dev.yml up --build -d

# Wait for services to start
echo ""
echo "Waiting for services to start (30 seconds)..."
sleep 30

# Check service status
echo ""
echo "Checking service health..."
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "========================================="
echo "Development environment started!"
echo "========================================="
echo "Frontend: http://localhost:8080"
echo "Backend:  http://localhost:8081"
echo "API Docs: http://localhost:8081/api/docs"
echo "Database: localhost:5432 (postgres/postgres/cal3_dev)"
echo ""
echo "View logs with: docker-compose -f docker-compose.dev.yml logs -f [service]"
echo "Stop with: ./scripts/stop.sh"
echo "========================================="
