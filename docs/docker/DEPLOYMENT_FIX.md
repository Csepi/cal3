# Deployment Error Fix Guide

## Error
```
Failed to deploy a stack: compose up operation failed:
Error response from daemon: Head "https://ghcr.io/v2/csepi/cal3-backend/manifests/latest": denied
```

## Problem
The `docker-compose.portainer.yml` file references Docker images from GitHub Container Registry (ghcr.io):
- `ghcr.io/csepi/cal3-backend:latest`
- `ghcr.io/csepi/cal3-frontend:latest`

These images are either:
1. Not yet built and pushed to ghcr.io
2. Private and require authentication
3. The repository visibility doesn't allow public access

## Solutions

### **Option 1: Use Local Build (Recommended - Immediate Fix)**

Use the new `docker-compose.portainer-local.yml` which builds images locally:

#### In Portainer:
1. Go to **Stacks** → Select your stack → **Editor**
2. Change the compose file to use: `docker/docker-compose.portainer-local.yml`
3. Or replace the content with the local build version
4. Click **Update the stack**

#### Via Command Line:
```bash
cd docker
docker-compose -f docker-compose.portainer-local.yml up -d --build
```

This will build the images from source on your machine.

---

### **Option 2: Build and Push Images to GitHub Container Registry**

If you want to use pre-built images from ghcr.io:

#### Step 1: Authenticate with ghcr.io
```bash
# Create a GitHub Personal Access Token (PAT) with `write:packages` permission
# Go to: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)

# Login to ghcr.io
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

#### Step 2: Build and Push Images Manually
```bash
cd docker

# Build backend
docker build -f Dockerfile.backend -t ghcr.io/csepi/cal3-backend:latest ..
docker push ghcr.io/csepi/cal3-backend:latest

# Build frontend
docker build -f Dockerfile.frontend -t ghcr.io/csepi/cal3-frontend:latest ..
docker push ghcr.io/csepi/cal3-frontend:latest
```

#### Step 3: Make Images Public (Optional)
1. Go to https://github.com/csepi?tab=packages
2. Find `cal3-backend` and `cal3-frontend` packages
3. Click on each → **Package settings** → **Change visibility** → **Public**

#### Step 4: Use GitHub Actions (Automated)
The project has a GitHub Action workflow that automatically builds and pushes images:
- File: `.github/workflows/docker-deploy.yml`
- Triggers on push to `main` or `Docker` branch
- Builds both backend and frontend images
- Pushes to ghcr.io with tags

To trigger it:
```bash
git add .
git commit -m "Trigger Docker image build"
git push origin main
```

---

### **Option 3: Use Regular docker-compose.yml (Development)**

For local development, use the standard compose file:

```bash
cd docker
docker-compose up -d --build
```

This is the same as the production setup but with config files mounted.

---

## Environment Variables Required

Ensure you have these set in Portainer or in `.env` file:

```env
# Database
DB_USERNAME=cal3_user
DB_PASSWORD=your-secure-password-here
DB_NAME=cal3_production

# Application
JWT_SECRET=your-32-char-random-secret
FRONTEND_PORT=8080
FRONTEND_URL=http://localhost:8080

# Optional OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_CALLBACK_URL=
```

---

## Quick Reference

### Files Overview
- `docker-compose.yml` - Production with local build
- `docker-compose.portainer.yml` - Uses pre-built ghcr.io images (requires authentication)
- `docker-compose.portainer-local.yml` - **NEW** - Portainer-optimized with local build
- `docker-compose.dev.yml` - Development with hot reload

### Recommended for Different Scenarios

| Scenario | File to Use | Command |
|----------|-------------|---------|
| **Portainer (no ghcr.io access)** | `portainer-local.yml` | Use in Portainer stack |
| **Local development** | `docker-compose.yml` | `docker-compose up -d --build` |
| **Production with CI/CD** | `portainer.yml` | After GitHub Actions build |
| **Development with hot reload** | `docker-compose.dev.yml` | `docker-compose -f docker-compose.dev.yml up` |

---

## Troubleshooting

### Images still fail to pull?
```bash
# Check Docker login status
docker info | grep -i registry

# Re-login to ghcr.io
docker logout ghcr.io
echo "YOUR_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### Build fails locally?
```bash
# Check Docker disk space
docker system df

# Clean up if needed
docker system prune -a

# Try building with no cache
docker-compose -f docker-compose.portainer-local.yml build --no-cache
```

### Permission issues?
```bash
# On Linux/Mac, ensure proper permissions
sudo chown -R $USER:$USER ./config
chmod 600 ./config/.env
```

---

## Summary

**Immediate fix for your current error:**

Use `docker-compose.portainer-local.yml` instead of `docker-compose.portainer.yml`

This builds images locally and doesn't require GitHub Container Registry access.
