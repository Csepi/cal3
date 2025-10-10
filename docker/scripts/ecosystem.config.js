/**
 * ===========================================
 * PM2 Configuration for Cal3 Webhook Receiver
 * ===========================================
 *
 * Installation:
 *   npm install -g pm2
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 *
 * Usage:
 *   pm2 status
 *   pm2 logs cal3-webhook
 *   pm2 restart cal3-webhook
 *   pm2 monit
 */

module.exports = {
  apps: [{
    name: 'cal3-webhook',
    script: './webhook-receiver.js',
    cwd: '/opt/cal3/docker/scripts',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      WEBHOOK_PORT: 3001,
      WEBHOOK_SECRET: 'your-secret-here',
      DOCKER_DIR: '/opt/cal3/docker'
    },
    error_file: '/var/log/cal3-webhook-error.log',
    out_file: '/var/log/cal3-webhook-out.log',
    log_file: '/var/log/cal3-webhook-combined.log',
    time: true
  }]
};
