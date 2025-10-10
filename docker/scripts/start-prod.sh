#!/bin/bash
# ===========================================
# Start Cal3 Production Environment
# ===========================================

set -e

echo "========================================="
echo "Starting Cal3 Production Environment"
echo "========================================="

# Navigate to docker directory first
cd "$(dirname "$0")/.."

# Check if .env exists in config folder
if [ ! -f config/.env ]; then
    echo "ERROR: config/.env file not found!"
    echo "Please copy config/env.example to config/.env and configure it."
    echo ""
    echo "  cp config/env.example config/.env"
    echo "  nano config/.env"
    echo ""
    exit 1
fi

# Validate required environment variables
source config/.env

REQUIRED_VARS=("DB_USERNAME" "DB_PASSWORD" "DB_NAME" "JWT_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "ERROR: Required environment variables are missing:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Please update your config/.env file"
    exit 1
fi

# Check JWT secret strength
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo "WARNING: JWT_SECRET is less than 32 characters!"
    echo "For production, use a strong secret:"
    echo "  openssl rand -base64 32"
    echo ""
    read -p "Continue anyway? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        exit 1
    fi
fi

echo ""
echo "Building and starting Docker containers in production mode..."
docker-compose up --build -d

# Wait for health checks
echo ""
echo "Waiting for services to be healthy (60 seconds)..."
sleep 60

# Check service health
echo ""
echo "Checking service status..."
docker-compose ps

echo ""
echo "========================================="
echo "Production environment started!"
echo "========================================="
echo "Frontend: http://localhost:${FRONTEND_PORT:-8080}"
echo "Backend:  http://localhost:8081"
echo "API Docs: http://localhost:8081/api/docs"
echo ""
echo "View logs with: docker-compose logs -f [service]"
echo "Stop with: ./scripts/stop.sh"
echo ""
echo "IMPORTANT: Set up automated backups!"
echo "  ./scripts/db-backup.sh"
echo "========================================="
