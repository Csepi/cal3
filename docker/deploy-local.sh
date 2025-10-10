#!/bin/bash
# ===========================================
# Cal3 Local Deployment Script
# ===========================================
# This script deploys Cal3 using local image builds
# Use this when you don't have access to ghcr.io

set -e

echo "🚀 Cal3 Local Deployment"
echo "========================"
echo ""

# Navigate to docker directory
cd "$(dirname "$0")"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from example..."

    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env created. Please edit it with your values:"
        echo "   - DB_USERNAME"
        echo "   - DB_PASSWORD"
        echo "   - JWT_SECRET (32+ characters)"
        echo ""
        read -p "Press Enter when you've configured .env, or Ctrl+C to cancel..."
    else
        echo "❌ .env.example not found. Cannot proceed."
        exit 1
    fi
fi

# Source environment variables
source .env

# Validate required variables
REQUIRED_VARS=("DB_USERNAME" "DB_PASSWORD" "DB_NAME" "JWT_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please edit .env file and set these variables."
    exit 1
fi

echo "✅ Environment variables validated"
echo ""

# Choose deployment mode
echo "Select deployment mode:"
echo "  1) Production (docker-compose.yml - local build)"
echo "  2) Portainer-compatible (docker-compose.portainer-local.yml)"
echo "  3) Development (docker-compose.dev.yml - hot reload)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        COMPOSE_FILE="docker-compose.yml"
        MODE="Production"
        ;;
    2)
        COMPOSE_FILE="docker-compose.portainer-local.yml"
        MODE="Portainer (Local Build)"
        ;;
    3)
        COMPOSE_FILE="docker-compose.dev.yml"
        MODE="Development"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📦 Deploying Cal3 in $MODE mode..."
echo "   Using: $COMPOSE_FILE"
echo ""

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true

# Build and start
echo "🔨 Building images..."
docker-compose -f "$COMPOSE_FILE" build

echo "🚀 Starting containers..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check status
echo ""
echo "📊 Container status:"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access Cal3:"
echo "   Frontend: http://localhost:${FRONTEND_PORT:-8080}"
echo "   Backend:  http://localhost:8081"
echo "   Database: localhost:5432"
echo ""
echo "📝 Useful commands:"
echo "   View logs:    docker-compose -f $COMPOSE_FILE logs -f"
echo "   Stop:         docker-compose -f $COMPOSE_FILE down"
echo "   Restart:      docker-compose -f $COMPOSE_FILE restart"
echo "   Rebuild:      docker-compose -f $COMPOSE_FILE up -d --build"
echo ""
