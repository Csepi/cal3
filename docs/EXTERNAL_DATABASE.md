# External Database Setup Guide for Cal3

This guide explains how to configure Cal3 to use an external PostgreSQL database (Azure, AWS RDS, or self-hosted) instead of the built-in Docker PostgreSQL container.

## Quick Start

### 1. Set Environment Variables

Edit `docker/config/.env` and configure for external database:

```bash
# External Database Configuration
DB_TYPE=postgres
DB_HOST=your-db-server.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=cal3_user
DB_PASSWORD=your_strong_password
DB_NAME=cal3

# SSL Settings (required for Azure/AWS)
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false

# Production Settings
DB_SYNCHRONIZE=false
DB_LOGGING=false

# Optional: Connection Pool
DB_POOL_MAX=20
DB_POOL_MIN=5
```

### 2. Modify Docker Compose

Comment out the postgres service in `docker/docker-compose.yml`:

```yaml
services:
  # postgres:
  #   image: postgres:15-alpine
  #   ...

  backend:
    # Remove postgres dependency
    # depends_on:
    #   postgres:
    #     condition: service_healthy
```

### 3. Start Application

```bash
cd docker
docker-compose up -d backend frontend
```

## Provider-Specific Examples

### Azure PostgreSQL

```bash
DB_HOST=myserver.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=cal3admin
DB_PASSWORD=YourPassword123!
DB_NAME=cal3
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

### AWS RDS PostgreSQL

```bash
DB_HOST=mydb.abc123.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=cal3admin
DB_PASSWORD=YourPassword123!
DB_NAME=cal3
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

### Self-Hosted PostgreSQL

```bash
DB_HOST=192.168.1.100
DB_PORT=5432
DB_USERNAME=cal3_user
DB_PASSWORD=your_password
DB_NAME=cal3
DB_SSL=false
```

## Database Preparation

Create database and user on your PostgreSQL server:

```sql
CREATE DATABASE cal3;
CREATE USER cal3_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cal3 TO cal3_user;
\c cal3
GRANT ALL ON SCHEMA public TO cal3_user;
```

## Environment Variables Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| DB_HOST | Yes | Database server hostname | localhost |
| DB_PORT | No | Database port | 5432 |
| DB_USERNAME | Yes | Database username | postgres |
| DB_PASSWORD | Yes | Database password | - |
| DB_NAME | No | Database name | cal3 |
| DB_SSL | No | Enable SSL connection | false |
| DB_SSL_REJECT_UNAUTHORIZED | No | Reject self-signed certs | true |
| DB_SYNCHRONIZE | No | Auto-create/update schema | false |
| DB_LOGGING | No | Enable query logging | false |
| DB_POOL_MAX | No | Max connection pool size | 10 |
| DB_POOL_MIN | No | Min connection pool size | 2 |
| DB_IDLE_TIMEOUT | No | Idle timeout (ms) | 30000 |
| DB_CONNECTION_TIMEOUT | No | Connection timeout (ms) | 10000 |

## Troubleshooting

### Connection Refused
- Check firewall rules allow your Docker host IP
- Verify database server is running
- Test connection: `psql -h your-host -U cal3_user -d cal3`

### SSL Errors
- Set `DB_SSL=true` for cloud providers
- Set `DB_SSL_REJECT_UNAUTHORIZED=false` for self-signed certs

### Authentication Failed
- Verify username format (Azure Flexible Server: just `username`, not `username@server`)
- Check password has no unescaped special characters
- Ensure user has proper database permissions

### Performance Issues
- Adjust connection pool: `DB_POOL_MAX=20`, `DB_POOL_MIN=5`
- Enable logging temporarily: `DB_LOGGING=true`
- Check database server resources

## Best Practices

1. **Security**
   - Use strong passwords (16+ characters)
   - Enable SSL for cloud databases (`DB_SSL=true`)
   - Restrict firewall to specific IPs
   - Never set `DB_SYNCHRONIZE=true` in production

2. **Performance**
   - Configure connection pool based on load
   - Small (<50 users): `DB_POOL_MAX=10`
   - Medium (50-200 users): `DB_POOL_MAX=20`
   - Large (200+ users): `DB_POOL_MAX=50`

3. **Backups**
   - Configure automated backups on your database provider
   - Test restore procedures regularly
   - Keep encrypted backups of configuration

## Migration from Built-in Database

```bash
# 1. Backup current data
docker exec cal3-postgres pg_dump -U postgres cal3 > backup.sql

# 2. Restore to external database
psql -h your-external-host -U cal3_user -d cal3 < backup.sql

# 3. Update .env with external database settings

# 4. Restart application
docker-compose down
docker-compose up -d backend frontend
```

## Testing Connection

```bash
# Test with psql
psql -h your-db-host -p 5432 -U cal3_user -d cal3

# Test with Docker
docker run -it --rm postgres:15 psql -h your-db-host -U cal3_user -d cal3
```

## Support

For issues:
1. Check logs: `docker-compose logs backend`
2. Review error messages above
3. Check provider documentation
4. Open GitHub issue with logs

---

**Related Documentation**:
- [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md) - Complete configuration reference
- [docker/TROUBLESHOOTING.md](../docker/TROUBLESHOOTING.md) - Docker troubleshooting
- [DEPLOYMENT.md](../DEPLOYMENT.md) - General deployment guide
