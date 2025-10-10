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

### 3️⃣ Auto-Deploy Pipeline (30 minutes)

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
