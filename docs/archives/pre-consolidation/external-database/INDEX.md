# External Database Documentation

Complete documentation for using external PostgreSQL databases with Cal3.

## 📚 Documentation Files

### [README.md](README.md) - Complete Setup Guide
**Full comprehensive guide (186 lines)**

Includes:
- Quick setup instructions
- Database preparation SQL commands
- Provider-specific guides (Azure, AWS RDS, self-hosted)
- Complete environment variables reference
- Troubleshooting (connection, SSL, authentication, performance)
- Best practices (security, production, performance, disaster recovery)
- Migration guide from built-in to external database
- Connection testing procedures

**Use this when:** Setting up external database for the first time or troubleshooting issues.

### [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick Reference
**Fast setup reference (78 lines)**

Includes:
- 3-step quick setup
- Provider examples (Azure, AWS, self-hosted)
- Environment variables table
- Link to comprehensive guide

**Use this when:** You need a quick reminder or setup template.

## 🎯 Quick Start

### 1. Choose Your Database Provider

- **Azure Database for PostgreSQL**
- **AWS RDS PostgreSQL**
- **Self-Hosted PostgreSQL**
- **Google Cloud SQL**
- **Any PostgreSQL 12+ server**

### 2. Configure Environment Variables

```bash
# In docker/config/.env
DB_HOST=your-db-server.com
DB_PORT=5432
DB_USERNAME=cal3_user
DB_PASSWORD=your_password
DB_NAME=cal3
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_SYNCHRONIZE=false
```

### 3. Deploy

```bash
# Comment out postgres service in docker-compose.yml
# Then start:
docker-compose up -d backend frontend
```

## 🔗 Related Documentation

- [Portainer Deployment Guide](../docker/PORTAINER_GUIDE.md) - Includes external database setup
- [Configuration Guide](../CONFIGURATION_GUIDE.md) - All environment variables
- [Troubleshooting Guide](../TROUBLESHOOTING.md) - Docker troubleshooting

## 📋 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | Yes | Database hostname |
| `DB_PORT` | No | Port (default: 5432) |
| `DB_USERNAME` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `DB_NAME` | No | Database name (default: cal3) |
| `DB_SSL` | No | Enable SSL (true/false) |
| `DB_SSL_REJECT_UNAUTHORIZED` | No | Validate SSL cert |
| `DB_SYNCHRONIZE` | No | Auto-sync schema (false in prod!) |
| `DB_POOL_MAX` | No | Max connections (default: 10) |
| `DB_POOL_MIN` | No | Min connections (default: 2) |

## ⚡ Provider Quick Links

### Azure PostgreSQL
- [Azure Portal](https://portal.azure.com/)
- [Azure CLI Docs](https://docs.microsoft.com/en-us/cli/azure/postgres)
- [Firewall Configuration](https://docs.microsoft.com/en-us/azure/postgresql/concepts-firewall-rules)

### AWS RDS
- [AWS Console](https://console.aws.amazon.com/rds/)
- [RDS User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/)
- [Security Groups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.RDSSecurityGroups.html)

### Google Cloud SQL
- [Cloud Console](https://console.cloud.google.com/sql)
- [Cloud SQL Docs](https://cloud.google.com/sql/docs/postgres)

## 🆘 Common Issues

- **Connection Refused** → Check firewall rules
- **SSL Errors** → Set `DB_SSL_REJECT_UNAUTHORIZED=false`
- **Authentication Failed** → Verify username/password format
- **Performance Issues** → Tune connection pool settings

See [README.md](README.md) for detailed troubleshooting.

---

**Last Updated:** 2025-10-12  
**Version:** 1.0
