# Feature Flags System

## Overview

The Cal3 application includes a comprehensive feature flags system that allows administrators to enable or disable specific features across the entire application. When a feature is disabled via feature flags, all UI elements (buttons, tabs, forms) related to that feature are automatically hidden from users, regardless of their permissions.

## Available Feature Flags

### 1. OAuth Authentication (`ENABLE_OAUTH`)
- **Controls**: SSO login buttons (Google, Microsoft) on the login page
- **Default**: `true` (enabled)
- **When disabled**: OAuth login buttons are completely hidden from the login page
- **Backend endpoints**: OAuth endpoints remain accessible but UI is hidden

### 2. Calendar Sync (`ENABLE_CALENDAR_SYNC`)
- **Controls**: Calendar Sync tab and external calendar import features
- **Default**: `true` (enabled)
- **When disabled**:
  - "🔄 Calendar Sync" tab is hidden from the dashboard navigation
  - CalendarSync component is not rendered
  - Users are redirected to Calendar view if on the Sync view
- **Backend endpoints**: Calendar sync endpoints remain accessible but UI is hidden

### 3. Reservations (`ENABLE_RESERVATIONS`)
- **Controls**: Reservations system tab (in addition to user permissions)
- **Default**: `true` (enabled)
- **When disabled**:
  - "📅 Reservations" tab is hidden from the dashboard navigation
  - ReservationsPanel component is not rendered
  - Users are redirected to Calendar view if on the Reservations view
- **Note**: This flag works in combination with user permissions and the hideReservationsTab user preference

### 4. Automation (`ENABLE_AUTOMATION`)
- **Controls**: Automation rules tab and automation management features
- **Default**: `true` (enabled)
- **When disabled**:
  - "🤖 Automation" tab is hidden from the dashboard navigation
  - AutomationPanel component is not rendered
  - Users are redirected to Calendar view if on the Automation view
- **Backend endpoints**: Automation endpoints remain accessible but UI is hidden

## Configuration

### Backend Configuration

Feature flags are configured via environment variables in the backend `.env` file:

```bash
# Feature Flags - Control which features are enabled
# Set to 'true' to enable, any other value (or undefined) to disable
ENABLE_OAUTH=true
ENABLE_CALENDAR_SYNC=true
ENABLE_RESERVATIONS=true
ENABLE_AUTOMATION=true
```

**Important**:
- Only the string value `'true'` enables a feature
- Any other value (including `'false'`, `'0'`, or undefined) disables the feature
- Changes require a backend restart to take effect

### Checking Feature Flags

The backend exposes a public endpoint for checking feature flag status:

```bash
GET /api/feature-flags
```

**Response**:
```json
{
  "oauth": false,
  "calendarSync": false,
  "reservations": true,
  "automation": true
}
```

**Characteristics**:
- Public endpoint (no authentication required)
- Allows login page to check OAuth availability
- Cached on frontend for 5 minutes

## Architecture

### Backend Components

#### 1. FeatureFlagsService
**Location**: `backend-nestjs/src/common/feature-flags.service.ts`

Service that reads environment variables and provides feature flag status:

```typescript
@Injectable()
export class FeatureFlagsService {
  isOAuthEnabled(): boolean {
    return process.env.ENABLE_OAUTH === 'true';
  }

  isCalendarSyncEnabled(): boolean {
    return process.env.ENABLE_CALENDAR_SYNC === 'true';
  }

  isReservationsEnabled(): boolean {
    return process.env.ENABLE_RESERVATIONS === 'true';
  }

  isAutomationEnabled(): boolean {
    return process.env.ENABLE_AUTOMATION === 'true';
  }

  getAllFeatureFlags(): {
    oauth: boolean;
    calendarSync: boolean;
    reservations: boolean;
    automation: boolean;
  }
}
```

#### 2. FeatureFlagsController
**Location**: `backend-nestjs/src/common/feature-flags.controller.ts`

Controller that exposes feature flags via REST API:

```typescript
@Controller('feature-flags')
export class FeatureFlagsController {
  @Get()
  getFeatureFlags() {
    return this.featureFlagsService.getAllFeatureFlags();
  }
}
```

### Frontend Components

#### 1. featureFlagsService
**Location**: `frontend/src/services/featureFlagsService.ts`

Client-side service for fetching and caching feature flags:

```typescript
interface FeatureFlags {
  oauth: boolean;
  calendarSync: boolean;
  reservations: boolean;
  automation: boolean;
}

class FeatureFlagsService {
  async getFeatureFlags(): Promise<FeatureFlags>
  clearCache(): void
}
```

**Features**:
- 5-minute cache to reduce API calls
- Falls back to all enabled if fetch fails
- Ensures app remains functional if backend is unavailable

#### 2. useFeatureFlags Hook
**Location**: `frontend/src/hooks/useFeatureFlags.ts`

React hook for accessing feature flags in components:

```typescript
export function useFeatureFlags() {
  const { flags, loading, error } = useFeatureFlags();

  // Use flags in component
  if (!loading && flags.oauth) {
    // Render OAuth buttons
  }
}
```

**Features**:
- Loading state to prevent UI flicker
- Error handling with fallback to enabled state
- Clean unmount handling

#### 3. Dashboard Integration
**Location**: `frontend/src/components/Dashboard.tsx`

Main dashboard component that conditionally renders tabs based on feature flags:

```typescript
// Feature flags state
const { flags: featureFlags, loading: featureFlagsLoading } = useFeatureFlags();

// Conditional rendering
{featureFlags.calendarSync && (
  <button onClick={() => setCurrentView('sync')}>
    🔄 Calendar Sync
  </button>
)}

{featureFlags.automation && (
  <button onClick={() => setCurrentView('automation')}>
    🤖 Automation
  </button>
)}

{featureFlags.reservations && canAccessReservations && !userProfile?.hideReservationsTab && (
  <button onClick={() => setCurrentView('reservations')}>
    📅 Reservations
  </button>
)}
```

**Features**:
- Automatic redirection if user is on disabled view
- Prevents rendering of disabled components
- Combines with user permissions for multi-level access control

#### 4. Login Integration
**Location**: `frontend/src/components/auth/Login.tsx`

Login page that conditionally shows OAuth buttons:

```typescript
const { flags: featureFlags } = useFeatureFlags();

{featureFlags.oauth && (
  <div className="space-y-4">
    <div className="relative">
      <span>Or continue with SSO</span>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <button onClick={handleGoogleLogin}>Google</button>
      <button onClick={handleMicrosoftLogin}>Microsoft</button>
    </div>
  </div>
)}
```

## Use Cases

### 1. Gradual Feature Rollout
Deploy new features to production but keep them disabled until ready:
```bash
ENABLE_AUTOMATION=false  # Feature deployed but not visible
```

### 2. Maintenance Mode
Temporarily disable features during maintenance:
```bash
ENABLE_CALENDAR_SYNC=false  # Disable while fixing sync issues
```

### 3. Customer-Specific Deployments
Different customers may need different feature sets:
```bash
# Customer A: Full features
ENABLE_OAUTH=true
ENABLE_CALENDAR_SYNC=true
ENABLE_RESERVATIONS=true
ENABLE_AUTOMATION=true

# Customer B: Limited features
ENABLE_OAUTH=false
ENABLE_CALENDAR_SYNC=false
ENABLE_RESERVATIONS=true
ENABLE_AUTOMATION=false
```

### 4. Development and Testing
Test application behavior with different feature combinations:
```bash
# Test with all features disabled
ENABLE_OAUTH=false
ENABLE_CALENDAR_SYNC=false
ENABLE_RESERVATIONS=false
ENABLE_AUTOMATION=false

# Test with only core features
ENABLE_OAUTH=false
ENABLE_CALENDAR_SYNC=true
ENABLE_RESERVATIONS=false
ENABLE_AUTOMATION=false
```

## Multi-Level Access Control

The feature flags system works in combination with other access control mechanisms:

### Reservations Access
Requires ALL of the following to be true for tab to be visible:
1. **Feature Flag**: `ENABLE_RESERVATIONS=true`
2. **User Permission**: User must have a usage plan that includes reservation access
3. **User Preference**: `hideReservationsTab` must be `false` or undefined in user profile

```typescript
// All three conditions must be met
{featureFlags.reservations && canAccessReservations && !userProfile?.hideReservationsTab && (
  <button>📅 Reservations</button>
)}
```

### OAuth Authentication
Only requires feature flag (no user permissions):
```typescript
{featureFlags.oauth && (
  <div>OAuth Login Buttons</div>
)}
```

### Calendar Sync
Only requires feature flag (all authenticated users can access):
```typescript
{featureFlags.calendarSync && (
  <button>🔄 Calendar Sync</button>
)}
```

### Automation
Only requires feature flag (all authenticated users can access):
```typescript
{featureFlags.automation && (
  <button>🤖 Automation</button>
)}
```

## Testing Feature Flags

### Manual Testing

1. **Start backend with specific flags**:
```bash
cd backend-nestjs
ENABLE_OAUTH=false ENABLE_CALENDAR_SYNC=false ENABLE_RESERVATIONS=true ENABLE_AUTOMATION=true PORT=8081 JWT_SECRET="calendar-secret-key" npm run start:dev
```

2. **Verify flags endpoint**:
```bash
curl http://localhost:8081/api/feature-flags
# Expected: {"oauth":false,"calendarSync":false,"reservations":true,"automation":true}
```

3. **Start frontend**:
```bash
cd frontend
npm run dev -- --port 8080
```

4. **Test UI**:
   - Login page should NOT show OAuth buttons (ENABLE_OAUTH=false)
   - Dashboard should NOT show Calendar Sync tab (ENABLE_CALENDAR_SYNC=false)
   - Dashboard should show Automation tab (ENABLE_AUTOMATION=true)
   - Dashboard should show Reservations tab if user has permission (ENABLE_RESERVATIONS=true)

### Automated Testing

```typescript
describe('Feature Flags', () => {
  it('should hide OAuth buttons when ENABLE_OAUTH=false', async () => {
    // Set feature flags
    mockFeatureFlags({ oauth: false });

    // Render login page
    const { queryByText } = render(<Login />);

    // Verify OAuth buttons are hidden
    expect(queryByText('Google')).toBeNull();
    expect(queryByText('Microsoft')).toBeNull();
  });

  it('should hide Calendar Sync tab when ENABLE_CALENDAR_SYNC=false', async () => {
    // Set feature flags
    mockFeatureFlags({ calendarSync: false });

    // Render dashboard
    const { queryByText } = render(<Dashboard />);

    // Verify Calendar Sync tab is hidden
    expect(queryByText('🔄 Calendar Sync')).toBeNull();
  });
});
```

## Troubleshooting

### Feature not visible despite being enabled

1. **Check environment variable**:
```bash
echo $ENABLE_OAUTH  # Should output: true
```

2. **Restart backend** (environment variables are read on startup)

3. **Check browser cache** (feature flags cached for 5 minutes):
```javascript
// Clear cache in browser console
featureFlagsService.clearCache();
location.reload();
```

4. **Check network tab** for `/api/feature-flags` response

### Feature still visible despite being disabled

1. **Verify backend is reading correct `.env` file**

2. **Check for typos in environment variable name**

3. **Ensure value is exactly `'true'` to enable, anything else disables**

4. **Check browser console for errors** in feature flags fetch

5. **Verify frontend is connecting to correct backend URL**

## Best Practices

### 1. Default to Enabled in Development
Set all flags to `true` in development unless specifically testing disabled state:
```bash
# .env.development
ENABLE_OAUTH=true
ENABLE_CALENDAR_SYNC=true
ENABLE_RESERVATIONS=true
ENABLE_AUTOMATION=true
```

### 2. Document Production Configuration
Keep production feature flag configuration in deployment documentation:
```bash
# production-config.md
ENABLE_OAUTH=true          # OAuth providers configured
ENABLE_CALENDAR_SYNC=true  # Google Calendar API configured
ENABLE_RESERVATIONS=true   # Reservation system enabled
ENABLE_AUTOMATION=false    # Not yet released to production
```

### 3. Use Feature Flags for Beta Features
Deploy new features behind flags and enable for beta users first:
```bash
# Beta environment
ENABLE_AUTOMATION=true

# Production environment
ENABLE_AUTOMATION=false  # Wait for beta testing results
```

### 4. Monitor Feature Flag Usage
Log feature flag values at application startup:
```typescript
const flags = await featureFlagsService.getAllFeatureFlags();
logger.info('Feature Flags:', flags);
```

### 5. Consider Time-Based Enablement
For scheduled feature releases, consider environment-based enablement:
```bash
# Enable automation on specific date
if [ "$(date +%Y-%m-%d)" \>= "2025-11-01" ]; then
  export ENABLE_AUTOMATION=true
else
  export ENABLE_AUTOMATION=false
fi
```

## Future Enhancements

Potential improvements to the feature flags system:

1. **Database-Based Flags**: Store flags in database for runtime changes without restart
2. **User-Level Flags**: Enable features for specific users or roles
3. **A/B Testing**: Randomly enable features for percentage of users
4. **Feature Flag UI**: Admin panel for managing feature flags
5. **Audit Logging**: Track when and who changes feature flags
6. **Gradual Rollout**: Slowly increase percentage of users with access
7. **Feature Dependencies**: Automatically disable dependent features
8. **Expiry Dates**: Automatically remove old feature flags

## Related Documentation

- [User Permissions System](./user-permissions.md) - How permissions work with feature flags
- [Usage Plans](./usage-plans.md) - Usage plan-based feature access
- [Deployment Guide](./DEPLOYMENT.md) - Configuring feature flags in production
- [Environment Variables](./environment-variables.md) - Complete environment variable reference

## Support

For issues with feature flags:
1. Check this documentation first
2. Verify environment variables are set correctly
3. Check application logs for feature flag values
4. Report issues at https://github.com/anthropics/cal3/issues
