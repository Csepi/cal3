#!/bin/sh
# Quick Azure PostgreSQL Connection Diagnostic
# Run this inside the cal3-backend container via Portainer Console

echo "=========================================="
echo "Cal3 Azure PostgreSQL Connection Test"
echo "=========================================="
echo ""

# Check environment variables
echo "1. Environment Variables:"
echo "   DB_HOST: $DB_HOST"
echo "   DB_PORT: $DB_PORT"
echo "   DB_NAME: $DB_NAME"
echo "   DB_USERNAME: $DB_USERNAME"
echo "   DB_SSL: $DB_SSL"
echo "   DB_CONNECTION_TIMEOUT: $DB_CONNECTION_TIMEOUT"
echo ""

# Test DNS resolution
echo "2. Testing DNS Resolution..."
if nslookup "$DB_HOST" > /dev/null 2>&1; then
    echo "   ✓ DNS resolves $DB_HOST"
    nslookup "$DB_HOST" | grep -A 2 "Name:" | head -3
else
    echo "   ✗ DNS resolution failed for $DB_HOST"
    echo "   This is a critical error - cannot proceed"
    exit 1
fi
echo ""

# Test network connectivity with timeout
echo "3. Testing Network Connectivity..."
if ping -c 2 -W 5 "$DB_HOST" > /dev/null 2>&1; then
    echo "   ✓ Host $DB_HOST is reachable via ping"
else
    echo "   ⚠ Ping failed (may be normal - Azure blocks ICMP)"
fi
echo ""

# Test port connectivity (using timeout and nc if available)
echo "4. Testing Port $DB_PORT Connectivity..."
if command -v nc > /dev/null 2>&1; then
    if timeout 10 nc -zv "$DB_HOST" "$DB_PORT" 2>&1 | grep -q "succeeded\|open"; then
        echo "   ✓ Port $DB_PORT is accessible"
    else
        echo "   ✗ Port $DB_PORT connection failed"
        echo "   This usually means:"
        echo "   - Azure firewall is blocking your IP"
        echo "   - Network routing issue"
        echo ""
        echo "   ACTION REQUIRED:"
        echo "   1. Get your public IP: curl ifconfig.me"
        echo "   2. Add it to Azure Portal → PostgreSQL → Firewall rules"
    fi
else
    echo "   ⚠ netcat (nc) not available, skipping port test"
fi
echo ""

# Test with curl (if available)
echo "5. Testing HTTP Connectivity (alternative check)..."
if command -v curl > /dev/null 2>&1; then
    if timeout 10 curl -s -o /dev/null -w "%{http_code}" "https://$DB_HOST" 2>&1 | grep -q "[0-9]"; then
        echo "   ✓ Can reach host via HTTPS"
    else
        echo "   ⚠ HTTPS test inconclusive"
    fi
else
    echo "   ⚠ curl not available"
fi
echo ""

# Check if node is available and can load pg module
echo "6. Testing Node.js and PostgreSQL Driver..."
if command -v node > /dev/null 2>&1; then
    echo "   ✓ Node.js is available: $(node --version)"
    if node -e "require('pg')" 2>&1; then
        echo "   ✓ PostgreSQL driver (pg) is available"
    else
        echo "   ✗ PostgreSQL driver not found"
    fi
else
    echo "   ✗ Node.js not available"
fi
echo ""

# Create and run a Node.js connection test
echo "7. Testing Actual Database Connection..."
cat > /tmp/test-db-connection.js << 'EOFJS'
const { Client } = require('pg');

const config = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '60000'),
};

console.log('   Attempting connection with config:');
console.log('   - Host:', config.host);
console.log('   - Port:', config.port);
console.log('   - Database:', config.database);
console.log('   - SSL:', config.ssl !== false);
console.log('   - Timeout:', config.connectionTimeoutMillis, 'ms');
console.log('');

const client = new Client(config);

const startTime = Date.now();

client.connect()
  .then(() => {
    const duration = Date.now() - startTime;
    console.log('   ✓ Connection successful! (took ' + duration + 'ms)');
    return client.query('SELECT version(), current_database(), current_user');
  })
  .then(result => {
    console.log('   ✓ Query successful!');
    console.log('   - PostgreSQL:', result.rows[0].version.split(',')[0]);
    console.log('   - Database:', result.rows[0].current_database);
    console.log('   - User:', result.rows[0].current_user);
    return client.end();
  })
  .then(() => {
    console.log('   ✓ Connection closed cleanly');
    console.log('');
    console.log('========================================');
    console.log('SUCCESS! Database is accessible.');
    console.log('========================================');
    process.exit(0);
  })
  .catch(err => {
    const duration = Date.now() - startTime;
    console.log('   ✗ Connection failed after ' + duration + 'ms');
    console.log('   Error:', err.message);
    console.log('');

    if (err.message.includes('timeout')) {
      console.log('DIAGNOSIS: Connection Timeout');
      console.log('Most likely causes:');
      console.log('1. Azure firewall blocking your IP address');
      console.log('2. Network routing issue');
      console.log('3. Database server is down/unreachable');
      console.log('');
      console.log('SOLUTION:');
      console.log('1. Find your public IP: curl ifconfig.me');
      console.log('2. Add IP to Azure Portal:');
      console.log('   PostgreSQL Server → Connection Security');
      console.log('   → Firewall rules → Add your IP');
    } else if (err.message.includes('password')) {
      console.log('DIAGNOSIS: Authentication Failed');
      console.log('Check DB_USERNAME and DB_PASSWORD in environment');
    } else if (err.message.includes('ENOTFOUND')) {
      console.log('DIAGNOSIS: DNS Resolution Failed');
      console.log('Cannot resolve hostname:', process.env.DB_HOST);
    } else {
      console.log('DIAGNOSIS: Unknown Error');
      console.log('Check full error above for details');
    }

    console.log('');
    console.log('========================================');
    console.log('FAILED! Database is not accessible.');
    console.log('========================================');
    process.exit(1);
  });
EOFJS

if command -v node > /dev/null 2>&1; then
    node /tmp/test-db-connection.js
else
    echo "   ✗ Cannot run connection test - Node.js not available"
    echo ""
    echo "=========================================="
    echo "Diagnostic incomplete - Node.js required"
    echo "=========================================="
    exit 1
fi
