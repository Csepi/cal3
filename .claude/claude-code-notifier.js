const axios = require('axios');

// Home Assistant configuration
const HA_URL = 'http://www.cselo.hu:8124'; // Your Home Assistant URL
const HA_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwYzJmZTdhNGM4Yzk0ZTE3YmY5M2NiZTg1MWY0ZmM3ZSIsImlhdCI6MTc1NDM4NjA1NiwiZXhwIjoyMDY5NzQ2MDU2fQ.hrZ9dA_gnf1x3PYwX0HVPbKSeJM4uJEEdZ77OtrUEug';

async function sendNotification(message, title = 'Claude Code Activity') {
  try {
    const response = await axios.post(
      `${HA_URL}/api/services/notify/persistent_notification`,
      {
        message: message,
        title: title,
        notification_id: `claude_code_${Date.now()}`
      },
      {
        headers: {
          'Authorization': `Bearer ${HA_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Notification sent successfully:', response.status);
    return true;
  } catch (error) {
    console.error('Failed to send notification:', error.message);
    return false;
  }
}

// Function to be called when a question is asked in Claude Code
async function notifyClaudeCodeActivity(question) {
  const message = `New question in Claude Code: "${question.substring(0, 100)}${question.length > 100 ? '...' : ''}"`;
  return await sendNotification(message);
}

// Test the notification
if (require.main === module) {
  notifyClaudeCodeActivity('Test question from Claude Code setup')
    .then(() => console.log('Test completed'))
    .catch(console.error);
}

module.exports = { sendNotification, notifyClaudeCodeActivity };