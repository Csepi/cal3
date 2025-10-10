# Configuration Directory

This directory contains environment configuration files for Cal3 Docker deployment.

## 📁 Structure

```
config/
├── README.md              # This file
├── env.example            # Production environment template
├── env.dev.example        # Development environment template
├── .env                   # Production config (git-ignored, create from example)
└── .env.dev              # Development config (git-ignored, create from example)
```

## 🚀 Quick Setup

### For Development

```bash
# Copy the example file
cp env.dev.example .env.dev

# Edit with your settings (or use defaults)
nano .env.dev

# Start containers (from docker/ directory)
cd ..
./scripts/start-dev.sh
```

**Development defaults** (works without editing):
- Database: postgres/postgres/cal3_dev
- JWT: dev-jwt-secret-change-in-production
- Ports: 8080 (frontend), 8081 (backend), 5432 (database)

### For Production

```bash
# Copy the example file
cp env.example .env

# IMPORTANT: Edit with production values
nano .env

# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 24  # For DB_PASSWORD

# Start containers (from docker/ directory)
cd ..
./scripts/start-prod.sh
```

## 📝 Environment Files

### `.env` (Production)

Used by `docker-compose.yml` for production deployment.

**Required settings:**
- `DB_USERNAME` - Database user
- `DB_PASSWORD` - Strong password (16+ characters)
- `DB_NAME` - Database name
- `JWT_SECRET` - Strong secret (32+ characters)

**Optional settings:**
- OAuth credentials (Google, Microsoft)
- Custom ports
- Frontend/API URLs

### `.env.dev` (Development)

Used by `docker-compose.dev.yml` for local development.

**Can use defaults** or customize:
- Database: postgres/postgres/cal3_dev
- JWT: dev-jwt-secret-change-in-production
- OAuth: Leave empty for local testing

## 🔒 Security Notes

1. **Never commit** `.env` or `.env.dev` files (they're in .gitignore)
2. **Use strong passwords** in production (16+ characters)
3. **Generate unique JWT secrets** for each environment
4. **Rotate secrets regularly** (every 90 days recommended)
5. **Keep examples updated** when adding new variables

## 📖 Volume Mapping

The config directory is mounted as a read-only volume in containers:

- **Backend**: `/app/config` (read-only)
- **Frontend**: `/etc/cal3/config` (read-only)

This allows:
- ✅ Persistent configuration outside containers
- ✅ Easy updates without rebuilding images
- ✅ Backup and version control of templates
- ✅ Separation of config from code

## 🔄 Updating Configuration

### Without Restarting Containers

Most environment variables are loaded at startup, so you'll need to restart:

```bash
# From docker/ directory
docker-compose restart backend
docker-compose restart frontend
```

### Full Restart

```bash
# From docker/ directory
docker-compose down
docker-compose up -d
```

## 📋 Configuration Checklist

### Development
- [ ] Copy `env.dev.example` to `.env.dev`
- [ ] Review default values
- [ ] Customize if needed (optional)
- [ ] Start with `./scripts/start-dev.sh`

### Production
- [ ] Copy `env.example` to `.env`
- [ ] Set strong `DB_PASSWORD` (16+ chars)
- [ ] Set strong `JWT_SECRET` (32+ chars)
- [ ] Configure OAuth if needed
- [ ] Set production URLs
- [ ] Review all values
- [ ] Start with `./scripts/start-prod.sh`

## 🆘 Troubleshooting

### Config file not found

```bash
# Make sure you're in the docker/ directory
cd /path/to/cal3/docker

# Check if config files exist
ls -la config/

# Create from example if missing
cp config/env.example config/.env
```

### Environment variables not loading

```bash
# Check Docker Compose config
docker-compose config

# Verify env_file paths in docker-compose.yml
# Should point to: ./config/.env or ./config/.env.dev

# Restart containers
docker-compose restart
```

### Permission errors

```bash
# Ensure config directory is readable
chmod 755 config/
chmod 644 config/.env
chmod 644 config/.env.dev
```

## 📚 Related Documentation

- [Main Docker Documentation](../../docs/docker/README.md)
- [Deployment Guide](../../docs/docker/DEPLOYMENT_GUIDE.md)
- [Environment Variables Reference](../../docs/docker/DEPLOYMENT_GUIDE.md#environment-variables)

---

**Remember:** The config directory and its .env files are mounted as volumes, so changes persist across container rebuilds!
