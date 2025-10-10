#!/bin/bash
# ===========================================
# Setup Webhook Receiver for Auto-Deploy
# ===========================================

set -e

echo "========================================="
echo "Cal3 Webhook Receiver Setup"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  This script should be run with sudo for system-wide installation"
    echo "Continue anyway? (yes/no)"
    read -r response
    if [ "$response" != "yes" ]; then
        exit 1
    fi
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

echo "📁 Installation directory: $DOCKER_DIR"
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo "Please install Node.js 18+:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Install express if needed
cd "$SCRIPT_DIR"
if [ ! -d "node_modules/express" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install express
fi

# Generate secret if not set
SECRET="${WEBHOOK_SECRET:-$(openssl rand -hex 32)}"

echo ""
echo "🔐 Webhook Secret: $SECRET"
echo "⚠️  Save this secret! You'll need it for GitHub secrets."
echo ""

# Prompt for installation method
echo "Choose installation method:"
echo "  1) Systemd service (recommended for production)"
echo "  2) PM2 process manager (easier management)"
echo "  3) Manual (run webhook-receiver.js yourself)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📋 Installing systemd service..."

        # Update service file
        sed -e "s|WorkingDirectory=.*|WorkingDirectory=$SCRIPT_DIR|g" \
            -e "s|ExecStart=.*|ExecStart=$(which node) $SCRIPT_DIR/webhook-receiver.js|g" \
            -e "s|WEBHOOK_SECRET=.*|WEBHOOK_SECRET=$SECRET|g" \
            -e "s|DOCKER_DIR=.*|DOCKER_DIR=$DOCKER_DIR|g" \
            -e "s|User=.*|User=$USER|g" \
            -e "s|Group=.*|Group=$(id -gn)|g" \
            cal3-webhook.service > /tmp/cal3-webhook.service

        sudo mv /tmp/cal3-webhook.service /etc/systemd/system/
        sudo systemctl daemon-reload
        sudo systemctl enable cal3-webhook
        sudo systemctl start cal3-webhook

        echo "✅ Systemd service installed and started"
        echo ""
        echo "Useful commands:"
        echo "  sudo systemctl status cal3-webhook"
        echo "  sudo systemctl restart cal3-webhook"
        echo "  sudo journalctl -u cal3-webhook -f"
        ;;

    2)
        echo ""
        echo "📋 Installing PM2 process..."

        # Check PM2
        if ! command -v pm2 &> /dev/null; then
            echo "Installing PM2..."
            sudo npm install -g pm2
        fi

        # Update ecosystem config
        sed -e "s|cwd:.*|cwd: '$SCRIPT_DIR',|g" \
            -e "s|WEBHOOK_SECRET:.*|WEBHOOK_SECRET: '$SECRET',|g" \
            -e "s|DOCKER_DIR:.*|DOCKER_DIR: '$DOCKER_DIR'|g" \
            ecosystem.config.js > /tmp/ecosystem.config.js

        mv /tmp/ecosystem.config.js ecosystem.config.js

        pm2 start ecosystem.config.js
        pm2 save

        # Setup startup
        echo ""
        echo "Run the following command to enable PM2 on system startup:"
        pm2 startup

        echo ""
        echo "✅ PM2 process started"
        echo ""
        echo "Useful commands:"
        echo "  pm2 status"
        echo "  pm2 logs cal3-webhook"
        echo "  pm2 restart cal3-webhook"
        echo "  pm2 monit"
        ;;

    3)
        echo ""
        echo "📋 Manual setup selected"
        echo ""
        echo "To run manually:"
        echo "  cd $SCRIPT_DIR"
        echo "  WEBHOOK_SECRET='$SECRET' WEBHOOK_PORT=3001 DOCKER_DIR='$DOCKER_DIR' node webhook-receiver.js"
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

# Configure firewall
echo ""
echo "🔥 Firewall Configuration:"
echo "Make sure port 3001 is accessible from GitHub:"
echo ""
echo "  # UFW (Ubuntu/Debian)"
echo "  sudo ufw allow 3001/tcp"
echo ""
echo "  # Firewalld (CentOS/RHEL)"
echo "  sudo firewall-cmd --permanent --add-port=3001/tcp"
echo "  sudo firewall-cmd --reload"
echo ""

# GitHub configuration
echo "📝 GitHub Configuration:"
echo ""
echo "1. Go to your repository: https://github.com/your-org/cal3"
echo "2. Settings → Secrets and variables → Actions"
echo "3. Add new repository secrets:"
echo "   - Name: DEPLOY_WEBHOOK_URL"
echo "     Value: http://your-server-ip:3001/webhook/deploy"
echo "   - Name: WEBHOOK_SECRET"
echo "     Value: $SECRET"
echo ""

# Test endpoint
echo "🧪 Test the webhook receiver:"
echo "  curl http://localhost:3001/health"
echo ""

echo "========================================="
echo "✅ Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Configure firewall (see above)"
echo "  2. Add secrets to GitHub (see above)"
echo "  3. Test webhook: curl http://localhost:3001/health"
echo "  4. Push code to trigger auto-deploy"
echo ""
