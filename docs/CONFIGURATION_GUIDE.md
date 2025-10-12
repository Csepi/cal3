# 🎯 Cal3 Configuration Guide

## TL;DR - Quick Start

**Only 3 environment variables needed for port configuration:**

```bash
BASE_URL=http://localhost    # Your base domain
FRONTEND_PORT=8080           # Frontend port
BACKEND_PORT=8081            # Backend API port
```

**That's it!** All URLs are automatically constructed.

---

## Table of Contents

1. [Environment Variables Overview](#environment-variables-overview)
2. [How Smart URL Construction Works](#how-smart-url-construction-works)
3. [Configuration Examples](#configuration-examples)
4. [Docker Deployment](#docker-deployment)
5. [Local Development](#local-development)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Environment Variables Overview

### Core Configuration Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `BASE_URL` | No | `http://localhost` | Base URL for all services |
| `FRONTEND_PORT` | No | `8080` | Frontend web interface port |
| `BACKEND_PORT` | No | `8081` | Backend API port |
| `PORT` | No | Same as `BACKEND_PORT` | Alternative way to set backend port |

### Auto-Constructed URLs (Optional Overrides)

These are **automatically constructed** but can be explicitly set if needed:

| Variable | Auto-Constructed From | When to Override |
|----------|----------------------|------------------|
| `FRONTEND_URL` | `BASE_URL:FRONTEND_PORT` | Using subdomains or reverse proxy |
| `API_URL` | `BASE_URL:BACKEND_PORT` | Using subdomains or API gateway |
| `VITE_API_URL` | `BASE_URL:BACKEND_PORT` | Frontend needs different API endpoint |
| `GOOGLE_CALLBACK_URL` | `BASE_URL:BACKEND_PORT/api/auth/google/callback` | Custom OAuth setup |
| `MICROSOFT_CALLBACK_URL` | `BASE_URL:BACKEND_PORT/api/auth/microsoft/callback` | Custom OAuth setup |

### Required Application Variables

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `DB_USERNAME` | Yes | Database username | `cal3_user` |
| `DB_PASSWORD` | Yes | Database password | Use `openssl rand -base64 24` |
| `DB_NAME` | Yes | Database name | `cal3_production` |
| `JWT_SECRET` | Yes | JWT signing key | Use `openssl rand -base64 32` |

---

## How Smart URL Construction Works

### Priority Chain

The application uses this priority for determining URLs:

```
1. Explicit URL (if provided)     → Use as-is
2. BASE_URL + PORT (if BASE_URL)  → Construct URL
3. Default                        → http://localhost:{port}
```

### Example Resolution

**Configuration:**
```bash
BASE_URL=http://localhost
FRONTEND_PORT=3000
BACKEND_PORT=3001
```

**Automatically Constructed:**
```
FRONTEND_URL   = http://localhost:3000
API_URL        = http://localhost:3001
VITE_API_URL   = http://localhost:3001
CORS Origin    = http://localhost:3000
Google OAuth   = http://localhost:3001/api/auth/google/callback
Microsoft OAuth= http://localhost:3001/api/auth/microsoft/callback
```

### Code Implementation

**Backend** (main.ts):
```typescript
const backendPort = process.env.PORT || process.env.BACKEND_PORT || '8081';
const frontendPort = process.env.FRONTEND_PORT || '8080';
const baseUrl = process.env.BASE_URL || 'http://localhost';

const frontendUrl = process.env.FRONTEND_URL || `${baseUrl}:${frontendPort}`;
// Result: http://localhost:8080 (or your custom configuration)
```

**Frontend** (api.ts):
```typescript
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8081';
const API_BASE_URL = import.meta.env.VITE_API_URL || `${BASE_URL}:${BACKEND_PORT}`;
// Result: http://localhost:8081 (or your custom configuration)
```

---

## Configuration Examples

### Example 1: Default (No Configuration)

**No `.env` file needed!**

```bash
# Start backend
cd backend-nestjs && npm run start:dev
# Runs on: http://localhost:8081

# Start frontend
cd frontend && npm run dev
# Runs on: http://localhost:8080
```

### Example 2: Custom Ports (Localhost)

**`.env` or environment variables:**
```bash
BASE_URL=http://localhost
FRONTEND_PORT=3000
BACKEND_PORT=3001
```

**Result:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- CORS automatically configured for http://localhost:3000

### Example 3: Production with Domain

**`.env`:**
```bash
BASE_URL=https://mycal.com
FRONTEND_PORT=443
BACKEND_PORT=443

# Required for production
DB_USERNAME=cal3_user
DB_PASSWORD=your_secure_password
DB_NAME=cal3_production
JWT_SECRET=your_32_char_secret
```

**Result:**
- Frontend: https://mycal.com:443
- Backend: https://mycal.com:443
- OAuth callbacks: https://mycal.com:443/api/auth/*/callback

### Example 4: Subdomains (Advanced)

When using subdomains or reverse proxy, override specific URLs:

**`.env`:**
```bash
BASE_URL=https://mycal.com
FRONTEND_URL=https://app.mycal.com
API_URL=https://api.mycal.com

# OAuth needs explicit URLs in this case
GOOGLE_CALLBACK_URL=https://api.mycal.com/api/auth/google/callback
MICROSOFT_CALLBACK_URL=https://api.mycal.com/api/auth/microsoft/callback
```

---

## Docker Deployment

### Minimal Docker Configuration

**`docker/config/.env`:**
```bash
# Database (Required)
DB_USERNAME=cal3_user
DB_PASSWORD=change_me_strong_password
DB_NAME=cal3_production
JWT_SECRET=change_me_32_char_secret

# Smart Port Configuration (Optional - defaults work)
BASE_URL=http://localhost
FRONTEND_PORT=8080
BACKEND_PORT=8081
DB_PORT=5433
```

### Start Docker Containers

```bash
cd docker
docker-compose up -d
```

**Access:**
- Frontend: http://localhost:8080
- Backend: http://localhost:8081/api
- API Docs: http://localhost:8081/api/docs

### Custom Ports with Docker

**`docker/config/.env`:**
```bash
BASE_URL=http://localhost
FRONTEND_PORT=9000
BACKEND_PORT=9001
DB_PORT=5434
```

**Result:**
- Frontend: http://localhost:9000
- Backend: http://localhost:9001
- PostgreSQL: localhost:5434

---

## Local Development

### Backend Configuration

**`backend-nestjs/.env`:**
```bash
BASE_URL=http://localhost
PORT=8081                    # Or BACKEND_PORT=8081
FRONTEND_PORT=8080

DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=cal3_user
DB_PASSWORD=postgres
DB_NAME=cal3_dev
JWT_SECRET=dev-secret-key-min-32-chars
```

### Frontend Configuration

**`frontend/.env`:**
```bash
VITE_BASE_URL=http://localhost
VITE_BACKEND_PORT=8081
# Or explicitly: VITE_API_URL=http://localhost:8081
```

### Start Development Servers

```bash
# Terminal 1: Backend
cd backend-nestjs
PORT=8081 JWT_SECRET="dev-secret" npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev -- --port 8080
```

### Using Custom Development Ports

```bash
# Backend on 3001, Frontend on 3000
cd backend-nestjs
BASE_URL=http://localhost BACKEND_PORT=3001 FRONTEND_PORT=3000 PORT=3001 JWT_SECRET="dev-secret" npm run start:dev

cd frontend
VITE_BASE_URL=http://localhost VITE_BACKEND_PORT=3001 npm run dev -- --port 3000
```

---

## Production Deployment

### Production Environment Variables

**`.env` (production):**
```bash
# Base Configuration
NODE_ENV=production
BASE_URL=https://yourdomain.com

# Ports (if not using standard 80/443)
FRONTEND_PORT=443
BACKEND_PORT=443

# Database
DB_TYPE=postgres
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=cal3_prod
DB_PASSWORD=your_secure_password_here
DB_NAME=cal3_production

# Security
JWT_SECRET=your_32_char_secret_here

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-secret
```

### With Reverse Proxy (Nginx)

When using Nginx as reverse proxy:

**`.env`:**
```bash
BASE_URL=https://yourdomain.com
# No ports needed if Nginx handles SSL termination
FRONTEND_URL=https://yourdomain.com
API_URL=https://yourdomain.com/api
```

**nginx.conf:**
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;  # Frontend container
    }

    location /api {
        proxy_pass http://localhost:8081;  # Backend container
    }
}
```

---

## Troubleshooting

### Issue: "Cannot connect to backend"

**Check 1: Verify backend is running**
```bash
curl http://localhost:8081/api/health
# Should return: {"status":"ok"}
```

**Check 2: Verify frontend has correct API URL**
```bash
# In browser console
console.log(import.meta.env.VITE_API_URL)
# Should show: http://localhost:8081 (or your configured URL)
```

**Check 3: Verify CORS configuration**
Look for backend startup logs:
```
🔗 CORS enabled for: http://localhost:8080
```

### Issue: "OAuth callback URL mismatch"

**Solution:** OAuth providers need exact callback URLs.

**If using custom ports:**
```bash
# In Google Cloud Console / Azure Portal
# Set callback URL to:
http://localhost:YOUR_BACKEND_PORT/api/auth/google/callback

# Then in .env:
GOOGLE_CALLBACK_URL=http://localhost:YOUR_BACKEND_PORT/api/auth/google/callback
```

### Issue: "Port already in use"

**Find what's using the port:**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

**Or use different ports:**
```bash
BASE_URL=http://localhost
FRONTEND_PORT=8090
BACKEND_PORT=8091
```

### Issue: Docker containers can't communicate

**Check docker network:**
```bash
docker network inspect cal3-network
```

**Verify environment variables:**
```bash
docker exec cal3-backend env | grep BASE_URL
docker exec cal3-backend env | grep PORT
```

**Backend should use container name for CORS in Docker:**
```yaml
environment:
  BASE_URL: http://localhost  # For external access
  # Frontend URL constructed automatically
```

---

## Environment Variable Reference Sheet

### Quick Copy-Paste Templates

**Minimal (Development):**
```bash
BASE_URL=http://localhost
FRONTEND_PORT=8080
BACKEND_PORT=8081
```

**Full (Development):**
```bash
# Base Configuration
NODE_ENV=development
BASE_URL=http://localhost
FRONTEND_PORT=8080
BACKEND_PORT=8081

# Database
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=cal3_user
DB_PASSWORD=postgres
DB_NAME=cal3_dev

# Security
JWT_SECRET=dev-secret-key-minimum-32-characters
```

**Full (Production):**
```bash
# Base Configuration
NODE_ENV=production
BASE_URL=https://yourdomain.com
FRONTEND_PORT=443
BACKEND_PORT=443

# Database
DB_TYPE=postgres
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=cal3_prod
DB_PASSWORD=your_secure_password
DB_NAME=cal3_production

# Security
JWT_SECRET=your_32_character_secret_here

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

---

## Summary

✅ **Simple**: Only 3 variables needed for port configuration
✅ **Smart**: URLs auto-constructed from BASE_URL + ports
✅ **Flexible**: Can override anything for advanced setups
✅ **Safe**: Can't mismatch URLs and ports
✅ **Backward Compatible**: Explicit URLs still work

For more details, see:
- [SIMPLE_PORT_CONFIG.md](SIMPLE_PORT_CONFIG.md) - In-depth explanation
- [PORT_CONFIGURATION.md](PORT_CONFIGURATION.md) - Technical details
- [docker/README.md](docker/README.md) - Docker-specific guide
- [setup-guide.md](setup-guide.md) - Complete setup walkthrough
