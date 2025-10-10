# Cal3 Docker Deployment Guide

Complete Docker setup for deploying Cal3 Calendar Application on Azure, Synology, or any Docker-compatible platform.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Directory Structure](#directory-structure)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Usage](#usage)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Development Environment

```bash
# 1. Copy environment template
cp docker/.env.example .env

# 2. Start development environment
cd docker
./scripts/start-dev.sh

# 3. Access application
# Frontend: http://localhost:8080
# Backend: http://localhost:8081
# API Docs: http://localhost:8081/api/docs
```

### Production Environment

```bash
# 1. Copy and configure environment
cp docker/.env.example .env
nano .env  # Update with production values

# 2. Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET

# 3. Start production environment
cd docker
./scripts/start-prod.sh
```

## 📦 Prerequisites

### Software Requirements

- **Docker**: v24.0 or higher
- **Docker Compose**: v2.20 or higher
- **Git**: For cloning repository

Install Docker:
```bash
# Linux
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify installation
docker --version
docker-compose --version
```

### System Requirements

**Development:**
- RAM: 4GB minimum, 8GB recommended
- Disk: 10GB free space
- CPU: 2 cores minimum

**Production:**
- RAM: 8GB minimum, 16GB recommended
- Disk: 50GB+ for data persistence
- CPU: 4 cores minimum

## 📁 Directory Structure

```
docker/
├── Dockerfile.backend           # Production backend build
├── Dockerfile.backend.dev       # Development backend
├── Dockerfile.frontend          # Production frontend build
├── Dockerfile.frontend.dev      # Development frontend
├── docker-compose.yml           # Production compose
├── docker-compose.dev.yml       # Development compose
├── .env.example                 # Environment template
├── .dockerignore.backend        # Backend ignore rules
├── .dockerignore.frontend       # Frontend ignore rules
├── nginx/
│   ├── nginx.conf              # Main nginx config
│   └── default.conf            # Server config
├── scripts/
│   ├── start-dev.sh            # Start development
│   ├── start-prod.sh           # Start production
│   ├── stop.sh                 # Stop containers
│   ├── db-backup.sh            # Backup database
│   ├── db-restore.sh           # Restore database
│   └── init-db.sh              # Initialize database
└── README.md                    # This file
```

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

#### Required Variables

```bash
# Database
DB_USERNAME=cal3_user
DB_PASSWORD=your-strong-password-here
DB_NAME=cal3_production

# Security (32+ characters)
JWT_SECRET=your-super-secret-jwt-key-change-this
```

#### Optional Variables

```bash
# Application
FRONTEND_PORT=8080
FRONTEND_URL=http://localhost:8080
API_URL=http://localhost:8081

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8081/api/auth/google/callback

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:8081/api/auth/microsoft/callback
MICROSOFT_TENANT_ID=common
```

### Generate Secure Secrets

```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Database Password (24+ characters)
openssl rand -base64 24
```

## 🚢 Deployment

### Azure Container Instances

1. **Build and push images:**
```bash
# Login to Azure Container Registry
az acr login --name yourregistry

# Build images
docker build -f docker/Dockerfile.backend -t yourregistry.azurecr.io/cal3-backend:latest .
docker build -f docker/Dockerfile.frontend -t yourregistry.azurecr.io/cal3-frontend:latest .

# Push images
docker push yourregistry.azurecr.io/cal3-backend:latest
docker push yourregistry.azurecr.io/cal3-frontend:latest
```

2. **Deploy with Azure CLI:**
```bash
# Create resource group
az group create --name cal3-rg --location eastus

# Deploy containers
az container create \
  --resource-group cal3-rg \
  --name cal3-app \
  --image yourregistry.azurecr.io/cal3-frontend:latest \
  --dns-name-label cal3-app \
  --ports 80
```

### Synology NAS Docker

1. **Copy files to NAS:**
```bash
# Upload docker folder to /volume1/docker/cal3/
```

2. **Configure through Docker UI:**
- Open Docker app
- Go to "Image" → "Add" → "From File"
- Import docker-compose.yml
- Configure environment variables
- Launch containers

3. **Or use SSH:**
```bash
ssh admin@your-nas-ip
cd /volume1/docker/cal3/docker
./scripts/start-prod.sh
```

### Generic Docker Host

```bash
# Clone repository
git clone https://github.com/your-org/cal3.git
cd cal3

# Configure environment
cp docker/.env.example .env
nano .env

# Start services
cd docker
./scripts/start-prod.sh
```

## 📖 Usage

### Common Commands

#### Development

```bash
# Start
cd docker && ./scripts/start-dev.sh

# Stop
./scripts/stop.sh

# View logs
docker-compose -f docker-compose.dev.yml logs -f [service]

# Restart service
docker-compose -f docker-compose.dev.yml restart backend

# Shell access
docker exec -it cal3-backend-dev sh
docker exec -it cal3-frontend-dev sh

# Database access
docker exec -it cal3-postgres-dev psql -U postgres -d cal3_dev
```

#### Production

```bash
# Start
cd docker && ./scripts/start-prod.sh

# Stop
docker-compose down

# View logs
docker-compose logs -f [service]

# Restart service
docker-compose restart backend

# Update application
git pull
docker-compose up --build -d
```

### Database Operations

```bash
# Backup
./scripts/db-backup.sh

# Restore
./scripts/db-restore.sh ./backups/cal3_backup_20250110_120000.sql.gz

# Access database
docker exec -it cal3-postgres psql -U cal3_user -d cal3_production
```

### Health Checks

```bash
# Backend
curl http://localhost:8081/api/health

# Frontend
curl http://localhost:8080/health

# Database
docker exec cal3-postgres pg_isready -U cal3_user

# Container status
docker-compose ps
```

## 🔧 Maintenance

### Updates

```bash
# Pull latest code
git pull origin main

# Backup database first!
cd docker && ./scripts/db-backup.sh

# Rebuild and restart
docker-compose up --build -d

# Verify
docker-compose ps
docker-compose logs -f --tail=50
```

### Automated Backups

Set up daily backups with cron:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/cal3/docker && ./scripts/db-backup.sh >> /var/log/cal3-backup.log 2>&1
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Cleanup unused resources
docker system prune -a
```

## 🔍 Troubleshooting

### Containers Won't Start

```bash
# Check logs
docker-compose logs [service]

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues

```bash
# Check if PostgreSQL is healthy
docker-compose ps postgres

# Test connection
docker exec cal3-backend nc -zv postgres 5432

# Check database logs
docker-compose logs postgres
```

### Frontend Can't Reach Backend

```bash
# Check backend health
curl http://localhost:8081/api/health

# Check from frontend container
docker-compose exec frontend wget -O- http://backend:8081/api/health

# Restart services
docker-compose restart backend frontend
```

### Hot Reload Not Working (Development)

```bash
# Check volume mounts
docker-compose -f docker-compose.dev.yml config

# Rebuild
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

### Out of Memory/Disk Space

```bash
# Check disk usage
docker system df

# Clean up
docker system prune -a --volumes

# Check container resources
docker stats
```

## 🔒 Security Best Practices

1. **Never commit .env files** - Use .env.example as template
2. **Use strong passwords** - Minimum 16 characters
3. **Rotate secrets regularly** - Every 90 days for JWT
4. **Keep images updated** - Run `docker-compose pull` weekly
5. **Limit port exposure** - Bind to 127.0.0.1 in production
6. **Enable firewall** - Restrict access to necessary ports
7. **Regular backups** - Automated daily backups
8. **Use HTTPS** - Configure reverse proxy with SSL/TLS

## 📊 Port Reference

| Service | Development | Production | Description |
|---------|------------|------------|-------------|
| Frontend | 8080 | 8080 | React app (Nginx) |
| Backend | 8081 | 127.0.0.1:8081 | NestJS API |
| PostgreSQL | 5432 | 127.0.0.1:5432 | Database |

## 🔗 Additional Resources

- [Main Documentation](../README.md)
- [API Documentation](../API_DOCUMENTATION.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Setup Guide](../setup-guide.md)

## 📝 Production Checklist

Before deploying to production:

- [ ] .env configured with production values
- [ ] JWT_SECRET is strong (32+ chars) and unique
- [ ] Database credentials are secure (16+ chars)
- [ ] OAuth credentials configured (if using)
- [ ] Firewall rules configured
- [ ] Backup script tested
- [ ] SSL/TLS certificates configured (if needed)
- [ ] Resource limits reviewed
- [ ] Log rotation configured
- [ ] Monitoring setup

## 🆘 Support

For issues and questions:
- GitHub Issues: https://github.com/your-org/cal3/issues
- Documentation: https://github.com/your-org/cal3/wiki

---

**Version:** 1.0
**Last Updated:** 2025-10-10
**Maintained By:** Cal3 Development Team
