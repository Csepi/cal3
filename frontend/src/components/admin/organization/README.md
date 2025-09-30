# Organization Management Components

## Architecture Overview

This directory contains modular, reusable components for organization management in the Admin Panel. The components follow React best practices with proper separation of concerns.

## Completed Components

### ✅ ConfirmationDialog.tsx
Reusable confirmation modal for destructive actions (delete, remove members, etc.)

### ✅ OrganizationFormModal.tsx
Form modal for creating and editing organizations with validation

## Components To Complete

### RoleAssignmentModal.tsx
```typescript
// Modal for assigning roles (admin/editor/user) to users
// Features:
// - User search/select dropdown
// - Role selection with descriptions
// - Usage plan validation
// - Shows available roles based on user's plans
```

###Organization List.tsx
```typescript
// Left sidebar showing all organizations
// Features:
// - Organization cards with basic info
// - Selection handling
// - Search functionality
// - Empty states
// - Click to select organization
```

### OrganizationOverview.tsx
```typescript
// Overview tab showing organization details
// Features:
// - Organization name and description
// - Statistics cards (admins/editors/users count)
// - Quick actions toolbar
// - Created date info
```

### OrganizationMembersPanel.tsx
```typescript
// Unified members view showing all roles
// Features:
// - Table/list of all members
// - Role badges (Admin/Editor/User)
// - Filter by role
// - Search members
// - Actions: Change Role, Remove
// - Shows usage plans per member
```

## Usage in AdminOrganisationPanel

The refactored main panel should:

```typescript
import { useOrganizationList, useOrganizationDetails, useAvailableUsers } from '../../../hooks/useOrganizationData';
import { useUsagePlanCheck } from '../../../hooks/useUsagePlanCheck';
import { ConfirmationDialog, OrganizationFormModal } from './organization';
import { Badge } from '../../ui';

// Use hooks for data
const { organizations, loading, createOrganization, deleteOrganization } = useOrganizationList();
const { members, loadOrganizationData, assignMemberRole, removeMember } = useOrganizationDetails(selectedOrgId);
const { permissions, getAvailableRoles, canAssignRole } = useUsagePlanCheck();

// Conditional rendering based on permissions
{permissions.canManageOrganizations && (
  <Button onClick={() => setShowCreateModal(true)}>
    Create Organization
  </Button>
)}

// Members view with role badges
{members.map(member => (
  <div key={member.id}>
    <span>{member.username}</span>
    <Badge variant={getBadgeVariant(member.organizationRole)}>
      {member.organizationRole}
    </Badge>
  </div>
))}
```

## Key Features

1. **Usage Plan Integration**: All role operations check user plans before allowing actions
2. **Modular Components**: Each component < 200 lines, focused on single responsibility
3. **Custom Hooks**: Data fetching logic separated from UI
4. **Type Safety**: Full TypeScript coverage with proper interfaces
5. **Consistent UX**: Follows patterns from AdminUserPanel

## File Structure

```
organization/
├── ConfirmationDialog.tsx       ✅ Complete
├── OrganizationFormModal.tsx    ✅ Complete
├── RoleAssignmentModal.tsx      ⏳ To implement
├── OrganizationList.tsx         ⏳ To implement
├── OrganizationOverview.tsx     ⏳ To implement
├── OrganizationMembersPanel.tsx ⏳ To implement
├── index.ts                     ✅ Barrel export
└── README.md                    ✅ This file
```

## Implementation Notes

- All components use getThemeConfig for consistent theming
- Error handling follows formatAdminError pattern
- Loading states with proper UI feedback
- Confirmation dialogs for all destructive actions
- Search/filter using local state with debouncing
- Responsive design with mobile breakpoints

## Testing Checklist

- [ ] Create organization (requires store/enterprise plan)
- [ ] Delete organization with confirmation
- [ ] Assign admin role (requires store/enterprise plan)
- [ ] Assign editor role (requires store/enterprise plan)
- [ ] Assign user role
- [ ] Remove member with confirmation
- [ ] Search/filter functionality
- [ ] Empty states display correctly
- [ ] Error messages are user-friendly
- [ ] Loading states show appropriately