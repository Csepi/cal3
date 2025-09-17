# OAuth SSO Setup Guide

This guide will help you configure Google and Microsoft OAuth SSO for your Calendar application.

## Prerequisites

- Backend running on `http://localhost:8081`
- Frontend running on `http://localhost:8080`
- Access to Google Cloud Console and Microsoft Azure Portal

---

## 🔵 Google OAuth 2.0 Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**

### Step 2: Configure OAuth Consent Screen

1. Click **OAuth consent screen** in the left sidebar
2. Choose **External** user type (for testing with any Google account)
3. Fill in the required information:
   - **App name**: Calendar App
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes: `email`, `profile`, `openid`
5. Add test users (your email addresses for testing)

### Step 3: Create OAuth 2.0 Credentials

1. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
2. Choose **Web application** as application type
3. Set the following URLs:
   - **Authorized JavaScript origins**: `http://localhost:8080`
   - **Authorized redirect URIs**: `http://localhost:8081/api/auth/google/callback`
4. Copy the **Client ID** and **Client Secret**

### Step 4: Configure Environment Variables

Add these environment variables to your backend:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:8081/api/auth/google/callback
```

---

## 🟦 Microsoft OAuth 2.0 Setup

### Step 1: Register Application in Azure

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**

### Step 2: Configure Application

1. Set **Name**: Calendar App
2. Set **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
3. Set **Redirect URI**:
   - Type: **Web**
   - URL: `http://localhost:8081/api/auth/microsoft/callback`
4. Click **Register**

### Step 3: Configure Authentication

1. Go to **Authentication** in your app registration
2. Add platform > **Web**
3. Add redirect URI: `http://localhost:8081/api/auth/microsoft/callback`
4. Enable **Access tokens** and **ID tokens** under implicit grant

### Step 4: Get Client Credentials

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Set description and expiration
4. Copy the **Value** (Client Secret)
5. Go to **Overview** and copy the **Application (client) ID**

### Step 5: Configure Environment Variables

Add these environment variables to your backend:

```bash
# Microsoft OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here
MICROSOFT_CALLBACK_URL=http://localhost:8081/api/auth/microsoft/callback
```

---

## 🚀 Running with OAuth Configuration

### Option 1: Environment Variables File

Create a `.env` file in the `backend-nestjs` directory:

```env
# Server Configuration
PORT=8081
JWT_SECRET=calendar-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:8081/api/auth/google/callback

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here
MICROSOFT_CALLBACK_URL=http://localhost:8081/api/auth/microsoft/callback

# Database (Optional - uses SQLite in memory by default)
DB_TYPE=sqlite
```

### Option 2: Command Line

Start the backend with environment variables:

```bash
cd backend-nestjs
GOOGLE_CLIENT_ID=your_id GOOGLE_CLIENT_SECRET=your_secret MICROSOFT_CLIENT_ID=your_id MICROSOFT_CLIENT_SECRET=your_secret PORT=8081 JWT_SECRET=calendar-secret-key npm run start:dev
```

---

## 🧪 Testing OAuth

1. **Start both servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend-nestjs
   npm run start:dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Open frontend**: Navigate to `http://localhost:8080`

3. **Test OAuth Login**:
   - Click **Google** button → Should redirect to Google login
   - Click **Microsoft** button → Should redirect to Microsoft login
   - After successful authentication, you should be redirected back to the calendar

---

## 🔧 Troubleshooting

### Common Issues

**1. OAuth buttons don't work**
- Check if environment variables are set correctly
- Verify callback URLs match exactly
- Ensure backend is running on port 8081

**2. "redirect_uri_mismatch" error**
- Double-check redirect URIs in OAuth provider settings
- Ensure URLs include the correct port (8081 for backend)

**3. "Client ID not found" error**
- Verify CLIENT_ID environment variables are correct
- Check that OAuth credentials are active

**4. CORS errors**
- Frontend must be running on port 8080
- Backend must be running on port 8081

### Debug OAuth

Check OAuth routes are loaded:
```bash
curl http://localhost:8081/api/auth/google
curl http://localhost:8081/api/auth/microsoft
```

Should redirect to OAuth provider login pages.

---

## 📚 API Endpoints

Once configured, these endpoints will be available:

- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/microsoft` - Initiate Microsoft OAuth
- `GET /api/auth/microsoft/callback` - Microsoft OAuth callback

---

## 🔒 Security Notes

- Never commit OAuth secrets to version control
- Use different credentials for production
- Regularly rotate client secrets
- Enable logging to monitor OAuth usage
- Consider rate limiting for production use

---

## 💡 Next Steps

After OAuth is working:

1. **Production Setup**: Use environment-specific credentials
2. **Enhanced Security**: Add CSRF protection, state validation
3. **User Management**: Link OAuth accounts to existing users
4. **Monitoring**: Add analytics for OAuth usage
5. **Multi-Provider**: Allow users to link multiple OAuth providers

---

*Happy coding! 🎉*