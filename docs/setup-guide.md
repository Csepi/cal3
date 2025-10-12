# Cal3 Complete Setup Guide

## 🚀 **Quick Start Overview**

This comprehensive guide will help you set up the Cal3 calendar application from scratch, including both frontend and backend components, database configuration, and optional external integrations.

## 📋 **System Requirements**

### Minimum Requirements
- **Node.js**: 18.0+ (LTS recommended)
- **npm**: 10.0+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)

### Optional Requirements
- **PostgreSQL**: 13+ (for production)
- **Git**: 2.30+ (for version control)
- **Docker**: 20.10+ (for containerized deployment)

## 🔧 **Initial Setup**

### 1. Clone the Repository
```bash
# Clone the Cal3 repository
git clone https://github.com/Csepi/cal3.git
cd cal3

# Verify project structure
ls -la
# Should show: frontend/, backend-nestjs/, and documentation files
```

### 2. Install Node.js Dependencies

#### Backend Setup
```bash
cd backend-nestjs
npm install

# Verify installation
npm list --depth=0
```

#### Frontend Setup
```bash
cd ../frontend
npm install

# Verify installation
npm list --depth=0
```

## 🗄️ **Database Configuration**

### Option 1: SQLite (Development - Default)
SQLite runs automatically with no additional setup required.

```bash
# Backend will create database.db automatically
# No additional configuration needed
```

### Option 2: PostgreSQL (Production Recommended)

#### Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Windows (download from postgresql.org)
# Or use Docker:
docker run --name cal3-postgres \
  -e POSTGRES_DB=cal3_db \
  -e POSTGRES_USER=cal3user \
  -e POSTGRES_PASSWORD=securepassword \
  -p 5432:5432 \
  -d postgres:15
```

#### Configure PostgreSQL
```sql
-- Connect to PostgreSQL
sudo -u postgres psql

-- Create database and user
CREATE DATABASE cal3_db;
CREATE USER cal3user WITH ENCRYPTED PASSWORD 'securepassword';
GRANT ALL PRIVILEGES ON DATABASE cal3_db TO cal3user;

-- Exit PostgreSQL
\q
```

## ⚙️ **Environment Configuration**

### Backend Environment Variables

Create `.env` file in `backend-nestjs/` directory:

#### Basic Configuration (SQLite)
```bash
# Database (SQLite - Development)
DB_TYPE=sqlite
DB_NAME=database.db

# Authentication
JWT_SECRET=calendar-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Application
PORT=8081
NODE_ENV=development
```

#### Production Configuration (PostgreSQL)
```bash
# Database (PostgreSQL - Production)
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=cal3user
DB_PASSWORD=securepassword
DB_NAME=cal3_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=24h

# OAuth (Optional - see OAuth section below)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8081/api/auth/google/callback

MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_REDIRECT_URI=http://localhost:8081/api/auth/microsoft/callback

# Application
PORT=8081
NODE_ENV=production
```

### Frontend Environment Variables (Optional)

Create `.env` file in `frontend/` directory:
```bash
# API Configuration (only needed if backend is on different host)
VITE_API_BASE_URL=http://localhost:8081/api

# Development tools
VITE_ENABLE_DEV_TOOLS=true
```

## 🏃‍♂️ **Running the Application**

### **⚠️ CRITICAL PORT REQUIREMENTS**
- **Frontend**: MUST run on port 8080
- **Backend**: MUST run on port 8081

These ports are hardcoded in the application and cannot be changed.

### Start Development Servers

#### Terminal 1 - Backend
```bash
cd backend-nestjs

# Run database migrations (first time only)
npm run migration:run

# Seed database with initial data (optional)
npm run seed

# Start development server
PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev

# Backend should now be running on http://localhost:8081
```

#### Terminal 2 - Frontend
```bash
cd frontend

# Start development server (MUST use port 8080)
npm run dev -- --port 8080

# Frontend should now be running on http://localhost:8080
```

### Verify Installation
```bash
# Test backend health
curl http://localhost:8081/api/health

# Test frontend (open in browser)
open http://localhost:8080
```

## 👤 **Default User Accounts**

The application comes with pre-configured test accounts:

### Admin Account
- **Username**: `admin`
- **Password**: `enterenter`
- **Role**: Administrator (full access)

### Regular User Account
- **Username**: `user`
- **Password**: `enterenter`
- **Role**: Standard user

## 🎨 **Application Features Tour**

### 1. **Login and Authentication**
- Navigate to `http://localhost:8080`
- Login with admin credentials above
- Explore role-based interface differences

### 2. **Calendar Management**
- Create new calendars with custom colors
- Switch between Month and Week views
- Create events with drag-and-drop
- Test recurring event patterns

### 3. **User Profile Customization**
- Access Profile tab
- Change theme colors (16 available)
- Set timezone from 70+ options
- Configure time format (12h/24h)

### 4. **Admin Panel** (Admin users only)
- Access Admin Panel tab
- Manage user accounts
- Modify usage plans
- View system statistics

### 5. **External Calendar Sync** (Optional)
- Configure OAuth providers (see OAuth section)
- Sync with Google Calendar or Outlook
- Monitor sync status

## 🔐 **OAuth SSO Setup (Optional)**

### Google OAuth 2.0 Setup

#### Step 1: Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Navigate to **APIs & Services** > **Credentials**

#### Step 2: OAuth Consent Screen
1. Click **OAuth consent screen**
2. Choose **External** user type
3. Fill required information:
   - App name: Cal3 Calendar
   - User support email: your-email@example.com
   - Developer contact: your-email@example.com
4. Add scopes: `email`, `profile`, `openid`

#### Step 3: Create Credentials
1. **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
2. Application type: **Web application**
3. Authorized JavaScript origins: `http://localhost:8080`
4. Authorized redirect URIs: `http://localhost:8081/api/auth/google/callback`
5. Copy Client ID and Client Secret

### Microsoft OAuth 2.0 Setup

#### Step 1: Azure Portal
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**

#### Step 2: Configure Application
1. Name: Cal3 Calendar
2. Supported account types: Personal and organizational accounts
3. Redirect URI: `http://localhost:8081/api/auth/microsoft/callback`

#### Step 3: Get Credentials
1. Go to **Certificates & secrets** > **New client secret**
2. Copy the secret value
3. Go to **Overview** and copy Application (client) ID

### Add OAuth to Environment Variables
Update your `backend-nestjs/.env` file:
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8081/api/auth/google/callback

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here
MICROSOFT_REDIRECT_URI=http://localhost:8081/api/auth/microsoft/callback
```

Restart the backend server after adding OAuth credentials.

## 🔍 **Testing Your Setup**

### Backend API Tests
```bash
# Health check
curl http://localhost:8081/api/health

# Authentication test
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"enterenter"}'

# Get events (requires authentication token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8081/api/events
```

### Frontend Feature Tests
1. **Login Flow**: Test both admin and user accounts
2. **Calendar Operations**: Create, edit, delete events
3. **Theme Changes**: Switch between different color themes
4. **Time Formats**: Toggle between 12h and 24h formats
5. **Responsive Design**: Test on mobile viewport
6. **Admin Features**: User management, usage plans

### Database Tests
```bash
# Check database connection
cd backend-nestjs
npm run migration:show

# Test data integrity
npm run test

# Check seeded data
npm run seed:status
```

## 🐛 **Troubleshooting**

### Common Setup Issues

#### **Port Already in Use**
```bash
# Find process using port 8080
netstat -ano | findstr :8080
# OR on Unix/macOS
lsof -i :8080

# Kill process (Windows)
taskkill /PID <pid> /F

# Kill process (Unix/macOS)
kill -9 <pid>
```

#### **Node.js Version Issues**
```bash
# Check Node.js version
node --version

# If version is too old, update:
# Windows: Download from nodejs.org
# macOS: brew install node
# Linux: nvm install node
```

#### **Database Connection Errors**
```bash
# SQLite: Check file permissions
ls -la backend-nestjs/database.db

# PostgreSQL: Test connection
psql -h localhost -U cal3user -d cal3_db -c "SELECT version();"
```

#### **Environment Variables Not Loading**
```bash
# Verify .env file location
ls -la backend-nestjs/.env

# Check environment variable syntax (no spaces around =)
cat backend-nestjs/.env | grep JWT_SECRET

# Test environment loading
cd backend-nestjs
node -e "require('dotenv').config(); console.log(process.env.JWT_SECRET);"
```

#### **Frontend Build Issues**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run typecheck
```

#### **CORS Errors**
- Ensure frontend runs on port 8080
- Ensure backend runs on port 8081
- Check browser developer tools for specific CORS errors
- Verify no other applications are using these ports

### Development Tools

#### Enable Detailed Logging
```bash
# Backend debug mode
cd backend-nestjs
DEBUG=* npm run start:dev

# TypeORM query logging
DEBUG=typeorm:query npm run start:dev
```

#### Database Management
```bash
# View migration status
npm run migration:show

# Create new migration
npm run migration:generate -- src/migrations/NewMigration

# Revert last migration
npm run migration:revert
```

## 🚀 **Next Steps**

### Development Workflow
1. **Code Changes**: Edit files with hot reload enabled
2. **Testing**: Run `npm test` in both frontend and backend
3. **Database Changes**: Create migrations for schema changes
4. **Git Workflow**: Commit changes with descriptive messages

### Production Deployment
1. **Review Deployment Guide**: Read `DEPLOYMENT.md`
2. **Environment Setup**: Configure production environment variables
3. **SSL Certificates**: Obtain SSL certificates for HTTPS
4. **Database Setup**: Configure production PostgreSQL instance
5. **Monitoring**: Set up application monitoring and logging

### Advanced Features
1. **Custom OAuth Providers**: Add additional authentication providers
2. **Email Notifications**: Configure email service for notifications
3. **Mobile App**: Consider React Native for mobile application
4. **API Extensions**: Develop custom API endpoints
5. **Third-party Integrations**: Connect with other calendar services

## 📚 **Additional Resources**

### Documentation
- [README.md](./README.md) - Project overview and features
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [CLAUDE.md](./CLAUDE.md) - Development guidelines

### Learning Resources
- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Community Support
- [GitHub Issues](https://github.com/Csepi/cal3/issues)
- [Discussions](https://github.com/Csepi/cal3/discussions)

---

**Setup Guide Version**: 1.2.0
**Last Updated**: September 2025
**Compatible with**: Cal3 v1.2.0

🎉 **Congratulations!** You now have a fully functional Cal3 calendar application running locally. Happy coding!