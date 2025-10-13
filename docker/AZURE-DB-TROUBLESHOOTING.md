# Azure PostgreSQL Connection Troubleshooting

## Problem: Connection Timeout from Docker Container

When running Cal3 in Docker with external Azure PostgreSQL, you may encounter:
```
Error: Connection terminated due to connection timeout
```

## Root Causes

### 1. Azure Firewall Rules (Most Common)
Azure PostgreSQL blocks all connections by default except those explicitly allowed.

**Solution:**
1. Go to Azure Portal
2. Navigate to: PostgreSQL Server → Connection Security → Firewall rules
3. Find your Docker host's public IP:
   ```bash
   curl ifconfig.me
   ```
4. Add firewall rule:
   - Name: `Docker-Host` or `Development-Machine`
   - Start IP: [your public IP]
   - End IP: [your public IP]
5. Click "Save" (may take 1-2 minutes to apply)

**For dynamic IPs:**
- Option A: Add a range (e.g., your ISP's subnet)
- Option B: Enable "Allow Azure services and resources to access this server"
- Option C: Add `0.0.0.0` to `255.255.255.255` (⚠️ NOT recommended for production)

### 2. Docker Network Isolation
Docker containers use bridge networking which may have issues reaching external services.

**Solution A - Increased Timeout (Already Applied):**
The debug compose file now uses 60-second timeout:
```yaml
DB_CONNECTION_TIMEOUT: ${DB_CONNECTION_TIMEOUT:-60000}
```

**Solution B - Host Network Mode:**
Add to backend service in docker-compose:
```yaml
network_mode: host
```
Note: This bypasses Docker networking entirely but breaks container port isolation.

### 3. DNS Resolution Issues
Container may fail to resolve Azure hostname.

**Solution (Already Applied):**
The debug compose includes:
```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

## Diagnostic Steps

### Step 1: Test from Host Machine
First verify the connection works outside Docker:
```bash
# Test network connectivity
ping cal2db.postgres.database.azure.com

# Test PostgreSQL port
nc -zv cal2db.postgres.database.azure.com 5432

# Test actual database connection
psql -h cal2db.postgres.database.azure.com -p 5432 -U db_admin -d cal3
```

If this fails, the issue is not Docker-specific:
- Check Azure firewall rules
- Verify your network allows outbound port 5432
- Check if you're behind a corporate firewall/VPN

### Step 2: Test DNS from Container
```bash
# Get container ID
docker ps | grep cal3-backend

# Test DNS resolution
docker exec cal3-backend nslookup cal2db.postgres.database.azure.com

# Test network connectivity
docker exec cal3-backend ping -c 3 cal2db.postgres.database.azure.com
```

### Step 3: Test PostgreSQL Connection from Container
```bash
# If psql is available in container
docker exec -e PGPASSWORD=Enter.Enter cal3-backend psql \
  -h cal2db.postgres.database.azure.com \
  -p 5432 \
  -U db_admin \
  -d cal3 \
  -c "SELECT version();"
```

### Step 4: Check Container Logs
```bash
docker logs cal3-backend --tail 100

# Follow logs in real-time
docker logs cal3-backend -f
```

## Quick Fixes

### Fix 1: Add Your IP to Azure Firewall
```bash
# Get your public IP
MY_IP=$(curl -s ifconfig.me)
echo "Your public IP: $MY_IP"

# Add to Azure Portal manually or use Azure CLI:
az postgres server firewall-rule create \
  --resource-group YOUR_RESOURCE_GROUP \
  --server-name cal2db \
  --name AllowDockerHost \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

### Fix 2: Test with Longer Timeout
Update `.env` in docker directory:
```bash
DB_CONNECTION_TIMEOUT=120000  # 2 minutes
```

### Fix 3: Use Host Network (Temporary)
Edit docker-compose.portainer-external-db-debug.yml:
```yaml
services:
  backend:
    network_mode: "host"
    # Remove these when using host mode:
    # ports: ...
    # networks: ...
```

Restart:
```bash
docker-compose -f docker-compose.portainer-external-db-debug.yml down
docker-compose -f docker-compose.portainer-external-db-debug.yml up -d
```

## Environment Variables Reference

### Database Connection
```bash
DB_HOST=cal2db.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=db_admin
DB_PASSWORD=Enter.Enter
DB_NAME=cal3
```

### SSL Configuration
```bash
DB_SSL=true                          # Enable SSL for Azure
DB_SSL_REJECT_UNAUTHORIZED=false     # Allow self-signed certs
```

### Timeout Settings
```bash
DB_CONNECTION_TIMEOUT=60000          # Connection timeout (ms)
DB_IDLE_TIMEOUT=30000                # Idle connection timeout (ms)
DB_POOL_MAX=10                       # Max connections in pool
DB_POOL_MIN=2                        # Min connections in pool
```

## Portainer-Specific Notes

When deploying via Portainer:
1. Environment variables are set in Portainer UI or docker/.env
2. Container logs are available in Portainer → Containers → cal3-backend → Logs
3. Console access: Portainer → Containers → cal3-backend → Console → Connect

## Advanced Debugging

### Enable PostgreSQL Connection Logging
Add to docker-compose environment:
```yaml
DB_LOGGING: "true"
```

### Check TypeORM Connection Details
Add temporary logging to backend code:
```typescript
// In app.module.ts
console.log('DB Config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true'
});
```

### Test with Different Connection String
Create test script in container:
```javascript
// test-db.js
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000,
});

client.connect()
  .then(() => {
    console.log('✓ Connection successful!');
    return client.query('SELECT version()');
  })
  .then(result => {
    console.log('PostgreSQL version:', result.rows[0].version);
    client.end();
  })
  .catch(err => {
    console.error('✗ Connection failed:', err.message);
    process.exit(1);
  });
```

Run in container:
```bash
docker exec cal3-backend node test-db.js
```

## Common Error Messages

### "Connection terminated due to connection timeout"
- **Cause**: Cannot reach Azure database within timeout period
- **Fix**: Check firewall rules, increase timeout, verify network

### "no pg_hba.conf entry for host"
- **Cause**: Azure firewall blocking your IP
- **Fix**: Add your IP to Azure firewall rules

### "password authentication failed"
- **Cause**: Wrong credentials
- **Fix**: Verify DB_USERNAME and DB_PASSWORD in docker/.env

### "getaddrinfo ENOTFOUND"
- **Cause**: DNS cannot resolve hostname
- **Fix**: Check DNS settings, verify hostname spelling

## Success Indicators

When connection works, you should see:
```
[Nest] 1  - 10/13/2025, 11:23:53 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized +362ms
[Nest] 1  - 10/13/2025, 11:23:53 AM     LOG [NestFactory] Application is running on: http://localhost:8081
```

No retry attempts or connection errors.

## Further Help

If issues persist:
1. Check Azure PostgreSQL service status
2. Verify Azure resource region (latency issues)
3. Check if VPN/proxy is interfering
4. Try connecting from another machine/network
5. Contact Azure support for firewall/networking issues

## Related Files

- [docker-compose.portainer-external-db-debug.yml](docker-compose.portainer-external-db-debug.yml) - Debug compose file
- [docker/.env](docker/.env) - Environment variables
- [backend-nestjs/src/app.module.ts](../backend-nestjs/src/app.module.ts) - TypeORM configuration
