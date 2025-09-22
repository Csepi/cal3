#!/usr/bin/env node

// Claude Code notification hook for Home Assistant
// This script can be called as a hook when Claude Code receives questions

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  homeAssistant: {
    url: 'http://www.cselo.hu:8124',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwYzJmZTdhNGM4Yzk0ZTE3YmY5M2NiZTg1MWY0ZmM3ZSIsImlhdCI6MTc1NDM4NjA1NiwiZXhwIjoyMDY5NzQ2MDU2fQ.hrZ9dA_gnf1x3PYwX0HVPbKSeJM4uJEEdZ77OtrUEug'
  },
  logFile: path.join(__dirname, 'claude-code-activity.log')
};

// Notification methods
const notificationMethods = [
  // Method 1: Home Assistant REST API
  async (message, title) => {
    try {
      const response = await axios.post(
        `${CONFIG.homeAssistant.url}/api/services/notify/persistent_notification`,
        {
          message: message,
          title: title,
          notification_id: `claude_code_${Date.now()}`
        },
        {
          headers: {
            'Authorization': `Bearer ${CONFIG.homeAssistant.token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      console.log('✓ Home Assistant notification sent');
      return true;
    } catch (error) {
      console.log('✗ Home Assistant method failed:', error.message);
      return false;
    }
  },

  // Method 2: Home Assistant Webhook (alternative)
  async (message, title) => {
    try {
      const webhookId = 'claude_code_activity'; // You'd need to create this webhook in HA
      const response = await axios.post(
        `${CONFIG.homeAssistant.url}/api/webhook/${webhookId}`,
        {
          message: message,
          title: title,
          timestamp: new Date().toISOString(),
          source: 'claude-code'
        },
        { timeout: 5000 }
      );
      console.log('✓ Home Assistant webhook sent');
      return true;
    } catch (error) {
      console.log('✗ Home Assistant webhook failed:', error.message);
      return false;
    }
  },

  // Method 3: Log to file (fallback)
  async (message, title) => {
    try {
      const logEntry = `${new Date().toISOString()} - ${title}: ${message}\n`;
      await fs.appendFile(CONFIG.logFile, logEntry);
      console.log('✓ Logged to file');
      return true;
    } catch (error) {
      console.log('✗ File logging failed:', error.message);
      return false;
    }
  }
];

async function sendNotification(message, title = 'Claude Code Activity') {
  console.log(`\n🔔 Sending notification: ${title}`);
  console.log(`📝 Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}\n`);

  // Try each notification method until one succeeds
  for (const method of notificationMethods) {
    if (await method(message, title)) {
      return true;
    }
  }

  console.log('❌ All notification methods failed');
  return false;
}

// Main function for Claude Code hook
async function handleClaudeCodeActivity() {
  const args = process.argv.slice(2);
  const action = args[0] || 'question';
  const content = args.slice(1).join(' ') || 'New activity in Claude Code';

  let message, title;

  switch (action) {
    case 'question':
      title = '❓ New Question in Claude Code';
      message = `Question: "${content}"`;
      break;
    case 'response':
      title = '💬 Claude Code Response';
      message = `Response completed for: "${content}"`;
      break;
    case 'error':
      title = '⚠️ Claude Code Error';
      message = `Error occurred: "${content}"`;
      break;
    default:
      title = '🤖 Claude Code Activity';
      message = content;
  }

  await sendNotification(message, title);
}

// Run if called directly
if (require.main === module) {
  handleClaudeCodeActivity()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Hook execution failed:', error.message);
      process.exit(1);
    });
}

module.exports = { sendNotification, handleClaudeCodeActivity };