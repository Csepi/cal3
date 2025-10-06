# Automation System - Frontend Design

**Version:** 1.0
**Date:** 2025-10-06
**Status:** Architecture & Planning Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [UI Component Specifications](#ui-component-specifications)
4. [User Flows](#user-flows)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Styling & Theme Integration](#styling--theme-integration)
8. [Accessibility](#accessibility)

---

## Overview

The Automation frontend provides an intuitive interface for users to create, manage, and monitor automation rules. The UI is built with React 19, TypeScript, and Tailwind CSS, maintaining consistency with the existing Cal3 design system.

**Key Features:**
1. **Rule Management Dashboard** - List, create, edit, delete rules
2. **Visual Rule Builder** - Drag-and-drop interface for conditions and actions
3. **Condition Builder** - Boolean logic editor with grouping
4. **Action Configurator** - Type-specific configuration forms
5. **Audit Log Viewer** - Execution history with filtering
6. **Retroactive Execution Dialog** - One-time rule application

---

## Component Architecture

### Component Hierarchy

```
Dashboard
└── AutomationPanel (new tab)
    ├── AutomationList
    │   ├── AutomationRuleCard
    │   ├── CreateRuleButton
    │   └── RuleFilters
    │
    ├── AutomationRuleModal
    │   ├── RuleBasicInfo
    │   ├── TriggerSelector
    │   ├── ConditionBuilder
    │   │   ├── ConditionGroup
    │   │   │   └── ConditionRow
    │   │   ├── LogicOperatorSelector
    │   │   └── AddConditionButton
    │   ├── ActionBuilder
    │   │   ├── ActionRow
    │   │   │   └── ActionConfigForm
    │   │   └── AddActionButton
    │   ├── RetroactiveExecutionToggle
    │   └── SaveRuleButton
    │
    ├── AutomationDetailView
    │   ├── RuleHeader
    │   ├── RuleSummary
    │   ├── ConditionsList
    │   ├── ActionsList
    │   ├── ExecutionStats
    │   └── AuditLogSection
    │
    └── AuditLogViewer
        ├── AuditLogFilters
        ├── AuditLogTable
        │   └── AuditLogRow
        └── AuditLogDetailModal
```

### File Structure

```
frontend/src/
├── components/
│   ├── automation/
│   │   ├── AutomationPanel.tsx
│   │   ├── AutomationList.tsx
│   │   ├── AutomationRuleCard.tsx
│   │   ├── AutomationRuleModal.tsx
│   │   ├── AutomationDetailView.tsx
│   │   ├── AuditLogViewer.tsx
│   │   ├── AuditLogDetailModal.tsx
│   │   ├── builders/
│   │   │   ├── TriggerSelector.tsx
│   │   │   ├── ConditionBuilder.tsx
│   │   │   ├── ConditionRow.tsx
│   │   │   ├── ActionBuilder.tsx
│   │   │   ├── ActionRow.tsx
│   │   │   └── ActionConfigForms/
│   │   │       ├── SetEventColorForm.tsx
│   │   │       └── (future action forms)
│   │   └── dialogs/
│   │       ├── DeleteRuleDialog.tsx
│   │       └── RetroactiveExecutionDialog.tsx
│   └── Dashboard.tsx (modified)
│
├── services/
│   └── automationService.ts
│
├── hooks/
│   ├── useAutomationRules.ts
│   ├── useAutomationMetadata.ts
│   └── useAuditLogs.ts
│
└── types/
    └── Automation.ts
```

---

## UI Component Specifications

### 1. AutomationPanel

**Purpose:** Main container for automation features, accessible from Dashboard navigation.

**Props:** None (fetches user context from Dashboard)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ [< Back to Calendar]           Automation Rules     │
├─────────────────────────────────────────────────────┤
│ [+ Create Rule]  [Filter: All ▾] [Search...]       │
├─────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────┐   │
│ │ [●] Color work meetings blue                  │   │
│ │ Trigger: Event Created | 156 executions       │   │
│ │ Last run: 2 hours ago                         │   │
│ │ [View] [Edit] [●●●]                           │   │
│ └───────────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────────┐   │
│ │ [○] Remind before long meetings (disabled)    │   │
│ │ Trigger: Event Starts In 30min | 0 executions│   │
│ │ Never run                                     │   │
│ │ [View] [Edit] [●●●]                           │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ [1] [2] [3] ... [8]                                │
└─────────────────────────────────────────────────────┘
```

**State:**
- `rules: AutomationRuleDto[]` - List of rules
- `filter: 'all' | 'enabled' | 'disabled'` - Filter state
- `searchQuery: string` - Search input
- `page: number` - Current page

**Features:**
- Navigation back to calendar
- Create new rule button
- Filter dropdown (All, Enabled, Disabled)
- Search by rule name
- Paginated rule list
- Quick actions per rule (View, Edit, Delete, Toggle enabled)

**Component Skeleton:**
```typescript
export const AutomationPanel: React.FC = () => {
  const [rules, setRules] = useState<AutomationRuleDto[]>([]);
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<number | null>(null);

  const { data, loading, error } = useAutomationRules({ filter, searchQuery, page });

  // ... handlers

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      {/* Filters */}
      {/* Rule List */}
      {/* Pagination */}

      {showCreateModal && (
        <AutomationRuleModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateRule}
        />
      )}
    </div>
  );
};
```

---

### 2. AutomationRuleCard

**Purpose:** Display summary of a single automation rule.

**Props:**
```typescript
interface AutomationRuleCardProps {
  rule: AutomationRuleDto;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, enabled: boolean) => void;
}
```

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ [●] Color work meetings blue              [●●●] │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 📅 Event Created                                │
│ ✓ 3 conditions | ⚡ 1 action                   │
│ 📊 156 executions | ⏱️ Last run: 2 hours ago   │
│                                                 │
│ [View Details] [Edit]                           │
└─────────────────────────────────────────────────┘
```

**Visual Elements:**
- Toggle switch (●/○) for enabled/disabled
- Rule name (bold, larger font)
- Divider line with theme color gradient
- Trigger type with icon
- Condition/action counts
- Execution statistics
- Action buttons

**Color Coding:**
- Enabled rules: Full color (theme color gradient)
- Disabled rules: Grayscale with opacity

---

### 3. AutomationRuleModal

**Purpose:** Create or edit automation rule with all configurations.

**Props:**
```typescript
interface AutomationRuleModalProps {
  rule?: AutomationRuleDetailDto; // undefined for create, defined for edit
  onClose: () => void;
  onSave: (rule: CreateAutomationRuleDto | UpdateAutomationRuleDto) => Promise<void>;
}
```

**Layout (Tabbed Interface):**
```
┌───────────────────────────────────────────────────┐
│ Create Automation Rule                       [×]  │
├───────────────────────────────────────────────────┤
│ [1. Basics] [2. Trigger] [3. Conditions] [4. Actions] [5. Review] │
├───────────────────────────────────────────────────┤
│                                                   │
│ === Tab 1: Basics ===                            │
│ Name: [________________________________]          │
│       Required, max 200 characters                │
│                                                   │
│ Description: [__________________________]         │
│              [__________________________]         │
│              Optional                             │
│                                                   │
│ [Next: Choose Trigger →]                          │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Tab Structure:**

**Tab 1: Basics**
- Rule name (required, 1-200 chars)
- Description (optional, textarea)

**Tab 2: Trigger**
- Trigger type selector (dropdown)
- Trigger configuration (conditional based on type)
  - For `event.starts_in`: Minutes/hours before input
  - For `scheduled.time`: Cron expression or visual scheduler

**Tab 3: Conditions**
- Condition builder (see ConditionBuilder component)
- Root logic operator (AND/OR toggle)
- Add condition button
- Condition rows with field/operator/value

**Tab 4: Actions**
- Action builder (see ActionBuilder component)
- Action rows with type selector and config form
- Add action button
- Drag-and-drop reordering

**Tab 5: Review**
- Summary of all configurations
- Retroactive execution option (checkbox)
- Save button

**State Management:**
```typescript
interface RuleFormState {
  name: string;
  description: string;
  triggerType: TriggerType | null;
  triggerConfig: Record<string, any>;
  conditionLogic: ConditionLogic;
  conditions: ConditionFormData[];
  actions: ActionFormData[];
  isEnabled: boolean;
  runRetroactively: boolean;
}
```

---

### 4. ConditionBuilder

**Purpose:** Build complex condition logic with multiple conditions and grouping.

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Conditions (All must be true) [AND ▾]           │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ If [Event Title ▾] [contains ▾] [meeting ]  │ │
│ │                                      [×]     │ │
│ └─────────────────────────────────────────────┘ │
│ [AND ▾]                                         │
│ ┌─────────────────────────────────────────────┐ │
│ │ If [Event Duration ▾] [> ▾] [30] minutes    │ │
│ │                                      [×]     │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [+ Add Condition]                               │
└─────────────────────────────────────────────────┘
```

**Features:**
- Root logic operator selector (AND/OR)
- Multiple condition rows
- Per-condition logic operator (between rows)
- Field selector (dropdown with categories)
- Operator selector (filtered by field type)
- Value input (type-specific: text, number, dropdown)
- Delete condition button
- Add condition button

**Component Skeleton:**
```typescript
export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  conditions,
  conditionLogic,
  onChange,
}) => {
  const { fields, operators } = useAutomationMetadata();

  const handleAddCondition = () => {
    const newCondition: ConditionFormData = {
      field: null,
      operator: null,
      value: '',
      logicOperator: ConditionLogicOperator.AND,
      order: conditions.length,
    };
    onChange([...conditions, newCondition]);
  };

  const handleUpdateCondition = (index: number, updates: Partial<ConditionFormData>) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleDeleteCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3>Conditions</h3>
        <LogicOperatorSelector
          value={conditionLogic}
          onChange={(logic) => {/* update parent */}}
        />
      </div>

      {conditions.map((condition, index) => (
        <div key={index}>
          <ConditionRow
            condition={condition}
            fields={fields}
            operators={operators}
            onUpdate={(updates) => handleUpdateCondition(index, updates)}
            onDelete={() => handleDeleteCondition(index)}
          />
          {index < conditions.length - 1 && (
            <LogicOperatorSelector
              value={condition.logicOperator}
              onChange={(op) => handleUpdateCondition(index, { logicOperator: op })}
            />
          )}
        </div>
      ))}

      <button onClick={handleAddCondition}>
        + Add Condition
      </button>
    </div>
  );
};
```

---

### 5. ActionBuilder

**Purpose:** Configure actions to execute when conditions pass.

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Actions                                         │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ [⋮⋮] Set Event Color                [×]     │ │
│ │      Color: [#3b82f6 ▾] 🔵                  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [+ Add Action]                                  │
│                                                 │
│ Available actions:                              │
│ • Send Notification (coming soon)               │
│ • Modify Event Title (coming soon)              │
│ • Webhook (coming soon)                         │
└─────────────────────────────────────────────────┘
```

**Features:**
- Multiple action rows
- Drag-and-drop reordering (⋮⋮ handle)
- Action type selector
- Type-specific configuration forms
- Delete action button
- Add action dropdown (only shows implemented actions)
- Info section for future actions

**Component Skeleton:**
```typescript
export const ActionBuilder: React.FC<ActionBuilderProps> = ({
  actions,
  onChange,
}) => {
  const { actionTypes } = useAutomationMetadata();
  const implementedActions = actionTypes.filter(a => a.isImplemented);

  const handleAddAction = (actionType: ActionType) => {
    const newAction: ActionFormData = {
      actionType,
      actionConfig: {},
      order: actions.length,
    };
    onChange([...actions, newAction]);
  };

  const handleUpdateAction = (index: number, updates: Partial<ActionFormData>) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleDeleteAction = (index: number) => {
    const updated = actions.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const updated = [...actions];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <h3>Actions</h3>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="actions">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {actions.map((action, index) => (
                <Draggable key={index} draggableId={`action-${index}`} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <ActionRow
                        action={action}
                        actionTypes={implementedActions}
                        onUpdate={(updates) => handleUpdateAction(index, updates)}
                        onDelete={() => handleDeleteAction(index)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <AddActionDropdown
        availableActions={implementedActions}
        onSelect={handleAddAction}
      />
    </div>
  );
};
```

---

### 6. AuditLogViewer

**Purpose:** Display execution history with filtering and details.

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Execution History                               │
├─────────────────────────────────────────────────┤
│ [Status: All ▾] [Date: Last 30 days ▾] [Clear] │
├─────────────────────────────────────────────────┤
│ Date/Time         Event         Status   Actions│
├─────────────────────────────────────────────────┤
│ Oct 6, 14:30:00  Team Meeting   ✓ Success  [↗] │
│ Oct 6, 14:15:00  Standup        ✓ Success  [↗] │
│ Oct 6, 13:00:00  Sync Call      ✓ Success  [↗] │
│ Oct 6, 12:45:00  Planning       ⊘ Skipped  [↗] │
│ Oct 6, 12:30:00  Lunch          ✗ Failed   [↗] │
│                                                 │
│ Showing 5 of 156 | [1] [2] [3] ... [32]        │
└─────────────────────────────────────────────────┘
```

**Features:**
- Filter by status (All, Success, Failed, Skipped)
- Filter by date range (Last 7 days, 30 days, Custom)
- Sortable columns
- Status indicators with colors:
  - ✓ Success (green)
  - ✗ Failed (red)
  - ⊘ Skipped (gray)
  - ◐ Partial Success (yellow)
- Click row to view details
- Pagination

**Component Skeleton:**
```typescript
export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ ruleId }) => {
  const [status, setStatus] = useState<AuditLogStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<DateRange>('last_30_days');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<number | null>(null);

  const { data, loading, error } = useAuditLogs({
    ruleId,
    status: status === 'all' ? undefined : status,
    startDate: getStartDate(dateRange),
    endDate: new Date(),
    page,
    limit: 20,
  });

  const getStatusIcon = (status: AuditLogStatus) => {
    switch (status) {
      case 'success': return <span className="text-green-600">✓</span>;
      case 'failure': return <span className="text-red-600">✗</span>;
      case 'skipped': return <span className="text-gray-400">⊘</span>;
      case 'partial_success': return <span className="text-yellow-600">◐</span>;
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
          <option value="all">All Statuses</option>
          <option value="success">Success</option>
          <option value="failure">Failed</option>
          <option value="skipped">Skipped</option>
          <option value="partial_success">Partial Success</option>
        </select>

        <select value={dateRange} onChange={(e) => setDateRange(e.target.value as any)}>
          <option value="last_7_days">Last 7 days</option>
          <option value="last_30_days">Last 30 days</option>
          <option value="last_90_days">Last 90 days</option>
          <option value="custom">Custom range</option>
        </select>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr>
            <th>Date/Time</th>
            <th>Event</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map(log => (
            <tr
              key={log.id}
              onClick={() => setSelectedLog(log.id)}
              className="cursor-pointer hover:bg-gray-50"
            >
              <td>{formatDateTime(log.executedAt)}</td>
              <td>{log.event?.title || 'Event deleted'}</td>
              <td>{getStatusIcon(log.status)}</td>
              <td>{log.duration_ms}ms</td>
              <td>
                <button onClick={(e) => { e.stopPropagation(); setSelectedLog(log.id); }}>
                  ↗
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}

      {/* Detail Modal */}
      {selectedLog && (
        <AuditLogDetailModal
          logId={selectedLog}
          ruleId={ruleId}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};
```

---

### 7. AuditLogDetailModal

**Purpose:** Show detailed information about a single execution.

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Execution Details                          [×]  │
├─────────────────────────────────────────────────┤
│ 📅 Executed: Oct 6, 2025 14:30:00              │
│ ⏱️ Duration: 45ms                               │
│ 📊 Status: ✓ Success                            │
│                                                 │
│ 🎯 Trigger                                      │
│ • Type: Event Created                           │
│ • Event: Team Meeting (ID: 234)                │
│                                                 │
│ ✅ Conditions (2/2 passed)                      │
│ • Event title contains "meeting"                │
│   Expected: "meeting"                           │
│   Actual: "Team Meeting"                        │
│   Result: ✓ Passed                              │
│                                                 │
│ • Event duration > 30 minutes                   │
│   Expected: 30                                  │
│   Actual: 60                                    │
│   Result: ✓ Passed                              │
│                                                 │
│ ⚡ Actions (1 executed)                         │
│ • Set Event Color                               │
│   Color: #3b82f6                                │
│   Previous: #ef4444                             │
│   Result: ✓ Success                             │
│                                                 │
│ [Close]                                         │
└─────────────────────────────────────────────────┘
```

---

## User Flows

### Flow 1: Create New Automation Rule

1. User clicks "Create Rule" button on AutomationPanel
2. Modal opens to Tab 1 (Basics)
3. User enters rule name and description
4. User clicks "Next" to Tab 2 (Trigger)
5. User selects trigger type (e.g., "Event Created")
6. User configures trigger (if applicable)
7. User clicks "Next" to Tab 3 (Conditions)
8. User clicks "Add Condition"
9. User selects field (e.g., "Event Title")
10. User selects operator (e.g., "contains")
11. User enters value (e.g., "meeting")
12. User clicks "Add Condition" again (optional)
13. User configures second condition
14. User clicks "Next" to Tab 4 (Actions)
15. User clicks "Add Action"
16. User selects action type (e.g., "Set Event Color")
17. User configures action (selects color)
18. User clicks "Next" to Tab 5 (Review)
19. User reviews all configurations
20. User optionally checks "Apply to existing events"
21. User clicks "Save Rule"
22. Modal closes, rule appears in list

### Flow 2: View Audit Logs

1. User clicks "View" button on rule card
2. AutomationDetailView opens
3. User scrolls to "Execution History" section
4. User sees recent executions
5. User clicks "View All" to open AuditLogViewer
6. User filters by status (e.g., "Failed only")
7. User clicks on a log entry
8. AuditLogDetailModal opens
9. User views condition evaluations and action results
10. User closes modal

### Flow 3: Retroactive Execution

1. User clicks "Run Now" button on rule card
2. RetroactiveExecutionDialog opens
3. User selects calendars (optional)
4. User sets date range (optional)
5. User clicks "Run"
6. Dialog shows "Processing 342 events..."
7. User clicks "View Progress"
8. AuditLogViewer opens, filtered by execution ID
9. User sees real-time progress (refresh button)
10. User sees completion message

---

## State Management

### Custom Hooks

#### useAutomationRules

```typescript
export function useAutomationRules(filters?: {
  isEnabled?: boolean;
  triggerType?: TriggerType;
  page?: number;
  limit?: number;
}) {
  const [data, setData] = useState<PaginatedResponse<AutomationRuleDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchRules = async () => {
      try {
        setLoading(true);
        const result = await automationService.listRules(filters);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRules();

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(filters)]);

  const refetch = () => {
    setLoading(true);
    // Trigger useEffect
  };

  return { data, loading, error, refetch };
}
```

#### useAutomationMetadata

```typescript
export function useAutomationMetadata() {
  const [metadata, setMetadata] = useState<AutomationMetadataDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    automationService.getMetadata()
      .then(setMetadata)
      .finally(() => setLoading(false));
  }, []);

  return { metadata, loading };
}
```

#### useAuditLogs

```typescript
export function useAuditLogs(filters: {
  ruleId: number;
  status?: AuditLogStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const [data, setData] = useState<PaginatedResponse<AutomationAuditLogDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchLogs = async () => {
      try {
        setLoading(true);
        const result = await automationService.getAuditLogs(filters);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchLogs();

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(filters)]);

  return { data, loading, error };
}
```

---

## API Integration

### AutomationService

**File:** `frontend/src/services/automationService.ts`

```typescript
import { apiService } from './api';

class AutomationService {
  private baseUrl = '/api/automations';

  async listRules(filters?: {
    isEnabled?: boolean;
    triggerType?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AutomationRuleDto>> {
    const params = new URLSearchParams();
    if (filters?.isEnabled !== undefined) {
      params.append('isEnabled', String(filters.isEnabled));
    }
    if (filters?.triggerType) {
      params.append('triggerType', filters.triggerType);
    }
    if (filters?.page) {
      params.append('page', String(filters.page));
    }
    if (filters?.limit) {
      params.append('limit', String(filters.limit));
    }

    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: apiService.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch automation rules');
    }

    return response.json();
  }

  async getRule(id: number): Promise<AutomationRuleDetailDto> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      headers: apiService.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch rule');
    }

    return response.json();
  }

  async createRule(data: CreateAutomationRuleDto): Promise<AutomationRuleDetailDto> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: apiService.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create rule');
    }

    return response.json();
  }

  async updateRule(
    id: number,
    data: UpdateAutomationRuleDto
  ): Promise<AutomationRuleDetailDto> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      headers: apiService.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update rule');
    }

    return response.json();
  }

  async deleteRule(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: apiService.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete rule');
    }
  }

  async executeRetroactively(
    id: number,
    options: RetroactiveExecutionDto
  ): Promise<RetroactiveExecutionResponse> {
    const response = await fetch(`${this.baseUrl}/${id}/execute`, {
      method: 'POST',
      headers: apiService.getAuthHeaders(),
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to execute rule retroactively');
    }

    return response.json();
  }

  async getAuditLogs(filters: {
    ruleId: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AutomationAuditLogDto>> {
    const params = new URLSearchParams();
    params.append('page', String(filters.page || 1));
    params.append('limit', String(filters.limit || 50));
    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate.toISOString());
    }

    const response = await fetch(
      `${this.baseUrl}/${filters.ruleId}/audit?${params}`,
      {
        headers: apiService.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }

    return response.json();
  }

  async getAuditLog(ruleId: number, logId: number): Promise<AutomationAuditLogDetailDto> {
    const response = await fetch(`${this.baseUrl}/${ruleId}/audit/${logId}`, {
      headers: apiService.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audit log');
    }

    return response.json();
  }

  async getMetadata(): Promise<AutomationMetadataDto> {
    const response = await fetch(`${this.baseUrl}/metadata`, {
      headers: apiService.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch metadata');
    }

    return response.json();
  }
}

export const automationService = new AutomationService();
```

---

## Styling & Theme Integration

### Tailwind Classes

**Theme Color Integration:**
```typescript
const getThemeColors = (themeColor: string) => {
  // Same pattern as existing components (Calendar.tsx, Dashboard.tsx)
  const colors = {
    '#ef4444': { bg: 'bg-red-500', gradient: 'from-red-400 to-red-600', ... },
    '#3b82f6': { bg: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600', ... },
    // ... all 16 colors
  };
  return colors[themeColor] || colors['#3b82f6'];
};
```

**Glassmorphism Effects:**
```css
.glass-effect {
  @apply bg-white/80 backdrop-blur-md border border-white/20 shadow-lg;
}

.glass-card {
  @apply glass-effect rounded-lg p-6;
}

.glass-modal {
  @apply glass-effect rounded-xl p-8 max-w-4xl mx-auto;
}
```

**Gradient Backgrounds:**
```tsx
<div className={`min-h-screen bg-gradient-to-br from-${themeColors.light} to-${themeColors.lighter}`}>
  {/* Content */}
</div>
```

---

## Accessibility

### ARIA Labels

**Interactive Elements:**
```tsx
<button
  aria-label="Create new automation rule"
  onClick={handleCreate}
>
  + Create Rule
</button>

<select
  aria-label="Filter rules by status"
  value={filter}
  onChange={handleFilterChange}
>
  {/* Options */}
</select>
```

**Status Indicators:**
```tsx
<span
  role="img"
  aria-label="Rule is enabled"
  className="text-green-600"
>
  ●
</span>

<span
  role="status"
  aria-live="polite"
>
  Processing 342 events...
</span>
```

### Keyboard Navigation

**Shortcuts:**
- `Ctrl/Cmd + N`: Create new rule (when on AutomationPanel)
- `Enter`: Open rule details (when focused on rule card)
- `Delete`: Delete rule (when focused on rule card, with confirmation)
- `Tab`: Navigate between form fields in modal
- `Esc`: Close modal/dialog

**Focus Management:**
```tsx
useEffect(() => {
  // Focus first input when modal opens
  if (isOpen && firstInputRef.current) {
    firstInputRef.current.focus();
  }
}, [isOpen]);
```

### Screen Reader Support

**Descriptive Labels:**
```tsx
<h2 id="modal-title">Create Automation Rule</h2>
<div
  role="dialog"
  aria-labelledby="modal-title"
  aria-modal="true"
>
  {/* Modal content */}
</div>
```

**Status Updates:**
```tsx
<div role="status" aria-live="polite">
  {loading && 'Loading automation rules...'}
  {error && `Error: ${error.message}`}
  {data && `Loaded ${data.total} rules`}
</div>
```

---

**END OF DOCUMENT**
