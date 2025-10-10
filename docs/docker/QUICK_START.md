# Quick Start Guide

Get Cal3 up and running with Docker in minutes!

---

## 🎯 Choose Your Path

### 1️⃣ Local Development (5 minutes)

Perfect for: Testing features, development

```bash
cd docker
./scripts/start-dev.sh
```

✅ Access: http://localhost:8080
✅ Hot-reload enabled
✅ Dev database included

### 2️⃣ Production Deployment (15 minutes)

Perfect for: Running on a server, production use

```bash
# Configure
cp docker/.env.example .env
nano .env  # Update values

# Deploy
cd docker
./scripts/start-prod.sh
```

✅ Optimized builds
✅ Resource limits
✅ Health checks

### 3️⃣ Portainer Deployment (10 minutes)

Perfect for: Web UI management, no command-line experience needed

**Using Portainer web interface:**

1. Install Portainer (if not already installed):
   ```bash
   docker volume create portainer_data
   docker run -d -p 9443:9443 -p 9000:9000 --name portainer --restart=always \
     -v /var/run/docker.sock:/var/run/docker.sock \
     -v portainer_data:/data \
     portainer/portainer-ce:latest
   ```

2. Open Portainer: https://localhost:9443

3. Deploy Cal3:
   - Stacks → Add stack
   - Name: `cal3`
   - Repository: `https://github.com/Csepi/cal3.git`
   - Branch: `main`
   - **Compose path: `docker/docker-compose.portainer-local.yml`** ⭐
   - Add environment variables (DB_USERNAME, DB_PASSWORD, JWT_SECRET, etc.)
   - Deploy!

✅ Web-based management
✅ No ghcr.io access needed
✅ Visual monitoring

### 4️⃣ Auto-Deploy Pipeline (30 minutes)

Perfect for: Continuous deployment, team workflows

**Setup once, deploy forever!**

See [CI/CD Setup Guide](CI_CD_SETUP.md) for complete instructions.

**Result:** Push code → Containers update automatically! 🎉

---

## 📚 Next Steps

- **Learn more:** [Full Documentation](README.md)
- **Configure OAuth:** [Deployment Guide](DEPLOYMENT_GUIDE.md#oauth-configuration)
- **Setup backups:** [Maintenance Guide](DEPLOYMENT_GUIDE.md#maintenance)
- **Enable CI/CD:** [CI/CD Setup](CI_CD_SETUP.md)

---

## 🆘 Need Help?

**Something not working?**
- [Troubleshooting Guide](DEPLOYMENT_GUIDE.md#troubleshooting)
- [Common Issues](CI_CD_SETUP.md#troubleshooting)

**Have questions?**
- Check [Full Documentation](README.md)
- Open a GitHub issue

---

**Ready to start?** Pick your path above! 🚀
