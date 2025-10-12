#!/bin/bash
# Test Azure PostgreSQL Connection
# Usage: docker run --rm -it postgres:15-alpine sh -c "$(cat test-azure-connection.sh)"

echo "=== Testing Azure PostgreSQL Connection ==="
echo ""
echo "Enter your Azure PostgreSQL details:"
read -p "DB_HOST: " DB_HOST
read -p "DB_USERNAME: " DB_USERNAME
read -sp "DB_PASSWORD: " DB_PASSWORD
echo ""
read -p "DB_NAME (default: cal3): " DB_NAME
DB_NAME=${DB_NAME:-cal3}

echo ""
echo "Testing connection to $DB_HOST..."
echo ""

PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USERNAME" -d "$DB_NAME" -c "SELECT version();"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Database connection works!"
    echo ""
    echo "Your environment variables are correct:"
    echo "DB_HOST=$DB_HOST"
    echo "DB_USERNAME=$DB_USERNAME"
    echo "DB_NAME=$DB_NAME"
    echo "DB_SSL=true"
    echo "DB_SSL_REJECT_UNAUTHORIZED=false"
else
    echo ""
    echo "❌ FAILED! Check:"
    echo "1. Azure firewall allows your IP"
    echo "2. Username format (use 'username' not 'username@server' for Flexible Server)"
    echo "3. Password is correct"
    echo "4. Database '$DB_NAME' exists"
fi
