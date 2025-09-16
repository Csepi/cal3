# React + TypeScript Calendar App Deployment Guide

## 🎯 **Modern Full-Stack Deployment Strategy**

This document outlines deployment for the upgraded React + TypeScript + Vite + TailwindCSS calendar application with Node.js/Express backend.

## **Architecture Overview**

### **Frontend (React + TypeScript + Vite + TailwindCSS)**
- 📦 **Location**: `frontend/` directory
- 🚀 **Dev Server**: `npm run dev` (Port 5174)
- 🏗️ **Production Build**: `npm run build` → `frontend/dist/`
- 🎨 **Styling**: TailwindCSS with modern component design
- 🔐 **Authentication**: Simple login flow with dashboard

### **Backend (Node.js + TypeScript + PostgreSQL)**
- 📦 **Location**: Root directory (`src/`, compiled to `dist/`)
- 🚀 **Server**: Express.js on Port 4000
- 🗄️ **Database**: Azure PostgreSQL Flexible Server
- 📡 **API Endpoints**: `/api/events` (GET, POST, DELETE)

## **Development Workflow**

### **1. Local Development Setup**
```bash
# Start backend server
npm run build && DB_PASSWORD="Enter.Enter" PORT=4000 node dist/server.js

# Start frontend dev server (separate terminal)
cd frontend && npm run dev
```

### **2. Production Build**
```bash
# Build frontend for production
cd frontend && npm run build

# Build backend
npm run build
```

## **Azure Deployment Options**

### **Option A: Single Azure Web App (Recommended)**

Deploy both frontend and backend as a single application:

```bash
# 1. Build frontend
cd frontend && npm run build

# 2. Copy frontend build to backend static files
cp -r frontend/dist/* ./

# 3. Update backend to serve React build
# (Already configured in src/server.ts)

# 4. Deploy using GitHub connection
az webapp deployment source config \
  --resource-group [RESOURCE_GROUP] \
  --name [WEB_APP_NAME] \
  --repo-url https://github.com/[USERNAME]/[REPOSITORY].git \
  --branch main \
  --manual-integration

# 5. Configure environment variables
az webapp config appsettings set \
  --resource-group [RESOURCE_GROUP] \
  --name [WEB_APP_NAME] \
  --settings \
    DB_HOST="[DATABASE_HOST]" \
    DB_PORT="5432" \
    DB_NAME="[DATABASE_NAME]" \
    DB_USER="[DATABASE_USER]" \
    DB_PASSWORD="[DATABASE_PASSWORD]"
```

### **Option B: Separate Frontend/Backend Services**

Deploy frontend to Azure Static Web Apps and backend to Azure Web App:

#### **Frontend (Azure Static Web Apps)**
```bash
# 1. Build frontend
cd frontend && npm run build

# 2. Deploy to Static Web Apps
az staticwebapp create \
  --name [FRONTEND_NAME] \
  --resource-group [RESOURCE_GROUP] \
  --source https://github.com/[USERNAME]/[REPOSITORY].git \
  --location "West US 2" \
  --branch main \
  --app-location "frontend" \
  --output-location "dist"
```

#### **Backend (Azure Web App)**
```bash
# Use existing backend deployment from DEPLOYMENT.md
```

## **Required Package.json Updates**

### **Root package.json (Backend)**
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "dev": "nodemon --exec ts-node src/server.ts",
    "build:frontend": "cd frontend && npm install && npm run build && cp -r dist/* ../",
    "deploy:prepare": "npm run build && npm run build:frontend"
  },
  "engines": {
    "node": "18.x",
    "npm": "10.x"
  }
}
```

### **Frontend package.json**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

## **Backend Configuration Updates**

The backend is already configured to serve the React frontend:

```typescript
// src/server.ts (lines 161-167)
app.use(express.static(path.join(__dirname, '..')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});
```

## **Environment Variables**

### **Backend (.env)**
```env
DB_HOST=cal2db.postgres.database.azure.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=db_admin
DB_PASSWORD=Enter.Enter
PORT=4000
NODE_ENV=production
```

### **Frontend (Optional - for API URL)**
```env
VITE_API_BASE_URL=http://localhost:4000
```

## **Deployment Automation Script**

Create a deployment script:

```bash
#!/bin/bash
# deploy-react.sh

echo "🚀 Starting React Calendar App Deployment"

# Build frontend
echo "📦 Building frontend..."
cd frontend && npm install && npm run build

# Copy frontend build to root
echo "📁 Copying frontend files..."
cd .. && cp -r frontend/dist/* ./

# Build backend
echo "🔧 Building backend..."
npm run build

# Deploy to Azure
echo "☁️ Deploying to Azure..."
az webapp deployment source sync --resource-group [RESOURCE_GROUP] --name [WEB_APP_NAME]

echo "✅ Deployment complete!"
```

## **Key Features Deployed**

✅ **Modern React UI** with TypeScript and TailwindCSS
✅ **Calendar Grid** with event indicators
✅ **Login/Dashboard** authentication flow
✅ **API Integration** with backend endpoints
✅ **Mobile Responsive** design
✅ **Production Build** optimization

## **Testing Deployment**

### **Health Checks**
```bash
# Backend API
curl https://[APP_NAME].azurewebsites.net/health

# Frontend (React App)
curl https://[APP_NAME].azurewebsites.net/

# Events API
curl https://[APP_NAME].azurewebsites.net/api/events
```

### **Login Credentials**
- **Username**: Any username
- **Password**: `demo123`

## **Troubleshooting**

### **Common Issues**:
1. **React Router Issues**: Ensure backend serves `index.html` for all routes
2. **API CORS**: Backend already configured for CORS
3. **Build Errors**: Check TypeScript compilation errors
4. **TailwindCSS Issues**: Verify PostCSS configuration

### **Debug Commands**:
```bash
# Check deployment logs
az webapp log tail --resource-group [RESOURCE_GROUP] --name [WEB_APP_NAME]

# Check build output
cd frontend && npm run build -- --verbose
```

---
*Last Updated: September 2025*
*Stack: React 18, TypeScript 5, Vite 5, TailwindCSS 4, Node.js 18, Azure Web Apps*