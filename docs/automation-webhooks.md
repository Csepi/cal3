# Automation Webhooks Documentation

## Overview

The Webhook Incoming trigger allows external systems to trigger automation rules by sending HTTP POST requests to a unique webhook URL. When data is received, the automation system can evaluate conditions based on the webhook payload and execute configured actions.

## Features

- **Unique Webhook URLs**: Each webhook-triggered rule gets a unique, secure URL
- **Smart Values**: Access webhook data fields using dot notation in conditions
- **JSON Support**: Full support for nested JSON objects and arrays
- **Security**: Token-based authentication with regeneration support
- **Flexible Conditions**: Use webhook data in any supported condition operator

---

## Getting Started

### 1. Create a Webhook Rule

1. Navigate to the Automation panel
2. Click "Create Rule"
3. Select **"Incoming Webhook"** as the trigger type
4. Save the rule to generate a unique webhook URL

### 2. Get Your Webhook URL

After saving the rule, you'll see a webhook configuration panel with:
- Your unique webhook URL
- Copy button for easy sharing
- Token regeneration option
- Usage examples

Example webhook URL:
```
http://localhost:8081/api/automation/webhook/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### 3. Send Data to Your Webhook

Send a POST request with JSON data:

```bash
curl -X POST \
  http://localhost:8081/api/automation/webhook/YOUR_TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "12345",
    "order_status": "completed",
    "amount": 150.00,
    "metadata": {
      "source": "web",
      "priority": "high"
    }
  }'
```

---

## Using Smart Values

### Accessing Webhook Data in Conditions

Use the **"Webhook Data"** condition field with dot notation to access payload values:

| Field Path | Accesses |
|------------|----------|
| `webhook.data` | Entire payload object |
| `webhook.data.customer_id` | `"12345"` |
| `webhook.data.order_status` | `"completed"` |
| `webhook.data.amount` | `150.00` |
| `webhook.data.metadata.source` | `"web"` |
| `webhook.data.metadata.priority` | `"high"` |

### Example Conditions

**Check order status:**
```
Field: Webhook Data
Operator: equals
Value: webhook.data.order_status
Expected: completed
```

**Check if amount exceeds threshold:**
```
Field: Webhook Data
Operator: greater_than
Value: webhook.data.amount
Expected: 100
```

**Check nested metadata:**
```
Field: Webhook Data
Operator: equals
Value: webhook.data.metadata.priority
Expected: high
```

---

## Complete Example

### Scenario: Notify when high-priority orders are completed

**Webhook Payload:**
```json
{
  "order_id": "ORD-789",
  "customer_name": "John Doe",
  "order_status": "completed",
  "total_amount": 250.00,
  "metadata": {
    "priority": "high",
    "source": "mobile_app"
  }
}
```

**Automation Rule Configuration:**

1. **Trigger**: Incoming Webhook
2. **Conditions** (AND logic):
   - Webhook Data `webhook.data.order_status` equals `completed`
   - Webhook Data `webhook.data.metadata.priority` equals `high`
3. **Actions**:
   - Send Notification (planned action type)
   - Create Task (planned action type)

---

## Supported Operators

All standard condition operators work with webhook data:

### String Operators
- **equals** / **not_equals**: Exact match
- **contains** / **not_contains**: Substring search
- **starts_with** / **ends_with**: Prefix/suffix match

### Numeric Operators
- **greater_than** / **less_than**: Numeric comparison
- **greater_than_or_equal** / **less_than_or_equal**: Inclusive comparison

### Boolean Operators
- **is_true** / **is_false**: Boolean checks
- **is_empty** / **is_not_empty**: Null/empty checks

### Array Operators
- **in_list**: Check if value is in comma-separated list

---

## Security

### Token Management

**Webhook Token:**
- Automatically generated when creating a webhook rule
- 64-character secure random string
- Unique per rule

**Regeneration:**
1. Open the rule in edit mode
2. Click "Regenerate Token" button
3. Confirm the action
4. Update external systems with new URL

⚠️ **Warning**: Regenerating the token will invalidate the old webhook URL immediately.

### Best Practices

1. **Keep tokens secret**: Treat webhook URLs like passwords
2. **Use HTTPS**: Always use HTTPS in production
3. **Rotate tokens**: Periodically regenerate tokens for sensitive integrations
4. **Validate payloads**: Use conditions to validate expected data structure
5. **Monitor logs**: Check audit logs for unexpected webhook calls

---

## API Response

### Success Response (200 OK)
```json
{
  "success": true,
  "ruleId": 42,
  "message": "Webhook processed successfully"
}
```

### Error Responses

**404 Not Found** - Invalid webhook token:
```json
{
  "message": "Invalid webhook token"
}
```

**400 Bad Request** - Rule is disabled:
```json
{
  "message": "Webhook rule is disabled"
}
```

---

## Integration Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const webhookUrl = 'http://localhost:8081/api/automation/webhook/YOUR_TOKEN';

const data = {
  customer_id: '12345',
  order_status: 'completed',
  amount: 150.00,
  metadata: {
    source: 'api',
    priority: 'high'
  }
};

axios.post(webhookUrl, data)
  .then(response => {
    console.log('Webhook triggered:', response.data);
  })
  .catch(error => {
    console.error('Webhook error:', error.response?.data);
  });
```

### Python

```python
import requests
import json

webhook_url = 'http://localhost:8081/api/automation/webhook/YOUR_TOKEN'

data = {
    'customer_id': '12345',
    'order_status': 'completed',
    'amount': 150.00,
    'metadata': {
        'source': 'api',
        'priority': 'high'
    }
}

response = requests.post(webhook_url, json=data)

if response.status_code == 200:
    print('Webhook triggered:', response.json())
else:
    print('Error:', response.text)
```

### cURL

```bash
curl -X POST \
  http://localhost:8081/api/automation/webhook/YOUR_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "12345",
    "order_status": "completed",
    "amount": 150.00
  }'
```

---

## Audit Logs

All webhook executions are logged in the audit system:

- **Trigger Context**: Contains the complete webhook payload
- **Conditions Result**: Shows which conditions passed/failed
- **Action Results**: Records all executed actions
- **Execution Time**: Performance metrics for each webhook call

Access audit logs from the rule detail view's "Audit Logs" tab.

---

## Limitations

- **Payload Size**: Maximum 1MB JSON payload (configurable)
- **Rate Limiting**: Per-rule rate limiting (1-minute cooldown for manual execution)
- **Timeout**: Webhook processing timeout is 30 seconds
- **Conditions**: Maximum 10 conditions per rule
- **Actions**: Maximum 5 actions per rule

---

## Troubleshooting

### Webhook Not Triggering

1. **Check rule is enabled**: Verify the "Enable this rule" checkbox is checked
2. **Verify token**: Ensure webhook URL matches the current token (check for recent regeneration)
3. **Check payload format**: Must be valid JSON with Content-Type: application/json
4. **Review audit logs**: Check if the rule was triggered but conditions failed

### Condition Not Matching

1. **Check field path**: Verify dot notation path matches your payload structure
2. **Test with simple condition**: Start with `webhook.data` to ensure webhook is receiving data
3. **Check data types**: Ensure numeric comparisons use numbers, not strings
4. **Review audit logs**: See actual vs expected values in condition evaluations

### Common Errors

**"Field path not found in payload"**
- The specified webhook.data path doesn't exist in your JSON
- Check for typos in field names
- Verify nested object structure

**"Webhook data not available"**
- Trying to use webhook conditions with non-webhook trigger
- Only use Webhook Data field with Incoming Webhook trigger

---

## Future Enhancements

Planned features for webhook triggers:

- **Webhook Signature Validation**: HMAC-based payload verification
- **Custom Headers**: Support for header-based authentication
- **Retry Logic**: Automatic retry on failure
- **Response Customization**: Custom HTTP response codes and messages
- **Webhook Templates**: Pre-configured webhook rules for common services
- **Payload Transformation**: Transform incoming data before evaluation

---

## Support

For issues or questions:
- Check audit logs for detailed execution traces
- Review condition evaluations in rule detail view
- Consult main automation documentation: [docs/automation.md](./automation.md)
- Report bugs via GitHub issues

---

**Version**: 1.3.1
**Last Updated**: 2025-10-27
**Status**: Production Ready
