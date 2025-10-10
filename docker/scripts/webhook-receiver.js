#!/usr/bin/env node

/**
 * ===========================================
 * Webhook Receiver for Auto-Deploy
 * ===========================================
 *
 * Listens for webhooks from GitHub Actions and triggers
 * container updates when new images are pushed.
 *
 * Setup:
 *   1. npm install express
 *   2. Set environment variables (WEBHOOK_SECRET, WEBHOOK_PORT)
 *   3. Run: node webhook-receiver.js
 *   4. Configure as systemd service or pm2 process
 */

const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Configuration
const PORT = process.env.WEBHOOK_PORT || 3001;
const SECRET = process.env.WEBHOOK_SECRET || 'change-me-in-production';
const DOCKER_DIR = process.env.DOCKER_DIR || '/opt/cal3/docker';
const LOG_FILE = path.join(DOCKER_DIR, 'webhook-deploy.log');

// Logging helper
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(LOG_FILE, logMessage);
}

// Verify webhook signature
function verifySignature(payload, signature) {
    if (!signature) return false;

    const hmac = crypto.createHmac('sha256', SECRET);
    const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
    );
}

// Execute deployment
function deployContainers(data) {
    log(`🚀 Deployment triggered by ${data.pusher} for ${data.ref}`);
    log(`📝 Commit SHA: ${data.sha}`);

    const deployScript = path.join(DOCKER_DIR, 'scripts', 'auto-deploy.sh');

    exec(`bash ${deployScript}`, (error, stdout, stderr) => {
        if (error) {
            log(`❌ Deployment failed: ${error.message}`);
            log(`stderr: ${stderr}`);
            return;
        }

        log(`✅ Deployment completed successfully`);
        log(`stdout: ${stdout}`);
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Webhook endpoint
app.post('/webhook/deploy', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];

    // Verify signature
    if (!verifySignature(req.body, signature)) {
        log('⚠️  Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
    }

    log('✓ Webhook signature verified');

    // Trigger deployment asynchronously
    deployContainers(req.body);

    // Respond immediately
    res.json({
        status: 'accepted',
        message: 'Deployment triggered',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    log(`🎧 Webhook receiver listening on port ${PORT}`);
    log(`📁 Docker directory: ${DOCKER_DIR}`);
    log(`📝 Log file: ${LOG_FILE}`);
    log(`🔐 Secret configured: ${SECRET !== 'change-me-in-production' ? 'Yes' : 'No (CHANGE IT!)'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    log('🛑 Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    log('🛑 Received SIGINT, shutting down gracefully');
    process.exit(0);
});
