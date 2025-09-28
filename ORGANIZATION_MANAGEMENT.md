# Organization Management System Documentation

## Overview

The Cal3 Organization Management System provides a comprehensive, flexible approach to managing organizations, users, and their permissions within the calendar and reservation system. The system supports both simple role-based access and granular permission controls, ensuring scalability from small teams to large enterprises.

## 🏗️ System Architecture

### Core Entities

1. **Organisation**: The main organizational unit containing settings and relationships
2. **OrganisationUser**: Organization-level role assignments (Admin/Editor/User)
3. **OrganisationResourceTypePermission**: Granular permissions for specific resource types
4. **OrganisationCalendarPermission**: Granular permissions for specific reservation calendars

### Permission Models

The system supports two permission models that can be configured independently:

#### **Simple Permission Model (Default)**
- Organization membership grants access to ALL resource types and calendars
- Role-based access: Admin → Editor → User hierarchy
- Easier to manage for smaller organizations

#### **Granular Permission Model (Optional)**
- Individual permissions per resource type or calendar
- Fine-grained control for complex organizational structures
- Configurable via organization admin settings

## 🔐 Access Control Framework

### User Plans & Role Requirements

All organization roles require **Store** or **Enterprise** usage plans:

```typescript
enum UsagePlan {
  CHILD = 'child',      // ❌ No organization access
  USER = 'user',        // ❌ No organization access
  STORE = 'store',      // ✅ Can be assigned organization roles
  ENTERPRISE = 'enterprise' // ✅ Can be assigned organization roles
}
```

### Organization Role Hierarchy

```typescript
enum OrganisationRoleType {
  ADMIN = 'admin',      // Full organization control
  EDITOR = 'editor',    // Edit resources/reservations
  USER = 'user'         // View access only
}
```

### Role Capabilities Matrix

| Role | Manage Org Settings | Assign Users | Delete Org | Edit Resources* | View Calendars* |
|------|-------------------|--------------|------------|----------------|----------------|
| **Cal3 Admin** | ✅ Full system access | ✅ All orgs | ✅ All orgs | ✅ All orgs | ✅ All orgs |
| **Org Admin** | ✅ Own org only | ✅ Own org only | ❌ | ✅ Own org* | ✅ Own org* |
| **Org Editor** | ❌ | ❌ | ❌ | ✅ Own org* | ✅ Own org* |
| **Org User** | ❌ | ❌ | ❌ | ❌ | ✅ Own org* |

*Subject to granular permission settings

## 🎛️ Granular Permission Controls

### Resource Type Permissions

When `useGranularResourcePermissions = true`:

- **Organization Admins** can assign individual resource type edit permissions
- **Default behavior**: No automatic access to resource types
- **Permission assignment**: Explicit per-user, per-resource-type basis

```typescript
interface OrganisationResourceTypePermission {
  organisationId: number;
  userId: number;
  resourceTypeId: number;
  canEdit: boolean;
  assignedById: number; // Who granted this permission
}
```

### Calendar Permissions

When `useGranularCalendarPermissions = true`:

- **Organization Admins** can assign individual calendar view/edit permissions
- **Default behavior**: No automatic access to calendars
- **Permission assignment**: Explicit per-user, per-calendar basis

```typescript
interface OrganisationCalendarPermission {
  organisationId: number;
  userId: number;
  reservationCalendarId: number;
  canView: boolean;
  canEdit: boolean;
  assignedById: number; // Who granted this permission
}
```

## 🔄 Permission Resolution Logic

### 1. Plan Validation
```typescript
// Check if user has required plans for organization roles
if (!hasStorePlan(user) && !hasEnterprisePlan(user)) {
  return { access: false, reason: 'Insufficient plan' };
}
```

### 2. Organization Membership Check
```typescript
// Verify user is member of organization
const orgMembership = await getOrganisationMembership(userId, orgId);
if (!orgMembership) {
  return { access: false, reason: 'Not organization member' };
}
```

### 3. Permission Resolution
```typescript
if (organisation.useGranularResourcePermissions) {
  // Check specific resource type permissions
  return await checkResourceTypePermission(userId, resourceTypeId);
} else {
  // Use organization role for all resource types
  return checkOrganisationRole(userId, organisationId);
}
```

## 📊 Multi-Organization Support

Users can have different roles across multiple organizations:

### Example Scenarios
- **User A**: Admin in "Marketing Dept", Editor in "IT Dept", User in "HR Dept"
- **User B**: Editor in "Store Chain A", Admin in "Store Chain B"
- **User C**: User in multiple organizations with granular calendar permissions

### Implementation Details
- Each organization membership is independent
- Role assignments are organization-specific
- Permissions are resolved per-organization context
- Clean UI for managing multiple memberships

## 🛠️ Administrative Operations

### Cal3 System Administrators

**Full System Control:**
- Create and delete organizations
- Assign organization administrators
- Manage all users across all organizations
- Override any permission restrictions
- Delete organizations with hard cascade (removes all related data)

**User Management:**
```typescript
// Filter users by plans for organization role assignment
const eligibleUsers = await getUsersWithPlans([UsagePlan.STORE, UsagePlan.ENTERPRISE]);

// Assign organization admin
await assignOrganizationAdmin(orgId, userId, assignedBy);

// Delete organization (hard delete with cascade)
await deleteOrganizationCascade(orgId);
```

### Organization Administrators

**Organization-Specific Control:**
- Manage organization settings (granular permission toggles)
- Add/remove organization users and editors
- Assign granular permissions (when enabled)
- Manage reservation calendars within organization
- Delete resources, resource types, and reservations within organization

**Key Operations:**
```typescript
// Toggle granular permissions (org admins only)
await updateOrganizationSettings(orgId, {
  useGranularResourcePermissions: true,
  useGranularCalendarPermissions: false
});

// Assign organization role
await assignOrganizationUser(orgId, userId, role, assignedBy);

// Assign granular resource permission
await assignResourceTypePermission(orgId, userId, resourceTypeId, canEdit);
```

## 🔧 API Endpoints

### Organization Management
```typescript
// Organization CRUD
GET    /api/organizations                 // List accessible organizations
POST   /api/organizations                 // Create organization (Cal3 admins only)
GET    /api/organizations/:id             // Get organization details
PATCH  /api/organizations/:id             // Update organization
DELETE /api/organizations/:id             // Delete organization (hard cascade)

// Organization Settings (Org admins only)
PATCH  /api/organizations/:id/settings    // Update granular permission settings
```

### User Management
```typescript
// Organization membership
GET    /api/organizations/:id/users              // List organization users
POST   /api/organizations/:id/users              // Add user to organization
DELETE /api/organizations/:id/users/:userId      // Remove user from organization
PATCH  /api/organizations/:id/users/:userId/role // Update user role

// Admin assignment (Cal3 admins only)
POST   /api/organizations/:id/admins             // Assign organization admin
DELETE /api/organizations/:id/admins/:userId     // Remove organization admin
```

### Granular Permissions
```typescript
// Resource type permissions
GET    /api/organizations/:id/resource-permissions/:userId     // Get user's resource permissions
POST   /api/organizations/:id/resource-permissions             // Assign resource permission
DELETE /api/organizations/:id/resource-permissions/:permId     // Remove resource permission

// Calendar permissions
GET    /api/organizations/:id/calendar-permissions/:userId     // Get user's calendar permissions
POST   /api/organizations/:id/calendar-permissions             // Assign calendar permission
DELETE /api/organizations/:id/calendar-permissions/:permId     // Remove calendar permission
```

## 🎨 User Interface Design

### Admin Panel Enhancements

**Organization Management Tab:**
- List all organizations with admin/user counts
- Create new organizations
- Delete organizations with impact warning
- Filter users by Store/Enterprise plans for role assignment

**User Selection Interface:**
```typescript
// Only show users with required plans
const eligibleUsers = users.filter(user =>
  user.usagePlans.includes('store') || user.usagePlans.includes('enterprise')
);
```

### Organization Admin Interface

**Location**: Reservations Tab → Organization Management Section

**Features:**
- Organization member list with roles
- Add/remove users with role assignment
- Granular permission toggles (admin only)
- Resource type permission matrix (when enabled)
- Calendar permission matrix (when enabled)

**Permission Management UI:**
```typescript
// Simple mode: Role dropdown
<select value={userRole}>
  <option value="admin">Admin</option>
  <option value="editor">Editor</option>
  <option value="user">User</option>
</select>

// Granular mode: Permission checkboxes
{resourceTypes.map(rt => (
  <Checkbox
    key={rt.id}
    checked={hasResourcePermission(user.id, rt.id)}
    onChange={toggleResourcePermission}
  >
    {rt.name}
  </Checkbox>
))}
```

## 🚨 Plan Change Handling

### Automatic Cleanup Process

When a user loses Store/Enterprise plans:

1. **Silent Role Removal**: All organization roles are automatically removed
2. **Permission Cleanup**: All granular permissions are deleted
3. **Access Revocation**: Immediate loss of organization access
4. **No Notifications**: Process runs silently in background

### Implementation
```typescript
// Background job for plan change cleanup
async function cleanupUserPermissions(userId: number, oldPlans: UsagePlan[], newPlans: UsagePlan[]) {
  const lostStorePlan = oldPlans.includes(UsagePlan.STORE) && !newPlans.includes(UsagePlan.STORE);
  const lostEnterprisePlan = oldPlans.includes(UsagePlan.ENTERPRISE) && !newPlans.includes(UsagePlan.ENTERPRISE);

  if (lostStorePlan && lostEnterprisePlan) {
    // Remove all organization roles and permissions
    await removeAllOrganizationMemberships(userId);
    await removeAllGranularPermissions(userId);
  }
}
```

## 🔍 Security Considerations

### Plan Validation
- All role assignment endpoints validate user plans
- Real-time plan checking before permission grants
- Automatic cleanup on plan downgrades

### Cascade Deletion Safety
- Organization deletion requires confirmation
- Impact analysis shows affected users/resources
- Audit logging for all administrative actions

### Permission Inheritance
- Clear hierarchy: Cal3 Admin → Org Admin → Org Editor → Org User
- No privilege escalation possibilities
- Granular permissions can only restrict, not expand base role permissions

## 📈 Performance Considerations

### Caching Strategy
```typescript
// Cache user permissions for efficient access checking
const userPermissions = await cache.get(`user:${userId}:org:${orgId}:permissions`);

// Invalidate cache on permission changes
await cache.invalidate(`user:${userId}:org:*`);
```

### Database Optimization
- Proper indexing on foreign keys
- Efficient joins for permission resolution
- Bulk operations for role assignments

### Query Optimization
```sql
-- Efficient permission checking with proper indexes
SELECT * FROM organisation_users ou
LEFT JOIN organisation_resource_type_permissions ortp ON ou.userId = ortp.userId
WHERE ou.organisationId = ? AND ou.userId = ?;
```

## 🧪 Testing Strategy

### Unit Tests
- Permission resolution logic
- Plan validation functions
- Role assignment operations
- Cleanup processes

### Integration Tests
- Multi-organization scenarios
- Granular permission workflows
- Plan change handling
- API endpoint validation

### End-to-End Tests
- Complete user journeys
- Admin panel operations
- Organization admin workflows
- Permission inheritance scenarios

## 🚀 Future Enhancements

### Possible Extensions
1. **Time-based permissions**: Temporary role assignments
2. **Permission templates**: Pre-configured permission sets
3. **Delegation**: Allow editors to assign limited permissions
4. **Audit reports**: Detailed permission change tracking
5. **Bulk operations**: Mass user import/export
6. **API rate limiting**: Prevent abuse of administrative operations

### Scalability Considerations
- Horizontal scaling for large organizations
- Permission caching for high-traffic scenarios
- Batch processing for bulk operations
- Database sharding strategies

---

## Summary

The Cal3 Organization Management System provides a robust, flexible foundation for managing complex organizational structures while maintaining simplicity for basic use cases. The dual permission model (simple vs. granular) ensures the system can scale from small teams to large enterprises, while plan-based access control ensures proper monetization and feature gating.

The system's "Lego-block" architecture allows for easy extension and modification, following clean code principles and established patterns throughout the Cal3 application.