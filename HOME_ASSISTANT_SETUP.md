# Home Assistant + Claude Code Integration Setup

## ✅ What's Working
The notification system is set up and working! The webhook method successfully sends notifications to your Home Assistant instance.

## 🔧 Home Assistant Configuration

### 1. Create a Webhook Automation

Add this to your Home Assistant `configuration.yaml` or create it through the UI:

```yaml
# Webhook for Claude Code notifications
automation:
  - id: claude_code_notification
    alias: "Claude Code Activity Notification"
    trigger:
      - platform: webhook
        webhook_id: claude_code_activity
    action:
      - service: notify.persistent_notification
        data:
          title: "{{ trigger.json.title }}"
          message: "{{ trigger.json.message }}"
          notification_id: "claude_{{ now().timestamp() | int }}"
      # Optional: Send to mobile app
      - service: notify.mobile_app_your_device  # Replace with your device
        data:
          title: "{{ trigger.json.title }}"
          message: "{{ trigger.json.message }}"
      # Optional: Log to logbook
      - service: logbook.log
        data:
          name: "Claude Code"
          message: "{{ trigger.json.message }}"
```

### 2. Alternative: Manual Webhook Setup

If you prefer the UI:

1. Go to **Settings** → **Automations & Scenes** → **+ Create Automation**
2. Choose **Start with an empty automation**
3. **Trigger**:
   - Type: **Webhook**
   - Webhook ID: `claude_code_activity`
4. **Action**:
   - Service: `notify.persistent_notification`
   - Title: `{{ trigger.json.title }}`
   - Message: `{{ trigger.json.message }}`

## 🚀 Usage

### Manual Testing
```bash
# Test a question notification
node claude-code-hook.js question "How do I implement user authentication?"

# Test a response notification
node claude-code-hook.js response "Authentication implementation completed"

# Test an error notification
node claude-code-hook.js error "Build failed with TypeScript errors"
```

### Automatic Integration

To automatically trigger notifications when you ask questions in Claude Code, you can:

#### Option 1: Hook into Claude Code directly
If Claude Code supports hooks, add this to your Claude Code configuration:
```json
{
  "hooks": {
    "on_question": "node C:\\Users\\ThinkPad\\cal3\\claude-code-hook.js question",
    "on_response": "node C:\\Users\\ThinkPad\\cal3\\claude-code-hook.js response",
    "on_error": "node C:\\Users\\ThinkPad\\cal3\\claude-code-hook.js error"
  }
}
```

#### Option 2: Keyboard Shortcut
Create a keyboard shortcut that runs:
```bash
node C:\Users\ThinkPad\cal3\claude-code-hook.js question "New question started"
```

#### Option 3: File Watcher
Monitor Claude Code logs/activity files and trigger notifications based on changes.

## 📱 Mobile Notifications

To get notifications on your phone:

1. Install the Home Assistant mobile app
2. Set up the `notify.mobile_app_*` service
3. Update the automation to include mobile notifications:

```yaml
- service: notify.mobile_app_your_phone
  data:
    title: "{{ trigger.json.title }}"
    message: "{{ trigger.json.message }}"
    data:
      priority: high
      channel: claude_code
```

## 🎨 Advanced Features

### Rich Notifications
```yaml
- service: notify.mobile_app_your_phone
  data:
    title: "{{ trigger.json.title }}"
    message: "{{ trigger.json.message }}"
    data:
      actions:
        - action: "open_claude"
          title: "Open Claude Code"
        - action: "dismiss"
          title: "Dismiss"
      image: "/local/claude-code-icon.png"
      color: "#FF6B35"
```

### Conditional Notifications
Only notify during work hours:
```yaml
condition:
  - condition: time
    after: "09:00:00"
    before: "18:00:00"
    weekday:
      - mon
      - tue
      - wed
      - thu
      - fri
```

## 🔍 Troubleshooting

### Check Webhook Status
```bash
# Test webhook directly
curl -X POST http://www.cselo.hu:8124/api/webhook/claude_code_activity \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Manual test notification"}'
```

### View Logs
- Check Home Assistant logs: **Settings** → **System** → **Logs**
- Check webhook calls in **Developer Tools** → **Events** → Listen to `automation_triggered`

### Common Issues
1. **Webhook not working**: Make sure the webhook ID matches exactly
2. **No mobile notifications**: Verify mobile app integration is set up
3. **Authentication errors**: Check if your HA token is still valid

## 🎯 Next Steps

1. ✅ Test the current setup with `node claude-code-hook.js question "test"`
2. 🔧 Create the Home Assistant automation
3. 📱 Set up mobile notifications if desired
4. 🔗 Integrate with your actual Claude Code workflow

The foundation is working! You should now see notifications in your Home Assistant when running the test command.