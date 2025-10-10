#!/bin/bash
# ===========================================
# Stop Cal3 Docker Containers
# ===========================================

echo "Stopping Cal3 containers..."

cd "$(dirname "$0")/.."

# Stop development
if docker-compose -f docker-compose.dev.yml ps -q 2>/dev/null | grep -q .; then
    echo "Stopping development environment..."
    docker-compose -f docker-compose.dev.yml down
fi

# Stop production
if docker-compose ps -q 2>/dev/null | grep -q .; then
    echo "Stopping production environment..."
    docker-compose down
fi

echo "All Cal3 containers stopped!"
