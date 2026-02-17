#!/bin/bash
echo "Starting CAL3 app deployment..."

# Navigate to app directory
cd /home/site/wwwroot

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install --production
fi

# Start the application
echo "Starting application services..."
npm start
