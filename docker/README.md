# Cal3 Docker Quick Reference

All comprehensive Docker documentation has been moved to `docs/docker/` for better organization.

## 📚 Documentation

- **[Deployment Guide](../docs/docker/README.md)** - Complete deployment instructions
- **[CI/CD Setup](../docs/docker/CI_CD_SETUP.md)** - Automatic deployment pipeline
- **[Deployment Plan](../docs/docker/DOCKER_DEPLOYMENT_PLAN.md)** - Detailed implementation plan
- **[Implementation Summary](../docs/docker/IMPLEMENTATION_SUMMARY.md)** - Overview of what was built

## 🚀 Quick Start

### Development
```bash
cd docker
./scripts/start-dev.sh
```
Access at: http://localhost:8080

### Production
```bash
cp docker/.env.example .env
# Edit .env with your settings
cd docker
./scripts/start-prod.sh
```

## 📁 Files in This Directory

### Dockerfiles
- `Dockerfile.backend` - Production backend build
- `Dockerfile.backend.dev` - Development backend
- `Dockerfile.frontend` - Production frontend build
- `Dockerfile.frontend.dev` - Development frontend

### Docker Compose
- `docker-compose.yml` - Production environment
- `docker-compose.dev.yml` - Development environment

### Configuration
- `.env.example` - Environment variables template
- `.dockerignore.backend` - Backend build exclusions
- `.dockerignore.frontend` - Frontend build exclusions

### Nginx
- `nginx/nginx.conf` - Main nginx configuration
- `nginx/default.conf` - Server configuration with API proxy

### Scripts
- `scripts/start-dev.sh` - Start development environment
- `scripts/start-prod.sh` - Start production environment
- `scripts/stop.sh` - Stop all containers
- `scripts/db-backup.sh` - Backup database
- `scripts/db-restore.sh` - Restore database
- `scripts/init-db.sh` - Initialize database
- `scripts/auto-deploy.sh` - Auto-deployment script
- `scripts/webhook-receiver.js` - Webhook server for CI/CD
- `scripts/setup-webhook.sh` - Setup webhook receiver
- `scripts/cal3-webhook.service` - Systemd service file
- `scripts/ecosystem.config.js` - PM2 configuration

## 🔗 Learn More

See [docs/docker/README.md](../docs/docker/README.md) for comprehensive documentation including:
- Prerequisites and system requirements
- Detailed configuration guide
- Azure and Synology deployment
- Security best practices
- Troubleshooting guide
- Maintenance procedures

For automatic deployment setup, see [docs/docker/CI_CD_SETUP.md](../docs/docker/CI_CD_SETUP.md)
