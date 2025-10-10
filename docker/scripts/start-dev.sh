#!/bin/bash
# ===========================================
# Start Cal3 Development Environment
# ===========================================

set -e

echo "========================================="
echo "Starting Cal3 Development Environment"
echo "========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found!"
    echo "Creating .env from docker/.env.example with development defaults..."
    cp docker/.env.example .env
    echo ""
    echo "Please review and update .env file if needed."
    echo "Development will use default values (postgres/postgres/cal3_dev)"
fi

# Navigate to docker directory
cd "$(dirname "$0")/.."

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
