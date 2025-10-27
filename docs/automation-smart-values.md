# Automation Smart Values Documentation

## Overview

Smart Values allow you to dynamically insert data from triggers into your automation actions. Instead of static values, you can use placeholders that get replaced with actual data when the action executes.

## Syntax

Smart values use double curly braces: `{{field.path}}`

Alternative syntax: `${field.path}`

## Available Smart Values by Trigger Type

### Event Triggers
Available for: `event.created`, `event.updated`, `event.deleted`, `event.starts_in`, `event.ends_in`, `calendar.imported`

#### Event Fields
- `{{event.id}}` - Event ID
- `{{event.title}}` - Event title/name
- `{{event.description}}` - Event description
- `{{event.location}}` - Event location
- `{{event.notes}}` - Event notes
- `{{event.date}}` - Event date (YYYY-MM-DD)
- `{{event.startTime}}` - Start time (HH:MM)
- `{{event.endTime}}` - End time (HH:MM)
- `{{event.color}}` - Event color code
- `{{event.status}}` - Event status
- `{{event.isAllDay}}` - All-day flag (true/false)

#### Computed Event Fields
- `{{event.duration}}` - Duration in minutes
- `{{event.durationHours}}` - Duration hours component
- `{{event.durationMinutes}}` - Duration minutes component
- `{{event.year}}` - Event year
- `{{event.month}}` - Event month (01-12)
- `{{event.day}}` - Event day (01-31)
- `{{event.dayOfWeek}}` - Day name (Monday, Tuesday, etc.)
- `{{event.dayOfWeekShort}}` - Day abbreviation (Mon, Tue, etc.)

#### Calendar Fields
- `{{calendar.id}}` - Calendar ID
- `{{calendar.name}}` - Calendar name
- `{{calendar.color}}` - Calendar color
- `{{calendar.description}}` - Calendar description

### Webhook Triggers
Available for: `webhook.incoming`

#### Webhook Data Fields
- `{{webhook.data.*}}` - Access any field using dot notation
- Examples:
  - `{{webhook.data.customer_id}}`
  - `{{webhook.data.order.status}}`
  - `{{webhook.data.metadata.priority}}`

### Trigger Metadata
Available for all triggers:

- `{{trigger.timestamp}}` - ISO timestamp when triggered
- `{{trigger.date}}` - Date when triggered (YYYY-MM-DD)
- `{{trigger.time}}` - Time when triggered (HH:MM:SS)
- `{{trigger.type}}` - Trigger type name

---

## Usage Examples

### Example 1: Copy Calendar Color to Event

**Trigger**: Event Created
**Action**: Set Event Color
**Color Value**: `{{calendar.color}}`

When a new event is created, it automatically gets the color of its parent calendar.

### Example 2: Dynamic Webhook-Based Color

**Trigger**: Incoming Webhook
**Webhook Payload**:
```json
{
  "event_type": "meeting",
  "color": "#3b82f6"
}
```

**Action**: Set Event Color (for existing events)
**Color Value**: `{{webhook.data.color}}`

The event color is set based on the incoming webhook data.

### Example 3: Conditional Formatting Based on Duration

**Trigger**: Event Created
**Conditions**: Duration > 60 minutes
**Action**: Set Event Color
**Color Value**: `#ef4444` (static red for long meetings)

Or use smart values from the event itself:
**Color Value**: `{{event.color}}` (preserve existing color)

### Example 4: Time-Based Dynamic Values

**Trigger**: Scheduled Time (Daily at 9 AM)
**Action**: Create Notification (future action type)
**Message**: `Daily Report for {{trigger.date}} at {{trigger.time}}`

### Example 5: Nested Webhook Data

**Webhook Payload**:
```json
{
  "order": {
    "id": "ORD-123",
    "customer": {
      "name": "John Doe",
      "tier": "premium"
    },
    "status": "completed"
  }
}
```

**Action**: Set Event Title (future action type)
**Title**: `Order {{webhook.data.order.id}} - {{webhook.data.order.customer.name}}`

Result: "Order ORD-123 - John Doe"

---

## Action Support

### Currently Supported Actions

#### Set Event Color
- Field: `color`
- Accepts: Hex color codes or smart values that resolve to colors
- Examples:
  - `{{calendar.color}}` - Use calendar's color
  - `{{event.color}}` - Preserve event's color
  - `{{webhook.data.color}}` - Use color from webhook

#### Webhook (Outgoing)
- Fields: All configuration fields support smart values
- `url`: Webhook URL (can include smart values in path)
- `customPayload`: JSON payload with smart value interpolation
- Examples:
  ```json
  {
    "event_title": "{{event.title}}",
    "event_date": "{{event.date}}",
    "calendar": "{{calendar.name}}"
  }
  ```

### Future Action Types
Smart values will work in all future action types:
- Update Event Title: `{{webhook.data.title}}`
- Update Event Description: `Meeting with {{event.location}}`
- Send Notification: `Event {{event.title}} starts at {{event.startTime}}`
- Create Task: `Follow up on {{event.title}}`

---

## Smart Value Picker UI

The Smart Value Picker button (✨ Insert Smart Value) appears in action forms when:
- A trigger type is selected
- The action supports smart values
- The field accepts text input

### Using the Picker

1. Click "✨ Insert Smart Value" button
2. Search for available smart values
3. Click a smart value to insert it
4. The value `{{field.path}}` is added to your input

### Features
- **Search**: Filter smart values by name or description
- **Categories**: Organized by Event, Calendar, Webhook, Trigger
- **Preview**: See the smart value syntax before inserting
- **Descriptions**: Understand what each smart value provides

---

## Backend Processing

### Interpolation Flow

1. **Action Execution Triggered**
2. **Context Built**: Extract all available smart values
   - Event data (if applicable)
   - Webhook data (if applicable)
   - Trigger metadata
3. **Interpolation**: Replace all smart value placeholders
4. **Validation**: Ensure result is valid for the action
5. **Action Execution**: Use interpolated values

### Smart Value Extraction

The backend `AutomationSmartValuesService` handles:
- Extracting values from trigger context
- Flattening nested objects (webhooks)
- Computing derived values (duration, date components)
- Interpolating placeholders in strings and objects

### Error Handling

If a smart value path doesn't exist:
- The placeholder is left unchanged
- Action validation may fail
- Error is logged in audit trail
- Example: `{{webhook.data.missing}}` stays as-is if `missing` field doesn't exist

---

## Best Practices

### 1. Test Your Smart Values
- Send test webhooks with sample data
- Create test events to verify smart value extraction
- Check audit logs for interpolated values

### 2. Validate Data Structure
- For webhooks: Ensure consistent JSON structure
- Document expected webhook payload format
- Handle missing fields gracefully

### 3. Use Fallbacks
For future enhancements, consider:
- `{{webhook.data.color || '#3b82f6'}}` - Fallback to default
- Conditional logic for missing fields

### 4. Naming Conventions
- Use clear, descriptive webhook field names
- Maintain consistent data structures
- Document available smart values for your team

### 5. Security Considerations
- Sanitize webhook data before sending to automation
- Don't expose sensitive data in smart values
- Validate interpolated values before action execution

---

## Troubleshooting

### Smart Value Not Replaced

**Problem**: Smart value appears as `{{field.path}}` in result

**Solutions**:
1. Check trigger type provides that smart value
2. Verify field path spelling
3. Review audit log for extraction errors
4. Ensure webhook payload contains the field

### Invalid Value After Interpolation

**Problem**: Action fails with "Invalid color format"

**Solutions**:
1. Verify smart value resolves to expected format
2. Check source data type matches requirement
3. Use static value to test action configuration
4. Review audit log for actual interpolated value

### Webhook Smart Values Not Available

**Problem**: `webhook.data.*` smart values empty

**Solutions**:
1. Verify trigger type is `webhook.incoming`
2. Check webhook payload is valid JSON
3. Review audit log triggerContext for received data
4. Test webhook endpoint with curl/Postman

---

## API Reference

### Get Available Smart Values

**Endpoint**: `GET /api/automation/smart-values/:triggerType`

**Example**:
```bash
GET /api/automation/smart-values/event.created
Authorization: Bearer {token}
```

**Response**:
```json
[
  {
    "field": "event.title",
    "label": "Event Title",
    "description": "Event title/name",
    "category": "Event"
  },
  {
    "field": "calendar.color",
    "label": "Calendar Color",
    "description": "Calendar color code",
    "category": "Calendar"
  }
]
```

---

## Future Enhancements

Planned smart values features:
- **Fallback Values**: `{{field || 'default'}}`
- **Transformations**: `{{event.title | uppercase}}`
- **Conditional Values**: `{{if event.isAllDay then '#ff0000' else '#0000ff'}}`
- **Date Formatting**: `{{event.date | format:'YYYY-MM-DD'}}`
- **String Operations**: `{{event.title | substring:0:50}}`
- **Math Operations**: `{{event.duration * 2}}`

---

**Version**: 1.2.9
**Last Updated**: 2025-10-27
**Status**: Production Ready
