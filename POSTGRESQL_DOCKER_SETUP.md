# PostgreSQL Database Setup Guide (Docker)

## Quick Start - Docker Commands

### Option 1: Using Docker Run (Simple)

```bash
# 1. Pull PostgreSQL image
docker pull postgres:16

# 2. Create and run PostgreSQL container
docker run --name cal3-postgres \
  -e POSTGRES_DB=cal3 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -v cal3-postgres-data:/var/lib/postgresql/data \
  -d postgres:16

# 3. Wait a few seconds for PostgreSQL to start, then create the schema
docker exec -i cal3-postgres psql -U postgres -d cal3 < backend-nestjs/postgresql-schema.sql

# 4. Create admin user (optional)
docker exec -i cal3-postgres psql -U postgres -d cal3 <<EOF
INSERT INTO users (
  username, email, password, "firstName", "lastName",
  "isActive", role, "usagePlans", "createdAt", "updatedAt"
) VALUES (
  'admin',
  'admin@cal3.local',
  '\$2a\$10\$YourHashedPasswordHere',
  'Admin',
  'User',
  true,
  'admin',
  '["admin","enterprise","store","user","child"]',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
EOF
```

### Option 2: Using Docker Compose (Recommended)

Create `docker-compose.yml` in your project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: cal3-postgres
    environment:
      POSTGRES_DB: cal3
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backend-nestjs/postgresql-schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres-data:
    driver: local
```

**Commands:**

```bash
# Start PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f postgres

# Stop PostgreSQL
docker-compose down

# Stop and remove data
docker-compose down -v
```

---

## Detailed Setup Instructions

### Step 1: Prepare the Schema File

The schema file is already created at:
```
backend-nestjs/postgresql-schema.sql
```

This file contains:
- All 22 database tables
- All foreign key relationships
- All indexes (70+)
- All constraints and checks

### Step 2: Start PostgreSQL Container

**For Windows (PowerShell):**
```powershell
docker run --name cal3-postgres `
  -e POSTGRES_DB=cal3 `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=Enter.Enter `
  -p 5432:5432 `
  -v cal3-postgres-data:/var/lib/postgresql/data `
  -d postgres:16
```

**For Linux/Mac:**
```bash
docker run --name cal3-postgres \
  -e POSTGRES_DB=cal3 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=Enter.Enter \
  -p 5432:5432 \
  -v cal3-postgres-data:/var/lib/postgresql/data \
  -d postgres:16
```

### Step 3: Verify PostgreSQL is Running

```bash
# Check container status
docker ps | grep cal3-postgres

# Check PostgreSQL logs
docker logs cal3-postgres

# Test connection
docker exec -it cal3-postgres psql -U postgres -c "SELECT version();"
```

### Step 4: Create Database Schema

**Method 1: Copy SQL file to container and execute**
```bash
# Copy schema file to container
docker cp backend-nestjs/postgresql-schema.sql cal3-postgres:/tmp/schema.sql

# Execute schema
docker exec -i cal3-postgres psql -U postgres -d cal3 -f /tmp/schema.sql
```

**Method 2: Execute directly from host**
```bash
docker exec -i cal3-postgres psql -U postgres -d cal3 < backend-nestjs/postgresql-schema.sql
```

**Method 3: Using psql client on host (if installed)**
```bash
psql -h localhost -p 5432 -U postgres -d cal3 -f backend-nestjs/postgresql-schema.sql
```

### Step 5: Verify Schema Creation

```bash
# Connect to database
docker exec -it cal3-postgres psql -U postgres -d cal3

# List all tables
\dt

# Count tables (should be 22)
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

# List all tables with column counts
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

# Exit psql
\q
```

### Step 6: Create Admin User

**Option A: Using bcrypt-hashed password (recommended)**

First, generate a hashed password:
```bash
# Using Node.js (if bcryptjs is available)
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('enter', 10, (err, hash) => console.log(hash));"
```

Then insert the user:
```bash
docker exec -i cal3-postgres psql -U postgres -d cal3 <<EOF
INSERT INTO users (
  username, email, password, "firstName", "lastName",
  "isActive", role, "usagePlans", "createdAt", "updatedAt"
) VALUES (
  'admin',
  'admin@cal3.local',
  '\$2a\$10\$PASTE_YOUR_HASHED_PASSWORD_HERE',
  'Admin',
  'User',
  true,
  'admin',
  '["admin","enterprise","store","user","child"]'::json,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
EOF
```

**Option B: Using the TypeScript script (easier)**

The script `backend-nestjs/src/database/create-admin-user.ts` can be adapted for PostgreSQL.

---

## Connection Configuration

### Update Backend .env File

```bash
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=Enter.Enter
DB_NAME=cal3
DB_SYNCHRONIZE=false
DB_SSL=false
```

### For Docker Network (if backend is also in Docker)

```bash
DB_TYPE=postgres
DB_HOST=cal3-postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=Enter.Enter
DB_NAME=cal3
DB_SYNCHRONIZE=false
DB_SSL=false
```

---

## Useful Docker Commands

### Container Management

```bash
# Start container
docker start cal3-postgres

# Stop container
docker stop cal3-postgres

# Restart container
docker restart cal3-postgres

# Remove container (keeps data)
docker rm cal3-postgres

# Remove container and data volume
docker rm cal3-postgres
docker volume rm cal3-postgres-data
```

### Database Backup

```bash
# Backup database to file
docker exec cal3-postgres pg_dump -U postgres cal3 > cal3-backup-$(date +%Y%m%d).sql

# Backup with compression
docker exec cal3-postgres pg_dump -U postgres cal3 | gzip > cal3-backup-$(date +%Y%m%d).sql.gz
```

### Database Restore

```bash
# Restore from backup
docker exec -i cal3-postgres psql -U postgres -d cal3 < cal3-backup-20251020.sql

# Restore from compressed backup
gunzip < cal3-backup-20251020.sql.gz | docker exec -i cal3-postgres psql -U postgres -d cal3
```

### Logs and Monitoring

```bash
# View logs
docker logs cal3-postgres

# Follow logs (live)
docker logs -f cal3-postgres

# View last 100 lines
docker logs --tail 100 cal3-postgres
```

### Database Administration

```bash
# Connect to psql
docker exec -it cal3-postgres psql -U postgres -d cal3

# Run SQL command directly
docker exec -it cal3-postgres psql -U postgres -d cal3 -c "SELECT COUNT(*) FROM users;"

# List all databases
docker exec -it cal3-postgres psql -U postgres -c "\l"

# Database size
docker exec -it cal3-postgres psql -U postgres -d cal3 -c "SELECT pg_size_pretty(pg_database_size('cal3'));"
```

---

## Full Docker Compose Setup (Backend + PostgreSQL)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: cal3-postgres
    environment:
      POSTGRES_DB: cal3
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: Enter.Enter
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backend-nestjs/postgresql-schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - cal3-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend-nestjs
      dockerfile: Dockerfile
    container_name: cal3-backend
    environment:
      DB_TYPE: postgres
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: postgres
      DB_PASSWORD: Enter.Enter
      DB_NAME: cal3
      DB_SYNCHRONIZE: "false"
      DB_SSL: "false"
      PORT: 8081
      JWT_SECRET: calendar-secret-key
    ports:
      - "8081:8081"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - cal3-network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: cal3-frontend
    environment:
      VITE_API_URL: http://localhost:8081
    ports:
      - "8080:8080"
    depends_on:
      - backend
    networks:
      - cal3-network
    restart: unless-stopped

networks:
  cal3-network:
    driver: bridge

volumes:
  postgres-data:
    driver: local
```

**Commands:**
```bash
# Start all services
docker-compose up -d

# View logs for all services
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

---

## Troubleshooting

### Container won't start
```bash
# Check if port 5432 is already in use
netstat -an | findstr 5432  # Windows
lsof -i :5432              # Linux/Mac

# Use different port
docker run --name cal3-postgres -p 5433:5432 ...
```

### Cannot connect to database
```bash
# Check container is running
docker ps | grep cal3-postgres

# Check PostgreSQL logs
docker logs cal3-postgres

# Test connection
docker exec -it cal3-postgres psql -U postgres -c "SELECT 1;"
```

### Schema import fails
```bash
# Check file exists
ls -la backend-nestjs/postgresql-schema.sql

# Try executing in interactive mode
docker exec -it cal3-postgres psql -U postgres -d cal3
\i /tmp/schema.sql
```

### Permission denied errors
```bash
# Check file permissions
chmod 644 backend-nestjs/postgresql-schema.sql

# Try copying to container first
docker cp backend-nestjs/postgresql-schema.sql cal3-postgres:/tmp/
docker exec -it cal3-postgres psql -U postgres -d cal3 -f /tmp/schema.sql
```

---

## Next Steps

1. ✅ Start PostgreSQL container
2. ✅ Create database schema
3. ✅ Create admin user
4. ✅ Update backend `.env` file
5. 🔄 Start backend application
6. 🔄 Test connection and CRUD operations
7. 🔄 (Optional) Run seed script for sample data

---

## Security Recommendations

1. **Change default password** - Don't use "Enter.Enter" in production
2. **Use environment variables** - Don't hardcode passwords
3. **Enable SSL** - For production databases
4. **Limit network access** - Use firewall rules
5. **Regular backups** - Automate database backups
6. **Update regularly** - Keep PostgreSQL image updated

---

## Additional Resources

- PostgreSQL Official Documentation: https://www.postgresql.org/docs/
- Docker PostgreSQL Image: https://hub.docker.com/_/postgres
- TypeORM PostgreSQL Guide: https://typeorm.io/#/connection-options/postgres
- Cal3 Database Schema: `DATABASE_SCHEMA.md`
- Cal3 API Documentation: `API_DOCUMENTATION.md`
