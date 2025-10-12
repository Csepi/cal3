# External Database Quick Reference

Cal3 supports external PostgreSQL databases (Azure, AWS RDS, self-hosted).

## Quick Setup

1. **Configure Environment Variables** (`docker/config/.env`):
```bash
DB_HOST=your-db-server.com
DB_PORT=5432
DB_USERNAME=cal3_user
DB_PASSWORD=your_password
DB_NAME=cal3
DB_SSL=true                    # For cloud providers
DB_SSL_REJECT_UNAUTHORIZED=false
DB_SYNCHRONIZE=false           # MUST be false in production
```

2. **Comment Out PostgreSQL Service** in `docker/docker-compose.yml`:
```yaml
services:
  # postgres:
  #   image: postgres:15-alpine
  #   ...
```

3. **Start Application**:
```bash
docker-compose up -d backend frontend
```

## Provider Examples

### Azure
```bash
DB_HOST=myserver.postgres.database.azure.com
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

### AWS RDS
```bash
DB_HOST=mydb.abc123.us-east-1.rds.amazonaws.com
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

### Self-Hosted
```bash
DB_HOST=192.168.1.100
DB_SSL=false
```

## Complete Guide

See [README.md](README.md) for:
- Detailed setup instructions
- Provider-specific guides
- SSL configuration
- Connection pooling
- Troubleshooting
- Migration procedures

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | Yes | Database hostname |
| `DB_PORT` | No | Port (default: 5432) |
| `DB_USERNAME` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `DB_NAME` | No | Database name (default: cal3) |
| `DB_SSL` | No | Enable SSL (true/false) |
| `DB_SSL_REJECT_UNAUTHORIZED` | No | Validate SSL cert (true/false) |
| `DB_SYNCHRONIZE` | No | Auto-sync schema (**false** in prod!) |
| `DB_POOL_MAX` | No | Max connections (default: 10) |
| `DB_POOL_MIN` | No | Min connections (default: 2) |

