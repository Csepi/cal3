# Cal3 Docker Documentation

Complete Docker deployment and CI/CD documentation for the Cal3 Calendar Application.

---

## 📚 Documentation Index

### Getting Started

**[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Start here!
- Quick start instructions
- Prerequisites and system requirements
- Configuration guide
- Production deployment steps
- Azure, Synology, and generic Docker deployments
- Troubleshooting and maintenance

**[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Overview
- What was built and why
- Architecture diagram
- File structure
- Key features
- Quick reference

### CI/CD & Automation

**[CI/CD Setup Guide](CI_CD_SETUP.md)** - Automatic deployments
- Complete pipeline setup (GitHub Actions → Webhooks → Auto Deploy)
- Step-by-step configuration
- Webhook receiver installation
- Security best practices
- Monitoring and troubleshooting
- Advanced configurations

### Reference

**[Docker Deployment Plan](DOCKER_DEPLOYMENT_PLAN.md)** - Technical details
- Complete implementation plan
- Detailed architecture
- All Docker configurations
- Scripts and utilities
- Production checklist

---

## 🚀 Quick Start

### For Development

```bash
# From project root
cd docker
./scripts/start-dev.sh

# Access application
# Frontend: http://localhost:8080
# Backend:  http://localhost:8081
# API Docs: http://localhost:8081/api/docs
```

### For Production

```bash
# 1. Configure environment
cp docker/.env.example .env
nano .env  # Update with production values

# 2. Generate secrets
openssl rand -base64 32  # For JWT_SECRET

# 3. Deploy
cd docker
./scripts/start-prod.sh
```

### For CI/CD (Automatic Deployment)

See **[CI/CD Setup Guide](CI_CD_SETUP.md)** for complete instructions.

**Quick overview:**
1. Configure GitHub secrets (webhook URL + secret)
2. Install webhook receiver on server
3. Push code to GitHub
4. Containers update automatically! 🎉

---

## 📁 What's in the Docker Directory

```
docker/
├── Dockerfile.backend           # Production backend
├── Dockerfile.backend.dev       # Development backend
├── Dockerfile.frontend          # Production frontend
├── Dockerfile.frontend.dev      # Development frontend
├── docker-compose.yml           # Production compose
├── docker-compose.dev.yml       # Development compose
├── .env.example                 # Environment template
├── nginx/
│   ├── nginx.conf              # Main nginx config
│   └── default.conf            # Server config
└── scripts/
    ├── start-dev.sh            # Start development
    ├── start-prod.sh           # Start production
    ├── stop.sh                 # Stop containers
    ├── db-backup.sh            # Backup database
    ├── db-restore.sh           # Restore database
    ├── auto-deploy.sh          # Auto-deployment
    ├── webhook-receiver.js     # Webhook server
    └── setup-webhook.sh        # Webhook setup
```

---

## 🎯 Common Tasks

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Database Backup
```bash
cd docker
./scripts/db-backup.sh
```

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
cd docker
docker-compose up --build -d
```

### Health Checks
```bash
# Backend
curl http://localhost:8081/api/health

# Frontend
curl http://localhost:8080/health

# Database
docker exec cal3-postgres pg_isready -U cal3_user
```

---

## 🏗️ Architecture

### Container Structure

```
┌─────────────────────────────────────────────────────────┐
│              Docker Network (cal3-network)              │
│                                                          │
│  ┌──────────────┐      ┌──────────────┐      ┌────────┐│
│  │   Frontend   │─────►│   Backend    │─────►│ PostgreSQL
│  │ React+Nginx  │      │   NestJS     │      │    15    │
│  │   Port: 80   │      │  Port: 8081  │      │Port: 5432│
│  └──────────────┘      └──────────────┘      └────────┘│
│         │                     │                     │   │
└─────────┼─────────────────────┼─────────────────────┼───┘
          │                     │                     │
          ▼                     ▼                     ▼
    Host: 8080            Host: 8081            Host: 5432
```

### CI/CD Pipeline (Option B)

```
Push Code → GitHub Actions → Build Images → Push to Registry
                                                    │
                                                    ▼
Server Updates ← Restart Containers ← Pull Images ← Webhook
```

---

## 🔒 Security Features

- ✅ Non-root users in containers
- ✅ Resource limits configured
- ✅ Health checks for all services
- ✅ Security headers in Nginx
- ✅ Webhook signature verification
- ✅ Environment variable validation
- ✅ Firewall configuration guides
- ✅ HTTPS support ready

---

## 🆘 Need Help?

### Documentation
- **General questions**: Start with [Deployment Guide](DEPLOYMENT_GUIDE.md)
- **Auto-deployment**: See [CI/CD Setup](CI_CD_SETUP.md)
- **Technical details**: Check [Deployment Plan](DOCKER_DEPLOYMENT_PLAN.md)

### Troubleshooting
Each guide has a dedicated troubleshooting section:
- Deployment issues → [Deployment Guide](DEPLOYMENT_GUIDE.md#troubleshooting)
- CI/CD issues → [CI/CD Setup](CI_CD_SETUP.md#troubleshooting)

### Common Issues

**Containers won't start:**
```bash
docker-compose logs
docker-compose down -v
docker-compose up -d --build
```

**Database connection failed:**
```bash
docker-compose ps postgres
docker-compose logs postgres
```

**Webhook not working:**
```bash
# Check webhook receiver
curl http://localhost:3001/health

# Check logs
sudo journalctl -u cal3-webhook -f  # systemd
pm2 logs cal3-webhook              # PM2
```

---

## 📊 Monitoring

### Container Status
```bash
docker-compose ps
docker stats
```

### Resource Usage
```bash
docker system df
```

### Logs
```bash
# Follow all logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100
```

---

## 🔄 Updates & Maintenance

### Manual Update
```bash
git pull
cd docker
docker-compose up --build -d
```

### Automatic Update (with CI/CD)
```bash
# Just push code!
git push origin main

# Everything updates automatically
```

### Cleanup
```bash
# Remove unused images
docker image prune -a

# Full cleanup (careful!)
docker system prune -a --volumes
```

---

## 📝 Environment Variables

### Required
- `DB_USERNAME` - Database user
- `DB_PASSWORD` - Database password (16+ chars)
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT signing key (32+ chars)

### Optional
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` - Microsoft OAuth
- `FRONTEND_PORT` - Frontend port (default: 8080)
- `GITHUB_USERNAME` / `GITHUB_TOKEN` - For auto-deployment

See `.env.example` for complete list.

---

## 🎓 Learn More

### External Resources
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Nginx Documentation](https://nginx.org/en/docs/)

### Cal3 Documentation
- [Main README](../../README.md)
- [API Documentation](../../API_DOCUMENTATION.md)
- [Setup Guide](../../setup-guide.md)

---

## ✅ Production Checklist

Before going live:

- [ ] `.env` configured with production values
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] Database credentials are secure (16+ chars)
- [ ] OAuth credentials configured (if using)
- [ ] Firewall rules configured
- [ ] Backup script tested
- [ ] SSL/TLS certificates configured
- [ ] Monitoring setup
- [ ] CI/CD pipeline tested (optional)
- [ ] Resource limits reviewed
- [ ] Log rotation configured

---

**Version:** 1.1
**Last Updated:** 2025-10-10
**Status:** Production Ready 🚀

For questions or issues, please check the documentation or open a GitHub issue.
