# Cal3 Deployment Guide

## 🏆 **DEPLOYMENT OVERVIEW**

This document provides comprehensive deployment instructions for the Cal3 calendar application, covering both frontend (React) and backend (NestJS) components for various deployment platforms.

## 📋 **Application Architecture**

Cal3 consists of two main components:
- **Frontend**: React 18 + TypeScript + Vite (port 8080)
- **Backend**: NestJS + TypeORM + PostgreSQL (port 8081)

## 🔧 **Prerequisites**

### General Requirements
- Node.js 18+ and npm
- Git version control
- PostgreSQL database (production)
- Domain name and SSL certificate (production)

### Platform-Specific Tools
- **Azure**: Azure CLI
- **AWS**: AWS CLI + Amplify CLI
- **Vercel**: Vercel CLI
- **Netlify**: Netlify CLI
- **Docker**: Docker + Docker Compose

## 🚀 **Production Deployment Options**

### **Option 1: Azure Web Apps (Recommended)**

#### Backend Deployment (Azure Web App)
```bash
# 1. Create App Service Plan
az appservice plan create \
  --name cal3-backend-plan \
  --resource-group cal3-rg \
  --sku B1 \
  --is-linux

# 2. Create Web App
az webapp create \
  --name cal3-backend \
  --resource-group cal3-rg \
  --plan cal3-backend-plan \
  --runtime "NODE|18-lts"

# 3. Configure Environment Variables
az webapp config appsettings set \
  --resource-group cal3-rg \
  --name cal3-backend \
  --settings \
    DB_TYPE="postgres" \
    DB_HOST="your-postgres-server.postgres.database.azure.com" \
    DB_PORT="5432" \
    DB_USERNAME="your-username" \
    DB_PASSWORD="your-password" \
    DB_NAME="cal3_production" \
    JWT_SECRET="your-super-secret-jwt-key" \
    JWT_EXPIRES_IN="24h" \
    NODE_ENV="production" \
    PORT="8081" \
    GOOGLE_CLIENT_ID="your-google-client-id" \
    GOOGLE_CLIENT_SECRET="your-google-client-secret" \
    MICROSOFT_CLIENT_ID="your-microsoft-client-id" \
    MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# 4. Connect GitHub Repository
az webapp deployment source config \
  --resource-group cal3-rg \
  --name cal3-backend \
  --repo-url https://github.com/yourusername/cal3.git \
  --branch main \
  --manual-integration
```

#### Frontend Deployment (Azure Static Web Apps)
```bash
# 1. Create Static Web App
az staticwebapp create \
  --name cal3-frontend \
  --resource-group cal3-rg \
  --source https://github.com/yourusername/cal3 \
  --location "East US 2" \
  --branch main \
  --app-location "/frontend" \
  --output-location "dist"

# 2. Configure API base URL
# Update frontend/src/services/api.ts with production backend URL
```

### **Option 2: Vercel (Frontend) + Railway (Backend)**

#### Backend on Railway
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy
railway login
railway init
railway up

# 3. Configure environment variables through Railway dashboard
# Add all environment variables from the Azure example above
```

#### Frontend on Vercel
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy frontend
cd frontend
vercel

# 3. Configure environment variables
vercel env add VITE_API_BASE_URL production
# Enter: https://your-backend-url.railway.app/api
```

### **Option 3: AWS (Amplify + Elastic Beanstalk)**

#### Backend on AWS Elastic Beanstalk
```bash
# 1. Install AWS CLI and EB CLI
pip install awsebcli

# 2. Initialize Elastic Beanstalk
cd backend-nestjs
eb init cal3-backend --platform node.js-18 --region us-east-1

# 3. Create environment
eb create production

# 4. Configure environment variables
eb setenv \
  DB_TYPE=postgres \
  DB_HOST=your-rds-endpoint.amazonaws.com \
  DB_PORT=5432 \
  JWT_SECRET=your-jwt-secret \
  NODE_ENV=production
```

#### Frontend on AWS Amplify
```bash
# 1. Install Amplify CLI
npm install -g @aws-amplify/cli

# 2. Initialize Amplify
cd frontend
amplify init

# 3. Add hosting
amplify add hosting

# 4. Deploy
amplify publish
```

### **Option 4: Docker Deployment**

#### Docker Compose Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://backend:8081/api
    depends_on:
      - backend

  backend:
    build:
      context: ./backend-nestjs
      dockerfile: Dockerfile
    ports:
      - "8081:8081"
    environment:
      - DB_TYPE=postgres
      - DB_HOST=database
      - DB_PORT=5432
      - DB_USERNAME=cal3user
      - DB_PASSWORD=securepassword
      - DB_NAME=cal3_production
      - JWT_SECRET=your-jwt-secret
      - NODE_ENV=production
    depends_on:
      - database

  database:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=cal3_production
      - POSTGRES_USER=cal3user
      - POSTGRES_PASSWORD=securepassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Backend Dockerfile
```dockerfile
# backend-nestjs/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 8081
CMD ["node", "dist/main"]
```

## ⚙️ **Environment Configuration**

### Backend Environment Variables
```bash
# Database
DB_TYPE=postgres
DB_HOST=your-database-host
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=cal3_production

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=24h

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=https://your-domain.com/api/auth/microsoft/callback

# Application
NODE_ENV=production
PORT=8081
```

### Frontend Environment Variables
```bash
# API Configuration
VITE_API_BASE_URL=https://your-backend-domain.com/api

# Optional: Enable development tools
VITE_ENABLE_DEV_TOOLS=false
```

## 🔒 **Security Configuration**

### SSL/TLS Setup
```bash
# Using Let's Encrypt with Certbot (for self-hosted)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

### Reverse Proxy Configuration (Nginx)
```nginx
# /etc/nginx/sites-available/cal3
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/cal3/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8081/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### CORS Configuration
Ensure backend CORS settings allow your frontend domain:
```typescript
// backend-nestjs/src/main.ts
app.enableCors({
  origin: [
    'https://your-domain.com',
    'https://www.your-domain.com'
  ],
  credentials: true,
});
```

## 📊 **Database Setup**

### PostgreSQL Production Setup
```sql
-- Create database and user
CREATE DATABASE cal3_production;
CREATE USER cal3user WITH ENCRYPTED PASSWORD 'securepassword';
GRANT ALL PRIVILEGES ON DATABASE cal3_production TO cal3user;

-- Connect to database
\c cal3_production

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO cal3user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cal3user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cal3user;
```

### Database Migration
```bash
# Run migrations on production
cd backend-nestjs
npm run migration:run

# Seed initial data (optional)
npm run seed
```

## 🔍 **Health Checks & Monitoring**

### Application Health Endpoints
```bash
# Backend health
curl https://your-api-domain.com/api/health

# Database connectivity
curl https://your-api-domain.com/api/health/database
```

### Monitoring Setup
```yaml
# docker-compose.monitoring.yml (optional)
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## 🚨 **Troubleshooting**

### Common Deployment Issues

#### Backend Issues
```bash
# Check application logs
az webapp log tail --resource-group cal3-rg --name cal3-backend

# Verify environment variables
az webapp config appsettings list --resource-group cal3-rg --name cal3-backend

# Test database connectivity
psql -h your-host -U your-user -d cal3_production -c "SELECT version();"
```

#### Frontend Issues
```bash
# Check build output
npm run build

# Verify API connectivity
curl https://your-backend-domain.com/api/health

# Check network requests in browser dev tools
```

#### Database Issues
```bash
# Check PostgreSQL logs
sudo journalctl -u postgresql -f

# Verify connection settings
pg_isready -h your-host -p 5432 -U your-user

# Test migrations
npm run migration:run
```

### Performance Optimization

#### Backend Optimization
```bash
# Enable PM2 for process management
npm install -g pm2
pm2 start dist/main.js --name cal3-backend

# Configure PM2 ecosystem
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cal3-backend',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8081
    }
  }]
};
```

#### Frontend Optimization
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Enable gzip compression in nginx
gzip on;
gzip_types text/css text/javascript application/javascript application/json;
```

## 📅 **Deployment Checklist**

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates obtained
- [ ] DNS records configured
- [ ] Backup strategy implemented

### Post-Deployment
- [ ] Health checks passing
- [ ] Authentication working
- [ ] Calendar functionality tested
- [ ] Admin panel accessible
- [ ] External calendar sync working
- [ ] Performance monitoring active

### Security Checklist
- [ ] HTTPS enforced
- [ ] Database secured
- [ ] OAuth credentials secured
- [ ] API rate limiting enabled
- [ ] Error logging configured
- [ ] Backup verification completed

## 🔄 **CI/CD Pipeline**

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy Cal3
on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd backend-nestjs && npm ci
      - run: cd backend-nestjs && npm run build
      - run: cd backend-nestjs && npm run test
      - name: Deploy to Azure
        run: |
          az webapp deployment source sync \
            --resource-group ${{ secrets.AZURE_RG }} \
            --name ${{ secrets.AZURE_BACKEND_APP }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

---

**Last Updated**: September 2025
**Tested Platforms**: Azure, Vercel, Railway, AWS, Docker
**Application Version**: Cal3 v1.2.0