# Reservation Calendars Implementation Plan

## Overview
Add reservation calendars to the main calendar view with hierarchical organization display and visibility toggles.

---

## Task Breakdown

### Phase 1: Backend API Integration (Estimated: 1-2 hours)

#### Task 1.1: Verify User Permissions Endpoint
- **File**: `backend-nestjs/src/common/services/user-permissions.service.ts`
- **Action**: Verify the `getAccessibleReservationCalendars()` method exists and returns proper data
- **Expected Response Format**:
  ```typescript
  {
    organizationId: number;
    organizationName: string;
    resourceTypes: [
      {
        id: number;
        name: string;
        resources: [
          {
            id: number;
            name: string;
            reservationCalendarId: number;
          }
        ]
      }
    ]
  }
  ```
- **Deliverable**: Confirmed API endpoint returns hierarchical data

#### Task 1.2: Create Frontend Service Method
- **File**: `frontend/src/services/api.ts`
- **Action**: Add method to fetch reservation calendars
- **Code**:
  ```typescript
  async getAccessibleReservationCalendars() {
    return this.get('/user-permissions/accessible-reservation-calendars');
  }
  ```
- **Deliverable**: Service method ready to use

---

### Phase 2: State Management (Estimated: 1 hour)

#### Task 2.1: Add State to Calendar Component
- **File**: `frontend/src/components/Calendar.tsx`
- **Action**: Add state for reservation calendars and visibility
- **State Structure**:
  ```typescript
  // Hierarchical data from API
  const [reservationOrgs, setReservationOrgs] = useState<ReservationOrg[]>([]);

  // Visibility toggles (stored as Set for O(1) lookup)
  const [visibleOrgIds, setVisibleOrgIds] = useState<Set<number>>(new Set());
  const [visibleTypeIds, setVisibleTypeIds] = useState<Set<number>>(new Set());
  const [visibleResourceIds, setVisibleResourceIds] = useState<Set<number>>(new Set());

  // Selected reservation calendar IDs for fetching events
  const [selectedReservationCalendars, setSelectedReservationCalendars] = useState<number[]>([]);
  ```
- **Deliverable**: State structure defined and initialized

#### Task 2.2: Load Reservation Calendars on Mount
- **File**: `frontend/src/components/Calendar.tsx`
- **Action**: Fetch reservation calendars when component mounts
- **Code**:
  ```typescript
  useEffect(() => {
    const loadReservationCalendars = async () => {
      try {
        const data = await apiService.getAccessibleReservationCalendars();
        setReservationOrgs(data);

        // Auto-expand all by default
        const orgIds = new Set(data.map(org => org.organizationId));
        const typeIds = new Set(data.flatMap(org =>
          org.resourceTypes.map(rt => rt.id)
        ));
        const resourceIds = new Set(data.flatMap(org =>
          org.resourceTypes.flatMap(rt =>
            rt.resources.map(r => r.id)
          )
        ));

        setVisibleOrgIds(orgIds);
        setVisibleTypeIds(typeIds);
        setVisibleResourceIds(resourceIds);

        // Auto-select all reservation calendars
        const calIds = data.flatMap(org =>
          org.resourceTypes.flatMap(rt =>
            rt.resources.map(r => r.reservationCalendarId)
          )
        );
        setSelectedReservationCalendars(calIds);
      } catch (error) {
        console.error('Failed to load reservation calendars:', error);
      }
    };

    loadReservationCalendars();
  }, []);
  ```
- **Deliverable**: Reservation calendars loaded and auto-selected

---

### Phase 3: CalendarSidebar UI Enhancement (Estimated: 2-3 hours)

#### Task 3.1: Add Props to CalendarSidebar
- **File**: `frontend/src/components/CalendarSidebar.tsx`
- **Action**: Add new props for reservation calendars
- **Props**:
  ```typescript
  interface CalendarSidebarProps {
    // ... existing props ...

    // Reservation calendars
    reservationOrgs?: ReservationOrg[];
    visibleOrgIds?: Set<number>;
    visibleTypeIds?: Set<number>;
    visibleResourceIds?: Set<number>;
    selectedReservationCalendars?: number[];
    onToggleOrg?: (orgId: number) => void;
    onToggleType?: (typeId: number) => void;
    onToggleResource?: (resourceId: number) => void;
    onToggleReservationCalendar?: (calendarId: number) => void;
    onSelectAllReservations?: () => void;
    onDeselectAllReservations?: () => void;
  }
  ```
- **Deliverable**: Props interface updated

#### Task 3.2: Create Reservation Calendars Section
- **File**: `frontend/src/components/CalendarSidebar.tsx`
- **Action**: Add new collapsible section below "My Calendars"
- **UI Structure**:
  ```
  ┌─ My Calendars ────────────────┐
  │ [✓] Personal                  │
  │ [✓] Work                      │
  └───────────────────────────────┘

  ┌─ Reservation Calendars ───────┐  ← NEW SECTION
  │ [v] TechCorp Solutions        │  ← Organization (collapsible)
  │   [v] Meeting Rooms           │  ← Resource Type (collapsible)
  │     [✓] Conference Room A     │  ← Resource (checkbox)
  │     [✓] Conference Room B     │
  │   [v] Desks                   │
  │     [✓] Desk #1               │
  │     [✓] Desk #2               │
  └───────────────────────────────┘
  ```
- **Deliverable**: Section header with select all/none buttons

#### Task 3.3: Implement Organization Level
- **File**: `frontend/src/components/CalendarSidebar.tsx`
- **Action**: Render organizations with expand/collapse toggle
- **Features**:
  - Click org name to expand/collapse
  - Chevron icon (right when collapsed, down when expanded)
  - Show count of selected resources (e.g., "3/5 selected")
- **Deliverable**: Organizations display with toggle

#### Task 3.4: Implement Resource Type Level
- **File**: `frontend/src/components/CalendarSidebar.tsx`
- **Action**: Render resource types nested under organizations
- **Features**:
  - Indented with left padding
  - Click type name to expand/collapse
  - Show count of selected resources
- **Deliverable**: Resource types display with toggle

#### Task 3.5: Implement Resource Level
- **File**: `frontend/src/components/CalendarSidebar.tsx`
- **Action**: Render resources with checkboxes
- **Features**:
  - Deeper indentation
  - Checkbox to toggle reservation calendar visibility
  - Resource name and capacity display
  - Color indicator (use theme color with opacity)
- **Deliverable**: Resources display with checkboxes

#### Task 3.6: Implement Select All/None for Reservations
- **File**: `frontend/src/components/CalendarSidebar.tsx`
- **Action**: Add buttons to select/deselect all reservation calendars
- **Deliverable**: Buttons toggle all reservation calendar visibility

---

### Phase 4: Event Fetching Integration (Estimated: 1-2 hours)

#### Task 4.1: Update Event Fetching Logic
- **File**: `frontend/src/components/Calendar.tsx` or `EnhancedCalendar.tsx`
- **Action**: Fetch events from reservation calendars
- **Changes**:
  ```typescript
  // Existing: Fetch from selected personal calendars
  const calendarIds = selectedCalendars.join(',');
  const events = await apiService.getEvents(calendarIds, startDate, endDate);

  // New: Also fetch from selected reservation calendars
  if (selectedReservationCalendars.length > 0) {
    const reservationEvents = await Promise.all(
      selectedReservationCalendars.map(calId =>
        apiService.get(`/reservation-calendars/${calId}/reservations`, {
          params: { startDate, endDate }
        })
      )
    );

    // Merge and format reservation events
    const formattedReservationEvents = reservationEvents.flat().map(res => ({
      id: `reservation-${res.id}`,
      title: res.customerInfo?.name || 'Reservation',
      start: res.startTime,
      end: res.endTime,
      calendarId: res.reservationCalendarId,
      color: '#10b981', // Green for reservations
      type: 'reservation',
      metadata: res
    }));

    allEvents = [...events, ...formattedReservationEvents];
  }
  ```
- **Deliverable**: Reservation events appear in calendar

#### Task 4.2: Add Visual Distinction for Reservation Events
- **File**: `frontend/src/components/calendar/EnhancedCalendar.tsx` (or wherever events are rendered)
- **Action**: Style reservation events differently
- **Features**:
  - Different color scheme (green tones)
  - Icon indicator (📅 or 🎫)
  - Tooltip shows customer info
- **Deliverable**: Reservations visually distinct from personal events

---

### Phase 5: Persistence & UX Polish (Estimated: 1 hour)

#### Task 5.1: Persist Visibility State
- **File**: `frontend/src/components/Calendar.tsx`
- **Action**: Save visibility preferences to localStorage
- **Code**:
  ```typescript
  useEffect(() => {
    localStorage.setItem('reservationVisibility', JSON.stringify({
      orgs: Array.from(visibleOrgIds),
      types: Array.from(visibleTypeIds),
      resources: Array.from(visibleResourceIds),
      calendars: selectedReservationCalendars
    }));
  }, [visibleOrgIds, visibleTypeIds, visibleResourceIds, selectedReservationCalendars]);
  ```
- **Deliverable**: User preferences persist across sessions

#### Task 5.2: Add Loading & Error States
- **File**: `frontend/src/components/CalendarSidebar.tsx`
- **Action**: Show loading spinner and error messages
- **Deliverable**: Better UX during data loading

#### Task 5.3: Add Empty State
- **File**: `frontend/src/components/CalendarSidebar.tsx`
- **Action**: Show message when user has no reservation calendar access
- **Message**: "No reservation calendars available. Contact your organization admin for access."
- **Deliverable**: Clear empty state

---

### Phase 6: Testing & Validation (Estimated: 1 hour)

#### Task 6.1: Manual Testing Checklist
- [ ] Reservation calendars load on mount
- [ ] Organizations expand/collapse correctly
- [ ] Resource types expand/collapse correctly
- [ ] Resource checkboxes toggle visibility
- [ ] Select all/none buttons work
- [ ] Reservation events appear in calendar
- [ ] Reservation events have correct time and details
- [ ] Visibility state persists after refresh
- [ ] Works for users with no reservation access
- [ ] Works for users with multiple organizations
- [ ] Performance is acceptable with many resources

#### Task 6.2: Edge Case Testing
- [ ] User with 0 reservation calendars
- [ ] User with 1 organization, 1 type, 1 resource
- [ ] User with 3+ organizations, 10+ resources
- [ ] Switching between month/week views
- [ ] Date navigation with reservation events
- [ ] Event click shows reservation details

#### Task 6.3: Browser Compatibility
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile responsive

---

## Data Models

### ReservationOrg Interface
```typescript
interface ReservationOrg {
  organizationId: number;
  organizationName: string;
  resourceTypes: ResourceTypeWithResources[];
}

interface ResourceTypeWithResources {
  id: number;
  name: string;
  description?: string;
  resources: ResourceWithCalendar[];
}

interface ResourceWithCalendar {
  id: number;
  name: string;
  description?: string;
  capacity?: number;
  reservationCalendarId: number;
}
```

### Reservation Event Format
```typescript
interface ReservationEvent extends CalendarEvent {
  type: 'reservation';
  metadata: {
    reservationId: number;
    resourceId: number;
    resourceName: string;
    customerInfo: {
      name: string;
      email?: string;
      phone?: string;
    };
    status: 'pending' | 'confirmed' | 'cancelled';
    notes?: string;
  };
}
```

---

## API Endpoints Required

### GET /api/user-permissions/accessible-reservation-calendars
**Response**:
```json
[
  {
    "organizationId": 1,
    "organizationName": "TechCorp Solutions",
    "resourceTypes": [
      {
        "id": 1,
        "name": "Meeting Rooms",
        "resources": [
          {
            "id": 1,
            "name": "Conference Room A",
            "capacity": 10,
            "reservationCalendarId": 101
          }
        ]
      }
    ]
  }
]
```

### GET /api/reservation-calendars/:id/reservations
**Query Params**: `startDate`, `endDate`
**Response**:
```json
[
  {
    "id": 1,
    "reservationCalendarId": 101,
    "resourceId": 1,
    "startTime": "2025-10-01T10:00:00Z",
    "endTime": "2025-10-01T11:00:00Z",
    "status": "confirmed",
    "customerInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "notes": "Team meeting"
  }
]
```

---

## Success Criteria

1. ✅ Reservation calendars appear in sidebar below personal calendars
2. ✅ Hierarchical organization (Org → Type → Resource) displays correctly
3. ✅ Expand/collapse works for all levels
4. ✅ Checkboxes toggle individual resource calendar visibility
5. ✅ Reservation events appear in month and week views
6. ✅ Reservation events are visually distinct from personal events
7. ✅ Select all/none functionality works
8. ✅ Visibility preferences persist across sessions
9. ✅ Performance is acceptable (< 2 seconds to load)
10. ✅ Works on different screen sizes (responsive)

---

## Implementation Order

1. **Start with Backend** - Verify API endpoints work
2. **State Management** - Set up data structures in Calendar component
3. **UI - Basic Section** - Add empty reservation section to sidebar
4. **UI - Organizations** - Render organizations with toggle
5. **UI - Types & Resources** - Render full hierarchy
6. **Event Integration** - Fetch and display reservation events
7. **Polish & Persist** - Add persistence and UX improvements
8. **Test** - Comprehensive testing

---

## Estimated Total Time: 8-12 hours

- Backend verification: 1-2 hours
- State & data loading: 1-2 hours
- UI implementation: 3-4 hours
- Event integration: 1-2 hours
- Polish & persistence: 1 hour
- Testing: 1 hour

---

## Future Enhancements (Out of Scope)

- Drag & drop to reschedule reservations
- Quick reservation creation from calendar
- Reservation filtering by status
- Resource availability overlay
- Real-time updates via WebSocket
- Export reservations to CSV
- Email notifications for new reservations
- Conflict resolution UI
