# Enhanced Database Debug Logging Guide

## Overview

The backend now includes comprehensive debug logging to help diagnose database connection issues. This logging provides detailed information about:

- Database configuration at startup
- Connection attempts and timing
- Network connectivity tests
- Query execution and results
- Detailed error diagnostics with solutions

## What's New

### 1. Startup Configuration Logging

When the application starts, it logs complete database configuration (with sensitive data redacted):

```
[DatabaseConnection] ========================================
[DatabaseConnection] PostgreSQL Connection Configuration
[DatabaseConnection] ========================================
[DatabaseConnection] Host: cal2db.postgres.database.azure.com
[DatabaseConnection] Port: 5432
[DatabaseConnection] Database: cal3
[DatabaseConnection] Username: db_admin
[DatabaseConnection] Password: [SET - 11 chars]
[DatabaseConnection] SSL Enabled: true
[DatabaseConnection] SSL Reject Unauthorized: false
[DatabaseConnection] Connection Timeout: 60000ms
[DatabaseConnection] Pool Max: 10
[DatabaseConnection] Pool Min: 2
[DatabaseConnection] Connection String: postgresql://db_admin:***@cal2db.postgres.database.azure.com:5432/cal3
[DatabaseConnection] ========================================
```

### 2. Connection Timing and Status

Track how long connections take:

```
[DatabaseConnection] 🔌 Attempting to connect to PostgreSQL...
[DatabaseConnection] ⏱️  Connection attempt started at 2025-10-13T11:38:20.000Z
[DatabaseConnection] ✅ Database connection established successfully!
[DatabaseConnection] ⏱️  Connection time: 3245ms
[DatabaseConnection] 📊 Database: postgres
[DatabaseConnection] 🌐 Connected to: cal2db.postgres.database.azure.com:5432/cal3
```

### 3. Automatic Connection Testing

After connection, runs a test query:

```
[DatabaseConnection] 🧪 Testing database query...
[DatabaseConnection] ✅ Test query successful (234ms)
[DatabaseConnection]    PostgreSQL: PostgreSQL 14.10 on x86_64-pc-linux-gnu
[DatabaseConnection]    Database: cal3
[DatabaseConnection]    User: db_admin
```

### 4. Detailed Error Diagnostics

When connection fails, provides specific diagnosis and solutions:

```
[DatabaseConnection] ❌ Connection Failed - Attempt #1
[DatabaseConnection] Error Type: Error
[DatabaseConnection] Error Message: Connection terminated due to connection timeout
[DatabaseConnection] ┌─────────────────────────────────────────────────────────┐
[DatabaseConnection] │ DIAGNOSIS: CONNECTION TIMEOUT                           │
[DatabaseConnection] ├─────────────────────────────────────────────────────────┤
[DatabaseConnection] │ Most common causes:                                     │
[DatabaseConnection] │ 1. Firewall blocking connection (Azure/AWS)            │
[DatabaseConnection] │ 2. Database server is down or unreachable              │
[DatabaseConnection] │ 3. Network routing issue                                │
[DatabaseConnection] │ 4. Incorrect host/port configuration                    │
[DatabaseConnection] ├─────────────────────────────────────────────────────────┤
[DatabaseConnection] │ Solutions:                                              │
[DatabaseConnection] │ • Add your IP to database firewall rules               │
[DatabaseConnection] │ • Verify DB_HOST and DB_PORT are correct               │
[DatabaseConnection] │ • Test connection: nc -zv <host> <port>                │
[DatabaseConnection] │ • Check container can reach internet: ping 8.8.8.8     │
[DatabaseConnection] └─────────────────────────────────────────────────────────┘
```

### 5. Proactive Warnings

Warns about potential configuration issues:

```
[DatabaseConnection] ⚠️  Detected cloud database provider
[DatabaseConnection] ⚠️  Ensure firewall rules allow connections from this IP
[DatabaseConnection] ⚠️  Connection timeout (15000ms) may be too short for cloud databases
[DatabaseConnection] ⚠️  Recommended: 60000ms (60 seconds) for Azure/AWS
```

### 6. Network Diagnostics (Optional)

Enable deep network diagnostics by setting `DB_RUN_DIAGNOSTICS=true`:

```
[DatabaseConnection] ========================================
[DatabaseConnection] NETWORK CONNECTIVITY TEST
[DatabaseConnection] ========================================
[DatabaseConnection] Testing DNS resolution for cal2db.postgres.database.azure.com...
[DatabaseConnection] ✅ DNS Resolution: Success
[DatabaseConnection]    Resolved to: 20.54.123.45
[DatabaseConnection] Testing TCP connection to cal2db.postgres.database.azure.com:5432...
[DatabaseConnection] ✅ TCP Connection: Success
[DatabaseConnection] ========================================
```

## Configuration

### Environment Variables

#### Required
```bash
DB_TYPE=postgres
DB_HOST=cal2db.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=db_admin
DB_PASSWORD=YourPassword
DB_NAME=cal3
```

#### SSL Configuration
```bash
DB_SSL=true                          # Enable SSL for cloud databases
DB_SSL_REJECT_UNAUTHORIZED=false     # Allow self-signed certificates
```

#### Timeout Settings
```bash
DB_CONNECTION_TIMEOUT=60000          # 60 seconds (recommended for cloud)
DB_IDLE_TIMEOUT=30000                # 30 seconds
DB_POOL_MAX=10                       # Maximum connections in pool
DB_POOL_MIN=2                        # Minimum connections in pool
```

#### Debug Options
```bash
DB_LOGGING=true                      # Enable SQL query logging
DB_RUN_DIAGNOSTICS=true              # Run network diagnostics on startup
```

### Docker Compose

The debug compose file (`docker-compose.portainer-external-db-debug.yml`) has these settings pre-configured:

```yaml
environment:
  DB_LOGGING: "true"              # Always on for debug builds
  DB_CONNECTION_TIMEOUT: 60000    # Extended timeout for Azure
  DB_RUN_DIAGNOSTICS: "false"     # Set to "true" to enable
```

## How to Use

### 1. View Logs in Portainer

**Portainer UI:**
1. Go to **Containers**
2. Click on **cal3-backend**
3. Click **Logs** tab
4. Scroll to see full connection sequence

**Or use streaming logs:**
```bash
docker logs cal3-backend -f
```

### 2. Enable Network Diagnostics

Add to `docker/.env`:
```bash
DB_RUN_DIAGNOSTICS=true
```

Or in docker-compose environment:
```yaml
environment:
  DB_RUN_DIAGNOSTICS: "true"
```

Restart container:
```bash
docker-compose -f docker-compose.portainer-external-db-debug.yml up -d --force-recreate backend
```

### 3. Increase Verbosity

For even more detailed logs, set log level to verbose:
```bash
# Not currently exposed, but can be added to main.ts logger options
logger: ['log', 'error', 'warn', 'debug', 'verbose']
```

## Log Levels

The logging system uses these log levels:

- **LOG** (default): Important events (connection established, queries)
- **WARN**: Potential issues (misconfiguration, suboptimal settings)
- **ERROR**: Failures (connection errors, query errors)
- **DEBUG**: Detailed debugging info (when DB_LOGGING=true)
- **VERBOSE**: Everything (all database operations)

## Understanding the Output

### Success Scenario

```
[Bootstrap] Starting Cal3 Application
[DatabaseConnection] PostgreSQL Connection Configuration
[DatabaseConnection] Host: cal2db.postgres.database.azure.com
[DatabaseConnection] 🔌 Attempting to connect to PostgreSQL...
[DatabaseConnection] ✅ Database connection established successfully!
[DatabaseConnection] ⏱️  Connection time: 3245ms
[DatabaseConnection] 🧪 Testing database query...
[DatabaseConnection] ✅ Test query successful (234ms)
[Bootstrap] ✅ APPLICATION STARTED SUCCESSFULLY
[Bootstrap] ⏱️  Total startup time: 4567ms
```

**Interpretation**: Everything is working perfectly. Connection took 3.2 seconds, test query 234ms.

### Timeout Scenario

```
[DatabaseConnection] PostgreSQL Connection Configuration
[DatabaseConnection] Host: cal2db.postgres.database.azure.com
[DatabaseConnection] ⚠️  Connection timeout (15000ms) may be too short for cloud databases
[DatabaseConnection] 🔌 Attempting to connect to PostgreSQL...
[TypeOrmModule] Unable to connect to the database. Retrying (1)...
Error: Connection terminated due to connection timeout
[DatabaseConnection] ❌ Connection Failed - Attempt #1
[DatabaseConnection] │ DIAGNOSIS: CONNECTION TIMEOUT                           │
[DatabaseConnection] │ Most common causes:                                     │
[DatabaseConnection] │ 1. Firewall blocking connection (Azure/AWS)            │
```

**Interpretation**: Connection timed out after 15 seconds. Most likely Azure firewall blocking your IP.

**Solution**: Add your IP to Azure firewall rules.

### DNS Failure Scenario

```
[DatabaseConnection] ❌ Connection Failed - Attempt #1
[DatabaseConnection] Error Message: getaddrinfo ENOTFOUND cal2db.postgres.database.azure.com
[DatabaseConnection] │ DIAGNOSIS: DNS RESOLUTION FAILED                        │
[DatabaseConnection] │ • Cannot resolve hostname to IP address                 │
[DatabaseConnection] │ • Test DNS: nslookup <hostname>                         │
```

**Interpretation**: Container cannot resolve the hostname. DNS issue or typo in hostname.

**Solution**: Check spelling of DB_HOST, verify container has DNS access.

## Troubleshooting with Logs

### Problem: Connection Takes Too Long

Look for:
```
[DatabaseConnection] ⏱️  Connection time: 58234ms
```

If connection time is close to timeout (60000ms), increase timeout:
```bash
DB_CONNECTION_TIMEOUT=120000  # 2 minutes
```

### Problem: Connection Fails Immediately

Look for:
```
[DatabaseConnection] Error Code: ECONNREFUSED
```

This means wrong port or database not running. Verify:
- DB_PORT is correct (5432 for PostgreSQL)
- Database server is actually running
- Not blocked by local firewall

### Problem: SSL Errors

Look for:
```
[DatabaseConnection] Error Message: ... SSL ...
```

Try different SSL configurations:
```bash
DB_SSL=false                         # Disable SSL
# or
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false     # Accept any certificate
```

### Problem: Authentication Failures

Look for:
```
[DatabaseConnection] Error Message: password authentication failed
```

Verify:
- DB_USERNAME is correct
- DB_PASSWORD is correct
- Password has no special characters that need escaping

## Log Files

Logs are written to stdout by default. To save to file:

```bash
# Save recent logs
docker logs cal3-backend > backend-logs.txt 2>&1

# Stream logs to file
docker logs cal3-backend -f > backend-logs.txt 2>&1
```

## Performance Metrics

The logs track these timing metrics:

1. **Connection Time**: Time to establish database connection
2. **Query Time**: Time for test query to execute
3. **Total Startup Time**: Complete application initialization time

**Benchmarks** (from containerized environment to Azure):
- Connection time: 2-5 seconds (normal)
- Connection time: 5-15 seconds (high latency)
- Connection time: >30 seconds (potential issue)
- Query time: <500ms (good)
- Query time: >1000ms (network latency)
- Total startup: 5-10 seconds (typical)

## Integration with Other Diagnostic Tools

This logging works alongside:

1. **diagnose-connection.sh** - Standalone diagnostic script
2. **AZURE-DB-TROUBLESHOOTING.md** - Comprehensive troubleshooting guide
3. **README-DIAGNOSTICS.md** - Quick start instructions

Use them together for complete diagnostics:

1. Start with application logs (this guide)
2. If still failing, run diagnose-connection.sh inside container
3. Refer to AZURE-DB-TROUBLESHOOTING.md for specific solutions

## Code Files

The logging is implemented in:

- **backend-nestjs/src/app.module.ts**: Configuration logging, warnings
- **backend-nestjs/src/main.ts**: Connection timing, test queries
- **backend-nestjs/src/database/database-diagnostics.service.ts**: Network diagnostics, error messages

## Disabling Debug Logging

For production, set:
```bash
DB_LOGGING=false
DB_RUN_DIAGNOSTICS=false
```

This reduces log volume while keeping error reporting intact.

## Advanced: Custom Logging

To add custom logging to your own code:

```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('MyService');

// Log database operations
logger.log('Fetching users from database...');
logger.debug('Query: SELECT * FROM users');
logger.error('Failed to fetch users:', error.message);
```

## Support

If the enhanced logging doesn't help identify your issue:

1. Copy full logs from startup to error
2. Check [AZURE-DB-TROUBLESHOOTING.md](AZURE-DB-TROUBLESHOOTING.md)
3. Run [diagnose-connection.sh](diagnose-connection.sh) for network tests
4. Create GitHub issue with logs attached

---

**Last Updated**: October 13, 2025
**Version**: 1.0.0
