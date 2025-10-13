#!/bin/bash
# Database Connection Test Script
# Run this inside the Docker container to diagnose connection issues

echo "================================"
echo "Database Connection Diagnostics"
echo "================================"
echo ""

# Load environment variables
DB_HOST="${DB_HOST:-cal2db.postgres.database.azure.com}"
DB_PORT="${DB_PORT:-5432}"
DB_USERNAME="${DB_USERNAME:-db_admin}"
DB_NAME="${DB_NAME:-cal3}"

echo "Testing connection to: $DB_HOST:$DB_PORT"
echo ""

# Test 1: DNS Resolution
echo "1. Testing DNS Resolution..."
if nslookup "$DB_HOST" > /dev/null 2>&1; then
    echo "✓ DNS resolution successful"
    nslookup "$DB_HOST" | grep -A 2 "Name:"
else
    echo "✗ DNS resolution failed"
fi
echo ""

# Test 2: Network Connectivity (Ping)
echo "2. Testing Network Connectivity (Ping)..."
if ping -c 3 "$DB_HOST" > /dev/null 2>&1; then
    echo "✓ Host is reachable"
else
    echo "✗ Host is not reachable (this may be normal if ICMP is blocked)"
fi
echo ""

# Test 3: Port Connectivity (Telnet/NC)
echo "3. Testing Port Connectivity..."
if command -v nc > /dev/null 2>&1; then
    if timeout 5 nc -zv "$DB_HOST" "$DB_PORT" 2>&1; then
        echo "✓ Port $DB_PORT is open"
    else
        echo "✗ Port $DB_PORT is not accessible"
    fi
elif command -v telnet > /dev/null 2>&1; then
    if timeout 5 telnet "$DB_HOST" "$DB_PORT" 2>&1 | grep -q "Connected"; then
        echo "✓ Port $DB_PORT is open"
    else
        echo "✗ Port $DB_PORT is not accessible"
    fi
else
    echo "⚠ Neither nc nor telnet available for port testing"
fi
echo ""

# Test 4: SSL Connection
echo "4. Testing SSL Connection..."
if command -v openssl > /dev/null 2>&1; then
    if timeout 5 openssl s_client -connect "$DB_HOST:$DB_PORT" -starttls postgres < /dev/null 2>&1 | grep -q "CONNECTED"; then
        echo "✓ SSL connection successful"
    else
        echo "⚠ SSL connection test inconclusive"
    fi
else
    echo "⚠ OpenSSL not available"
fi
echo ""

# Test 5: PostgreSQL Connection (if psql is available)
echo "5. Testing PostgreSQL Connection..."
if command -v psql > /dev/null 2>&1; then
    if PGPASSWORD="$DB_PASSWORD" timeout 10 psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
        echo "✓ PostgreSQL connection successful"
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -c "SELECT version();"
    else
        echo "✗ PostgreSQL connection failed"
        echo "Error details:"
        PGPASSWORD="$DB_PASSWORD" timeout 10 psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -c "SELECT version();" 2>&1
    fi
else
    echo "⚠ psql not available in container"
fi
echo ""

# Test 6: Container Network Info
echo "6. Container Network Information..."
echo "Container IP addresses:"
ip addr show | grep "inet " | grep -v "127.0.0.1"
echo ""
echo "DNS Configuration:"
cat /etc/resolv.conf
echo ""

echo "================================"
echo "Diagnostics Complete"
echo "================================"
