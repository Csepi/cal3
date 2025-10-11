# 🎯 Complete Portainer Deployment Guide for Cal3

**Step-by-step guide with screenshots and troubleshooting**

This guide will walk you through deploying Cal3 using Portainer's web interface, avoiding common pitfalls.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Install Portainer](#install-portainer)
3. [Deploy Cal3 Stack](#deploy-cal3-stack)
4. [Verify Deployment](#verify-deployment)
5. [Common Errors and Solutions](#common-errors-and-solutions)
6. [Management Tasks](#management-tasks)

---

## ✅ Prerequisites

Before starting, ensure you have:

- [ ] Docker installed and running
- [ ] At least 8GB RAM available
- [ ] 20GB free disk space
- [ ] Ports available: 9443 (Portainer), 8080 (Cal3 Frontend), 8081 (Cal3 Backend), 5432 (PostgreSQL)

**Verify Docker is running:**
```bash
docker ps
```
If you see a list (even empty), Docker is running. If you get an error, start Docker first.

---

## 🚀 Install Portainer

### Step 1: Install Portainer Container

**On Windows (PowerShell):**
```powershell
# Create volume for Portainer data
docker volume create portainer_data

# Run Portainer
docker run -d `
  -p 9443:9443 `
  -p 9000:9000 `
  --name portainer `
  --restart=always `
  -v //var/run/docker.sock:/var/run/docker.sock `
  -v portainer_data:/data `
  portainer/portainer-ce:latest

# Verify it's running
docker ps | Select-String portainer
```

**On Linux/Mac:**
```bash
# Create volume for Portainer data
docker volume create portainer_data

# Run Portainer
docker run -d \
  -p 9443:9443 \
  -p 9000:9000 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# Verify it's running
docker ps | grep portainer
```

**Expected output:**
```
CONTAINER ID   IMAGE                          COMMAND        STATUS          PORTS
abc123def456   portainer/portainer-ce:latest  "/portainer"   Up 10 seconds   0.0.0.0:9000->9000/tcp, 0.0.0.0:9443->9443/tcp
```

### Step 2: Access Portainer

1. Open your browser
2. Navigate to: **https://localhost:9443**
3. You'll see a security warning (this is normal for self-signed certificates)
   - Click **Advanced** → **Proceed to localhost (unsafe)**

### Step 3: Initial Setup

**First-time setup screen:**

1. **Create admin account:**
   - Username: `admin` (or your choice)
   - Password: Create a strong password (12+ characters)
   - Confirm password

2. Click **Create user**

3. **Select environment:**
   - Click **Get Started**
   - You'll see "Docker" environment
   - Click on **local** environment to manage it

✅ **Portainer is now ready!**

---

## 📦 Deploy Cal3 Stack

### Method 1: Repository Deployment (Recommended)

This method uses the Git repository directly and is the easiest.

#### Step 1: Create Stack

1. In Portainer, click **Stacks** in the left menu
2. Click **+ Add stack** button (top right)

#### Step 2: Configure Stack

**Fill in the form:**

1. **Name:** `cal3`

2. **Build method:** Select **Repository** (radio button)

3. **Repository configuration:**
   - **Repository URL:** `https://github.com/Csepi/cal3.git`
   - **Repository reference:** `main`
   - **Compose path:** `docker/docker-compose.portainer-local.yml` ⭐ **CRITICAL - Don't use the other file!**

4. **Authentication:** Leave unchecked (public repo)

5. **Enable automatic updates:** Optional (check if you want auto-updates)

#### Step 3: Add Environment Variables

**Scroll down to "Environment variables" section**

Click **+ Add an environment variable** for each of these:

| Name | Value | Notes |
|------|-------|-------|
| `DB_USERNAME` | `cal3_user` | Database username |
| `DB_PASSWORD` | `YOUR_SECURE_PASSWORD` | ⚠️ Use strong password! |
| `DB_NAME` | `cal3_production` | Database name |
| `JWT_SECRET` | `YOUR_32_CHAR_SECRET` | ⚠️ Generate with openssl! |
| `FRONTEND_PORT` | `8080` | Port for frontend |
| `FRONTEND_URL` | `http://localhost:8080` | Frontend URL |

**Optional (OAuth integration):**
| Name | Value | Notes |
|------|-------|-------|
| `GOOGLE_CLIENT_ID` | Your Google Client ID | For Google login |
| `GOOGLE_CLIENT_SECRET` | Your Google Secret | For Google login |
| `GOOGLE_CALLBACK_URL` | `http://localhost:8081/api/auth/google/callback` | |
| `MICROSOFT_CLIENT_ID` | Your Microsoft Client ID | For Microsoft login |
| `MICROSOFT_CLIENT_SECRET` | Your Microsoft Secret | For Microsoft login |
| `MICROSOFT_CALLBACK_URL` | `http://localhost:8081/api/auth/microsoft/callback` | |

**🔐 Generate Secure Secrets:**

Run these commands in your terminal to generate secure values:

```bash
# For JWT_SECRET (32 characters)
openssl rand -base64 32

# For DB_PASSWORD (24 characters)
openssl rand -base64 24
```

Copy the output and paste into Portainer.

#### Step 4: Deploy

1. **Scroll to bottom**
2. **Don't change any other options**
3. Click **Deploy the stack** button
4. **Wait patiently** - First deployment takes 10-15 minutes

**What happens during deployment:**
```
[1/5] Cloning repository...           ✓ (30 seconds)
[2/5] Building backend image...       ✓ (5-7 minutes)
[3/5] Building frontend image...      ✓ (5-7 minutes)
[4/5] Creating network...             ✓ (5 seconds)
[5/5] Starting containers...          ✓ (30 seconds)
```

#### Step 5: Monitor Progress

1. After clicking "Deploy", you'll see the stack page
2. Click **Logs** tab to see build progress
3. Look for these success indicators:
   - `Pulling postgres (postgres:15-alpine)...`
   - `Building backend`
   - `Building frontend`
   - `Creating cal3-postgres...`
   - `Creating cal3-backend...`
   - `Creating cal3-frontend...`

---

### Method 2: Web Editor (Manual Configuration)

Use this if you can't access GitHub or prefer manual control.

#### Step 1: Create Stack

1. **Stacks** → **+ Add stack**
2. **Name:** `cal3`
3. **Build method:** Select **Web editor**

#### Step 2: Paste Compose Configuration

Copy and paste this **entire** configuration into the editor:

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
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M

  backend:
    build:
      context: https://github.com/Csepi/cal3.git#main
      dockerfile: docker/Dockerfile.backend
      args:
        NODE_ENV: production
    image: cal3-backend:local
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
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M

  frontend:
    build:
      context: https://github.com/Csepi/cal3.git#main
      dockerfile: docker/Dockerfile.frontend
      args:
        API_URL: ${API_URL:-http://localhost:8081}
    image: cal3-frontend:local
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
      - backend
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M

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

#### Step 3: Add Environment Variables

Same as Method 1 - Add all required environment variables (see table above).

#### Step 4: Deploy

Click **Deploy the stack** and wait for build to complete.

---

## ✓ Verify Deployment

### Check Container Status

1. In Portainer: **Containers** → You should see 3 running containers:
   - `cal3-postgres` (green/running)
   - `cal3-backend` (green/running)
   - `cal3-frontend` (green/running)

2. All should show status: **running**

### Access Application

1. **Frontend:** Open browser to http://localhost:8080
   - You should see the Cal3 login page

2. **Backend API:** http://localhost:8081/api/health
   - Should show: `{"status":"ok"}`

3. **API Documentation:** http://localhost:8081/api/docs
   - Should show Swagger UI

### Check Logs

If something isn't working:

1. **Containers** → Click container name → **Logs** tab
2. Look for errors in:
   - `cal3-backend` - Database connection, API startup
   - `cal3-frontend` - Nginx errors
   - `cal3-postgres` - Database initialization

---

## 🔧 Common Errors and Solutions

### Error 1: "denied: access to image ghcr.io/csepi/cal3-backend"

**Cause:** Using wrong compose file (docker-compose.portainer.yml instead of portainer-local.yml)

**Solution:**
1. Delete the stack: **Stacks** → `cal3` → **Remove**
2. Create new stack
3. **Critical:** Use compose path `docker/docker-compose.portainer-local.yml`
4. Redeploy

### Error 2: "env file /data/compose/.../config/.env not found"

**Cause:** Trying to use env file that doesn't exist in repository

**Solution:**
- Don't use compose path with `env_file` references
- Use `docker-compose.portainer-local.yml` which doesn't need env files
- Or add all variables in Portainer UI (recommended)

### Error 3: "failed to solve: failed to fetch oauth token"

**Cause:** Docker can't access GitHub to clone repository

**Solution:**
1. Check your internet connection
2. Try Method 2 (Web Editor) instead
3. Or clone repo locally and use Upload method

### Error 4: Port already in use (8080, 8081, or 5432)

**Cause:** Another service is using these ports

**Solution - Find what's using the port:**
```bash
# Windows
netstat -ano | findstr :8080

# Linux/Mac
lsof -i :8080
```

Then either:
- Stop the conflicting service
- Or change ports in environment variables:
  - `FRONTEND_PORT=8090`
  - Backend port is harder to change (requires code modification)

### Error 5: "unhealthy" status on containers

**Cause:** Database or backend not starting properly

**Solution:**
1. Check backend logs: **Containers** → `cal3-backend` → **Logs**
2. Common issues:
   - Database not ready: Wait 30-60 seconds
   - Wrong JWT_SECRET: Must be set
   - Database connection error: Check DB_* variables match

### Error 6: Frontend shows but backend API doesn't work

**Cause:** Backend crashed or can't connect to database

**Solution:**
1. Check backend logs for errors
2. Verify environment variables are correct
3. Check database is running: `docker exec -it cal3-postgres pg_isready -U cal3_user`
4. Restart backend: **Containers** → `cal3-backend` → **Restart**

### Error 7: "Cannot connect to Docker daemon"

**Cause:** Portainer can't access Docker

**Solution:**
```bash
# Check Docker socket is accessible
docker ps

# Restart Portainer
docker restart portainer

# Verify socket mount (Linux)
docker inspect portainer | grep docker.sock
```

### Error 8: Build takes too long or times out

**Cause:** Large images, slow internet, or insufficient resources

**Solution:**
1. Wait patiently (first build can take 15-20 minutes)
2. Check system resources in Portainer Dashboard
3. Close other applications to free up RAM
4. If timeout, try again - Docker will use cached layers

---

## 📊 Management Tasks

### View Logs

1. **Containers** → Click container name
2. **Logs** tab
3. Toggle **Auto-refresh logs** for real-time view
4. Use search box to filter logs

### Restart Container

1. **Containers** → Select checkbox next to container
2. Click **Restart** button
3. Or click container name → **Restart** button

### Update Application

When new code is pushed to GitHub:

1. **Stacks** → `cal3`
2. Click **Editor**
3. Click **Pull and redeploy** checkbox
4. Click **Update the stack**
5. Portainer will:
   - Pull latest code from GitHub
   - Rebuild images
   - Restart containers

### Stop/Start Stack

**Stop all Cal3 services:**
1. **Stacks** → `cal3`
2. Click **Stop** button

**Start again:**
1. **Stacks** → `cal3`
2. Click **Start** button

### Execute Commands in Container

**Access backend shell:**
1. **Containers** → `cal3-backend`
2. **Console** tab
3. Select `/bin/sh`
4. Click **Connect**
5. You now have shell access

**Useful commands:**
```bash
# Check backend status
node -v
npm list

# Check environment variables
env | grep DB_

# Test database connection
nc -zv postgres 5432
```

### Database Backup

**From Portainer:**
1. **Containers** → `cal3-postgres`
2. **Console** → `/bin/sh`
3. Run:
```bash
pg_dump -U cal3_user cal3_production > /var/lib/postgresql/data/backup_$(date +%Y%m%d).sql
```

**Or from host:**
```bash
docker exec cal3-postgres pg_dump -U cal3_user cal3_production > backup.sql
```

### View Resource Usage

1. **Containers** → Click container name
2. **Stats** tab
3. View:
   - CPU usage
   - Memory usage
   - Network I/O
   - Block I/O

### Remove Everything (Clean Slate)

**Warning: This deletes all data!**

1. **Stacks** → `cal3` → **Remove**
2. Check "Remove associated volumes" if you want to delete database data
3. Confirm

To start fresh, follow deployment steps again.

---

## 🎓 Best Practices

### Security

- ✅ Use strong passwords (generated with openssl)
- ✅ Keep JWT_SECRET secret (never commit to git)
- ✅ Use HTTPS for Portainer (port 9443)
- ✅ Enable 2FA in Portainer settings
- ✅ Regularly update Portainer: `docker pull portainer/portainer-ce:latest`

### Maintenance

- 📅 Backup database weekly
- 📅 Check logs for errors weekly
- 📅 Update application monthly
- 📅 Clean up old images: **Images** → **Unused** → **Remove**

### Performance

- 💾 Monitor disk space: **Dashboard**
- 💾 Monitor memory usage: Container **Stats**
- 💾 Increase resources if needed in compose file

---

## 🆘 Still Having Issues?

### Troubleshooting Checklist

- [ ] Docker is running: `docker ps`
- [ ] Portainer is accessible: https://localhost:9443
- [ ] Using correct compose file: `docker-compose.portainer-local.yml`
- [ ] All environment variables are set
- [ ] Secrets are generated and strong
- [ ] No port conflicts
- [ ] Enough disk space (20GB+)
- [ ] Enough RAM (8GB+)

### Get Help

1. **Check logs in Portainer:**
   - Stack deployment logs
   - Individual container logs

2. **Check Docker logs:**
   ```bash
   docker logs cal3-backend
   docker logs cal3-frontend
   docker logs cal3-postgres
   ```

3. **Check stack status:**
   ```bash
   docker ps -a
   ```

4. **Create GitHub issue:**
   - Include error messages
   - Include relevant logs
   - Describe what you tried

---

## 📚 Additional Resources

- **Main Docker Documentation:** [docker/README.md](README.md)
- **Quick Start Guide:** [docs/docker/QUICK_START.md](../docs/docker/QUICK_START.md)
- **Deployment Fix Guide:** [DEPLOYMENT_FIX.md](DEPLOYMENT_FIX.md)
- **Portainer Documentation:** https://docs.portainer.io/

---

**✨ Success!** Once deployed, you can access Cal3 at http://localhost:8080

Need to make changes? Use the Portainer interface - no command line needed!
