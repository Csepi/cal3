# CI/CD Setup Guide - Automatic Deployment Pipeline

**Option B: GitHub Actions → Registry → Webhooks → Auto Deploy**

This guide explains how to set up automatic container updates when you push code to GitHub.

---

## 🎯 Overview

The complete CI/CD pipeline:

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐     ┌─────────────┐
│  Git Push   │ ──► │ GitHub Actions│ ──► │ Build & Push   │ ──► │  Webhook    │
│  to GitHub  │     │   Triggered   │     │  to Registry   │     │  Triggered  │
└─────────────┘     └──────────────┘     └────────────────┘     └─────────────┘
                                                                         │
                                                                         ▼
┌─────────────┐     ┌──────────────┐     ┌────────────────┐     ┌─────────────┐
│  Containers │ ◄── │   Restart     │ ◄── │  Pull Images   │ ◄── │   Server    │
│   Updated   │     │  Containers   │     │  from Registry │     │  Receives   │
└─────────────┘     └──────────────┘     └────────────────┘     └─────────────┘
```

### What Happens:

1. **You push code** to GitHub (main or Docker branch)
2. **GitHub Actions** automatically builds Docker images
3. **Images are pushed** to GitHub Container Registry
4. **Webhook is triggered** to notify your server
5. **Server pulls** new images and restarts containers
6. **Application is updated** with zero manual intervention

---

## 📋 Prerequisites

### On Your Development Machine:
- ✅ Git access to the repository
- ✅ GitHub account with write access

### On Your Server (Synology, VPS, etc.):
- ✅ Docker and Docker Compose installed
- ✅ Node.js 18+ installed
- ✅ Port 3001 accessible from internet (or use reverse proxy)
- ✅ Cal3 application already deployed

---

## 🔧 Setup Steps

### Step 1: Configure GitHub Secrets

1. Go to your GitHub repository: `https://github.com/your-org/cal3`
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `DEPLOY_WEBHOOK_URL` | `http://your-server-ip:3001/webhook/deploy` | Your server webhook endpoint |
| `WEBHOOK_SECRET` | Generate: `openssl rand -hex 32` | Shared secret for security |

**Example:**
```bash
# Generate webhook secret
openssl rand -hex 32
# Output: a1b2c3d4e5f6...
```

### Step 2: Install Webhook Receiver on Server

SSH into your server and run:

```bash
cd /opt/cal3/docker/scripts

# Run setup script (interactive)
chmod +x setup-webhook.sh
sudo ./setup-webhook.sh
```

The script will:
- ✅ Check Node.js installation
- ✅ Install dependencies (express)
- ✅ Generate webhook secret (if not set)
- ✅ Prompt for installation method (systemd or PM2)
- ✅ Configure and start the webhook receiver
- ✅ Show GitHub configuration steps

**Choose Installation Method:**

**Option A: Systemd (Recommended for production)**
```bash
# Select option 1 in setup script
# Service will auto-start on boot
sudo systemctl status cal3-webhook
```

**Option B: PM2 (Easier management)**
```bash
# Select option 2 in setup script
pm2 status
pm2 logs cal3-webhook
```

### Step 3: Configure Firewall

Allow webhook port:

**Ubuntu/Debian (UFW):**
```bash
sudo ufw allow 3001/tcp
sudo ufw reload
```

**CentOS/RHEL (firewalld):**
```bash
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

**Synology:**
- Control Panel → Security → Firewall
- Create rule: Allow TCP 3001 from GitHub IP ranges

### Step 4: Update Environment Variables

Add GitHub credentials to `.env` on your server:

```bash
cd /opt/cal3
nano .env
```

Add:
```bash
# GitHub Container Registry (for pulling images)
GITHUB_USERNAME=your-github-username
GITHUB_TOKEN=ghp_your_personal_access_token
```

**Generate GitHub Token:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `read:packages` permission
3. Copy token to `.env` file

### Step 5: Update Docker Compose

Ensure your `docker-compose.yml` uses GitHub Container Registry:

```yaml
services:
  backend:
    image: ghcr.io/your-org/cal3-backend:latest
    # Remove 'build:' section for production

  frontend:
    image: ghcr.io/your-org/cal3-frontend:latest
    # Remove 'build:' section for production
```

---

## ✅ Testing the Pipeline

### Test 1: Webhook Receiver Health

```bash
curl http://localhost:3001/health
# Expected: {"status":"ok","uptime":123,"timestamp":"..."}
```

### Test 2: Manual Webhook Trigger

```bash
curl -X POST http://your-server-ip:3001/webhook/deploy \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=your-webhook-secret" \
  -d '{"repository":"your-org/cal3","ref":"refs/heads/main","sha":"abc123","pusher":"test"}'
```

### Test 3: Full Pipeline Test

1. Make a small change to code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin Docker
   ```
3. Watch GitHub Actions: `https://github.com/your-org/cal3/actions`
4. Check server logs:
   ```bash
   # Systemd
   sudo journalctl -u cal3-webhook -f

   # PM2
   pm2 logs cal3-webhook

   # Docker
   tail -f /opt/cal3/docker/webhook-deploy.log
   ```

---

## 📊 Monitoring & Logs

### Webhook Receiver Logs

**Systemd:**
```bash
sudo journalctl -u cal3-webhook -f          # Follow logs
sudo journalctl -u cal3-webhook -n 100      # Last 100 lines
sudo systemctl status cal3-webhook          # Service status
```

**PM2:**
```bash
pm2 logs cal3-webhook                       # Follow logs
pm2 logs cal3-webhook --lines 100           # Last 100 lines
pm2 status                                  # Process status
pm2 monit                                   # Real-time monitoring
```

**Deployment Log:**
```bash
tail -f /opt/cal3/docker/webhook-deploy.log
```

### GitHub Actions

View workflow runs:
- GitHub Repository → Actions tab
- Click on specific workflow run
- View logs for each step

### Container Logs

```bash
cd /opt/cal3/docker
docker-compose logs -f                      # All services
docker-compose logs -f backend              # Backend only
docker-compose logs -f frontend             # Frontend only
```

---

## 🔒 Security Considerations

### 1. Webhook Secret

- ✅ Use strong random secret (32+ bytes)
- ✅ Never commit to repository
- ✅ Rotate every 90 days
- ✅ Use HTTPS in production

### 2. Network Security

**Production Setup (Recommended):**

Use reverse proxy with HTTPS:

```nginx
# /etc/nginx/sites-available/webhook
server {
    listen 443 ssl http2;
    server_name webhook.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location /webhook/deploy {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then update GitHub secret:
```
DEPLOY_WEBHOOK_URL=https://webhook.yourdomain.com/webhook/deploy
```

### 3. Access Control

Limit webhook endpoint access:

**Firewall (UFW):**
```bash
# Allow only from GitHub IP ranges
sudo ufw allow from 140.82.112.0/20 to any port 3001
sudo ufw allow from 143.55.64.0/20 to any port 3001
```

**Nginx:**
```nginx
location /webhook/deploy {
    # Allow GitHub IPs only
    allow 140.82.112.0/20;
    allow 143.55.64.0/20;
    deny all;

    proxy_pass http://localhost:3001;
}
```

### 4. Rate Limiting

Add rate limiting to webhook receiver:

```javascript
// In webhook-receiver.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // limit each IP to 10 requests per windowMs
});

app.use('/webhook/deploy', limiter);
```

---

## 🔧 Troubleshooting

### Webhook Not Triggered

**Check GitHub Actions logs:**
```
Repository → Actions → Latest workflow → trigger-deployment job
```

**Common issues:**
- ❌ `DEPLOY_WEBHOOK_URL` secret not set
- ❌ `WEBHOOK_SECRET` mismatch
- ❌ Server port 3001 not accessible
- ❌ Firewall blocking requests

**Fix:**
```bash
# Test webhook receiver from server
curl http://localhost:3001/health

# Test from outside
curl http://your-server-ip:3001/health

# Check firewall
sudo ufw status
```

### Deployment Fails

**Check deployment logs:**
```bash
tail -f /opt/cal3/docker/webhook-deploy.log
```

**Common issues:**
- ❌ GitHub token not set or expired
- ❌ Not logged into container registry
- ❌ Docker Compose errors
- ❌ Insufficient permissions

**Fix:**
```bash
# Re-login to registry
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Test manual pull
docker pull ghcr.io/your-org/cal3-backend:latest

# Check Docker Compose
cd /opt/cal3/docker
docker-compose config
```

### Containers Not Updating

**Verify images are being pulled:**
```bash
cd /opt/cal3/docker
docker-compose pull
docker-compose up -d
```

**Check image tags:**
```bash
docker images | grep cal3
```

**Force recreation:**
```bash
docker-compose down
docker-compose pull
docker-compose up -d --force-recreate
```

---

## 🚀 Advanced Configuration

### Multiple Environments

Deploy to different environments based on branch:

**GitHub Actions:**
```yaml
- name: Set environment
  id: set-env
  run: |
    if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
      echo "ENV=production" >> $GITHUB_OUTPUT
      echo "WEBHOOK_URL=${{ secrets.PROD_WEBHOOK_URL }}" >> $GITHUB_OUTPUT
    elif [[ "${{ github.ref }}" == "refs/heads/staging" ]]; then
      echo "ENV=staging" >> $GITHUB_OUTPUT
      echo "WEBHOOK_URL=${{ secrets.STAGING_WEBHOOK_URL }}" >> $GITHUB_OUTPUT
    fi

- name: Trigger deployment
  run: curl -X POST "${{ steps.set-env.outputs.WEBHOOK_URL }}" ...
```

### Rollback on Failure

Add health check after deployment:

**In auto-deploy.sh:**
```bash
# Save old image IDs
OLD_BACKEND=$(docker images -q ghcr.io/your-org/cal3-backend:latest)
OLD_FRONTEND=$(docker images -q ghcr.io/your-org/cal3-frontend:latest)

# Deploy new version
docker-compose up -d

# Health check with timeout
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if curl -f http://localhost:8081/api/health && \
       curl -f http://localhost:8080/health; then
        echo "✅ Health check passed"
        exit 0
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

# Rollback on failure
echo "❌ Health check failed, rolling back..."
docker tag $OLD_BACKEND ghcr.io/your-org/cal3-backend:latest
docker tag $OLD_FRONTEND ghcr.io/your-org/cal3-frontend:latest
docker-compose up -d
exit 1
```

### Notification on Deploy

Send notifications to Slack/Discord:

```bash
# At end of auto-deploy.sh
curl -X POST "$SLACK_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "🚀 Cal3 deployed successfully",
    "attachments": [{
      "color": "good",
      "fields": [
        {"title": "Environment", "value": "Production", "short": true},
        {"title": "Commit", "value": "'$GITHUB_SHA'", "short": true}
      ]
    }]
  }'
```

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Compose](https://docs.docker.com/compose/)
- [Webhook Security Best Practices](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks)

---

## 🎯 Summary

Once set up, your workflow is:

1. **Develop** → Make code changes locally
2. **Commit** → `git add . && git commit -m "Your changes"`
3. **Push** → `git push origin main`
4. **Relax** → Everything updates automatically! ☕

The pipeline handles:
- ✅ Building Docker images
- ✅ Pushing to registry
- ✅ Notifying server
- ✅ Pulling new images
- ✅ Restarting containers
- ✅ Health checks

**No manual deployment needed!** 🎉

---

**Questions or Issues?**
- Check logs (see Monitoring section)
- Review troubleshooting guide
- Open GitHub issue with logs
