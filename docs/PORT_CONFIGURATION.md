# 🔌 Port Configuration Guide for Cal3

## Summary

**✅ ALL PORTS ARE FULLY CONFIGURABLE** - There are **NO hardcoded ports** in the Cal3 codebase. All port references use environment variables with sensible localhost defaults for development.

---

## Port Configuration Overview

### Default Ports

| Service | Default Port | Environment Variable | Configurable? |
|---------|-------------|---------------------|---------------|
| Frontend | 8080 | `FRONTEND_PORT` | ✅ Yes |
| Backend API | 8081 | `PORT` | ✅ Yes |
| PostgreSQL | 5433 | `DB_PORT` | ✅ Yes |

### How Ports Are Used in Code

#### Frontend (`frontend/src/services/api.ts`, `automationService.ts`)
```typescript
const API_BASE_URL = import.meta.env.BASE_URL || 'http://localhost:8081';
```
- Uses environment variable `BASE_URL`
- Fallback to `localhost:8081` for local development
- **NOT hardcoded** - configurable via `.env` file

#### Backend (`backend-nestjs/src/main.ts`)
```typescript
const port = process.env.PORT || 8081;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
```
- Uses environment variable `PORT` for server port
- Uses environment variable `FRONTEND_URL` for CORS
- Fallbacks are for local development convenience
- **NOT hardcoded** - configurable via `.env` file

---

## Configuration Methods

### Method 1: Docker Deployment (Recommended)

**File:** `docker/config/.env`

```bash
# Port Configuration
FRONTEND_PORT=8080      # Change to any available port
BACKEND_PORT=8081       # Change to any available port
DB_PORT=5433           # Change to any available port

# URL Configuration (must match ports above)
FRONTEND_URL=http://localhost:8080
API_URL=http://localhost:8081
BASE_URL=http://localhost:8081
```

**Important:** If you change ports, you MUST update the URL variables to match:
```bash
# Example: Using custom ports
FRONTEND_PORT=3000
BACKEND_PORT=3001
DB_PORT=5432

# Update URLs to match
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:3001
BASE_URL=http://localhost:3001
```

### Method 2: Local Development

**Backend:** `backend-nestjs/.env`
```bash
PORT=8081                           # Backend port
FRONTEND_URL=http://localhost:8080  # Frontend URL for CORS
```

**Frontend:** `frontend/.env`
```bash
BASE_URL=http://localhost:8081  # Backend API URL
```

**Running with custom ports:**
```bash
# Backend with custom port
cd backend-nestjs
PORT=3001 JWT_SECRET="your-secret" npm run start:dev

# Frontend with custom port
cd frontend
npm run dev -- --port 3000
```

---

## Production Deployment

### Changing Ports in Production

1. **Update Environment Variables:**
   ```bash
   # In docker/config/.env
   FRONTEND_PORT=80
   BACKEND_PORT=443
   FRONTEND_URL=https://yourdomain.com
   API_URL=https://api.yourdomain.com
   BASE_URL=https://api.yourdomain.com
   ```

2. **Update OAuth Callback URLs** (if using SSO):
   ```bash
   GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback
   MICROSOFT_CALLBACK_URL=https://api.yourdomain.com/api/auth/microsoft/callback
   ```

3. **Rebuild Docker Images:**
   ```bash
   cd docker
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

---

## Verification

### Verify No Hardcoded Ports in Code

**Frontend Services:**
```bash
grep -r "localhost:808" frontend/src/
# Should only find environment variable fallbacks like:
# import.meta.env.BASE_URL || 'http://localhost:8081'
```

**Backend Main:**
```bash
grep -r "process.env.PORT" backend-nestjs/src/main.ts
# Should find: const port = process.env.PORT || 8081;
```

### Test Custom Ports

**Example: Running on ports 3000/3001**

1. Create `backend-nestjs/.env.test`:
   ```bash
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   JWT_SECRET=test-secret
   ```

2. Create `frontend/.env.test`:
   ```bash
   BASE_URL=http://localhost:3001
   ```

3. Start services:
   ```bash
   # Backend
   cd backend-nestjs
   npm run start:dev
   # Should show: 🚀 Application is running on: http://localhost:3001

   # Frontend
   cd frontend
   npm run dev -- --port 3000
   # Should show: Local: http://localhost:3000
   ```

---

## Common Port Conflicts

### Port 8080 Already in Use
```bash
# Option 1: Use different port
FRONTEND_PORT=8090
FRONTEND_URL=http://localhost:8090
# When running locally:
npm run dev -- --port 8090

# Option 2: Kill process using port 8080
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

### Port 8081 Already in Use
```bash
# Option 1: Use different port
BACKEND_PORT=8082
PORT=8082
API_URL=http://localhost:8082
BASE_URL=http://localhost:8082

# Option 2: Kill process using port 8081
# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8081 | xargs kill -9
```

---

## Architecture Details

### Environment Variable Flow

```
Docker Compose (.env)
    ↓
Container Environment Variables
    ↓
Application Code (uses process.env / import.meta.env)
    ↓
Runtime Port Binding
```

### Where Ports Are Defined

1. **Docker Compose** (`docker-compose.yml`):
   ```yaml
   services:
     backend:
       ports:
         - "${BACKEND_PORT:-8081}:8081"
       environment:
         PORT: ${BACKEND_PORT:-8081}
   ```

2. **Dockerfile** (build-time):
   ```dockerfile
   ARG API_URL=http://localhost:8081
   ENV BASE_URL=${API_URL}
   ```

3. **Application Code** (runtime):
   ```typescript
   const port = process.env.PORT || 8081;
   ```

---

## Documentation References

- **Complete Docker Setup:** [docker/README.md](docker/README.md)
- **Portainer Deployment:** [docker/PORTAINER_GUIDE.md](docker/PORTAINER_GUIDE.md)
- **Local Development:** [setup-guide.md](setup-guide.md)
- **Development Guide:** [CLAUDE.md](CLAUDE.md)

---

## Frequently Asked Questions

### Q: Are ports hardcoded anywhere?
**A:** No. All ports use environment variables with localhost defaults for development convenience.

### Q: What happens if I don't set environment variables?
**A:** The application uses sensible defaults (8080/8081/5433) suitable for local development.

### Q: Can I run multiple instances on the same machine?
**A:** Yes! Configure each instance with different ports using separate `.env` files.

### Q: Do I need to rebuild after changing ports?
**A:**
- **Docker:** Yes, rebuild frontend image (backend doesn't need rebuild)
- **Local:** No, just restart with new environment variables

### Q: What about nginx/reverse proxy?
**A:** You can map any external port to internal container ports using nginx or docker port mapping.

---

## Conclusion

✅ **Cal3 has ZERO hardcoded ports** - all ports are fully configurable via environment variables with sensible defaults for local development.

The `localhost:8080` and `localhost:8081` you see in code are **fallback defaults**, not hardcoded requirements. These ensure the application works out-of-the-box for local development without complex configuration.

For production, Docker, or custom environments, simply set the appropriate environment variables and all ports will be configured accordingly.
