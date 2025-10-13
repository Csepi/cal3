# Docker Diagnostics for Azure PostgreSQL Connection

## Quick Start - Run Diagnostics in Portainer

If your backend container is failing to connect to Azure PostgreSQL, follow these steps:

### Option 1: Run via Portainer Console (Easiest)

1. Open **Portainer** → **Containers**
2. Find and click on **cal3-backend** container
3. Click **Console** button
4. Select **Connect** with shell: `/bin/sh`
5. In the console, run:
   ```sh
   wget -O - https://raw.githubusercontent.com/yourusername/cal3/main/docker/diagnose-connection.sh | sh
   ```

   Or if the container has the script already:
   ```sh
   sh /app/diagnose-connection.sh
   ```

### Option 2: Copy and Run Locally

If the container already has the diagnostic script:

```bash
# From your local machine
cd docker

# Copy script into running container
docker cp diagnose-connection.sh cal3-backend:/tmp/

# Make it executable and run
docker exec cal3-backend chmod +x /tmp/diagnose-connection.sh
docker exec cal3-backend /tmp/diagnose-connection.sh
```

### Option 3: Manual Step-by-Step Diagnosis

If you prefer to run commands manually in Portainer Console:

```sh
# 1. Check environment variables
echo "DB_HOST: $DB_HOST"
echo "DB_PORT: $DB_PORT"
echo "DB_CONNECTION_TIMEOUT: $DB_CONNECTION_TIMEOUT"

# 2. Test DNS
nslookup cal2db.postgres.database.azure.com

# 3. Test network connectivity
ping -c 2 cal2db.postgres.database.azure.com

# 4. Test port (if nc is available)
nc -zv cal2db.postgres.database.azure.com 5432

# 5. Test with Node.js script (create test file first)
cat > /tmp/test.js << 'EOF'
const { Client } = require('pg');
const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000,
});

console.log('Connecting to:', process.env.DB_HOST);
client.connect()
  .then(() => {
    console.log('✓ Connected!');
    return client.query('SELECT version()');
  })
  .then(r => {
    console.log('✓ PostgreSQL:', r.rows[0].version);
    client.end();
  })
  .catch(e => {
    console.log('✗ Error:', e.message);
    process.exit(1);
  });
EOF

# Run the test
node /tmp/test.js
```

## Understanding the Output

### ✓ Success Indicators
```
✓ DNS resolves cal2db.postgres.database.azure.com
✓ Host is reachable
✓ Port 5432 is accessible
✓ Connection successful! (took 234ms)
✓ Query successful!
```

If you see all checkmarks, the connection is working!

### ✗ Failure Indicators

#### "DNS resolution failed"
```
✗ DNS resolution failed for cal2db.postgres.database.azure.com
```
**Cause**: Container cannot resolve the hostname
**Fix**: Check if hostname is correct, verify container has internet access

#### "Port 5432 connection failed"
```
✗ Port 5432 is not accessible
```
**Cause**: Azure firewall blocking your IP
**Fix**: Add your public IP to Azure firewall rules (see below)

#### "Connection timeout"
```
✗ Connection failed after 60000ms
Error: Connection terminated due to connection timeout
```
**Cause**: Cannot reach database within timeout
**Fix**: Check firewall, increase timeout, verify network

## Most Common Fix: Azure Firewall Rules

**The #1 cause of connection timeouts is Azure PostgreSQL firewall blocking your IP.**

### Step-by-Step Fix:

1. **Find your public IP:**
   ```bash
   # From your local machine (not in container!)
   curl ifconfig.me
   ```

   Example output: `203.0.113.42`

2. **Add IP to Azure Portal:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to: **All Resources** → **cal2db** (your PostgreSQL server)
   - Click **Connection security** (under Settings)
   - Under **Firewall rules**, click **+ Add client IP** or **+ Add firewall rule**
   - Fill in:
     - **Rule name**: `Docker-Host` or `Development-PC`
     - **Start IP**: `203.0.113.42` (your IP from step 1)
     - **End IP**: `203.0.113.42` (same IP)
   - Click **Save**
   - Wait 1-2 minutes for the rule to take effect

3. **Test again:**
   - Restart your backend container
   - Run diagnostics again
   - Should now show: ✓ Connection successful!

### Alternative: Azure CLI

```bash
# Get your public IP
MY_IP=$(curl -s ifconfig.me)

# Add firewall rule
az postgres server firewall-rule create \
  --resource-group YOUR_RESOURCE_GROUP \
  --server-name cal2db \
  --name AllowDockerHost \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

## What Changed in This Debug Build

The `docker-compose.portainer-external-db-debug.yml` includes:

1. **Extended connection timeout**: 60 seconds (was 15 seconds)
   ```yaml
   DB_CONNECTION_TIMEOUT: 60000
   ```

2. **DNS helper for Docker**:
   ```yaml
   extra_hosts:
     - "host.docker.internal:host-gateway"
   ```

3. **Debug logging enabled**:
   ```yaml
   DB_LOGGING: "true"
   ```

4. **No automatic restarts**: Easier to see errors
   ```yaml
   restart: "no"
   ```

## Rebuilding After Changes

If you modified the docker-compose or .env files:

```bash
# Stop containers
docker-compose -f docker-compose.portainer-external-db-debug.yml down

# Rebuild and start
docker-compose -f docker-compose.portainer-external-db-debug.yml up -d --build

# View logs
docker-compose -f docker-compose.portainer-external-db-debug.yml logs -f backend
```

## Still Having Issues?

See [AZURE-DB-TROUBLESHOOTING.md](AZURE-DB-TROUBLESHOOTING.md) for:
- Advanced debugging techniques
- Network mode alternatives
- SSL configuration options
- Environment variable reference
- Common error messages and solutions

## Success Checklist

- [ ] Container environment variables are set correctly
- [ ] DNS resolves Azure hostname
- [ ] Network can reach Azure (ping/nc test)
- [ ] Azure firewall allows your IP
- [ ] SSL is configured correctly
- [ ] Connection timeout is sufficient (60+ seconds)
- [ ] Backend container starts without retries
- [ ] Health check passes

Once all checkboxes are ✓, your application should be running!
