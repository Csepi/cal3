#!/bin/bash
# ===========================================
# Auto-Deploy Script for Cal3
# Triggered by webhook receiver
# ===========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "Cal3 Auto-Deploy Started"
echo "========================================="
echo "Time: $(date)"
echo "Directory: $DOCKER_DIR"
echo ""

cd "$DOCKER_DIR"

# Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    exit 1
fi

# Load environment variables
source .env

# Login to GitHub Container Registry
echo "🔐 Logging into GitHub Container Registry..."
if [ -n "$GITHUB_TOKEN" ]; then
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin
else
    echo "⚠️  GITHUB_TOKEN not set, assuming already logged in"
fi

# Pull latest images
echo ""
echo "📥 Pulling latest images..."
docker-compose pull

# Stop and remove old containers
echo ""
echo "🛑 Stopping old containers..."
docker-compose down

# Start new containers
echo ""
echo "🚀 Starting new containers..."
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 15

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

# Health checks
echo ""
echo "🏥 Health Checks:"

# Backend health
if curl -f http://localhost:8081/api/health > /dev/null 2>&1; then
    echo "✅ Backend: Healthy"
else
    echo "❌ Backend: Unhealthy"
fi

# Frontend health
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Frontend: Healthy"
else
    echo "❌ Frontend: Unhealthy"
fi

# Database health
if docker exec cal3-postgres pg_isready -U "$DB_USERNAME" > /dev/null 2>&1; then
    echo "✅ Database: Healthy"
else
    echo "❌ Database: Unhealthy"
fi

# Cleanup old images
echo ""
echo "🧹 Cleaning up old images..."
docker image prune -f

echo ""
echo "========================================="
echo "✅ Auto-Deploy Completed Successfully!"
echo "========================================="
echo "Time: $(date)"
echo ""
