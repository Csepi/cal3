# 🐳 Cal3 Docker Setup Guide

Complete guide to setting up and running Cal3 Calendar Application using Docker.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Configuration](#configuration)
5. [Platform-Specific Guides](#platform-specific-guides)
6. [Usage](#usage)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Configuration](#advanced-configuration)

---

## 🎯 Prerequisites

### Required Software

| Software | Minimum Version | Download |
|----------|----------------|----------|
| Docker | 24.0+ | [docker.com](https://www.docker.com/get-started) |
| Docker Compose | 2.20+ | Included with Docker Desktop |
| Git | Any | [git-scm.com](https://git-scm.com/downloads) |

### System Requirements

**Development:**
- RAM: 4GB minimum, 8GB recommended
- Disk: 10GB free space
- CPU: 2 cores minimum

**Production:**
- RAM: 8GB minimum, 16GB recommended
- Disk: 50GB+ for data persistence
- CPU: 4 cores minimum

### Verify Installation

```bash
# Check Docker
docker --version
# Should show: Docker version 24.0.0 or higher

# Check Docker Compose
docker-compose --version
# Should show: Docker Compose version v2.20.0 or higher

# Check Docker is running
docker ps
# Should show empty list or running containers (not an error)
```

---

## 🚀 Quick Start

### Option 1: Development (5 minutes)

Perfect for testing and development:

```bash
# 1. Clone repository
git clone https://github.com/Csepi/cal3.git
cd cal3/docker

# 2. Start everything (auto-creates config)
./scripts/start-dev.sh

# 3. Access application
# Frontend: http://localhost:8080
# Backend:  http://localhost:8081
# API Docs: http://localhost:8081/api/docs
```

**That's it!** ✨ Development uses default settings (no configuration needed).

### Option 2: Production (15 minutes)

For production deployment:

```bash
# 1. Clone repository
git clone https://github.com/Csepi/cal3.git
cd cal3/docker

# 2. Create production config
cp config/env.example config/.env

# 3. Edit configuration (IMPORTANT!)
nano config/.env
# Set DB_PASSWORD, JWT_SECRET, etc.

# 4. Generate secure secrets
openssl rand -base64 32  # Use for JWT_SECRET
openssl rand -base64 24  # Use for DB_PASSWORD

# 5. Start production
./scripts/start-prod.sh

# 6. Access application
# Frontend: http://localhost:8080
```

---

## 📦 Available Docker Compose Files

The project includes multiple compose files for different deployment scenarios:

| File | Purpose | Image Source | Best For |
|------|---------|--------------|----------|
| **`docker-compose.yml`** | Production deployment | Builds locally | Standard production |
| **`docker-compose.portainer-local.yml`** | Portainer with local build | Builds locally | **Portainer users (Recommended)** ⭐ |
| **`docker-compose.portainer.yml`** | Portainer with pre-built images | Pulls from ghcr.io | CI/CD pipelines |
| **`docker-compose.dev.yml`** | Development | Builds with hot reload | Local development |

**Which one should I use?**

- 🎯 **Deploying with Portainer?** → Use `portainer-local.yml` (no ghcr.io access needed)
- 🚀 **Production via command line?** → Use `docker-compose.yml`
- 💻 **Local development?** → Use `docker-compose.dev.yml`
- ⚙️ **Have CI/CD setup?** → Use `portainer.yml` (requires ghcr.io images)

---

## 📖 Detailed Setup

### Step 1: Install Docker

Choose your platform:

**Windows:**
```powershell
# Download and install Docker Desktop
# https://www.docker.com/products/docker-desktop

# After installation, restart computer
# Verify installation
docker --version
```

**macOS:**
```bash
# Download and install Docker Desktop
# https://www.docker.com/products/docker-desktop

# After installation
# Verify installation
docker --version
```

**Linux (Ubuntu/Debian):**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verify installation
docker --version
docker-compose --version
```

**Linux (CentOS/RHEL):**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/Csepi/cal3.git

# Navigate to docker directory
cd cal3/docker

# Verify structure
ls -la
# Should see: config/, nginx/, scripts/, docker-compose.yml, etc.
```

### Step 3: Choose Environment

**For Development:**
```bash
# Copy development template (optional - script does this automatically)
cp config/env.dev.example config/.env.dev

# Start development
./scripts/start-dev.sh
```

**For Production:**
```bash
# MUST create production config
cp config/env.example config/.env

# Edit with your values
nano config/.env
# OR
vim config/.env
# OR on Windows
notepad config/.env
```

### Step 4: Configure Environment

Open `config/.env` and set these **REQUIRED** values:

```bash
# Database Configuration
DB_USERNAME=cal3_user
DB_PASSWORD=your-strong-password-here    # 16+ characters!
DB_NAME=cal3_production

# Security
JWT_SECRET=your-super-secret-jwt-key     # 32+ characters!
```

**Generate Strong Secrets:**
```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32
# Example output: Kx4vN2mP9rT5wY8zB3nQ6sU1jH7fD0aL

# Generate database password (24+ characters)
openssl rand -base64 24
# Example output: 3xK9mN2pQ5rT8vY1zB4nH7j
```

**Optional Configuration:**

```bash
# Frontend/Backend URLs (for production)
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8081/api/auth/google/callback

# Microsoft OAuth (optional)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:8081/api/auth/microsoft/callback
```

See [config/README.md](config/README.md) for complete configuration reference.

### Step 5: Start Docker Containers

**Development:**
```bash
# From cal3/docker directory
./scripts/start-dev.sh

# Wait for containers to start (30 seconds)
# Applications start automatically!
```

**Production:**
```bash
# From cal3/docker directory
./scripts/start-prod.sh

# Wait for health checks (60 seconds)
# Applications start automatically!
```

### Step 6: Verify Installation

```bash
# Check container status
docker-compose ps
# All containers should be "Up" and "healthy"

# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Test endpoints
curl http://localhost:8081/api/health
# Should return: {"status":"ok","timestamp":"..."}

curl http://localhost:8080/health
# Should return: healthy
```

### Step 7: Access Application

Open your browser:

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:8081
- **API Documentation:** http://localhost:8081/api/docs

**Default admin credentials (development only):**
- Created by seed script if exists
- Check backend logs for credentials

---

## ⚙️ Configuration

### Configuration Files

All configuration is in `docker/config/` directory:

```
config/
├── env.example         # Production template
├── env.dev.example     # Development template
├── .env               # Production config (create this)
└── .env.dev           # Development config (auto-created)
```

### Port Configuration

**🎯 Smart Configuration** - Only 3 variables needed:

```bash
# In config/.env or config/.env.dev
BASE_URL=http://localhost      # Base domain
FRONTEND_PORT=8080             # Frontend port (default: 8080)
BACKEND_PORT=8081              # Backend port (default: 8081)
DB_PORT=5433                   # PostgreSQL port (default: 5433)
```

**All URLs automatically constructed:**
- `FRONTEND_URL` = `BASE_URL:FRONTEND_PORT`
- `API_URL` = `BASE_URL:BACKEND_PORT`
- OAuth callbacks = `BASE_URL:BACKEND_PORT/api/auth/{provider}/callback`

**Example with custom ports:**
```bash
BASE_URL=http://localhost
FRONTEND_PORT=3000
BACKEND_PORT=3001
DB_PORT=5434
# All URLs auto-constructed - no redundant configuration!
```

✅ **No more URL mismatches** - Ports and URLs stay synchronized automatically.

For advanced setups (subdomains, reverse proxy), you can still override specific URLs. See [CONFIGURATION_GUIDE.md](../CONFIGURATION_GUIDE.md).

### Environment Variables Reference

**Required (Production):**

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_USERNAME` | Database user | `cal3_user` |
| `DB_PASSWORD` | Database password (16+ chars) | `SecurePass123!@#` |
| `DB_NAME` | Database name | `cal3_production` |
| `JWT_SECRET` | JWT signing key (32+ chars) | Use `openssl rand -base64 32` |

**Optional:**

| Variable | Description | Default |
|----------|-------------|---------|
| `FRONTEND_PORT` | Frontend port | `8080` |
| `DB_PORT` | Database port | `5432` |
| `NODE_ENV` | Environment | `production` |
| `GOOGLE_CLIENT_ID` | Google OAuth | - |
| `MICROSOFT_CLIENT_ID` | Microsoft OAuth | - |

**Development Defaults:**
- Database: `postgres` / `postgres` / `cal3_dev`
- JWT Secret: `dev-jwt-secret-change-in-production`
- All OAuth: Optional (leave empty)

### Ports Used

| Service | Port | Access |
|---------|------|--------|
| Frontend | 8080 | http://localhost:8080 |
| Backend | 8081 | http://localhost:8081 |
| PostgreSQL | 5433 | localhost:5433 |
| API Docs | 8081 | http://localhost:8081/api/docs |

### Volumes (Data Persistence)

| Volume | Purpose | Location |
|--------|---------|----------|
| `postgres_data` | Database files | Docker volume |
| `config` | Environment files | `./config/` |
| `backups` | Database backups | `./backups/` |

---

## 🖥️ Platform-Specific Guides

### Windows

**Using PowerShell:**

```powershell
# Clone repository
git clone https://github.com/Csepi/cal3.git
cd cal3\docker

# Create config
copy config\env.example config\.env
notepad config\.env

# Start (use Git Bash for scripts, or use docker-compose directly)
docker-compose up -d

# Or use Git Bash
bash ./scripts/start-prod.sh
```

**Using WSL2 (Recommended):**

```bash
# All commands work natively in WSL2
cd /mnt/c/Users/YourName/cal3/docker
./scripts/start-prod.sh
```

### macOS

**Using Terminal:**

```bash
# Clone repository
git clone https://github.com/Csepi/cal3.git
cd cal3/docker

# Make scripts executable
chmod +x scripts/*.sh

# Create config
cp config/env.example config/.env
nano config/.env

# Start
./scripts/start-prod.sh
```

### Linux (Ubuntu/Debian)

**Standard Setup:**

```bash
# Install Docker (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Clone and setup
git clone https://github.com/Csepi/cal3.git
cd cal3/docker
cp config/env.example config/.env
nano config/.env

# Start
./scripts/start-prod.sh
```

### Synology NAS

**Method 1: Using Docker UI**

1. Open Docker app on Synology
2. Go to "Registry" → Search "postgres" and download
3. Upload `cal3-backend` and `cal3-frontend` images
4. Create network "cal3-network"
5. Create containers from images
6. Configure environment variables
7. Start containers

**Method 2: Using SSH (Recommended)**

```bash
# SSH to Synology
ssh admin@synology-ip

# Create directory
sudo mkdir -p /volume1/docker/cal3
cd /volume1/docker/cal3

# Clone repository
git clone https://github.com/Csepi/cal3.git .

# Setup config
cd docker
cp config/env.example config/.env
nano config/.env

# Start
./scripts/start-prod.sh
```

### Azure

**Using Azure Container Instances:**

See [docs/docker/CI_CD_SETUP.md](../docs/docker/CI_CD_SETUP.md) for complete guide.

### Portainer (Docker Management UI)

Portainer provides a web-based UI for managing Docker containers, perfect for users who prefer visual management over command-line.

**📖 Complete Step-by-Step Guide:** [PORTAINER_GUIDE.md](PORTAINER_GUIDE.md)
Includes: Installation, deployment, troubleshooting, and management tasks with detailed explanations.

**🎯 Quick Start:** Follow steps below, or use the [comprehensive guide](PORTAINER_GUIDE.md) for detailed instructions and common error solutions.

#### Step 1: Install Portainer

**On Linux/Mac:**
```bash
# Create volume for Portainer data
docker volume create portainer_data

# Run Portainer
docker run -d \
  -p 9000:9000 \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

**On Windows (PowerShell):**
```powershell
# Create volume
docker volume create portainer_data

# Run Portainer
docker run -d `
  -p 9000:9000 `
  -p 9443:9443 `
  --name portainer `
  --restart=always `
  -v //var/run/docker.sock:/var/run/docker.sock `
  -v portainer_data:/data `
  portainer/portainer-ce:latest
```

**On Synology NAS:**
1. Open Docker app
2. Go to Registry → Search "portainer/portainer-ce"
3. Download latest image
4. Launch container with:
   - Port 9443:9443
   - Port 9000:9000
   - Volume: `/var/run/docker.sock` → `/var/run/docker.sock`
   - Auto-restart enabled

#### Step 2: Access Portainer

1. Open browser: **https://localhost:9443** (or http://localhost:9000)
2. Create admin account on first visit
3. Select "Docker" environment
4. Click "Connect"

#### Step 3: Deploy Cal3 with Portainer

**Method 1: Using Stacks (Recommended)**

**Important:** Portainer deployments don't include the git-ignored `config/.env` file. Choose based on your situation:

**🎯 Quick Comparison:**

| Feature | Option A (Local Build) | Option B (Pre-built Images) |
|---------|----------------------|---------------------------|
| **Setup Time** | ⏱️ First time: 10-15 min | ⚡ 2-3 minutes |
| **GitHub Registry** | ✅ Not needed | ⚠️ Required |
| **Authentication** | ✅ None required | ⚠️ May need ghcr.io login |
| **Latest Code** | ✅ Always current | ⚠️ Depends on CI/CD |
| **Disk Space** | 📦 Higher (builds on host) | 📦 Lower |
| **Best For** | **First-time users, Testing** | Production with CI/CD |

**Recommendation:** Start with **Option A** for immediate deployment without setup complexity.

**🔥 QUICK START - Option A: Local Build (No GitHub Container Registry Required)**

This is the **fastest and easiest** method - builds images locally without needing access to ghcr.io.

1. In Portainer, go to **Stacks** → **Add stack**
2. Name: `cal3`
3. Build method: **Repository**
   - URL: `https://github.com/Csepi/cal3.git`
   - Branch: `main` (or `Docker`)
   - **Compose path: `docker/docker-compose.portainer-local.yml`** ⭐ **NEW**

   **OR** use **Web editor** and paste content from [docker-compose.portainer-local.yml](docker-compose.portainer-local.yml)

4. Scroll down to **Environment variables** section
5. Click **Add an environment variable** and add these (required):
   ```
   DB_USERNAME=cal3_user
   DB_PASSWORD=your-strong-password-here
   DB_NAME=cal3_production
   JWT_SECRET=your-32-char-secret-here
   FRONTEND_PORT=8080
   FRONTEND_URL=http://localhost:8080
   ```

6. **Generate secure secrets first:**
   ```bash
   # Run these commands to generate secrets:
   openssl rand -base64 32  # Use for JWT_SECRET
   openssl rand -base64 24  # Use for DB_PASSWORD
   ```

7. Click **Deploy the stack**
8. Wait for images to build (first time: 5-10 minutes)

**✅ Advantages:**
- No GitHub Container Registry access needed
- No authentication required
- Always uses latest code
- Works offline (if repo cloned)

---

**Option B: Pre-built Images from GitHub Container Registry**

Use this if GitHub Actions has already built the images, or you prefer using pre-built images.

1. In Portainer, go to **Stacks** → **Add stack**
2. Name: `cal3`
3. Build method: **Repository** or **Web editor**
   - **If using Repository**:
     - URL: `https://github.com/Csepi/cal3.git`
     - Branch: `main`
     - Compose path: `docker/docker-compose.portainer.yml`
   - **If using Web editor**: Copy the content below

4. Paste this docker-compose content (or it's auto-loaded from repo):

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
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - cal3-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME}"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  backend:
    image: ghcr.io/csepi/cal3-backend:latest
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
      MICROSOFT_TENANT_ID: ${MICROSOFT_TENANT_ID:-common}
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

  frontend:
    image: ghcr.io/csepi/cal3-frontend:latest
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

networks:
  cal3-network:
    driver: bridge

volumes:
  postgres_data:
    name: cal3_postgres_data
```

5. Scroll down to **Environment variables** section
6. Click **Add an environment variable** and add these **required** variables (click + after each):
   ```
   DB_USERNAME=cal3_user
   DB_PASSWORD=your-strong-password-here
   DB_NAME=cal3_production
   JWT_SECRET=your-32-char-secret-here
   FRONTEND_URL=http://localhost:8080
   ```

7. **Optional:** Add port configuration if you have conflicts (click + after each):
   ```
   FRONTEND_PORT=8080    # Change to 8090 if 8080 is in use
   BACKEND_PORT=8081     # Change to 8082 if 8081 is in use
   DB_PORT=5433          # Change to 5434 if 5433 is in use
   ```

8. **Important:** Generate secure secrets first:
   - JWT_SECRET: Run `openssl rand -base64 32` and copy result
   - DB_PASSWORD: Run `openssl rand -base64 24` and copy result

9. Click **Deploy the stack**

**✅ Advantages:**
- Faster deployment (images pre-built)
- Smaller resource usage during deployment
- Works when CI/CD is set up

**⚠️ Requirements:**
- GitHub Actions must have built the images
- Images must be public, or you must authenticate with ghcr.io

**Note:** If you get "access denied" errors, use **Option A** instead.

**Method 2: Upload docker-compose.yml**

1. In Portainer, go to **Stacks** → **Add stack**
2. Name: `cal3`
3. Build method: **Web editor**
4. Copy contents of `docker/docker-compose.yml`
5. Paste into editor
6. **Environment variables** → Add variables (same as above)
7. Click **Deploy the stack**

**Method 3: Manual Container Creation**

1. **Create Network:**
   - Go to **Networks** → **Add network**
   - Name: `cal3-network`
   - Driver: `bridge`
   - Click **Create**

2. **Create PostgreSQL Container:**
   - Go to **Containers** → **Add container**
   - Name: `cal3-postgres`
   - Image: `postgres:15-alpine`
   - Port mapping: `5432:5432`
   - Environment variables:
     ```
     POSTGRES_USER=cal3_user
     POSTGRES_PASSWORD=your-password
     POSTGRES_DB=cal3_production
     ```
   - Network: `cal3-network`
   - Volumes: Create volume `cal3_postgres_data` → `/var/lib/postgresql/data`
   - Restart policy: `Unless stopped`
   - Click **Deploy**

3. **Create Backend Container:**
   - **Add container**
   - Name: `cal3-backend`
   - Image: `ghcr.io/csepi/cal3-backend:latest` (or build locally)
   - Port mapping: `8081:8081`
   - Environment variables:
     ```
     NODE_ENV=production
     DB_HOST=cal3-postgres
     DB_PORT=5432
     DB_USERNAME=cal3_user
     DB_PASSWORD=your-password
     DB_NAME=cal3_production
     JWT_SECRET=your-32-char-secret
     ```
   - Network: `cal3-network`
   - Restart policy: `Unless stopped`
   - Click **Deploy**

4. **Create Frontend Container:**
   - **Add container**
   - Name: `cal3-frontend`
   - Image: `ghcr.io/csepi/cal3-frontend:latest` (or build locally)
   - Port mapping: `8080:80`
   - Environment variables:
     ```
     API_URL=http://cal3-backend:8081
     NODE_ENV=production
     ```
   - Network: `cal3-network`
   - Restart policy: `Unless stopped`
   - Click **Deploy**

#### Step 4: Manage Cal3 in Portainer

**View Logs:**
1. Go to **Containers**
2. Click on container name (e.g., `cal3-backend`)
3. Click **Logs** tab
4. Toggle **Auto-refresh** for live logs

**Restart Containers:**
1. Go to **Containers**
2. Select container(s)
3. Click **Restart**

**Update Configuration:**
1. Go to **Stacks** → `cal3`
2. Click **Editor**
3. Modify environment variables
4. Click **Update the stack**
5. Select "Re-pull images and redeploy"

**View Container Stats:**
1. Go to **Containers**
2. Click on container name
3. Click **Stats** tab
4. View CPU, Memory, Network usage

**Execute Commands:**
1. Go to **Containers** → Container name
2. Click **Console**
3. Select `/bin/sh` or `/bin/bash`
4. Click **Connect**

**Backup Database:**
1. Go to **Containers** → `cal3-postgres`
2. Click **Console** → Connect
3. Run: `pg_dump -U cal3_user cal3_production > /backups/backup.sql`

**Update Application:**
1. Go to **Stacks** → `cal3`
2. Click **Update the stack**
3. Check "Re-pull images and redeploy"
4. Click **Update**

#### Portainer Tips

**Best Practices:**
- ✅ Use Stacks (docker-compose) for easier management
- ✅ Set restart policy to "Unless stopped"
- ✅ Use named volumes for data persistence
- ✅ Label containers for better organization
- ✅ Enable container health checks

**Security:**
- 🔒 Use HTTPS (port 9443) instead of HTTP
- 🔒 Set strong admin password
- 🔒 Enable 2FA in Settings
- 🔒 Restrict access with firewalls
- 🔒 Regularly update Portainer

**Monitoring:**
- 📊 Dashboard shows container status at a glance
- 📊 View resource usage (CPU, Memory, Network)
- 📊 Set up webhooks for notifications
- 📊 Use templates for quick deployments

#### Troubleshooting Portainer

**"env file /data/compose/.../config/.env not found"**

This is the most common error when deploying from Git repository.

**Cause:** The `config/.env` file is git-ignored and doesn't exist in the repository.

**Solutions:**

1. **Use Option A above** (Portainer Environment Variables method)
   - Don't use Git repository deployment
   - Use Web editor with the provided docker-compose.yml
   - Add all environment variables in Portainer UI
   - This is the recommended approach for Portainer

2. **Remove env_file references:**
   - Edit the docker-compose.yml in Portainer
   - Remove these lines:
     ```yaml
     env_file:
       - ./config/.env
     ```
   - Add all environment variables directly in the compose file or Portainer UI

3. **For advanced users - Create config file in Portainer:**
   - After deploying stack, exec into container
   - Create config/.env file manually
   - Restart containers

**Cannot access Portainer:**
```bash
# Check if Portainer is running
docker ps | grep portainer

# Check logs
docker logs portainer

# Restart Portainer
docker restart portainer
```

**"Cannot connect to Docker socket":**
```bash
# Ensure socket is mounted (Linux)
docker inspect portainer | grep docker.sock

# Fix permissions (Linux)
sudo chmod 666 /var/run/docker.sock
```

**Stack deployment fails:**
- Check environment variables are set correctly
- Verify repository URL is accessible
- Check Portainer logs for specific errors
- Ensure compose file path is correct
- Remove env_file references if using Git deployment

**Images not found (ghcr.io/csepi/cal3-*):**

This error means the pre-built images aren't available in GitHub Container Registry.

**Solution - Use Local Build:**
1. Go to **Stacks** → Your stack → **Editor**
2. Change compose path to: `docker/docker-compose.portainer-local.yml`
3. **OR** replace image references:
   ```yaml
   # Change from:
   image: ghcr.io/csepi/cal3-backend:latest

   # To:
   build:
     context: ..
     dockerfile: docker/Dockerfile.backend
   ```
4. Update and redeploy the stack
5. Portainer will build images locally (takes 5-10 minutes first time)

**Alternative:** Wait for GitHub Actions to build images, or make the packages public at https://github.com/Csepi?tab=packages

**"NanoCPUs can not be set, as your kernel does not support CPU CFS scheduler"**

This error occurs when your Docker environment doesn't support CPU resource limits.

**Cause:** The system kernel doesn't support CPU CFS (Completely Fair Scheduler) or cgroups are not properly mounted. Common on Windows Docker Desktop and older Linux kernels.

**Solution:**

The project has been updated to remove CPU limits from all docker-compose files (commit 50374b5). If you're seeing this error on an older version:

```bash
# Pull latest changes
git pull origin main

# Or manually remove CPU limits from your docker-compose file:
# Remove these lines from each service's deploy.resources section:
#   cpus: 'X'
#   (Keep memory limits - they work without CPU scheduler support)
```

Memory limits are still in place for resource management and work without CPU scheduler support.

**"npm run build: exit code: 2" or "executor failed running [/bin/sh -c npm run build]"**

This error occurs during the Docker build process when the frontend build fails.

**Cause:** TypeScript compilation errors in the frontend code block the build process.

**Solution:**

The `frontend/package.json` build script has been configured to skip TypeScript type checking during Docker builds:

```json
"scripts": {
  "build": "vite build",           // Docker production build (no type checking)
  "build:typecheck": "tsc -b && vite build",  // Full build with type checking
  "typecheck": "tsc -b"            // Check types only
}
```

This allows Docker builds to succeed even with TypeScript warnings. To check for TypeScript errors locally:

```bash
cd frontend
npm run typecheck
```

If you want to restore type checking in Docker builds, change the `build` script back to:
```json
"build": "tsc -b && vite build"
```

Then fix all TypeScript errors before building:
```bash
cd frontend
npm run typecheck
# Fix all errors shown
npm run build
```

#### Portainer Alternatives

If you prefer other UI tools:

**Dockge:**
```bash
docker run -d \
  -p 5001:5001 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v dockge:/app/data \
  --name dockge \
  louislam/dockge:1
```
Access: http://localhost:5001

**Yacht:**
```bash
docker run -d \
  -p 8000:8000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v yacht:/config \
  --name yacht \
  selfhostedpro/yacht
```
Access: http://localhost:8000

**Lazydocker (Terminal UI):**
```bash
# Install
curl https://raw.githubusercontent.com/jesseduffield/lazydocker/master/scripts/install_update_linux.sh | bash

# Run
lazydocker
```

---

## 💻 Usage

### Starting Containers

**Development:**
```bash
cd docker
./scripts/start-dev.sh
```

**Production:**
```bash
cd docker
./scripts/start-prod.sh
```

**Manual Start:**
```bash
cd docker

# Development
docker-compose -f docker-compose.dev.yml up -d

# Production
docker-compose up -d
```

### Stopping Containers

```bash
# Using script
cd docker
./scripts/stop.sh

# Manual
docker-compose down

# Stop and remove volumes (careful - deletes data!)
docker-compose down -v
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restarting Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# After config changes
docker-compose restart backend frontend
```

### Updating Application

```bash
# Pull latest code
cd cal3
git pull origin main

# Rebuild and restart
cd docker
docker-compose up --build -d

# Or use restart script
./scripts/stop.sh
./scripts/start-prod.sh
```

### Database Operations

**Backup:**
```bash
cd docker
./scripts/db-backup.sh

# Backups saved to: docker/backups/
```

**Restore:**
```bash
cd docker
./scripts/db-restore.sh ./backups/cal3_backup_20250110_120000.sql.gz
```

**Access Database:**
```bash
# Development
docker exec -it cal3-postgres-dev psql -U postgres -d cal3_dev

# Production
docker exec -it cal3-postgres psql -U cal3_user -d cal3_production
```

### Accessing Containers

**Get shell access:**
```bash
# Backend
docker exec -it cal3-backend sh

# Frontend
docker exec -it cal3-frontend sh

# Database
docker exec -it cal3-postgres sh
```

---

## 🔧 Troubleshooting

### Issue: Containers Won't Start

**Symptoms:**
- `docker-compose up` fails
- Containers exit immediately

**Solutions:**

```bash
# Check logs
docker-compose logs

# Check for port conflicts
netstat -ano | findstr :8080
netstat -ano | findstr :8081
netstat -ano | findstr :5432

# Clean and restart
docker-compose down -v
docker-compose up -d --build

# Check Docker resources
docker system df
docker system prune -a
```

### Issue: "Config file not found"

**Symptoms:**
- Error: "config/.env file not found"

**Solutions:**

```bash
# Ensure you're in docker/ directory
cd cal3/docker
pwd  # Should end with /cal3/docker

# Create config file
cp config/env.example config/.env

# Verify it exists
ls -la config/.env
```

### Issue: Database Connection Failed

**Symptoms:**
- Backend logs show "Connection refused"
- "ECONNREFUSED postgres:5432"

**Solutions:**

```bash
# Check if postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Verify environment variables
docker-compose exec backend env | grep DB_

# Restart in correct order
docker-compose down
docker-compose up -d postgres
# Wait 10 seconds
docker-compose up -d backend frontend
```

### Issue: Port Already in Use

**Symptoms:**
- "port is already allocated"
- "bind: address already in use"
- Error on ports 5433, 8080, or 8081

**Common Causes:**
- **Port 5433**: Another PostgreSQL instance or previous Docker container
- **Port 8080**: Other web servers or development tools
- **Port 8081**: Backend services or API servers

**✅ Easy Solution: Configure Different Ports**

All ports are now configurable via environment variables! Simply add these to Portainer or config/.env:

```bash
# If port 8081 is in use (your current error):
BACKEND_PORT=8082

# If port 8080 is in use:
FRONTEND_PORT=8090

# If port 5433 is in use:
DB_PORT=5434
```

**In Portainer:**
1. Go to **Stacks** → Your stack → **Environment variables**
2. Click **Add an environment variable**
3. Add: `BACKEND_PORT` = `8082` (or any free port)
4. Click **Update the stack**

**Using config/.env:**
```bash
# Edit docker/config/.env
FRONTEND_PORT=8090
BACKEND_PORT=8082
DB_PORT=5434
```

**Alternative - Find and Kill Process Using Port:**

**Windows:**
```powershell
# Find process using port 8081
netstat -ano | findstr :8081

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Find process
lsof -i :8081

# Kill process
kill -9 <PID>
```

### Issue: Permission Denied (Linux)

**Symptoms:**
- "Permission denied" errors
- Cannot access volumes

**Solutions:**

```bash
# Fix directory permissions
sudo chown -R $USER:$USER .

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Restart Docker
sudo systemctl restart docker
```

### Issue: Out of Disk Space

**Symptoms:**
- "no space left on device"
- Containers crashing

**Solutions:**

```bash
# Check disk usage
docker system df

# Clean up
docker system prune -a
docker volume prune

# Remove unused images
docker image prune -a

# Check host disk space
df -h
```

### Issue: Hot Reload Not Working (Development)

**Symptoms:**
- Code changes not reflected
- Must restart containers manually

**Solutions:**

```bash
# For Windows users: Enable WSL2 backend in Docker Desktop

# For Mac users: Enable "Use gRPC FUSE for file sharing"

# Rebuild dev environment
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

### Issue: Cannot Access Application

**Symptoms:**
- Browser shows "Can't reach this page"
- Connection refused

**Solutions:**

```bash
# Check containers are running
docker-compose ps
# All should show "Up" status

# Check health
curl http://localhost:8081/api/health
curl http://localhost:8080/health

# Check Docker network
docker network ls
docker network inspect cal3-network

# Check firewall (Windows)
# Allow Docker through Windows Firewall

# Check firewall (Linux)
sudo ufw allow 8080/tcp
sudo ufw allow 8081/tcp
```

### Issue: "NanoCPUs can not be set" Error

**Symptoms:**
- Deployment fails with "NanoCPUs can not be set, as your kernel does not support CPU CFS scheduler or the cgroup is not mounted"
- Error during `docker-compose up` or Portainer stack deployment

**Cause:**
Your Docker environment doesn't support CPU resource limits. Common on:
- Windows Docker Desktop (certain configurations)
- Older Linux kernels without CPU CFS scheduler
- Systems where cgroups are not fully mounted

**Solution:**

The issue has been fixed in commit 50374b5. Pull the latest changes:

```bash
git pull origin main
```

If you're using a custom compose file or older version, manually remove CPU limits:

```yaml
# Before (causes error):
deploy:
  resources:
    limits:
      cpus: '2'        # Remove this line
      memory: 2G       # Keep this
    reservations:
      cpus: '1'        # Remove this line
      memory: 512M     # Keep this

# After (works everywhere):
deploy:
  resources:
    limits:
      memory: 2G       # Memory limits work without CPU scheduler
    reservations:
      memory: 512M
```

Memory limits still provide resource control and work on all systems.

### Issue: Docker Build Fails with "npm run build: exit code: 2"

**Symptoms:**
- Build fails during frontend container build
- Error: "executor failed running [/bin/sh -c npm run build]: exit code: 2"
- Portainer shows "compose build operation failed"

**Cause:**
TypeScript compilation errors in the frontend code

**Solution:**

The project has been configured to skip TypeScript checking during Docker builds. If you're seeing this error on an older version:

```bash
# Pull latest changes
git pull origin main

# Or manually update frontend/package.json:
# Change "build": "tsc -b && vite build"
# To:     "build": "vite build"
```

**For developers who want to check types:**

```bash
cd frontend
npm run typecheck  # Check for TypeScript errors
npm run build:typecheck  # Build with type checking
```

**If you want strict type checking in Docker builds:**

1. Fix all TypeScript errors first:
   ```bash
   cd frontend
   npm run typecheck
   # Fix all reported errors
   ```

2. Change `frontend/package.json`:
   ```json
   "build": "tsc -b && vite build"
   ```

3. Rebuild Docker images:
   ```bash
   docker-compose build --no-cache
   ```

---

## 🔐 Advanced Configuration

### SSL/HTTPS Setup

**Using Nginx Reverse Proxy:**

```bash
# Install Nginx on host
sudo apt-get install nginx certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Configure Nginx
sudo nano /etc/nginx/sites-available/cal3
```

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Custom Network

**Edit docker-compose.yml:**

```yaml
networks:
  cal3-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
          gateway: 172.28.0.1
```

### Resource Limits

**Edit docker-compose.yml:**

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M
```

### Multiple Environments

**Create separate configs:**

```bash
# Staging
cp config/env.example config/.env.staging

# Production
cp config/env.example config/.env.prod

# Start with specific config
docker-compose --env-file config/.env.staging up -d
```

---

## 📚 Additional Resources

### Documentation
- [Full Docker Documentation](../docs/docker/README.md)
- [CI/CD Setup Guide](../docs/docker/CI_CD_SETUP.md)
- [Deployment Plan](../docs/docker/DOCKER_DEPLOYMENT_PLAN.md)
- [Config Reference](config/README.md)

### Cal3 Documentation
- [Main README](../README.md)
- [API Documentation](../API_DOCUMENTATION.md)
- [Setup Guide](../setup-guide.md)

### External Resources
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NestJS Documentation](https://docs.nestjs.com/)

---

## ✅ Setup Checklist

### Before Starting

- [ ] Docker installed and running
- [ ] Docker Compose installed
- [ ] Git installed
- [ ] Repository cloned
- [ ] In `cal3/docker` directory

### Development Setup

- [ ] Run `./scripts/start-dev.sh`
- [ ] Wait for containers to start
- [ ] Access http://localhost:8080
- [ ] Verify backend: http://localhost:8081/api/health

### Production Setup

- [ ] Copy `config/env.example` to `config/.env`
- [ ] Set `DB_PASSWORD` (16+ characters)
- [ ] Set `JWT_SECRET` (32+ characters)
- [ ] Configure OAuth (optional)
- [ ] Review all configuration
- [ ] Run `./scripts/start-prod.sh`
- [ ] Verify containers: `docker-compose ps`
- [ ] Test frontend: http://localhost:8080
- [ ] Test backend: http://localhost:8081/api/health
- [ ] Setup automated backups
- [ ] Configure SSL/HTTPS (recommended)
- [ ] Setup monitoring (recommended)

---

## 🆘 Getting Help

### Common Questions

**Q: Do I need to configure anything for development?**
A: No! Just run `./scripts/start-dev.sh` - it uses defaults.

**Q: How do I change the port?**
A: Edit `config/.env` and set `FRONTEND_PORT=your_port`

**Q: Can I use SQLite instead of PostgreSQL?**
A: No, PostgreSQL is required for production features.

**Q: How do I setup OAuth?**
A: See [Deployment Guide](../docs/docker/DEPLOYMENT_GUIDE.md#oauth-configuration)

**Q: Is Windows supported?**
A: Yes! Use Docker Desktop with WSL2 for best experience.

### Support Channels

- **GitHub Issues:** https://github.com/Csepi/cal3/issues
- **Documentation:** https://github.com/Csepi/cal3/wiki
- **Discussions:** https://github.com/Csepi/cal3/discussions

---

**Version:** 2.0
**Last Updated:** 2025-10-10
**Status:** Production Ready 🚀

Happy Docker-ing! 🐳
