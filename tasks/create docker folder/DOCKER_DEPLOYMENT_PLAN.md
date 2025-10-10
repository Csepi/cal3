# Docker Deployment Plan for Cal3 Calendar Application

**Version:** 1.0
**Date:** 2025-10-09
**Status:** Planning Phase
**Repository:** Cal3 - Modern Calendar & Reservation Management System

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Implementation Phases](#implementation-phases)
5. [File Structure](#file-structure)
6. [Detailed Implementation](#detailed-implementation)
7. [Configuration Guide](#configuration-guide)
8. [Deployment Instructions](#deployment-instructions)
9. [Maintenance & Operations](#maintenance--operations)
10. [Troubleshooting](#troubleshooting)
11. [Security Considerations](#security-considerations)

---

## Overview

This plan outlines the complete dockerization of the Cal3 application, transforming it from a local development setup into a production-ready containerized application. The application consists of:

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (served via Nginx)
- **Backend**: NestJS + TypeORM + Node.js 18
- **Database**: PostgreSQL 15
- **Additional Services**: Automation scheduler, OAuth integrations

### Goals

- ✅ Production-ready Docker setup
- ✅ Development environment with hot-reload
- ✅ Automated database migrations
- ✅ Secure and optimized containers
- ✅ Easy deployment and maintenance
- ✅ Persistent data storage
- ✅ Health checks and monitoring
- ✅ Scalable architecture

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Network                       │
│                                                          │
│  ┌──────────────┐      ┌──────────────┐      ┌───────┐ │
│  │   Frontend   │      │   Backend    │      │ PostgreSQL │
│  │              │      │              │      │           │
│  │ React + Vite │◄────►│   NestJS     │◄────►│ Database  │
│  │   + Nginx    │      │   + TypeORM  │      │           │
│  │              │      │              │      │           │
│  │  Port: 80    │      │  Port: 8081  │      │ Port: 5432│
│  └──────────────┘      └──────────────┘      └───────────┘
│         │                     │                     │     │
└─────────┼─────────────────────┼─────────────────────┼─────┘
          │                     │                     │
          ▼                     ▼                     ▼
    Host: 8080            Host: 8081            Host: 5432
```

### Container Breakdown

1. **Frontend Container (cal3-frontend)**
   - Multi-stage build: Node.js → Nginx
   - Serves static React build
   - Proxies API requests to backend
   - SPA routing support
   - Gzip compression enabled

2. **Backend Container (cal3-backend)**
   - Multi-stage build: Builder → Production
   - NestJS application
   - TypeORM migrations
   - Cron job scheduling
   - OAuth integrations

3. **Database Container (cal3-postgres)**
   - PostgreSQL 15
   - Persistent volume storage
   - Automated backups support
   - Health checks

---

## Prerequisites

### Software Requirements

- **Docker**: v24.0+
- **Docker Compose**: v2.20+
- **Git**: For cloning repository
- **Text Editor**: For configuration files

### Knowledge Requirements

- Basic Docker concepts
- Docker Compose basics
- Environment variables
- Basic networking concepts

### System Requirements

**Development:**
- RAM: 4GB minimum, 8GB recommended
- Disk: 10GB free space
- CPU: 2 cores minimum

**Production:**
- RAM: 8GB minimum, 16GB recommended
- Disk: 50GB+ for data persistence
- CPU: 4 cores minimum

---

## Implementation Phases

### Phase 1: Create Docker Directory Structure ⏱️ 10 minutes

**Objective:** Organize Docker-related files in a dedicated directory structure.

**Tasks:**
1. Create `docker/` directory in project root
2. Create subdirectories:
   - `docker/development/` - Dev environment configs
   - `docker/production/` - Production configs
   - `docker/nginx/` - Nginx configurations
   - `docker/scripts/` - Utility scripts

**Commands:**
```bash
mkdir -p docker/{development,production,nginx,scripts}
```

**Success Criteria:**
- Directory structure exists
- Proper permissions set

---

### Phase 2: Backend Dockerfile ⏱️ 30 minutes

**Objective:** Create a multi-stage Dockerfile for the NestJS backend.

**File:** `backend-nestjs/Dockerfile`

**Key Features:**
- Multi-stage build (builder + production)
- Node 18 Alpine base image
- Optimized layer caching
- Non-root user
- Health check endpoint

**Implementation Details:**

```dockerfile
# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:8081/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main"]
```

**Required Changes to Backend:**

1. **Add health check endpoint** in `src/app.controller.ts`:
```typescript
@Get('health')
healthCheck() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

2. **Update CORS in `src/main.ts`**:
```typescript
app.enableCors({
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://frontend:80', // Docker network
    process.env.FRONTEND_URL
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});
```

3. **Database host configuration** - Use environment variable:
```typescript
// In app.module.ts
host: process.env.DB_HOST || 'localhost',
```

**Testing:**
```bash
cd backend-nestjs
docker build -t cal3-backend:test .
docker run -p 8081:8081 cal3-backend:test
```

---

### Phase 3: Frontend Dockerfile ⏱️ 30 minutes

**Objective:** Create a multi-stage Dockerfile for the React frontend with Nginx.

**File:** `frontend/Dockerfile`

**Key Features:**
- Multi-stage build (builder + nginx)
- Optimized production build
- Custom nginx configuration
- Runtime environment variables
- Gzip compression

**Implementation Details:**

```dockerfile
# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy runtime config script
COPY docker/scripts/runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

**Required Frontend Changes:**

1. **Create runtime config script** `docker/scripts/runtime-config.sh`:
```bash
#!/bin/sh
# Generate runtime config
cat > /usr/share/nginx/html/config.js << EOF
window.ENV = {
  API_URL: "${API_URL:-http://localhost:8081}",
  NODE_ENV: "${NODE_ENV:-production}"
};
EOF
```

2. **Update API service** `frontend/src/services/api.ts`:
```typescript
// Add at the top
declare global {
  interface Window {
    ENV?: {
      API_URL: string;
      NODE_ENV: string;
    };
  }
}

// Use in API service
const baseURL = window.ENV?.API_URL || 'http://localhost:8081';
```

3. **Add config.js to index.html**:
```html
<script src="/config.js"></script>
```

**Testing:**
```bash
cd frontend
docker build -t cal3-frontend:test -f Dockerfile .
docker run -p 8080:80 cal3-frontend:test
```

---

### Phase 4: Docker Compose - Development ⏱️ 45 minutes

**Objective:** Create a development environment with hot-reload capability.

**File:** `docker-compose.dev.yml`

**Implementation:**

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    container_name: cal3-postgres-dev
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-cal3_dev}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
      - ./docker/scripts/init-db.sh:/docker-entrypoint-initdb.d/init-db.sh:ro
    networks:
      - cal3-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend-nestjs
      dockerfile: Dockerfile.dev
    container_name: cal3-backend-dev
    restart: unless-stopped
    environment:
      NODE_ENV: development
      PORT: 8081
      DB_TYPE: postgres
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: ${DB_USERNAME:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:-postgres}
      DB_NAME: ${DB_NAME:-cal3_dev}
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: http://localhost:8080
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GOOGLE_CALLBACK_URL: ${GOOGLE_CALLBACK_URL}
      MICROSOFT_CLIENT_ID: ${MICROSOFT_CLIENT_ID}
      MICROSOFT_CLIENT_SECRET: ${MICROSOFT_CLIENT_SECRET}
      MICROSOFT_CALLBACK_URL: ${MICROSOFT_CALLBACK_URL}
      MICROSOFT_TENANT_ID: ${MICROSOFT_TENANT_ID}
    ports:
      - "8081:8081"
    volumes:
      - ./backend-nestjs/src:/app/src:ro
      - ./backend-nestjs/package*.json:/app/package*.json:ro
      - backend_node_modules:/app/node_modules
    networks:
      - cal3-network
    depends_on:
      postgres:
        condition: service_healthy
    command: npm run start:dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: cal3-frontend-dev
    restart: unless-stopped
    environment:
      NODE_ENV: development
      VITE_API_URL: http://localhost:8081
    ports:
      - "8080:8080"
    volumes:
      - ./frontend/src:/app/src:ro
      - ./frontend/package*.json:/app/package*.json:ro
      - ./frontend/index.html:/app/index.html:ro
      - ./frontend/vite.config.ts:/app/vite.config.ts:ro
      - ./frontend/tsconfig*.json:/app/:ro
      - ./frontend/tailwind.config.js:/app/tailwind.config.js:ro
      - ./frontend/postcss.config.js:/app/postcss.config.js:ro
      - frontend_node_modules:/app/node_modules
    networks:
      - cal3-network
    depends_on:
      - backend
    command: npm run dev

networks:
  cal3-network:
    driver: bridge

volumes:
  postgres_data_dev:
    name: cal3_postgres_data_dev
  backend_node_modules:
    name: cal3_backend_node_modules_dev
  frontend_node_modules:
    name: cal3_frontend_node_modules_dev
```

**Development Dockerfiles:**

`backend-nestjs/Dockerfile.dev`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8081

CMD ["npm", "run", "start:dev"]
```

`frontend/Dockerfile.dev`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

---

### Phase 5: Docker Compose - Production ⏱️ 45 minutes

**Objective:** Create production-ready Docker Compose configuration.

**File:** `docker-compose.yml`

**Implementation:**

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    container_name: cal3-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "127.0.0.1:${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - cal3-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME}"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  backend:
    build:
      context: ./backend-nestjs
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
    container_name: cal3-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 8081
      DB_TYPE: postgres
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:8080}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GOOGLE_CALLBACK_URL: ${GOOGLE_CALLBACK_URL}
      MICROSOFT_CLIENT_ID: ${MICROSOFT_CLIENT_ID}
      MICROSOFT_CLIENT_SECRET: ${MICROSOFT_CLIENT_SECRET}
      MICROSOFT_CALLBACK_URL: ${MICROSOFT_CALLBACK_URL}
      MICROSOFT_TENANT_ID: ${MICROSOFT_TENANT_ID}
    ports:
      - "127.0.0.1:8081:8081"
    networks:
      - cal3-network
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8081/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
      args:
        API_URL: ${API_URL:-http://localhost:8081}
    container_name: cal3-frontend
    restart: unless-stopped
    environment:
      API_URL: http://backend:8081
      NODE_ENV: production
    ports:
      - "${FRONTEND_PORT:-8080}:80"
    networks:
      - cal3-network
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  cal3-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16

volumes:
  postgres_data:
    name: cal3_postgres_data
```

---

### Phase 6: Environment Configuration ⏱️ 20 minutes

**Objective:** Create environment variable templates and documentation.

**File:** `docker/.env.example`

```bash
# ============================================
# Cal3 Docker Environment Configuration
# ============================================
# Copy this file to .env and fill in your values

# ============================================
# Database Configuration
# ============================================
DB_TYPE=postgres
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=cal3_user
DB_PASSWORD=changeme_strong_password_here
DB_NAME=cal3_production

# ============================================
# Application Configuration
# ============================================
NODE_ENV=production
PORT=8081
FRONTEND_PORT=8080
FRONTEND_URL=http://localhost:8080
API_URL=http://localhost:8081

# ============================================
# Security
# ============================================
# Generate with: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# ============================================
# Google OAuth (Optional)
# ============================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8081/api/auth/google/callback

# ============================================
# Microsoft OAuth (Optional)
# ============================================
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:8081/api/auth/microsoft/callback
MICROSOFT_TENANT_ID=common

# ============================================
# Docker Resource Limits (Production)
# ============================================
POSTGRES_CPU_LIMIT=2
POSTGRES_MEMORY_LIMIT=2G
BACKEND_CPU_LIMIT=2
BACKEND_MEMORY_LIMIT=1G
FRONTEND_CPU_LIMIT=1
FRONTEND_MEMORY_LIMIT=512M
```

**File:** `backend-nestjs/.dockerignore`

```
# Dependencies
node_modules
npm-debug.log*

# Build outputs
dist
build

# Development files
*.development.ts
*.dev.ts
.env.development
.env.local

# Testing
coverage
*.test.ts
*.spec.ts
test

# Documentation
*.md
docs

# Git
.git
.gitignore

# IDE
.vscode
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log
```

**File:** `frontend/.dockerignore`

```
# Dependencies
node_modules
npm-debug.log*

# Build outputs (except for production)
dist
.vite

# Development
*.development.*
.env.development
.env.local

# Testing
coverage
*.test.ts
*.spec.ts
*.test.tsx
*.spec.tsx

# Documentation
*.md
docs

# Git
.git
.gitignore

# IDE
.vscode
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log
```

---

### Phase 7: Nginx Configuration ⏱️ 30 minutes

**Objective:** Configure Nginx for SPA routing and API proxying.

**File:** `docker/nginx/nginx.conf`

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    include /etc/nginx/conf.d/*.conf;
}
```

**File:** `docker/nginx/default.conf`

```nginx
upstream backend {
    server backend:8081;
    keepalive 32;
}

# HTTP server
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API proxy
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering off;
        proxy_request_buffering off;

        # CORS headers (if needed)
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback - all other requests go to index.html
    location / {
        try_files $uri $uri/ /index.html;

        # Disable caching for index.html
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Security - deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

---

### Phase 8: Database Initialization ⏱️ 20 minutes

**Objective:** Automated database setup and migrations.

**File:** `docker/scripts/init-db.sh`

```bash
#!/bin/bash
set -e

echo "========================================="
echo "Cal3 Database Initialization"
echo "========================================="

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h "$DB_HOST" -U "$DB_USERNAME"; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is ready!"

# Check if database exists
DB_EXISTS=$(psql -h "$DB_HOST" -U "$DB_USERNAME" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "Database $DB_NAME already exists"
else
    echo "Creating database $DB_NAME..."
    psql -h "$DB_HOST" -U "$DB_USERNAME" -c "CREATE DATABASE $DB_NAME"
    echo "Database created successfully!"
fi

echo "========================================="
echo "Database initialization complete!"
echo "========================================="
```

**File:** `docker/scripts/run-migrations.sh`

```bash
#!/bin/bash
set -e

echo "========================================="
echo "Running Database Migrations"
echo "========================================="

cd /app

# Wait for database
echo "Waiting for database connection..."
until node -e "require('typeorm').createConnection(require('./dist/ormconfig.js')).then(() => process.exit(0)).catch(() => process.exit(1))"; do
  echo "Database not ready, retrying in 3 seconds..."
  sleep 3
done

echo "Database connection established!"

# Run migrations
echo "Running TypeORM migrations..."
npm run migration:run

# Check if seed is needed
if [ "$RUN_SEED" = "true" ]; then
    echo "Running database seed..."
    npm run seed
fi

echo "========================================="
echo "Migrations completed successfully!"
echo "========================================="
```

**Update backend package.json:**

```json
{
  "scripts": {
    "migration:run": "typeorm migration:run -d dist/ormconfig.js",
    "migration:revert": "typeorm migration:revert -d dist/ormconfig.js",
    "migration:generate": "typeorm migration:generate -d dist/ormconfig.js"
  }
}
```

---

### Phase 9: Utility Scripts ⏱️ 40 minutes

**Objective:** Create helper scripts for common Docker operations.

**File:** `docker/scripts/start-dev.sh`

```bash
#!/bin/bash

echo "========================================="
echo "Starting Cal3 Development Environment"
echo "========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy docker/.env.example to .env and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Start containers
echo "Starting Docker containers..."
docker-compose -f docker-compose.dev.yml up --build -d

# Show logs
echo ""
echo "========================================="
echo "Development environment started!"
echo "========================================="
echo "Frontend: http://localhost:8080"
echo "Backend:  http://localhost:8081"
echo "API Docs: http://localhost:8081/api/docs"
echo ""
echo "View logs with: docker-compose -f docker-compose.dev.yml logs -f"
echo "========================================="
```

**File:** `docker/scripts/start-prod.sh`

```bash
#!/bin/bash

echo "========================================="
echo "Starting Cal3 Production Environment"
echo "========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy docker/.env.example to .env and configure it."
    exit 1
fi

# Validate required environment variables
REQUIRED_VARS=("DB_USERNAME" "DB_PASSWORD" "DB_NAME" "JWT_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set in .env file"
        exit 1
    fi
done

# Build and start containers
echo "Building and starting Docker containers..."
docker-compose up --build -d

# Wait for health checks
echo "Waiting for services to be healthy..."
sleep 10

# Check service health
docker-compose ps

echo ""
echo "========================================="
echo "Production environment started!"
echo "========================================="
echo "Frontend: http://localhost:${FRONTEND_PORT:-8080}"
echo "Backend:  http://localhost:8081"
echo ""
echo "View logs with: docker-compose logs -f"
echo "========================================="
```

**File:** `docker/scripts/stop.sh`

```bash
#!/bin/bash

echo "Stopping Cal3 containers..."

# Stop development
if docker-compose -f docker-compose.dev.yml ps -q 2>/dev/null; then
    echo "Stopping development environment..."
    docker-compose -f docker-compose.dev.yml down
fi

# Stop production
if docker-compose ps -q 2>/dev/null; then
    echo "Stopping production environment..."
    docker-compose down
fi

echo "All containers stopped!"
```

**File:** `docker/scripts/rebuild.sh`

```bash
#!/bin/bash

ENV=${1:-dev}

echo "Rebuilding Cal3 ($ENV environment)..."

if [ "$ENV" = "dev" ]; then
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml build --no-cache
    docker-compose -f docker-compose.dev.yml up -d
else
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
fi

echo "Rebuild complete!"
```

**File:** `docker/scripts/logs.sh`

```bash
#!/bin/bash

SERVICE=${1:-}
ENV=${2:-prod}

if [ "$ENV" = "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

if [ -z "$SERVICE" ]; then
    docker-compose -f $COMPOSE_FILE logs -f
else
    docker-compose -f $COMPOSE_FILE logs -f $SERVICE
fi
```

**File:** `docker/scripts/db-backup.sh`

```bash
#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cal3_backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "Creating database backup..."
docker exec cal3-postgres pg_dump -U $DB_USERNAME $DB_NAME > $BACKUP_FILE

if [ -f $BACKUP_FILE ]; then
    # Compress backup
    gzip $BACKUP_FILE
    echo "Backup created: ${BACKUP_FILE}.gz"

    # Keep only last 7 backups
    ls -t $BACKUP_DIR/cal3_backup_*.sql.gz | tail -n +8 | xargs rm -f 2>/dev/null
    echo "Old backups cleaned up"
else
    echo "Backup failed!"
    exit 1
fi
```

**File:** `docker/scripts/db-restore.sh`

```bash
#!/bin/bash

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./db-restore.sh <backup-file>"
    echo "Available backups:"
    ls -lh ./backups/cal3_backup_*.sql.gz
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "WARNING: This will overwrite the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo "Restoring database from $BACKUP_FILE..."

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | docker exec -i cal3-postgres psql -U $DB_USERNAME $DB_NAME
else
    cat $BACKUP_FILE | docker exec -i cal3-postgres psql -U $DB_USERNAME $DB_NAME
fi

echo "Database restored successfully!"
```

**Make scripts executable:**

```bash
chmod +x docker/scripts/*.sh
```

---

### Phase 10: Documentation ⏱️ 45 minutes

**Objective:** Comprehensive Docker usage documentation.

**File:** `docker/README.md`

```markdown
# Cal3 Docker Deployment Guide

Complete guide for deploying Cal3 using Docker and Docker Compose.

## Quick Start

### Prerequisites

- Docker Engine 24.0+
- Docker Compose 2.20+
- 8GB RAM (16GB recommended for production)
- 20GB disk space

### Development Setup

1. **Clone repository:**
   ```bash
   git clone https://github.com/your-org/cal3.git
   cd cal3
   ```

2. **Configure environment:**
   ```bash
   cp docker/.env.example .env
   # Edit .env with your settings
   nano .env
   ```

3. **Start development environment:**
   ```bash
   ./docker/scripts/start-dev.sh
   ```

4. **Access application:**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8081
   - API Documentation: http://localhost:8081/api/docs

### Production Deployment

1. **Configure production environment:**
   ```bash
   cp docker/.env.example .env
   # Set production values
   nano .env
   ```

2. **Generate secure JWT secret:**
   ```bash
   openssl rand -base64 32
   ```

3. **Start production environment:**
   ```bash
   ./docker/scripts/start-prod.sh
   ```

4. **Verify deployment:**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

## Container Architecture

### Services

- **frontend**: React + Nginx (Port 8080)
- **backend**: NestJS API (Port 8081)
- **postgres**: PostgreSQL 15 (Port 5432)

### Networks

- `cal3-network`: Bridge network for inter-container communication

### Volumes

- `postgres_data`: Persistent database storage
- `backend_node_modules`: Backend dependencies
- `frontend_node_modules`: Frontend dependencies

## Common Commands

### Development

```bash
# Start
./docker/scripts/start-dev.sh

# Stop
./docker/scripts/stop.sh

# View logs
./docker/scripts/logs.sh [service]

# Rebuild
./docker/scripts/rebuild.sh dev

# Shell access
docker exec -it cal3-backend-dev sh
docker exec -it cal3-frontend-dev sh

# Database access
docker exec -it cal3-postgres-dev psql -U postgres -d cal3_dev
```

### Production

```bash
# Start
./docker/scripts/start-prod.sh

# Stop
docker-compose down

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs -f backend

# Update application
git pull
docker-compose up --build -d

# Scale backend (if needed)
docker-compose up -d --scale backend=3
```

### Database Operations

```bash
# Backup
./docker/scripts/db-backup.sh

# Restore
./docker/scripts/db-restore.sh ./backups/cal3_backup_20250109_120000.sql.gz

# Run migrations manually
docker exec cal3-backend npm run migration:run

# Access database
docker exec -it cal3-postgres psql -U cal3_user -d cal3_production
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_USERNAME` | Database user | `cal3_user` |
| `DB_PASSWORD` | Database password | `secure_password_123` |
| `DB_NAME` | Database name | `cal3_production` |
| `JWT_SECRET` | JWT signing key | `your-32-char-secret` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FRONTEND_PORT` | Frontend port | `8080` |
| `DB_PORT` | Database port | `5432` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `MICROSOFT_CLIENT_ID` | Microsoft OAuth client ID | - |

See `docker/.env.example` for complete list.

## Health Checks

### Manual Health Check

```bash
# Backend
curl http://localhost:8081/api/health

# Frontend
curl http://localhost:8080/health

# Database
docker exec cal3-postgres pg_isready -U cal3_user
```

### Container Health Status

```bash
docker-compose ps
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs [service]

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database connection issues

```bash
# Check if postgres is healthy
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker exec cal3-backend nc -zv postgres 5432
```

### Permission errors

```bash
# Fix volume permissions
docker-compose down -v
sudo chown -R $USER:$USER .
docker-compose up -d
```

### Out of memory

```bash
# Check resource usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Or adjust resource limits in docker-compose.yml
```

### Hot reload not working

```bash
# Development only - check volumes
docker-compose -f docker-compose.dev.yml config

# Verify file watching
docker-compose -f docker-compose.dev.yml logs frontend
```

## Maintenance

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up --build -d

# Check for issues
docker-compose logs -f
```

### Cleanup

```bash
# Remove stopped containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Clean system
docker system prune -a
```

### Monitoring

```bash
# Resource usage
docker stats

# Container status
docker-compose ps

# Disk usage
docker system df
```

## Security Best Practices

1. **Never commit .env files** - Use .env.example as template
2. **Use strong passwords** - Minimum 16 characters
3. **Rotate JWT secrets regularly** - Every 90 days
4. **Keep base images updated** - Run `docker-compose pull` weekly
5. **Limit exposed ports** - Bind to 127.0.0.1 in production
6. **Use secrets management** - Docker secrets or external vault
7. **Enable firewall** - Restrict access to necessary ports only
8. **Regular backups** - Automated daily backups recommended

## Production Checklist

- [ ] .env configured with production values
- [ ] JWT_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] OAuth credentials configured (if using)
- [ ] Firewall rules configured
- [ ] Backup script tested
- [ ] Monitoring setup
- [ ] SSL/TLS certificates configured (if using reverse proxy)
- [ ] Resource limits set appropriately
- [ ] Log rotation configured

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-org/cal3/issues
- Documentation: https://github.com/your-org/cal3/wiki
- Email: support@your-org.com
```

---

### Phase 11: CI/CD Configuration (Optional) ⏱️ 60 minutes

**File:** `.github/workflows/docker-build.yml`

```yaml
name: Docker Build and Push

on:
  push:
    branches:
      - main
      - develop
    tags:
      - 'v*'
  pull_request:
    branches:
      - main

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    strategy:
      matrix:
        service: [backend, frontend]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.service }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./${{ matrix.service == 'backend' && 'backend-nestjs' || 'frontend' }}
          file: ./${{ matrix.service == 'backend' && 'backend-nestjs' || 'frontend' }}/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  test:
    runs-on: ubuntu-latest
    needs: build-and-push

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Create .env file
        run: |
          cat > .env << EOF
          DB_USERNAME=test_user
          DB_PASSWORD=test_password
          DB_NAME=test_db
          JWT_SECRET=test-jwt-secret-for-ci-testing-only
          NODE_ENV=test
          EOF

      - name: Start services
        run: |
          docker-compose up -d
          sleep 30

      - name: Check service health
        run: |
          curl -f http://localhost:8080/health || exit 1
          curl -f http://localhost:8081/api/health || exit 1

      - name: Run backend tests
        run: |
          docker exec cal3-backend npm test

      - name: Cleanup
        if: always()
        run: docker-compose down -v
```

---

### Phase 12: Additional Enhancements (Optional) ⏱️ Variable

#### A. Reverse Proxy with Traefik

**File:** `docker-compose.traefik.yml`

```yaml
version: '3.9'

services:
  traefik:
    image: traefik:v2.10
    container_name: cal3-traefik
    restart: unless-stopped
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@yourdomain.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080" # Traefik dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certificates:/letsencrypt
    networks:
      - cal3-network

  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.services.frontend.loadbalancer.server.port=80"

  backend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.yourdomain.com`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
      - "traefik.http.services.backend.loadbalancer.server.port=8081"

volumes:
  traefik-certificates:
```

#### B. Redis Caching Layer

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: cal3-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - cal3-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  redis_data:
```

#### C. Monitoring with Prometheus & Grafana

**File:** `docker-compose.monitoring.yml`

```yaml
version: '3.9'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: cal3-prometheus
    restart: unless-stopped
    volumes:
      - ./docker/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    networks:
      - cal3-network

  grafana:
    image: grafana/grafana:latest
    container_name: cal3-grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./docker/monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3000:3000"
    networks:
      - cal3-network
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:
```

---

## Configuration Guide

### Environment Variable Details

#### Database Configuration

```bash
# PostgreSQL specific settings
DB_TYPE=postgres                    # Database type (postgres or sqlite)
DB_HOST=postgres                    # Hostname (use service name in Docker)
DB_PORT=5432                       # Default PostgreSQL port
DB_USERNAME=cal3_user              # Database user
DB_PASSWORD=secure_password        # Strong password (min 16 chars)
DB_NAME=cal3_production           # Database name
PGDATA=/var/lib/postgresql/data/pgdata  # Data directory inside container
```

#### Application Settings

```bash
NODE_ENV=production               # Environment: development, production, test
PORT=8081                        # Backend API port
FRONTEND_PORT=8080               # Frontend serving port
FRONTEND_URL=https://yourdomain.com  # Frontend URL (for CORS)
API_URL=https://api.yourdomain.com   # API URL (for frontend)
```

#### Security Configuration

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRATION=1d               # Token expiration time

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:8080,https://yourdomain.com
```

#### OAuth Configuration

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8081/api/auth/google/callback
```

**Microsoft OAuth:**
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register application in Azure AD
3. Add redirect URIs
4. Generate client secret

```bash
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:8081/api/auth/microsoft/callback
MICROSOFT_TENANT_ID=common  # or your tenant ID
```

---

## Deployment Instructions

### Local Development Deployment

**Step 1: Prerequisites**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

**Step 2: Clone and Configure**
```bash
# Clone repository
git clone https://github.com/your-org/cal3.git
cd cal3

# Create environment file
cp docker/.env.example .env

# Edit configuration
nano .env  # or vim, code, etc.
```

**Step 3: Start Development Environment**
```bash
# Make scripts executable
chmod +x docker/scripts/*.sh

# Start all services
./docker/scripts/start-dev.sh

# Wait for services to start (30-60 seconds)
# Watch logs
docker-compose -f docker-compose.dev.yml logs -f
```

**Step 4: Verify Installation**
```bash
# Check service health
docker-compose -f docker-compose.dev.yml ps

# Test frontend
curl http://localhost:8080

# Test backend
curl http://localhost:8081/api/health

# Test database
docker exec -it cal3-postgres-dev psql -U postgres -d cal3_dev -c "SELECT version();"
```

### Production Deployment

**Step 1: Server Preparation**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

**Step 2: Configure Firewall**
```bash
# Ubuntu/Debian with UFW
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# CentOS/RHEL with firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

**Step 3: Application Setup**
```bash
# Create application directory
sudo mkdir -p /opt/cal3
sudo chown $USER:$USER /opt/cal3
cd /opt/cal3

# Clone repository
git clone https://github.com/your-org/cal3.git .

# Configure environment
cp docker/.env.example .env
nano .env

# IMPORTANT: Set production values
# - Strong DB_PASSWORD
# - Secure JWT_SECRET (32+ characters)
# - Production URLs
# - OAuth credentials
```

**Step 4: Generate Secrets**
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate database password
openssl rand -base64 24
```

**Step 5: Deploy Application**
```bash
# Make scripts executable
chmod +x docker/scripts/*.sh

# Start production environment
./docker/scripts/start-prod.sh

# Monitor startup
docker-compose logs -f
```

**Step 6: Verify Deployment**
```bash
# Check container status
docker-compose ps

# Health checks
curl http://localhost:8080/health
curl http://localhost:8081/api/health

# View logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

**Step 7: Setup Automated Backups**
```bash
# Create backup cron job
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /opt/cal3 && ./docker/scripts/db-backup.sh >> /var/log/cal3-backup.log 2>&1
```

**Step 8: Configure Reverse Proxy (Optional)**

**Using Nginx as Reverse Proxy:**
```nginx
# /etc/nginx/sites-available/cal3
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/cal3 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**SSL Certificates with Let's Encrypt:**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured by default
sudo certbot renew --dry-run
```

### Cloud Platform Deployments

#### AWS EC2 Deployment

**Step 1: Launch EC2 Instance**
- AMI: Ubuntu 22.04 LTS
- Instance Type: t3.medium (minimum)
- Storage: 50GB gp3
- Security Group: Ports 22, 80, 443

**Step 2: Connect and Setup**
```bash
ssh -i your-key.pem ubuntu@ec2-instance-ip

# Follow production deployment steps above
```

#### DigitalOcean Droplet

```bash
# Create Droplet
# - Ubuntu 22.04
# - 4GB RAM / 2 vCPU (minimum)
# - 80GB SSD

# SSH to droplet
ssh root@droplet-ip

# Follow production deployment steps
```

#### Google Cloud Platform

```bash
# Create Compute Engine instance
gcloud compute instances create cal3-server \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --machine-type=e2-medium \
  --boot-disk-size=50GB

# SSH to instance
gcloud compute ssh cal3-server

# Follow production deployment steps
```

---

## Maintenance & Operations

### Regular Maintenance Tasks

#### Daily Tasks
- Monitor container health: `docker-compose ps`
- Check disk usage: `docker system df`
- Review logs for errors: `docker-compose logs --tail=100`

#### Weekly Tasks
- Update base images: `docker-compose pull`
- Review backup integrity
- Check application updates
- Review security advisories

#### Monthly Tasks
- Rotate JWT secrets
- Update dependencies
- Performance review
- Capacity planning

### Update Procedures

**Application Updates:**
```bash
# 1. Pull latest code
cd /opt/cal3
git pull origin main

# 2. Backup database
./docker/scripts/db-backup.sh

# 3. Rebuild and restart
docker-compose up --build -d

# 4. Verify
docker-compose ps
docker-compose logs -f --tail=50
```

**Docker Image Updates:**
```bash
# Pull latest base images
docker-compose pull

# Rebuild with new base images
docker-compose build --no-cache

# Restart services
docker-compose up -d
```

### Backup and Restore Procedures

**Automated Backups:**
```bash
# Setup cron job
crontab -e

# Daily backup at 2 AM
0 2 * * * cd /opt/cal3 && ./docker/scripts/db-backup.sh

# Weekly full backup
0 3 * * 0 cd /opt/cal3 && ./docker/scripts/full-backup.sh
```

**Manual Backup:**
```bash
# Database only
./docker/scripts/db-backup.sh

# Full application backup
tar -czf cal3-backup-$(date +%Y%m%d).tar.gz \
  .env \
  docker/ \
  backups/ \
  docker-compose.yml
```

**Restore Procedure:**
```bash
# 1. Stop services
docker-compose down

# 2. Restore database
./docker/scripts/db-restore.sh ./backups/cal3_backup_20250109.sql.gz

# 3. Restart services
docker-compose up -d

# 4. Verify
docker-compose logs -f
```

### Scaling Guidelines

**Vertical Scaling (Single Server):**
```yaml
# Update docker-compose.yml resource limits
deploy:
  resources:
    limits:
      cpus: '4'      # Increase from 2
      memory: 4G     # Increase from 1G
```

**Horizontal Scaling (Multiple Backends):**
```bash
# Scale backend service
docker-compose up -d --scale backend=3

# Add load balancer (Nginx, HAProxy, Traefik)
```

**Database Scaling:**
- Use managed database service (RDS, Cloud SQL)
- Implement read replicas for read-heavy workloads
- Consider connection pooling (PgBouncer)

### Monitoring Setup

**Container Metrics:**
```bash
# Resource usage
docker stats

# Service health
docker-compose ps

# Log aggregation
docker-compose logs --since 1h > /var/log/cal3-hourly.log
```

**Application Monitoring:**
- Setup Prometheus + Grafana (see Phase 12)
- Configure alerts for:
  - High CPU/Memory usage
  - Container restarts
  - Failed health checks
  - Disk space warnings

**Log Management:**
```yaml
# Configure log rotation in docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "5"
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Containers Won't Start

**Symptoms:**
- `docker-compose up` fails
- Container exits immediately
- Health checks failing

**Diagnosis:**
```bash
# Check container logs
docker-compose logs [service-name]

# Check container status
docker-compose ps

# Inspect container
docker inspect cal3-backend
```

**Solutions:**
```bash
# Clear everything and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Check environment variables
docker-compose config

# Verify .env file
cat .env | grep -v '^#'
```

#### Issue 2: Database Connection Failures

**Symptoms:**
- Backend can't connect to PostgreSQL
- "Connection refused" errors
- "password authentication failed"

**Diagnosis:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Test database connection
docker exec cal3-backend nc -zv postgres 5432

# Check database logs
docker-compose logs postgres
```

**Solutions:**
```bash
# Verify environment variables
docker-compose exec backend env | grep DB_

# Test connection from backend container
docker-compose exec backend psql -h postgres -U $DB_USERNAME -d $DB_NAME

# Reset database
docker-compose down
docker volume rm cal3_postgres_data
docker-compose up -d postgres
```

#### Issue 3: Frontend Can't Reach Backend

**Symptoms:**
- API calls fail from browser
- CORS errors
- 502 Bad Gateway

**Diagnosis:**
```bash
# Check if backend is healthy
curl http://localhost:8081/api/health

# Check from frontend container
docker-compose exec frontend wget -O- http://backend:8081/api/health

# Check nginx logs
docker-compose logs frontend
```

**Solutions:**
```bash
# Verify CORS configuration in backend main.ts
# Update nginx.conf proxy settings
# Restart services
docker-compose restart backend frontend
```

#### Issue 4: Hot Reload Not Working (Development)

**Symptoms:**
- Code changes not reflected
- Must restart containers manually

**Diagnosis:**
```bash
# Check volume mounts
docker-compose -f docker-compose.dev.yml config

# Verify file watcher
docker-compose -f docker-compose.dev.yml exec backend ls -la /app/src
```

**Solutions:**
```bash
# Windows users: Enable WSL2 backend
# Mac users: Enable "Use gRPC FUSE for file sharing"

# Rebuild with proper volumes
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

#### Issue 5: Out of Memory/Disk Space

**Symptoms:**
- Containers crashing
- Slow performance
- "no space left on device"

**Diagnosis:**
```bash
# Check Docker disk usage
docker system df

# Check container resources
docker stats

# Check host disk space
df -h
```

**Solutions:**
```bash
# Clean Docker system
docker system prune -a --volumes

# Remove unused images
docker image prune -a

# Adjust resource limits in docker-compose.yml

# Increase Docker disk allocation (Docker Desktop settings)
```

#### Issue 6: Permission Denied Errors

**Symptoms:**
- Can't write to volumes
- Logs show permission errors

**Diagnosis:**
```bash
# Check volume permissions
docker-compose exec backend ls -la /app

# Check file ownership
docker-compose exec backend id
```

**Solutions:**
```bash
# Fix volume permissions
docker-compose down -v
sudo chown -R $USER:$USER .
docker-compose up -d

# Or modify Dockerfile to use correct UID/GID
```

#### Issue 7: Slow Build Times

**Symptoms:**
- `docker-compose build` takes too long
- Repeated dependency installation

**Solutions:**
```bash
# Use BuildKit
export DOCKER_BUILDKIT=1
docker-compose build

# Cache node_modules in volumes (development)
# See docker-compose.dev.yml volume configuration

# Use multi-stage builds efficiently
# Separate dependency installation from code copy
```

#### Issue 8: SSL/TLS Issues

**Symptoms:**
- HTTPS not working
- Certificate errors
- Mixed content warnings

**Diagnosis:**
```bash
# Test certificate
openssl s_client -connect yourdomain.com:443

# Check certificate expiry
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

**Solutions:**
```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Check reverse proxy configuration
sudo nginx -t

# Verify certificate paths in nginx config
```

---

## Security Considerations

### Container Security

**1. Use Official Base Images**
```dockerfile
# Good
FROM node:18-alpine

# Avoid
FROM custom-node:latest
```

**2. Non-Root Users**
```dockerfile
# Create and use non-root user
RUN adduser -D -u 1001 appuser
USER appuser
```

**3. Read-Only Filesystems**
```yaml
services:
  backend:
    read_only: true
    tmpfs:
      - /tmp
      - /app/logs
```

**4. Security Scanning**
```bash
# Install Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh

# Scan images
trivy image cal3-backend:latest
trivy image cal3-frontend:latest
```

### Network Security

**1. Isolate Networks**
```yaml
networks:
  cal3-frontend:
    driver: bridge
  cal3-backend:
    driver: bridge
    internal: true  # No external access
```

**2. Limit Port Exposure**
```yaml
ports:
  - "127.0.0.1:8081:8081"  # Bind to localhost only
```

**3. Use Secrets Management**
```yaml
secrets:
  db_password:
    external: true

services:
  backend:
    secrets:
      - db_password
```

### Application Security

**1. Environment Variables**
- Never commit `.env` files
- Use strong, random secrets
- Rotate credentials regularly
- Use secret management (Vault, AWS Secrets Manager)

**2. JWT Security**
```bash
# Generate strong JWT secret (32+ bytes)
openssl rand -base64 48

# Set appropriate expiration
JWT_EXPIRATION=1d  # or shorter for sensitive apps
```

**3. Database Security**
- Use strong passwords (16+ characters)
- Limit database user permissions
- Enable SSL/TLS for connections
- Regular security updates

**4. CORS Configuration**
```typescript
// Restrict CORS origins
app.enableCors({
  origin: [process.env.FRONTEND_URL],  // Specific domain only
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
});
```

### Monitoring and Auditing

**1. Log Everything**
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
    labels: "service=cal3"
```

**2. Security Alerts**
- Monitor failed login attempts
- Track unusual API usage
- Alert on container restarts
- Monitor resource usage spikes

**3. Regular Updates**
```bash
# Update base images weekly
docker-compose pull
docker-compose up -d --build

# Update system packages
sudo apt update && sudo apt upgrade -y
```

### Compliance Checklist

- [ ] All secrets stored securely (not in code)
- [ ] Strong passwords enforced (16+ characters)
- [ ] JWT secrets rotated quarterly
- [ ] HTTPS enabled (production)
- [ ] Database connections encrypted
- [ ] Regular security updates scheduled
- [ ] Automated backups configured
- [ ] Monitoring and alerting active
- [ ] Access logs retained
- [ ] Incident response plan documented
- [ ] Firewall configured correctly
- [ ] Non-root containers used
- [ ] Security scanning implemented
- [ ] Vulnerability patches applied

---

## Performance Optimization

### Docker Layer Caching

**Optimize Dockerfile layer order:**
```dockerfile
# 1. Copy package files first (changes rarely)
COPY package*.json ./
RUN npm ci

# 2. Copy source code last (changes frequently)
COPY . .
RUN npm run build
```

### Build Performance

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Use cache mounts (BuildKit feature)
RUN --mount=type=cache,target=/root/.npm npm ci
```

### Runtime Performance

**1. Resource Limits**
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 256M
```

**2. Health Check Tuning**
```yaml
healthcheck:
  interval: 30s      # Don't check too frequently
  timeout: 10s       # Reasonable timeout
  retries: 3         # Retry before marking unhealthy
  start_period: 60s  # Allow time for startup
```

**3. Database Performance**
```bash
# Add PostgreSQL tuning
POSTGRES_INITDB_ARGS="-c shared_buffers=256MB -c max_connections=100"
```

### Network Performance

**1. Use Host Network (Carefully)**
```yaml
# Only for high-performance scenarios
network_mode: "host"
```

**2. Optimize Nginx**
```nginx
# Enable keepalive
keepalive_timeout 65;

# Use sendfile
sendfile on;
tcp_nopush on;

# Enable gzip
gzip on;
gzip_comp_level 6;
```

---

## Appendix

### A. Complete File Checklist

After implementing all phases, verify these files exist:

```
cal3/
├── docker/
│   ├── development/
│   ├── production/
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── default.conf
│   ├── scripts/
│   │   ├── start-dev.sh
│   │   ├── start-prod.sh
│   │   ├── stop.sh
│   │   ├── rebuild.sh
│   │   ├── logs.sh
│   │   ├── db-backup.sh
│   │   ├── db-restore.sh
│   │   ├── init-db.sh
│   │   └── run-migrations.sh
│   ├── .env.example
│   └── README.md
├── backend-nestjs/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── .dockerignore
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env (not in git)
└── .github/
    └── workflows/
        └── docker-build.yml
```

### B. Port Reference

| Service | Development Port | Production Port | Description |
|---------|-----------------|-----------------|-------------|
| Frontend | 8080 | 8080 | React app served by Nginx |
| Backend | 8081 | 127.0.0.1:8081 | NestJS API |
| PostgreSQL | 5432 | 127.0.0.1:5432 | Database |
| Traefik Dashboard | 8080 | 8080 | (If using Traefik) |
| Prometheus | 9090 | 9090 | (If using monitoring) |
| Grafana | 3000 | 3000 | (If using monitoring) |

### C. Volume Reference

| Volume Name | Purpose | Lifecycle |
|------------|---------|-----------|
| `postgres_data` | Database files | Persistent |
| `postgres_data_dev` | Dev database | Ephemeral |
| `backend_node_modules` | Backend deps (dev) | Rebuild on changes |
| `frontend_node_modules` | Frontend deps (dev) | Rebuild on changes |
| `traefik-certificates` | SSL certificates | Persistent |
| `redis_data` | Redis cache | Persistent |

### D. Environment Variables Quick Reference

**Required:**
- `DB_USERNAME` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT signing key (32+ chars)

**Optional:**
- `FRONTEND_PORT` - Frontend port (default: 8080)
- `DB_PORT` - Database port (default: 5432)
- `NODE_ENV` - Environment (development/production)
- `GOOGLE_CLIENT_ID` - Google OAuth
- `GOOGLE_CLIENT_SECRET` - Google OAuth
- `MICROSOFT_CLIENT_ID` - Microsoft OAuth
- `MICROSOFT_CLIENT_SECRET` - Microsoft OAuth

### E. Useful Docker Commands

```bash
# View all containers
docker ps -a

# View all images
docker images

# View volumes
docker volume ls

# View networks
docker network ls

# Clean everything
docker system prune -a --volumes

# Export container
docker export <container-id> > container.tar

# Import container
docker import container.tar

# Save image
docker save cal3-backend:latest | gzip > cal3-backend.tar.gz

# Load image
docker load < cal3-backend.tar.gz

# Copy files from container
docker cp cal3-backend:/app/logs/. ./logs/

# Execute command in running container
docker exec -it cal3-backend bash

# View container resource usage
docker stats

# View container processes
docker top cal3-backend

# View container events
docker events --since 1h

# Restart policy
docker update --restart=unless-stopped cal3-backend
```

### F. Support and Resources

**Documentation:**
- Docker Docs: https://docs.docker.com
- Docker Compose Docs: https://docs.docker.com/compose
- NestJS Docs: https://docs.nestjs.com
- React Docs: https://react.dev
- PostgreSQL Docs: https://www.postgresql.org/docs

**Community:**
- GitHub Issues: https://github.com/your-org/cal3/issues
- Discord: https://discord.gg/your-server
- Stack Overflow: Tag with [cal3]

**Professional Support:**
- Email: support@your-org.com
- Enterprise Support: enterprise@your-org.com

---

## Conclusion

This comprehensive Docker deployment plan provides everything needed to containerize and deploy the Cal3 Calendar Application. Follow the phases sequentially, test thoroughly at each step, and refer to the troubleshooting section when issues arise.

**Key Takeaways:**

1. **Start with development** - Get familiar with Docker setup in development before production
2. **Secure your secrets** - Never commit sensitive data, use strong passwords
3. **Automate backups** - Set up automated database backups immediately
4. **Monitor proactively** - Implement health checks and monitoring from day one
5. **Document changes** - Keep this plan updated as you make modifications
6. **Test thoroughly** - Verify each phase before moving to the next
7. **Plan for scale** - Design with future growth in mind

Good luck with your Docker deployment! 🚀

---

**Document Version:** 1.0
**Last Updated:** 2025-10-09
**Maintained By:** Cal3 Development Team
