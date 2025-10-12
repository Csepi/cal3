# 🎯 Simplified Port Configuration

## The Problem We Solved

**Before:** You had to set multiple redundant variables:
```bash
FRONTEND_PORT=3000
BACKEND_PORT=3001
FRONTEND_URL=http://localhost:3000   # Redundant!
API_URL=http://localhost:3001         # Redundant!
VITE_API_URL=http://localhost:3001   # Redundant!
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback  # Redundant!
```

**After:** Just set BASE_URL and ports:
```bash
BASE_URL=http://localhost
FRONTEND_PORT=3000
BACKEND_PORT=3001
# Done! Everything else is auto-constructed
```

---

## How It Works

### Smart URL Construction

The application **automatically constructs** all URLs from `BASE_URL` and port numbers:

```
FRONTEND_URL   = BASE_URL + ":" + FRONTEND_PORT
API_URL        = BASE_URL + ":" + BACKEND_PORT
Callback URLs  = BASE_URL + ":" + BACKEND_PORT + "/api/auth/{provider}/callback"
```

### Code Implementation

**Backend** (`backend-nestjs/src/main.ts`):
```typescript
const backendPort = process.env.PORT || process.env.BACKEND_PORT || '8081';
const frontendPort = process.env.FRONTEND_PORT || '8080';
const baseUrl = process.env.BASE_URL || 'http://localhost';

// Auto-construct frontend URL for CORS
const frontendUrl = process.env.FRONTEND_URL || `${baseUrl}:${frontendPort}`;
```

**Frontend** (`frontend/src/services/api.ts`):
```typescript
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8081';
const API_BASE_URL = import.meta.env.VITE_API_URL || `${BASE_URL}:${BACKEND_PORT}`;
```

**OAuth Strategies** (`backend-nestjs/src/auth/*.strategy.ts`):
```typescript
const baseUrl = process.env.BASE_URL || 'http://localhost';
const backendPort = process.env.PORT || process.env.BACKEND_PORT || '8081';
const defaultCallbackUrl = `${baseUrl}:${backendPort}/api/auth/google/callback`;
```

---

## Configuration Examples

### Example 1: Default Localhost

**No configuration needed!** Defaults work out of the box:
```bash
# Backend runs on: http://localhost:8081
# Frontend runs on: http://localhost:8080
```

### Example 2: Custom Ports (Localhost)

Only change what you need:
```bash
BASE_URL=http://localhost
FRONTEND_PORT=3000
BACKEND_PORT=3001
```

**Result:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- CORS: Automatically allows http://localhost:3000
- OAuth callbacks: http://localhost:3001/api/auth/*/callback

### Example 3: Production Domain

```bash
BASE_URL=https://mycal.com
FRONTEND_PORT=443
BACKEND_PORT=443
```

**Result:**
- Frontend: https://mycal.com:443
- Backend API: https://mycal.com:443
- OAuth callbacks: https://mycal.com:443/api/auth/*/callback

### Example 4: Production with Subdomains

For advanced setups, you can still override:
```bash
BASE_URL=https://mycal.com
FRONTEND_URL=https://app.mycal.com
API_URL=https://api.mycal.com
GOOGLE_CALLBACK_URL=https://api.mycal.com/api/auth/google/callback
```

---

## Environment Variables Reference

### Required Variables (Minimum)

| Variable | Default | Purpose |
|----------|---------|---------|
| `BASE_URL` | `http://localhost` | Base domain for all services |
| `FRONTEND_PORT` | `8080` | Frontend web interface port |
| `BACKEND_PORT` | `8081` | Backend API port |

### Optional Override Variables

These are **automatically constructed** but can be overridden:

| Variable | Auto-Constructed From | When to Override |
|----------|----------------------|------------------|
| `FRONTEND_URL` | `BASE_URL:FRONTEND_PORT` | Using subdomains or reverse proxy |
| `API_URL` | `BASE_URL:BACKEND_PORT` | Using subdomains or reverse proxy |
| `GOOGLE_CALLBACK_URL` | `BASE_URL:BACKEND_PORT/api/auth/google/callback` | Custom OAuth setup |
| `MICROSOFT_CALLBACK_URL` | `BASE_URL:BACKEND_PORT/api/auth/microsoft/callback` | Custom OAuth setup |

### Vite-Specific (Frontend Build)

| Variable | Purpose |
|----------|---------|
| `VITE_BASE_URL` | Passes BASE_URL to frontend build |
| `VITE_BACKEND_PORT` | Passes BACKEND_PORT to frontend build |
| `VITE_API_URL` | Optional: Override for API URL |

---

## Migration Guide

### From Old Configuration

If you have an existing `.env` file with explicit URLs:

**Old `.env`:**
```bash
FRONTEND_PORT=8080
BACKEND_PORT=8081
FRONTEND_URL=http://localhost:8080
API_URL=http://localhost:8081
VITE_API_URL=http://localhost:8081
GOOGLE_CALLBACK_URL=http://localhost:8081/api/auth/google/callback
MICROSOFT_CALLBACK_URL=http://localhost:8081/api/auth/microsoft/callback
```

**New `.env` (Simplified):**
```bash
BASE_URL=http://localhost
FRONTEND_PORT=8080
BACKEND_PORT=8081

# OAuth credentials (URLs auto-constructed)
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
MICROSOFT_CLIENT_ID=your-id
MICROSOFT_CLIENT_SECRET=your-secret
```

### What to Delete

Remove these redundant variables:
- ❌ `FRONTEND_URL` (unless using subdomains)
- ❌ `API_URL` (unless using subdomains)
- ❌ `VITE_API_URL` (unless custom override needed)
- ❌ `GOOGLE_CALLBACK_URL` (auto-constructed)
- ❌ `MICROSOFT_CALLBACK_URL` (auto-constructed)

Keep these:
- ✅ `BASE_URL`
- ✅ `FRONTEND_PORT`
- ✅ `BACKEND_PORT`
- ✅ OAuth client IDs and secrets

---

## Docker Compose

### Simplified docker-compose.yml

```yaml
services:
  backend:
    environment:
      BASE_URL: ${BASE_URL:-http://localhost}
      PORT: ${BACKEND_PORT:-8081}
      BACKEND_PORT: ${BACKEND_PORT:-8081}
      FRONTEND_PORT: ${FRONTEND_PORT:-8080}
      # Everything else auto-constructed!

  frontend:
    build:
      args:
        BASE_URL: ${BASE_URL:-http://localhost}
        BACKEND_PORT: ${BACKEND_PORT:-8081}
    environment:
      BASE_URL: ${BASE_URL:-http://localhost}
      BACKEND_PORT: ${BACKEND_PORT:-8081}
```

---

## FAQ

### Q: Do I still need to set ports?
**A:** Yes, but only `BASE_URL`, `FRONTEND_PORT`, and `BACKEND_PORT`. Everything else is automatic.

### Q: What if I use a reverse proxy or subdomains?
**A:** You can still override with explicit URLs:
```bash
BASE_URL=https://mycal.com
FRONTEND_URL=https://app.mycal.com
API_URL=https://api.mycal.com
```

### Q: Will my old configuration still work?
**A:** Yes! Explicit URLs override auto-construction, so old configs are fully backward compatible.

### Q: What happens if I change ports?
**A:** Just change `FRONTEND_PORT` and `BACKEND_PORT`. All URLs update automatically.

### Q: Can I use environment variables for BASE_URL?
**A:** Yes! For example:
```bash
BASE_URL=http://${HOSTNAME}
```

---

## Benefits

✅ **Less Configuration**: 3 variables instead of 7+
✅ **Less Redundancy**: No duplicating localhost:port everywhere
✅ **Less Errors**: Can't accidentally mismatch URLs and ports
✅ **Easier Changes**: Change port once, everything updates
✅ **Still Flexible**: Can override anything for advanced setups
✅ **Backward Compatible**: Old explicit URL configs still work

---

## Complete Example

### Minimal `.env` for Docker

```bash
# Database
DB_USERNAME=cal3_user
DB_PASSWORD=super_secure_password_here
DB_NAME=cal3_production
JWT_SECRET=your_32_char_jwt_secret_here

# Smart Port Configuration
BASE_URL=http://localhost
FRONTEND_PORT=8080
BACKEND_PORT=8081
DB_PORT=5433

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

That's it! No more redundant URL variables needed.

---

## Technical Details

### Fallback Chain

The application uses this priority for URL construction:

1. **Explicit URL** (if provided) → Use as-is
2. **BASE_URL + PORT** (if BASE_URL provided) → Construct URL
3. **Default** → `http://localhost:{defaultPort}`

### Example Resolution

```typescript
// Frontend URL for CORS
const frontendUrl =
  process.env.FRONTEND_URL ||                    // 1. Explicit
  `${process.env.BASE_URL}:${frontendPort}` ||   // 2. Constructed
  `http://localhost:${frontendPort}`;            // 3. Default
```

This ensures maximum flexibility while maintaining simplicity for common cases.
