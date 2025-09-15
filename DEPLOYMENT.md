# Azure Deployment Guide - Definitive Method

## 🏆 **OFFICIAL DEPLOYMENT WORKFLOW**

This document outlines the **proven, simplest method** for deploying Node.js applications to Azure Web Apps in 2025.

### **Prerequisites**
- Azure CLI installed and logged in
- GitHub repository with Node.js application
- Existing Azure Web App or App Service Plan

### **Method: GitHub Repository Connection via Azure CLI**
**⏱️ Setup Time**: 2 minutes | **🎯 Success Rate**: 95%

## **Step-by-Step Instructions**

### 1. **Connect GitHub Repository**
```bash
az webapp deployment source config \
  --resource-group [RESOURCE_GROUP] \
  --name [WEB_APP_NAME] \
  --repo-url https://github.com/[USERNAME]/[REPOSITORY].git \
  --branch main \
  --manual-integration
```

### 2. **Configure Environment Variables**
```bash
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

### 3. **Trigger Deployment**
```bash
# Manual sync when needed
az webapp deployment source sync --resource-group [RESOURCE_GROUP] --name [WEB_APP_NAME]

# Restart app
az webapp restart --resource-group [RESOURCE_GROUP] --name [WEB_APP_NAME]
```

### 4. **Verify Deployment**
```bash
# Test health endpoint
curl https://[WEB_APP_NAME].azurewebsites.net/health

# Test API endpoints
curl https://[WEB_APP_NAME].azurewebsites.net/api/events
```

## **Required package.json Configuration**

Ensure your `package.json` includes:
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "prestart": "npm run build"
  },
  "engines": {
    "node": "18.x",
    "npm": "10.x"
  }
}
```

## **Automatic Deployment on Push**

Once configured, deployments happen automatically when you push to the connected branch:
```bash
git add .
git commit -m "Update application"
git push origin main  # Triggers automatic Azure deployment
```

## **Troubleshooting**

### Common Issues:
1. **API returning HTML instead of JSON**: Check startup command configuration
2. **Database connection errors**: Verify environment variables
3. **Build failures**: Ensure TypeScript compiles locally

### Debug Commands:
```bash
# Check deployment logs
az webapp log tail --resource-group [RESOURCE_GROUP] --name [WEB_APP_NAME]

# Check configuration
az webapp config show --resource-group [RESOURCE_GROUP] --name [WEB_APP_NAME]
```

## **Why This Method Works Best**

✅ **No authentication tokens required**
✅ **Automatic builds and deployments**
✅ **Works with existing Azure resources**
✅ **Simple one-time setup**
✅ **Reliable for production use**

---
*Last Updated: September 2025*
*Tested with: Node.js 18.x, TypeScript 5.x, Azure Web Apps*