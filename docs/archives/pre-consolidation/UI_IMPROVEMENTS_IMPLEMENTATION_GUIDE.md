# UI/UX Improvements Implementation Guide

## Overview
This guide provides step-by-step implementation for all requested UI/UX improvements following 2025 best practices.

---

## Feature A: Features Submenu (Group Navigation Items)

### Goal
Group Automation, Reservations, and Calendar Sync under a single "Features" dropdown menu to reduce top-level navigation items from 6 to 4.

### Current Structure
```
Calendar | Profile | Sync | Automation | Reservations | Admin
```

### New Structure
```
Calendar | Profile | Features ▼ | Admin
                    ├─ Calendar Sync
                    ├─ Automation
                    └─ Reservations
```

### Implementation Steps

#### Step 1: Update Dashboard View Types
**File**: `frontend/src/components/Dashboard.tsx`

```typescript
// Current
type DashboardView = 'calendar' | 'admin' | 'profile' | 'sync' | 'reservations' | 'automation';

// Keep the same (views stay the same, just navigation changes)
```

#### Step 2: Update ResponsiveNavigation Component
**File**: `frontend/src/components/mobile/organisms/ResponsiveNavigation.tsx`

Add submenu support:

```typescript
interface Tab {
  id: TabId;
  icon: string;
  label: string;
  shortLabel?: string;
  visible: boolean;
  submenu?: Tab[];  // NEW: Add submenu support
}

const tabs = [
  {
    id: 'calendar' as TabId,
    icon: '📅',
    label: 'Calendar',
    visible: true,
  },
  {
    id: 'profile' as TabId,
    icon: '👤',
    label: 'Profile',
    visible: true,
  },
  {
    id: 'features' as TabId,  // NEW: Features parent menu
    icon: '⚡',
    label: 'Features',
    visible: featureFlags.calendarSync || featureFlags.automation || featureFlags.reservations,
    submenu: [
      {
        id: 'sync' as TabId,
        icon: '🔄',
        label: 'Calendar Sync',
        visible: featureFlags.calendarSync,
      },
      {
        id: 'automation' as TabId,
        icon: '🤖',
        label: 'Automation',
        visible: featureFlags.automation,
      },
      {
        id: 'reservations' as TabId,
        icon: '📆',
        label: 'Reservations',
        visible: featureFlags.reservations && canAccessReservations,
      },
    ].filter(item => item.visible),
  },
  {
    id: 'admin' as TabId,
    icon: '🔧',
    label: 'Admin',
    visible: userRole === 'admin',
  },
];
```

#### Step 3: Update TabId Type
**File**: `frontend/src/components/mobile/organisms/BottomTabBar.tsx`

```typescript
export type TabId = 'calendar' | 'profile' | 'features' | 'sync' | 'automation' | 'reservations' | 'admin';
```

#### Step 4: Add Dropdown Component for Desktop
**File**: `frontend/src/components/mobile/organisms/ResponsiveNavigation.tsx`

```typescript
// Add dropdown state
const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);

// Desktop navigation with dropdown
{isDesktop && (
  <nav className="relative z-10 backdrop-blur-sm bg-white/80 border-b border-gray-200">
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => {
            if (tab.submenu) {
              // Features dropdown
              return (
                <div key={tab.id} className="relative">
                  <button
                    onClick={() => setFeaturesDropdownOpen(!featuresDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100"
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className="text-xs">{featuresDropdownOpen ? '▲' : '▼'}</span>
                  </button>

                  {featuresDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      {tab.submenu.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => {
                            onTabChange(subItem.id);
                            setFeaturesDropdownOpen(false);
                          }}
                          className={`
                            w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50
                            ${activeTab === subItem.id ? 'bg-blue-50 text-blue-600' : ''}
                          `}
                        >
                          <span className="text-lg">{subItem.icon}</span>
                          <span className="font-medium">{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Regular tab
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                  ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}
                `}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  </nav>
)}
```

#### Step 5: Update Mobile Bottom Tab Bar
For mobile, keep features separate (5 tab max rule) or use accordion:

```typescript
// Option 1: Keep separate (recommended for mobile)
// No changes needed - mobile shows all tabs separately

// Option 2: Accordion (if you want consistency)
// Add expandable features section in bottom tabs
```

---

## Feature B: Collapsible Sidebar with Icon-Only Mode

### Specifications (2025 Best Practices)
- **Expanded Width**: 260px (within 240-300px guideline)
- **Collapsed Width**: 56px (within 48-64px guideline)
- **Transition**: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- **Persistence**: localStorage key `cal3_sidebar_collapsed`
- **Icons**: Clear, recognizable, with tooltips on hover

### Implementation Steps

#### Step 1: Create Collapsible Sidebar Hook
**File**: `frontend/src/hooks/useSidebarCollapse.ts`

```typescript
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'cal3_sidebar_collapsed';

export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const toggle = () => setCollapsed(prev => !prev);

  return { collapsed, setCollapsed, toggle };
}
```

#### Step 2: Create Collapsible Sidebar Component
**File**: `frontend/src/components/common/CollapsibleSidebar.tsx`

```typescript
import React from 'react';
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse';

interface CollapsibleSidebarProps {
  children: (collapsed: boolean) => React.ReactNode;
  className?: string;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  children,
  className = '',
}) => {
  const { collapsed, toggle } = useSidebarCollapse();

  return (
    <aside
      className={`
        transition-all duration-300 ease-in-out
        bg-white border-r border-gray-200 h-full
        ${collapsed ? 'w-14' : 'w-64'}
        ${className}
      `}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        {!collapsed && <span className="font-semibold text-gray-800">Navigation</span>}
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="overflow-y-auto">
        {children(collapsed)}
      </div>
    </aside>
  );
};
```

#### Step 3: Create Sidebar Item Component
**File**: `frontend/src/components/common/SidebarItem.tsx`

```typescript
import React from 'react';
import { Tooltip } from '../ui/Tooltip';

interface SidebarItemProps {
  icon: string | React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  collapsed?: boolean;
  badge?: number;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  onClick,
  active = false,
  collapsed = false,
  badge,
}) => {
  const content = (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-3
        rounded-lg transition-all duration-200
        ${active
          ? 'bg-blue-100 text-blue-600'
          : 'hover:bg-gray-100 text-gray-700'
        }
        ${collapsed ? 'justify-center' : 'justify-start'}
      `}
    >
      <span className="text-xl shrink-0">{icon}</span>
      {!collapsed && (
        <>
          <span className="font-medium truncate flex-1">{label}</span>
          {badge && badge > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip content={label} position="right">
        {content}
      </Tooltip>
    );
  }

  return content;
};
```

#### Step 4: Update Calendar Component to Use Collapsible Sidebar
**File**: `frontend/src/components/Calendar.tsx` or `CalendarSidebar.tsx`

```typescript
import { CollapsibleSidebar } from './common/CollapsibleSidebar';
import { SidebarItem } from './common/SidebarItem';

// In your render:
<CollapsibleSidebar>
  {(collapsed) => (
    <div className="p-2">
      {calendars.map((calendar) => (
        <SidebarItem
          key={calendar.id}
          icon={calendar.icon || '📅'}
          label={calendar.name}
          onClick={() => handleCalendarClick(calendar.id)}
          active={selectedCalendarId === calendar.id}
          collapsed={collapsed}
          badge={calendar.unreadCount}
        />
      ))}
    </div>
  )}
</CollapsibleSidebar>
```

---

## Feature C: Icon Support for Entities

### Database Schema Changes

#### Step 1: Add Icon Column to Entities

**File**: `backend-nestjs/src/entities/calendar.entity.ts`

```typescript
@Column({ nullable: true })
icon: string; // Emoji or icon identifier
```

**File**: `backend-nestjs/src/entities/resource-type.entity.ts`

```typescript
@Column({ nullable: true })
icon: string;
```

**File**: `backend-nestjs/src/entities/event.entity.ts`

```typescript
@Column({ nullable: true })
icon: string;
```

#### Step 2: Create Migration

```bash
cd backend-nestjs
npm run typeorm migration:generate -- src/migrations/AddIconsToEntities
npm run typeorm migration:run
```

Or manually create migration:

**File**: `backend-nestjs/src/migrations/TIMESTAMP-AddIconsToEntities.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIconsToEntities1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'calendar',
      new TableColumn({
        name: 'icon',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'resource_type',
      new TableColumn({
        name: 'icon',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'event',
      new TableColumn({
        name: 'icon',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('calendar', 'icon');
    await queryRunner.dropColumn('resource_type', 'icon');
    await queryRunner.dropColumn('event', 'icon');
  }
}
```

#### Step 3: Update DTOs

**File**: `backend-nestjs/src/dto/calendar.dto.ts`

```typescript
export class CreateCalendarDto {
  // ... existing fields

  @IsOptional()
  @IsString()
  icon?: string;
}
```

**File**: `backend-nestjs/src/dto/resource-type.dto.ts`

```typescript
export class CreateResourceTypeDto {
  // ... existing fields

  @IsOptional()
  @IsString()
  icon?: string;
}
```

**File**: `backend-nestjs/src/dto/event.dto.ts`

```typescript
export class CreateEventDto {
  // ... existing fields

  @IsOptional()
  @IsString()
  icon?: string;
}
```

---

## Feature D: Frontend Icon Selection UI

### Implementation Steps

#### Step 1: Create Icon Picker Component
**File**: `frontend/src/components/ui/IconPicker.tsx`

```typescript
import React, { useState } from 'react';

const COMMON_ICONS = [
  '📅', '📆', '🗓️', '📋', '📝', '✅', '⭐', '🔔',
  '🏢', '🏠', '🏪', '🏨', '🎯', '🎉', '🎊', '🎈',
  '💼', '📧', '📞', '💻', '🖥️', '📱', '⚙️', '🔧',
  '👤', '👥', '🤝', '💡', '🔍', '📊', '📈', '📉',
  '🚀', '🎯', '🏆', '🎓', '📚', '🔒', '🔓', '⚡',
];

interface IconPickerProps {
  value?: string;
  onChange: (icon: string) => void;
  label?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  label = 'Select Icon',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {/* Current Selection */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 w-full"
      >
        <span className="text-2xl">{value || '📅'}</span>
        <span className="text-sm text-gray-500">Click to change icon</span>
      </button>

      {/* Icon Picker Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          <div className="grid grid-cols-8 gap-2">
            {COMMON_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => {
                  onChange(icon);
                  setIsOpen(false);
                }}
                className={`
                  text-2xl p-2 rounded-lg hover:bg-blue-50 transition-colors
                  ${value === icon ? 'bg-blue-100 ring-2 ring-blue-500' : ''}
                `}
                title={icon}
              >
                {icon}
              </button>
            ))}
          </div>

          {/* Custom Emoji Input */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <input
              type="text"
              placeholder="Or paste any emoji..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              onChange={(e) => {
                const emoji = e.target.value;
                if (emoji) {
                  onChange(emoji);
                  setIsOpen(false);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

#### Step 2: Update Calendar Creation Form
**File**: `frontend/src/components/CalendarManager.tsx`

```typescript
import { IconPicker } from './ui/IconPicker';

// In the form:
<IconPicker
  value={formData.icon}
  onChange={(icon) => setFormData({ ...formData, icon })}
  label="Calendar Icon"
/>
```

#### Step 3: Update Calendar Display
**File**: `frontend/src/components/CalendarSidebar.tsx`

```typescript
// When displaying calendars:
{calendars.map((calendar) => (
  <div key={calendar.id} className="flex items-center gap-3">
    <span className="text-xl">{calendar.icon || '📅'}</span>
    <span>{calendar.name}</span>
  </div>
))}
```

---

## Feature E: Organization Reservation Creation

### Implementation Steps

#### Step 1: Add Reservation API Methods
**File**: `frontend/src/services/api.ts`

```typescript
// Add to ApiService class:

async createReservation(data: {
  resourceId: number;
  startTime: string;
  endTime: string;
  quantity: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
}): Promise<any> {
  const response = await this.secureApiFetch(`${API_BASE_URL}/api/reservations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create reservation');
  }

  return await response.json();
}

async getUserOrganizations(): Promise<any[]> {
  const response = await this.secureApiFetch(`${API_BASE_URL}/api/organisations/my-organisations`);
  if (!response.ok) {
    throw new Error('Failed to fetch organizations');
  }
  return await response.json();
}

async getOrganizationResources(orgId: number): Promise<any[]> {
  const response = await this.secureApiFetch(`${API_BASE_URL}/api/organisations/${orgId}/resources`);
  if (!response.ok) {
    throw new Error('Failed to fetch resources');
  }
  return await response.json();
}
```

#### Step 2: Add Quick Reservation Button to Calendar
**File**: `frontend/src/components/Calendar.tsx`

```typescript
// Add state
const [showReservationModal, setShowReservationModal] = useState(false);
const [organizations, setOrganizations] = useState([]);

// Load user's organizations on mount
useEffect(() => {
  if (featureFlags.reservations && canAccessReservations) {
    apiService.getUserOrganizations().then(setOrganizations);
  }
}, []);

// In the calendar header or FAB, add:
{featureFlags.reservations && canAccessReservations && organizations.length > 0 && (
  <button
    onClick={() => setShowReservationModal(true)}
    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
  >
    <span>📆</span>
    <span>Create Reservation</span>
  </button>
)}
```

#### Step 3: Create Quick Reservation Modal
**File**: `frontend/src/components/QuickReservationModal.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { SimpleModal } from './ui/SimpleModal';
import { apiService } from '../services/api';

interface QuickReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: any[];
  initialDate?: Date;
}

export const QuickReservationModal: React.FC<QuickReservationModalProps> = ({
  isOpen,
  onClose,
  organizations,
  initialDate = new Date(),
}) => {
  const [step, setStep] = useState<'org' | 'resource' | 'details'>('org');
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    startTime: initialDate.toISOString().slice(0, 16),
    endTime: new Date(initialDate.getTime() + 3600000).toISOString().slice(0, 16),
    quantity: 1,
    customerName: '',
    customerEmail: '',
    description: '',
  });

  const handleOrgSelect = async (org: any) => {
    setSelectedOrg(org);
    setLoading(true);
    try {
      const orgResources = await apiService.getOrganizationResources(org.id);
      setResources(orgResources);
      setStep('resource');
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResourceSelect = (resource: any) => {
    setSelectedResource(resource);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.createReservation({
        resourceId: selectedResource.id,
        ...formData,
      });
      onClose();
      // Refresh calendar or show success message
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose} title="Create Reservation">
      {step === 'org' && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 mb-3">Select Organization</h3>
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => handleOrgSelect(org)}
              className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <span className="text-2xl">{org.icon || '🏢'}</span>
              <div className="text-left">
                <div className="font-medium">{org.name}</div>
                <div className="text-sm text-gray-500">{org.role}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 'resource' && (
        <div className="space-y-3">
          <button
            onClick={() => setStep('org')}
            className="text-blue-600 hover:text-blue-700 mb-3"
          >
            ← Back to organizations
          </button>
          <h3 className="font-semibold text-gray-800 mb-3">Select Resource</h3>
          {resources.map((resource) => (
            <button
              key={resource.id}
              onClick={() => handleResourceSelect(resource)}
              className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <span className="text-2xl">{resource.resourceType?.icon || '📋'}</span>
              <div className="text-left">
                <div className="font-medium">{resource.name}</div>
                <div className="text-sm text-gray-500">
                  {resource.resourceType?.name} • Capacity: {resource.capacity}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 'details' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <button
            type="button"
            onClick={() => setStep('resource')}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to resources
          </button>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Email
            </label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Reservation'}
            </button>
          </div>
        </form>
      )}
    </SimpleModal>
  );
};
```

---

## Testing Checklist

### Feature A: Features Submenu
- [ ] Desktop dropdown opens/closes correctly
- [ ] Click outside closes dropdown
- [ ] Submenu items navigate correctly
- [ ] Mobile keeps separate tabs (5 max)
- [ ] Feature flags hide/show items correctly

### Feature B: Collapsible Sidebar
- [ ] Sidebar collapses to 56px
- [ ] Sidebar expands to 260px
- [ ] Smooth 300ms animation
- [ ] State persists in localStorage
- [ ] Icons visible when collapsed
- [ ] Tooltips show on collapsed icons
- [ ] Works on all calendar views

### Feature C: Icon Support
- [ ] Icons save to database
- [ ] Icons display in lists
- [ ] Icon picker opens/closes
- [ ] Custom emoji input works
- [ ] Icons persist after refresh
- [ ] Migration runs successfully

### Feature D: Reservation Creation
- [ ] Organizations load correctly
- [ ] Resources load for selected org
- [ ] Form validation works
- [ ] Reservation creates successfully
- [ ] Calendar refreshes after creation
- [ ] Works for org owners/editors/users
- [ ] Permission checks work correctly

---

## Deployment Steps

1. **Backend Changes First**
   ```bash
   cd backend-nestjs
   npm run typeorm migration:run
   npm run build
   npm run start:prod
   ```

2. **Frontend Build**
   ```bash
   cd frontend
   npm run build
   ```

3. **Test on Staging**
   - Test all features
   - Check mobile responsiveness
   - Verify permission logic

4. **Deploy to Production**
   ```bash
   git add .
   git commit -m "feat: Complete UI/UX improvements (A, B, C, D, E)"
   git push
   ```

---

## Best Practices Applied

✅ **Navigation**: NN/g Menu Design Guidelines
✅ **Sidebar**: 2025 collapsible sidebar specifications
✅ **Icons**: Clear, recognizable, with tooltips
✅ **Persistence**: localStorage for user preferences
✅ **Accessibility**: Keyboard navigation, ARIA labels
✅ **Mobile**: Touch-friendly, responsive design
✅ **Permissions**: Role-based access control
✅ **UX**: Clear visual hierarchy, smooth animations

---

## Support & Maintenance

For questions or issues:
1. Check browser console for errors
2. Verify database migrations ran
3. Check feature flags are enabled
4. Test in different browsers
5. Review user permissions

---

*Generated for Cal3 v1.2.3+ • Following 2025 UI/UX Best Practices*
