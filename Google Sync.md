# Cal3 Calendar Application - Complete Setup Guide

## Overview
Cal3 is a full-stack calendar application with OAuth integration for Google Calendar and Microsoft Outlook, featuring real-time synchronization, user management, and a modern web interface.

## System Architecture
- **Backend**: NestJS with TypeScript
- **Frontend**: React with TypeScript and Tailwind CSS
- **Database**: SQLite (local) or PostgreSQL (Azure)
- **Authentication**: JWT + OAuth 2.0 (Google, Microsoft)
- **Calendar Sync**: Real-time bidirectional synchronization

---

## Prerequisites

### Software Requirements
- Node.js 18+ and npm
- Git
- Modern web browser

### Account Requirements
- Google Cloud Console account
- Microsoft Azure account (optional)
- Domain for production deployment (optional)

---

## Backend Setup

### 1. Environment Configuration

Create `backend-nestjs/.env` file:

```env
# Database Configuration
DB_TYPE=sqlite
DB_DATABASE=cal3.db

# For Azure PostgreSQL (optional)
# DB_TYPE=postgres
# DB_HOST=your-server.postgres.database.azure.com
# DB_PORT=5432
# DB_USERNAME=your-username
# DB_PASSWORD=your-password
# DB_NAME=cal3

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
PORT=8081

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8081/api/auth/google/callback

# Microsoft OAuth Configuration
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:8081/api/auth/microsoft/callback

# Application URLs
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:8081
```

### 2. Install Dependencies and Start Backend

```bash
cd backend-nestjs
npm install
npm run start:dev
```

### 3. Seed Database (First Run Only)

```bash
npm run seed
```

This creates:
- Admin user: `admin` / `enterenter`
- Sample users: `alice`, `bob`, `charlie` (password: `enterenter`)
- Sample calendars and events

---

## Frontend Setup

### 1. Install Dependencies and Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: http://localhost:8080

---

## OAuth Configuration

### Google Cloud Console Setup

#### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing one
3. Enable **Google Calendar API**

#### 2. Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill required fields:
   - **App name**: Cal3 Calendar Application
   - **User support email**: your-email@example.com
   - **Developer contact**: your-email@example.com
4. Add scopes:
   - `../auth/calendar` (Google Calendar API)
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. **Add test users** for development:
   - Add your Google account email
   - Add any accounts you want to test with

#### 3. Create OAuth Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Application type: **Web application**
4. Name: **Cal3 Calendar App**
5. **Authorized redirect URIs**:
   - `http://localhost:8081/api/auth/google/callback`
   - `http://your-domain.com/api/auth/google/callback` (for production)

#### 4. Handle Google Verification Process

**For Development/Testing:**
- App remains in "Testing" mode
- Only added test users can access
- No verification required
- 100 user limit

**For Production:**
1. **Publishing Status**: Change from "Testing" to "In production"
2. **Verification Process**:
   - Submit app for verification if using sensitive scopes
   - Provide OAuth consent screen details
   - May require domain verification
   - Can take several days/weeks

**Current Error Fix:**
```
Error 403: access_denied
Cal3 Calendar Application has not completed the Google verification process
```

**Solution Options:**
1. **Add yourself as test user** (immediate fix)
2. **Submit for verification** (production solution)
3. **Use internal app** (if within organization)

### Microsoft Azure Setup

#### 1. Register Application
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill details:
   - **Name**: Cal3 Calendar Application
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: `http://localhost:8081/api/auth/microsoft/callback`

#### 2. Configure API Permissions
1. Go to **API permissions**
2. Add permissions:
   - **Microsoft Graph** > **Delegated permissions**:
     - `Calendars.ReadWrite`
     - `offline_access`
     - `User.Read`

#### 3. Create Client Secret
1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add description: "Cal3 Application Secret"
4. Choose expiration: 24 months
5. **Copy the VALUE** (not the ID) - starts with `~` or similar
6. **IMPORTANT**: Save this value immediately - it won't be shown again

#### 4. Grant Admin Consent (Optional)
1. Go to **API permissions**
2. Click **Grant admin consent** for your tenant
3. This allows all users in your organization to use the app

---

## Common Issues and Solutions

### Microsoft OAuth Errors

#### Error: `AADSTS7000215: Invalid client secret provided`
**Cause**: Using client secret ID instead of secret value
**Solution**:
1. Go to Azure Portal > App registrations > Your app > Certificates & secrets
2. Copy the **secret VALUE** (not ID)
3. Update `MICROSOFT_CLIENT_SECRET` in `.env`
4. Restart backend server

#### Error: `500 Internal Server Error` on Microsoft callback
**Cause**: Invalid client credentials or network issues
**Solution**:
1. Verify all Microsoft OAuth environment variables
2. Check server logs for specific error
3. Ensure redirect URI matches exactly
4. Verify client secret is current (not expired)

### Google OAuth Errors

#### Error: `redirect_uri_mismatch`
**Cause**: Redirect URI in request doesn't match registered URI
**Solution**:
1. Check Google Cloud Console > Credentials > OAuth 2.0 Client IDs
2. Ensure redirect URI exactly matches: `http://localhost:8081/api/auth/google/callback`
3. Update `.env` with correct `GOOGLE_CALLBACK_URL`

#### Error: `access_denied` (App not verified)
**Cause**: App in testing mode, user not added as test user
**Solution**:
1. **Quick fix**: Add user email as test user in OAuth consent screen
2. **Production fix**: Submit app for Google verification
3. **Alternative**: Use different Google account that's added as test user

### Database Connection Issues

#### SQLite Database
- Default location: `backend-nestjs/cal3.db`
- Automatically created on first run
- Good for development and testing

#### Azure PostgreSQL Connection
**Error**: `getaddrinfo ENOTFOUND cal3-server.postgres.database.azure.com`
**Solutions**:
1. **Check network connectivity** to Azure
2. **Verify hostname** is correct
3. **Check Azure firewall rules**
4. **Ensure PostgreSQL server is running**
5. **Use SQLite for local development**

---

## Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com

# Update OAuth callback URLs
GOOGLE_CALLBACK_URL=https://api.your-domain.com/api/auth/google/callback
MICROSOFT_CALLBACK_URL=https://api.your-domain.com/api/auth/microsoft/callback

# Use PostgreSQL for production
DB_TYPE=postgres
DB_HOST=your-production-db.com
# ... other DB settings
```

### OAuth Callback URL Updates

**Google Cloud Console:**
- Add production callback URL: `https://api.your-domain.com/api/auth/google/callback`

**Microsoft Azure:**
- Add production redirect URI in App registration

### Security Considerations

1. **JWT Secret**: Use strong, random secret for production
2. **HTTPS**: Always use HTTPS in production
3. **Client Secrets**: Store securely, rotate regularly
4. **Database**: Use connection pooling and SSL
5. **CORS**: Configure properly for production domains

---

## Testing the Application

### 1. Start Both Servers
```bash
# Terminal 1 - Backend
cd backend-nestjs
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Access Application
- Frontend: http://localhost:8080
- Backend API: http://localhost:8081/api

### 3. Test Authentication
1. **Local Login**: Use `admin` / `enterenter`
2. **Google OAuth**: Click "Sign in with Google"
   - Must be added as test user in Google Cloud Console
3. **Microsoft OAuth**: Click "Sign in with Microsoft"
   - Any Microsoft account should work

### 4. Test Calendar Sync
1. Login as admin
2. Navigate to Calendar Sync section
3. Connect Google Calendar or Microsoft Outlook
4. Select calendars to sync
5. Verify events are imported

---

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - Local login
- `GET /api/auth/google` - Google OAuth initiation
- `GET /api/auth/microsoft` - Microsoft OAuth initiation
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/microsoft/callback` - Microsoft OAuth callback

### Calendar Sync Endpoints
- `GET /api/calendar-sync/status` - Get sync status
- `GET /api/calendar-sync/auth/:provider` - Get OAuth URL for calendar sync
- `GET /api/calendar-sync/callback/:provider` - Handle calendar sync OAuth callback
- `POST /api/calendar-sync/sync` - Sync selected calendars
- `POST /api/calendar-sync/disconnect` - Disconnect provider
- `POST /api/calendar-sync/force` - Force sync

### Admin Endpoints (Admin role required)
- `GET /api/admin/users` - List all users
- `GET /api/admin/calendars` - List all calendars
- `GET /api/admin/stats` - Get database statistics

---

## Troubleshooting

### Check Server Status
```bash
curl http://localhost:8081/api
```

### Check Authentication
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"enterenter"}'
```

### View Server Logs
Backend logs show in terminal where `npm run start:dev` is running.

### Reset Database
```bash
cd backend-nestjs
rm cal3.db
npm run start:dev  # Will recreate database
npm run seed       # Recreate sample data
```

---

## Support and Development

### Project Structure
```
cal3/
├── backend-nestjs/          # NestJS backend
│   ├── src/
│   │   ├── auth/           # Authentication modules
│   │   ├── calendar-sync/  # Calendar sync functionality
│   │   ├── entities/       # Database entities
│   │   └── ...
│   └── .env               # Environment configuration
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── ...
└── Google Sync.md        # This documentation
```

### Contributing
1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

### License
[Add your license information here]

---

## Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] Clone repository
- [ ] Create `.env` file with all required variables
- [ ] Set up Google Cloud Console project and OAuth
- [ ] Set up Microsoft Azure app registration
- [ ] Add yourself as Google test user
- [ ] Install backend dependencies: `cd backend-nestjs && npm install`
- [ ] Install frontend dependencies: `cd frontend && npm install`
- [ ] Start backend: `npm run start:dev`
- [ ] Seed database: `npm run seed`
- [ ] Start frontend: `npm run dev`
- [ ] Test login with `admin` / `enterenter`
- [ ] Test OAuth flows
- [ ] Test calendar sync functionality

**Last Updated**: September 2025
**Version**: 1.0.0