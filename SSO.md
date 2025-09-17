# Single Sign-On (SSO) Setup Tutorial for Cal3 Calendar Application

This comprehensive guide will walk you through setting up Google and Microsoft SSO authentication for the Cal3 Calendar application. The application uses NestJS backend with Passport.js strategies for OAuth implementation.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Google OAuth Setup](#google-oauth-setup)
3. [Microsoft Azure OAuth Setup](#microsoft-azure-oauth-setup)
4. [Backend Configuration](#backend-configuration)
5. [Frontend Configuration](#frontend-configuration)
6. [Testing SSO](#testing-sso)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

---

## Prerequisites

Before starting, ensure you have:
- A Google account for Google Cloud Console access
- A Microsoft account for Azure Portal access
- The Cal3 application running locally (backend on port 8081, frontend on port 8080)
- Admin access to both cloud platforms for app registration

---

## Google OAuth Setup

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select an existing project or create a new one:
   - Click the project dropdown in the top navigation
   - Select "New Project"
   - Enter project name: `cal3-calendar-app`
   - Select your organization (if applicable)
   - Click "Create"

### Step 2: Enable Google+ API

1. In the left sidebar, navigate to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on "Google+ API" and click **Enable**
4. Also enable "Gmail API" and "Google Calendar API" if you plan to integrate with these services

### Step 3: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Select **User Type**:
   - **Internal**: Only users within your organization can access the app
   - **External**: Any user with a Google account can access the app
3. Click **Create**

#### Fill Out App Information:
- **App name**: `Cal3 Calendar Application`
- **User support email**: Your email address
- **App logo**: Upload your app logo (optional)
- **App domain**:
  - Application homepage: `http://localhost:8080`
  - Privacy policy: `http://localhost:8080/privacy` (create this page)
  - Terms of service: `http://localhost:8080/terms` (create this page)
- **Developer contact information**: Your email address

4. Click **Save and Continue**

#### Configure Scopes:
1. Click **Add or Remove Scopes**
2. Select the following scopes:
   - `email`
   - `profile`
   - `openid`
3. Click **Update** and then **Save and Continue**

#### Test Users (for External apps in testing):
1. Add test users by clicking **Add Users**
2. Enter email addresses of users who can test the app
3. Click **Save and Continue**

### Step 4: Create OAuth Client Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **+ Create Credentials** > **OAuth client ID**
3. Select **Application type**: Web application
4. **Name**: `Cal3 Web Client`
5. **Authorized JavaScript origins**:
   ```
   http://localhost:8080
   http://localhost:5173
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:8081/api/auth/google/callback
   ```
7. Click **Create**

### Step 5: Download Credentials

⚠️ **CRITICAL**: Download your client credentials immediately! As of 2025, Google only shows the client secret once upon creation.

1. A modal will appear with your **Client ID** and **Client Secret**
2. Click **Download JSON** to save the credentials file
3. Copy the **Client ID** and **Client Secret** for environment configuration

**Example credentials:**
```
Client ID: 123456789-abcdefghijklmnop.apps.googleusercontent.com
Client Secret: GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx
```

---

## Microsoft Azure OAuth Setup

### Step 1: Access Azure Portal

1. Go to [Azure Portal](https://portal.azure.com/)
2. Sign in with your Microsoft account
3. Navigate to **Microsoft Entra ID** (formerly Azure Active Directory)

### Step 2: Register a New Application

1. In the left sidebar, click **App registrations**
2. Click **+ New registration**
3. Fill out the registration form:

#### Basic Information:
- **Name**: `Cal3 Calendar Application`
- **Supported account types**: Select one of:
  - **Accounts in this organizational directory only** (Single tenant)
  - **Accounts in any organizational directory** (Multi-tenant)
  - **Accounts in any organizational directory and personal Microsoft accounts** (Multi-tenant + personal)
- **Redirect URI**:
  - Platform: **Web**
  - URI: `http://localhost:8081/api/auth/microsoft/callback`

4. Click **Register**

### Step 3: Configure Authentication

1. After registration, you'll be redirected to the app overview page
2. Note down the **Application (client) ID**
3. Click **Authentication** in the left sidebar
4. Under **Platform configurations**, verify your redirect URI is listed
5. Under **Implicit grant and hybrid flows**, enable:
   - ✅ **Access tokens**
   - ✅ **ID tokens**
6. Click **Save**

### Step 4: Create Client Secret

1. Click **Certificates & secrets** in the left sidebar
2. Under **Client secrets**, click **+ New client secret**
3. **Description**: `Cal3 Application Secret`
4. **Expires**: Choose expiration (recommended: 24 months)
5. Click **Add**

⚠️ **CRITICAL**: Copy the **Value** of the client secret immediately! It will be hidden after you navigate away.

### Step 5: Configure API Permissions

1. Click **API permissions** in the left sidebar
2. The app should already have **Microsoft Graph** > **User.Read** permission
3. To add more permissions, click **+ Add a permission**
4. Select **Microsoft Graph** > **Delegated permissions**
5. Add these permissions:
   - `email`
   - `profile`
   - `openid`
   - `User.Read`
6. Click **Add permissions**
7. Click **Grant admin consent** (if you're an admin)

**Example credentials:**
```
Application (client) ID: 12345678-1234-1234-1234-123456789abc
Client Secret: AbC~dEf123GhI456JkL789MnO012PqR345StuVwx
Directory (tenant) ID: 87654321-4321-4321-4321-cba987654321
```

---

## Backend Configuration

### Step 1: Environment Variables

Create or update your `.env` file in the `backend-nestjs` directory:

```env
# JWT Configuration
JWT_SECRET=calendar-secret-key

# Port Configuration
PORT=8081

# Google OAuth Configuration
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx
GOOGLE_CALLBACK_URL=http://localhost:8081/api/auth/google/callback

# Microsoft OAuth Configuration
MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789abc
MICROSOFT_CLIENT_SECRET=AbC~dEf123GhI456JkL789MnO012PqR345StuVwx
MICROSOFT_CALLBACK_URL=http://localhost:8081/api/auth/microsoft/callback
MICROSOFT_TENANT_ID=87654321-4321-4321-4321-cba987654321

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:8080
```

### Step 2: Update OAuth Strategies (if needed)

The backend already includes Google and Microsoft strategies. Verify the callback URLs match your environment:

**Google Strategy** (`src/auth/google.strategy.ts`):
```typescript
callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8081/api/auth/google/callback',
```

**Microsoft Strategy** (`src/auth/microsoft.strategy.ts`):
```typescript
callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:8081/api/auth/microsoft/callback',
```

### Step 3: Update Frontend Redirect URLs

In `src/auth/auth.controller.ts`, update the redirect URLs to match your frontend:

```typescript
// Google OAuth callback
async googleAuthRedirect(@Req() req, @Res() res) {
  const result = req.user;
  const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${result.access_token}&provider=google`;
  return res.redirect(redirectUrl);
}

// Microsoft OAuth callback
async microsoftAuthRedirect(@Req() req, @Res() res) {
  const result = req.user;
  const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${result.access_token}&provider=microsoft`;
  return res.redirect(redirectUrl);
}
```

---

## Frontend Configuration

### Step 1: Update API Service

The frontend API service (`src/services/api.ts`) already includes OAuth methods:

```typescript
// OAuth methods
initiateGoogleLogin(): void {
  window.location.href = `${API_BASE_URL}/api/auth/google`;
}

initiateMicrosoftLogin(): void {
  window.location.href = `${API_BASE_URL}/api/auth/microsoft`;
}
```

### Step 2: Create OAuth Callback Handler

Create a new component `src/components/AuthCallback.tsx`:

```typescript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');

    if (token) {
      // Store the token
      localStorage.setItem('authToken', token);

      // Redirect to dashboard
      navigate('/dashboard');
    } else {
      // Handle error
      navigate('/login?error=oauth_failed');
    }
  }, [navigate, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
```

### Step 3: Add Route for OAuth Callback

In your router configuration, add the callback route:

```typescript
import AuthCallback from './components/AuthCallback';

// Add this route
{
  path: '/auth/callback',
  element: <AuthCallback />
}
```

### Step 4: Update Login Component

Add OAuth buttons to your login component:

```typescript
const handleGoogleLogin = () => {
  apiService.initiateGoogleLogin();
};

const handleMicrosoftLogin = () => {
  apiService.initiateMicrosoftLogin();
};

// In your JSX:
<button
  type="button"
  onClick={handleGoogleLogin}
  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
>
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    {/* Google icon SVG */}
  </svg>
  Continue with Google
</button>

<button
  type="button"
  onClick={handleMicrosoftLogin}
  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
>
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    {/* Microsoft icon SVG */}
  </svg>
  Continue with Microsoft
</button>
```

---

## Testing SSO

### Step 1: Start the Application

1. Start the backend:
   ```bash
   cd backend-nestjs
   PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

### Step 2: Test Google OAuth

1. Navigate to `http://localhost:8080/login`
2. Click "Continue with Google"
3. You should be redirected to Google's consent screen
4. Grant permissions
5. You should be redirected back to your application with authentication

### Step 3: Test Microsoft OAuth

1. Navigate to `http://localhost:8080/login`
2. Click "Continue with Microsoft"
3. You should be redirected to Microsoft's consent screen
4. Grant permissions
5. You should be redirected back to your application with authentication

### Step 4: Verify User Creation

Check the backend logs to ensure users are being created properly. You should see database queries creating new users with the OAuth provider information.

---

## Troubleshooting

### Common Google OAuth Issues

**"redirect_uri_mismatch" Error:**
- Verify the redirect URI in Google Cloud Console exactly matches your backend endpoint
- Ensure no trailing slashes or extra characters
- Check that you're using the correct protocol (http for localhost)

**"access_blocked" Error:**
- Your app may be in testing mode with restricted users
- Add your test email to the test users list in OAuth consent screen
- Or submit your app for verification if ready for production

**"invalid_client" Error:**
- Check that your client ID and secret are correctly set in environment variables
- Ensure the client ID matches exactly (no extra spaces or characters)

### Common Microsoft OAuth Issues

**"AADSTS50011" Error (Redirect URI mismatch):**
- Verify the redirect URI in Azure App Registration exactly matches your backend endpoint
- Check that the URI is registered under "Authentication" > "Platform configurations"

**"AADSTS700016" Error (Application not found):**
- Verify your client ID is correct
- Ensure the application is registered in the correct tenant

**"AADSTS50020" Error (User not in tenant):**
- The user account doesn't exist in the tenant
- If using single-tenant, add the user to your organization
- Consider switching to multi-tenant if appropriate

### General Issues

**CORS Errors:**
- Ensure your frontend URL is added to authorized origins in both Google and Microsoft configurations
- Check that your backend CORS configuration allows the frontend domain

**Token Issues:**
- Verify JWT_SECRET is set in environment variables
- Check token expiration times
- Ensure tokens are being stored correctly in frontend

**Network Issues:**
- Verify your application is accessible from the internet if testing from external OAuth providers
- Check firewall settings
- Ensure ports 8080 and 8081 are available

---

## Security Best Practices

### Environment Variables
- **Never commit** client secrets to version control
- Use different credentials for development, staging, and production
- Store production secrets in secure secret managers (Azure Key Vault, Google Secret Manager)

### OAuth Configuration
- **Principle of Least Privilege**: Only request necessary scopes
- **Validate State Parameter**: Implement CSRF protection (the current implementation can be enhanced with state validation)
- **Use HTTPS**: Always use HTTPS in production environments
- **Token Expiration**: Set appropriate token expiration times

### Backend Security
- **Validate Tokens**: Always validate OAuth tokens on the backend
- **Sanitize Data**: Sanitize all user data received from OAuth providers
- **Rate Limiting**: Implement rate limiting on authentication endpoints
- **Logging**: Log authentication attempts for security monitoring

### Frontend Security
- **Secure Storage**: Consider using secure HTTP-only cookies instead of localStorage for tokens
- **XSS Protection**: Sanitize all user-generated content
- **CSP Headers**: Implement Content Security Policy headers

### Production Checklist

Before deploying to production:

#### Google OAuth:
- [ ] Submit app for verification if requesting sensitive scopes
- [ ] Update OAuth consent screen with production URLs
- [ ] Replace localhost URLs with production domains
- [ ] Configure proper branding and privacy policy

#### Microsoft OAuth:
- [ ] Remove any test users from app registration
- [ ] Update redirect URIs to production URLs
- [ ] Consider app certification for enhanced trust
- [ ] Configure proper app permissions

#### General:
- [ ] Use environment-specific OAuth apps (dev, staging, prod)
- [ ] Implement proper error handling and user feedback
- [ ] Set up monitoring and alerting for authentication failures
- [ ] Document the OAuth flow for your team
- [ ] Test with real users before launch

### Monitoring and Maintenance

- **Monitor OAuth Usage**: Track authentication success/failure rates
- **Update Dependencies**: Keep OAuth libraries and dependencies updated
- **Rotate Secrets**: Regularly rotate client secrets (especially before expiration)
- **Review Permissions**: Periodically review and minimize requested scopes
- **User Feedback**: Collect feedback on the authentication experience

---

## Conclusion

This tutorial provides a comprehensive setup for Google and Microsoft SSO in your Cal3 Calendar application. The implementation uses industry-standard OAuth 2.0 flows with proper security considerations for 2025 requirements.

Remember to:
1. Test thoroughly in development before deploying to production
2. Keep your OAuth credentials secure and never commit them to version control
3. Monitor authentication flows and user feedback
4. Stay updated with OAuth provider policy changes
5. Follow security best practices for production deployment

For additional support or questions about the implementation, refer to:
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Identity Platform Documentation](https://learn.microsoft.com/en-us/entra/identity-platform/)
- [Passport.js Documentation](https://www.passportjs.org/docs/)