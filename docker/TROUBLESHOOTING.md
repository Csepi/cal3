# 🔧 Docker Deployment Troubleshooting Guide

## Common Issues and Solutions

### Issue: "cal3-backend is unhealthy" - Container Health Check Failure

**Symptom:**
```
Failed to deploy a stack: compose up operation failed:
dependency failed to start: container cal3-backend is unhealthy
```

**Root Causes:**

#### 1. Health Check Port Mismatch (FIXED)
**Problem:** Health check was hardcoded to port 8081, but your BACKEND_PORT is different.

**Solution:** ✅ Fixed in commit - health checks now use environment variables.

**Verify the fix:**
```bash
docker logs cal3-backend
# Should show: 🚀 Application is running on: http://localhost:YOUR_PORT
```

#### 2. Missing Environment Variables

**Problem:** Required environment variables not set.

**Required Variables:**
```bash
DB_USERNAME=cal3_user
DB_PASSWORD=your_password
DB_NAME=cal3_production
JWT_SECRET=your_32_char_secret
```

**Check in Portainer:**
1. Go to **Stacks** → **cal3** → **Environment variables**
2. Verify all required variables are set
3. Check for typos

#### 3. Database Connection Failure

**Problem:** Backend can't connect to PostgreSQL.

**Check database logs:**
```bash
docker logs cal3-postgres
```

**Common causes:**
- PostgreSQL still initializing (wait 30-60 seconds)
- Wrong DB_PASSWORD
- Database user doesn't exist

**Solution:**
```bash
# Restart the stack
docker-compose down
docker-compose up -d

# Check postgres is healthy first
docker ps
# cal3-postgres should show "healthy"
```

#### 4. Port Already in Use

**Problem:** Ports 8080 or 8081 already occupied.

**Check:**
```bash
# Windows
netstat -ano | findstr :8080
netstat -ano | findstr :8081

# Linux/Mac
lsof -ti:8080
lsof -ti:8081
```

**Solution:** Use custom ports
```bash
# In Portainer environment variables:
FRONTEND_PORT=9000
BACKEND_PORT=9001
BASE_URL=http://localhost
```

---

## Diagnostic Commands

### Check Container Status

```bash
# List all containers
docker ps -a

# Should see:
# cal3-postgres   healthy
# cal3-backend    healthy
# cal3-frontend   running
```

### Check Container Logs

```bash
# Backend logs
docker logs cal3-backend

# PostgreSQL logs
docker logs cal3-postgres

# Frontend logs
docker logs cal3-frontend

# Follow logs in real-time
docker logs -f cal3-backend
```

### Check Health Status

```bash
# Manually test backend health
docker exec cal3-backend curl http://localhost:8081/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Check Environment Variables

```bash
# View backend environment
docker exec cal3-backend env | grep -E "PORT|BASE_URL|DB_"

# Should show:
# BASE_URL=http://localhost
# PORT=8081
# BACKEND_PORT=8081
# DB_HOST=postgres
# etc.
```

### Check Network Connectivity

```bash
# Check if backend can reach postgres
docker exec cal3-backend ping -c 3 postgres

# Check if containers are on same network
docker network inspect cal3-network
```

---

## Step-by-Step Diagnosis

### Step 1: Check PostgreSQL

```bash
docker ps | grep postgres
# Should show "healthy" status

docker logs cal3-postgres | tail -20
# Should show: "database system is ready to accept connections"
```

**If postgres is unhealthy:**
```bash
docker logs cal3-postgres
# Look for errors like:
# - "FATAL: password authentication failed"
# - "role does not exist"
# - "could not bind"
```

### Step 2: Check Backend Startup

```bash
docker logs cal3-backend

# Look for:
✅ Good signs:
- "🚀 Application is running on: http://localhost:8081"
- "🔗 CORS enabled for: http://localhost:8080"
- "TypeOrmModule dependencies initialized"

❌ Bad signs:
- "Error: connect ECONNREFUSED" (can't reach postgres)
- "Invalid JWT secret" (JWT_SECRET too short)
- "Port 8081 already in use"
- "Unhealthy" or container exits immediately
```

### Step 3: Test Health Endpoint

```bash
# From host
curl http://localhost:8081/api/health

# From inside container
docker exec cal3-backend sh -c 'curl http://localhost:8081/api/health'

# Expected: {"status":"ok","timestamp":"2025-10-12T..."}
```

### Step 4: Check Port Configuration

```bash
# View what ports are mapped
docker port cal3-backend

# Should show:
# 8081/tcp -> 127.0.0.1:8081
# (or your custom BACKEND_PORT)
```

---

## Common Error Messages

### "ECONNREFUSED" in Backend Logs

**Full error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Cause:** Backend can't connect to PostgreSQL.

**Solutions:**
1. Wait 30 seconds for postgres to fully initialize
2. Check `DB_HOST` is set to `postgres` (not `localhost`)
3. Verify postgres container is healthy: `docker ps`
4. Check postgres logs: `docker logs cal3-postgres`

### "JWT secret must be at least 32 characters"

**Cause:** JWT_SECRET too short.

**Solution:**
```bash
# Generate secure secret
openssl rand -base64 32

# Add to Portainer environment variables
JWT_SECRET=<generated_secret>
```

### "Port 8081 already in use"

**Cause:** Another service using the port.

**Solutions:**
1. Stop conflicting service
2. Use custom port:
   ```bash
   BACKEND_PORT=8082
   BASE_URL=http://localhost
   ```

### "role 'cal3_user' does not exist"

**Cause:** Database user not created.

**Solution:**
```bash
# Recreate postgres with proper initialization
docker-compose down -v  # WARNING: Deletes data!
docker-compose up -d postgres

# Wait for postgres to be healthy
docker logs -f cal3-postgres
# Look for: "database system is ready"
```

---

## Portainer-Specific Issues

### Stack Won't Deploy

**Check 1: Compose file path**
- Must be: `docker/docker-compose.portainer-local.yml`
- Not: `docker-compose.yml` or `docker-compose.portainer.yml`

**Check 2: Environment variables**
- Click **Show advanced options**
- Verify all required variables set
- No typos in variable names

**Check 3: Repository access**
- If using Git sync, check repository is accessible
- Branch should be `main`
- Path should be `docker/docker-compose.portainer-local.yml`

### "build context error"

**Cause:** Portainer can't access Docker build context.

**Solution:** Use `docker-compose.portainer-local.yml` which builds from local context, not `docker-compose.portainer.yml` which tries to pull from ghcr.io.

---

## Recovery Procedures

### Full Reset (Nuclear Option)

**⚠️ WARNING: This deletes all data!**

```bash
# Stop and remove everything
docker-compose down -v

# Remove dangling images
docker image prune -a

# Start fresh
docker-compose up -d
```

### Partial Reset (Keep Data)

```bash
# Stop containers
docker-compose down

# Clear container cache but keep volumes
docker-compose build --no-cache

# Restart
docker-compose up -d
```

### Backend Only Reset

```bash
# Rebuild just backend
docker-compose up -d --build --force-recreate backend

# Or in Portainer:
# Stacks → cal3 → Editor → Deploy
```

---

## Verification Checklist

After deployment, verify:

- [ ] **PostgreSQL**: `docker ps` shows `cal3-postgres (healthy)`
- [ ] **Backend**: `docker ps` shows `cal3-backend (healthy)`
- [ ] **Frontend**: `docker ps` shows `cal3-frontend (Up)`
- [ ] **Backend logs**: `docker logs cal3-backend` shows "🚀 Application is running"
- [ ] **Health endpoint**: `curl http://localhost:8081/api/health` returns `{"status":"ok"}`
- [ ] **Frontend accessible**: Open `http://localhost:8080` in browser
- [ ] **API docs**: Open `http://localhost:8081/api/docs` in browser

---

## Getting More Information

### Export Full Logs

```bash
# Export all logs to files
docker logs cal3-postgres > postgres.log 2>&1
docker logs cal3-backend > backend.log 2>&1
docker logs cal3-frontend > frontend.log 2>&1

# In Portainer:
# Containers → cal3-backend → Logs → Download
```

### Container Inspection

```bash
# Full container details
docker inspect cal3-backend

# Check specific details
docker inspect --format='{{.State.Health}}' cal3-backend
docker inspect --format='{{.Config.Env}}' cal3-backend
```

### Network Debugging

```bash
# Check DNS resolution
docker exec cal3-backend nslookup postgres

# Check connectivity
docker exec cal3-backend nc -zv postgres 5432

# List all networks
docker network ls

# Inspect cal3 network
docker network inspect cal3-network
```

---

## Contact / Support

If you've tried all troubleshooting steps and still have issues:

1. **Collect diagnostics:**
   ```bash
   docker ps -a > container-status.txt
   docker logs cal3-backend > backend-logs.txt
   docker logs cal3-postgres > postgres-logs.txt
   docker inspect cal3-backend > backend-inspect.txt
   ```

2. **Check documentation:**
   - [CONFIGURATION_GUIDE.md](../CONFIGURATION_GUIDE.md)
   - [docker/README.md](README.md)
   - [PORTAINER_GUIDE.md](PORTAINER_GUIDE.md)

3. **GitHub Issues:**
   - https://github.com/Csepi/cal3/issues
   - Include logs and environment details (redact passwords!)

---

## Quick Reference

### Healthy Stack

```bash
$ docker ps
CONTAINER ID   IMAGE            STATUS
abc123         cal3-frontend    Up 2 minutes
def456         cal3-backend     Up 2 minutes (healthy)
ghi789         postgres:15      Up 2 minutes (healthy)

$ curl http://localhost:8081/api/health
{"status":"ok","timestamp":"2025-10-12T..."}

$ curl http://localhost:8080
<!doctype html>... (HTML returned)
```

### Unhealthy Stack

```bash
$ docker ps
CONTAINER ID   IMAGE            STATUS
abc123         cal3-frontend    Exited (1) 30 seconds ago
def456         cal3-backend     Up 2 minutes (unhealthy)
ghi789         postgres:15      Up 2 minutes (healthy)

# Check backend logs immediately
$ docker logs cal3-backend
```

---

**Remember:** The most common issue is missing or incorrect environment variables. Always check those first!
