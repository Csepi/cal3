# 🌐 Cal3 Public Deployment Guide
## Internet-Accessible Deployment with External Database

This guide covers deploying Cal3 with:
- ✅ **Frontend** accessible from internet (http://baseurl:frontendport)
- ✅ **Backend** accessible from internet (http://baseurl:backendport)
- ✅ **Database** on local network (NOT exposed to internet)

---

## 📋 Architecture Overview

```
Internet
   │
   ├─► http://your-ip:8080 ──► Frontend Container (exposed on 0.0.0.0:8080)
   │
   └─► http://your-ip:8081 ──► Backend Container (exposed on 0.0.0.0:8081)
                                      │
                                      └─► Database at 192.168.1.101:5433 (local network only)
```

### Key Features:
- **Frontend**: Publicly accessible React application
- **Backend**: Publicly accessible API endpoints
- **Database**: Only accessible from Docker host via local network (192.168.1.101)
- **Security**: Database not exposed to internet, only backend can reach it

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Docker and Docker Compose installed
- External PostgreSQL database accessible from Docker host (e.g., 192.168.1.101:5433)
- Firewall configured to allow incoming connections on ports 8080 and 8081
- Public IP address or domain name

### 1. Clone Repository
```bash
git clone https://github.com/Csepi/cal3.git
cd cal3/docker
```

### 2. Create Configuration
```bash
# Copy the public deployment template
cp config/env.public-external-db.example config/.env

# Edit configuration
nano config/.env
```

### 3. Configure Required Settings

Edit `config/.env` and update these **REQUIRED** values:

```bash
# Your public IP or domain
BASE_URL=http://203.0.113.45  # Replace with your public IP

# Database connection (local network)
DB_HOST=192.168.1.101         # Your database host IP
DB_PORT=5433                  # Your database port
DB_USERNAME=cal3_user         # Database username
DB_PASSWORD=strong-password   # Database password (16+ chars)
DB_NAME=cal3_production       # Database name

# Security (IMPORTANT!)
JWT_SECRET=generate-with-openssl-rand-base64-32

# Frontend and Backend ports
FRONTEND_PORT=8080
BACKEND_PORT=8081
```

### 4. Generate Secure Secrets
```bash
# Generate JWT secret
openssl rand -base64 32
# Copy output to JWT_SECRET in .env

# Generate database password (if creating new user)
openssl rand -base64 24
# Copy output to DB_PASSWORD in .env
```

### 5. Deploy
```bash
# Start containers
docker-compose -f docker-compose.public-external-db.yml up -d

# Check status
docker-compose -f docker-compose.public-external-db.yml ps

# View logs
docker-compose -f docker-compose.public-external-db.yml logs -f
```

### 6. Verify Deployment
```bash
# Test backend health
curl http://your-public-ip:8081/api/health
# Should return: {"status":"ok","timestamp":"..."}

# Test frontend (in browser)
http://your-public-ip:8080
```

---

## 🔧 Detailed Configuration

### Database Configuration

Your database can be on:
- **Same machine** (localhost/127.0.0.1) - Use host network mode or host.docker.internal
- **Local network** (192.168.x.x) - Most common scenario
- **Remote server** - Use IP address or hostname

**Example configurations:**

```bash
# Database on same machine as Docker
DB_HOST=host.docker.internal  # Docker special hostname
DB_PORT=5433

# Database on local network
DB_HOST=192.168.1.101
DB_PORT=5433

# Database on remote server (with SSL)
DB_HOST=db.example.com
DB_PORT=5432
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

### Base URL Configuration

The `BASE_URL` determines how users access your application:

**1. Public IP Address:**
```bash
BASE_URL=http://203.0.113.45
FRONTEND_PORT=8080
BACKEND_PORT=8081
# Access: http://203.0.113.45:8080 (frontend), http://203.0.113.45:8081 (backend)
```

**2. Domain Name:**
```bash
BASE_URL=http://cal3.example.com
FRONTEND_PORT=8080
BACKEND_PORT=8081
# Access: http://cal3.example.com:8080 (frontend), http://cal3.example.com:8081 (backend)
```

**3. With Reverse Proxy (no ports in URL):**
```bash
BASE_URL=https://cal3.example.com
FRONTEND_URL=https://cal3.example.com
API_URL=https://cal3.example.com/api
FRONTEND_PORT=8080  # Internal only, nginx proxies to this
BACKEND_PORT=8081   # Internal only, nginx proxies to this
```

### Port Configuration

**Frontend Port** (default: 8080):
- Web interface for users
- Serves React application via nginx
- Must be open on firewall

**Backend Port** (default: 8081):
- REST API endpoints
- Authentication and data operations
- Must be open on firewall

**Database Port** (default: 5433):
- PostgreSQL database
- **Should NOT be open on public firewall**
- Only accessible from Docker host via local network

**Changing Ports:**
```bash
# In config/.env
FRONTEND_PORT=3000    # Change if 8080 conflicts
BACKEND_PORT=3001     # Change if 8081 conflicts
DB_PORT=5434          # Database port on external host
```

---

## 🔒 Security Configuration

### 1. Firewall Setup

**Linux (UFW):**
```bash
# Allow frontend and backend
sudo ufw allow 8080/tcp
sudo ufw allow 8081/tcp

# DO NOT allow database port
# sudo ufw deny 5433/tcp  # Not needed if not listening on public interface

# Enable firewall
sudo ufw enable
sudo ufw status
```

**Windows Firewall:**
```powershell
# Allow frontend
New-NetFirewallRule -DisplayName "Cal3 Frontend" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow

# Allow backend
New-NetFirewallRule -DisplayName "Cal3 Backend" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow

# DO NOT create rule for database port
```

**Router Port Forwarding:**
If behind NAT/router, forward these ports:
- External 8080 → Internal Docker-Host-IP:8080
- External 8081 → Internal Docker-Host-IP:8081
- DO NOT forward database port (5433)

### 2. Database Security

**Best Practices:**
- Database should only bind to local network interface (not 0.0.0.0)
- Configure database firewall to only allow connections from Docker host IP
- Use strong password (16+ characters, mixed case, numbers, symbols)
- Regularly backup database
- Keep PostgreSQL updated

**PostgreSQL Configuration (on database host):**
```bash
# Edit postgresql.conf
listen_addresses = '192.168.1.101'  # Local network IP only, NOT '0.0.0.0'

# Edit pg_hba.conf - only allow from Docker host
host    cal3_production    cal3_user    192.168.1.x/32    md5
# Replace 192.168.1.x with Docker host IP
```

### 3. OAuth Configuration

If using Google/Microsoft OAuth, update callback URLs:

**Google Cloud Console:**
1. Go to https://console.cloud.google.com/
2. Select your project → Credentials
3. Edit OAuth 2.0 Client ID
4. Add authorized redirect URI: `http://your-public-ip:8081/api/auth/google/callback`
5. Save changes

**Microsoft Azure Portal:**
1. Go to https://portal.azure.com/
2. Azure Active Directory → App registrations
3. Select your app → Authentication
4. Add redirect URI: `http://your-public-ip:8081/api/auth/microsoft/callback`
5. Save

**In config/.env:**
```bash
GOOGLE_CALLBACK_URL=http://your-public-ip:8081/api/auth/google/callback
MICROSOFT_CALLBACK_URL=http://your-public-ip:8081/api/auth/microsoft/callback
```

### 4. SSL/HTTPS Setup (Recommended for Production)

**Option 1: Nginx Reverse Proxy with Let's Encrypt**

Install nginx and certbot:
```bash
sudo apt-get install nginx certbot python3-certbot-nginx
```

Configure nginx:
```nginx
# /etc/nginx/sites-available/cal3
server {
    listen 80;
    server_name cal3.example.com;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Get SSL certificate:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/cal3 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get certificate
sudo certbot --nginx -d cal3.example.com
```

Update `.env`:
```bash
BASE_URL=https://cal3.example.com
FRONTEND_URL=https://cal3.example.com
API_URL=https://cal3.example.com/api
```

**Option 2: Traefik (Automatic SSL)**

Create `docker-compose.traefik.yml` (see Advanced Configuration below)

---

## 📊 Management

### Starting and Stopping

```bash
# Start
docker-compose -f docker-compose.public-external-db.yml up -d

# Stop
docker-compose -f docker-compose.public-external-db.yml down

# Restart
docker-compose -f docker-compose.public-external-db.yml restart

# Restart specific service
docker-compose -f docker-compose.public-external-db.yml restart backend
```

### Viewing Logs

```bash
# All logs
docker-compose -f docker-compose.public-external-db.yml logs -f

# Backend only
docker-compose -f docker-compose.public-external-db.yml logs -f backend

# Frontend only
docker-compose -f docker-compose.public-external-db.yml logs -f frontend

# Last 100 lines
docker-compose -f docker-compose.public-external-db.yml logs --tail=100 backend
```

### Updating Application

```bash
# Pull latest code
cd cal3
git pull origin main

# Rebuild and restart
cd docker
docker-compose -f docker-compose.public-external-db.yml up --build -d
```

### Health Checks

```bash
# Backend health
curl http://your-ip:8081/api/health

# Frontend health
curl http://your-ip:8080/health

# Container status
docker-compose -f docker-compose.public-external-db.yml ps

# Database connectivity (from backend container)
docker-compose -f docker-compose.public-external-db.yml exec backend sh
# Inside container:
nc -zv ${DB_HOST} ${DB_PORT}
```

---

## 🐛 Troubleshooting

### Issue: Cannot connect to database

**Symptoms:**
- Backend logs show "ECONNREFUSED" or "Connection refused"
- Backend health check fails

**Solutions:**

1. **Verify database is accessible from Docker host:**
```bash
# On Docker host machine
telnet 192.168.1.101 5433
# OR
nc -zv 192.168.1.101 5433
```

2. **Check database allows connections from Docker host:**
```sql
-- On database host
-- Check pg_hba.conf for Docker host IP
SHOW hba_file;
```

3. **Verify environment variables:**
```bash
docker-compose -f docker-compose.public-external-db.yml exec backend env | grep DB_
```

4. **Check database firewall:**
```bash
# On database host
sudo ufw status
# Ensure Docker host IP is allowed on database port
```

### Issue: Cannot access frontend/backend from internet

**Symptoms:**
- Works from localhost but not from external IP
- Browser shows "Connection refused"

**Solutions:**

1. **Verify containers are bound to 0.0.0.0:**
```bash
docker-compose -f docker-compose.public-external-db.yml ps
netstat -tulpn | grep 8080
netstat -tulpn | grep 8081
# Should show: 0.0.0.0:8080 and 0.0.0.0:8081, NOT 127.0.0.1
```

2. **Check firewall allows connections:**
```bash
# Linux
sudo ufw status verbose

# Test from external machine
curl http://your-public-ip:8080
curl http://your-public-ip:8081/api/health
```

3. **Check router port forwarding** (if behind NAT):
- Log into router admin
- Verify port forwarding rules exist for 8080 and 8081
- Test with: https://www.yougetsignal.com/tools/open-ports/

### Issue: OAuth callbacks fail

**Symptoms:**
- "Redirect URI mismatch" error
- Authentication fails after provider login

**Solutions:**

1. **Update OAuth callback URLs to match public BASE_URL:**
```bash
# In config/.env
GOOGLE_CALLBACK_URL=http://your-public-ip:8081/api/auth/google/callback
MICROSOFT_CALLBACK_URL=http://your-public-ip:8081/api/auth/microsoft/callback
```

2. **Update in provider console:**
- Google: https://console.cloud.google.com/ → Credentials
- Microsoft: https://portal.azure.com/ → App registrations

3. **Ensure exact match** (including http/https, domain/IP, port):
```
Callback URL in .env must EXACTLY match provider console
```

### Issue: Port already in use

**Symptoms:**
- "port is already allocated"
- "bind: address already in use"

**Solutions:**

1. **Change ports in .env:**
```bash
FRONTEND_PORT=8090  # Changed from 8080
BACKEND_PORT=8082   # Changed from 8081
```

2. **Find and kill process using port:**
```bash
# Linux
sudo lsof -i :8080
sudo kill -9 <PID>

# Windows
netstat -ano | findstr :8080
taskkill /F /PID <PID>
```

---

## 📈 Monitoring and Maintenance

### Setup Health Monitoring

**1. Simple HTTP monitoring (cron):**
```bash
# Create health check script
cat > /usr/local/bin/cal3-health.sh << 'EOF'
#!/bin/bash
BACKEND_URL="http://localhost:8081/api/health"
FRONTEND_URL="http://localhost:8080/health"

if ! curl -sf "$BACKEND_URL" > /dev/null; then
    echo "Backend health check failed" | mail -s "Cal3 Alert" admin@example.com
fi
if ! curl -sf "$FRONTEND_URL" > /dev/null; then
    echo "Frontend health check failed" | mail -s "Cal3 Alert" admin@example.com
fi
EOF

chmod +x /usr/local/bin/cal3-health.sh

# Add to crontab (every 5 minutes)
crontab -e
# Add: */5 * * * * /usr/local/bin/cal3-health.sh
```

**2. Using Portainer:**
- Install Portainer: https://docs.portainer.io/start/install-ce
- Add Cal3 stack
- Monitor containers via web UI
- Set up webhooks for notifications

### Backup Strategy

**Database backups (on database host):**
```bash
# Create backup script
cat > /usr/local/bin/backup-cal3-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/cal3"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U cal3_user -h localhost -p 5433 cal3_production | gzip > $BACKUP_DIR/cal3_$DATE.sql.gz
# Keep last 30 days
find $BACKUP_DIR -name "cal3_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-cal3-db.sh

# Run daily at 2 AM
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-cal3-db.sh
```

### Log Rotation

Docker already rotates logs with the configuration in docker-compose:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

This keeps last 3 files of 10MB each = max 30MB per container.

---

## 🎯 Production Checklist

Before going to production, verify:

- [ ] **Configuration**
  - [ ] Strong JWT_SECRET (32+ characters)
  - [ ] Strong DB_PASSWORD (16+ characters)
  - [ ] Correct BASE_URL (public IP or domain)
  - [ ] Correct DB_HOST and DB_PORT

- [ ] **Security**
  - [ ] Firewall allows only ports 8080 and 8081
  - [ ] Database port NOT exposed to internet
  - [ ] Database firewall restricts access to Docker host IP only
  - [ ] SSL/HTTPS configured (recommended)
  - [ ] OAuth callback URLs updated

- [ ] **Testing**
  - [ ] Frontend accessible from external network
  - [ ] Backend API accessible from external network
  - [ ] Authentication works
  - [ ] Database connectivity confirmed
  - [ ] Health checks passing

- [ ] **Monitoring**
  - [ ] Health check monitoring setup
  - [ ] Log monitoring configured
  - [ ] Backup strategy in place
  - [ ] Alert notifications configured

- [ ] **Documentation**
  - [ ] Configuration documented
  - [ ] Access credentials stored securely
  - [ ] Emergency contacts defined
  - [ ] Rollback procedure documented

---

## 🌟 Advanced Configuration

### Using Docker Host Network (for same-machine database)

If database is on the same machine as Docker:

```yaml
# In docker-compose.public-external-db.yml
services:
  backend:
    network_mode: "host"  # Use host network
    # Remove ports section - using host network
```

Then in `.env`:
```bash
DB_HOST=localhost  # Or 127.0.0.1
```

### Using Docker Secrets (for sensitive data)

Create secrets:
```bash
echo "your-jwt-secret" | docker secret create jwt_secret -
echo "your-db-password" | docker secret create db_password -
```

Update docker-compose.yml:
```yaml
secrets:
  jwt_secret:
    external: true
  db_password:
    external: true

services:
  backend:
    secrets:
      - jwt_secret
      - db_password
```

---

## 📚 Related Documentation

- [Main Docker Setup Guide](README.md)
- [External Database Configuration](docker-compose.external-db.yml)
- [Security Best Practices](../DEPLOYMENT.md)
- [API Documentation](../API_DOCUMENTATION.md)

---

## 🆘 Getting Help

**Common Questions:**

**Q: Can I use this with a cloud database (Azure, AWS RDS)?**
A: Yes! Set `DB_HOST` to your cloud database endpoint and configure `DB_SSL=true`.

**Q: Do I need to open database port on firewall?**
A: **NO!** The database should only be accessible via local network. Only open ports 8080 and 8081.

**Q: Can I use a custom domain without ports?**
A: Yes, use a reverse proxy (nginx/traefik) with SSL to route traffic to containers.

**Q: What if I want to change ports later?**
A: Just update `FRONTEND_PORT` and `BACKEND_PORT` in `.env`, then restart containers.

**Support:**
- GitHub Issues: https://github.com/Csepi/cal3/issues
- Documentation: https://github.com/Csepi/cal3/wiki

---

**Version:** 1.0
**Last Updated:** 2025-01-24
**Status:** Production Ready 🚀
