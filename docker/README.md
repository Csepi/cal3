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
| PostgreSQL | 5432 | localhost:5432 |
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

**Solutions:**

**Windows:**
```powershell
# Find process using port
netstat -ano | findstr :8080

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in config/.env
FRONTEND_PORT=8090
```

**Linux/Mac:**
```bash
# Find process
lsof -i :8080

# Kill process
kill -9 <PID>

# Or change port
# Edit config/.env
FRONTEND_PORT=8090
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
