#!/bin/bash
# ===========================================
# Database Backup Script for Cal3
# ===========================================

set -e

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "ERROR: .env file not found!"
    exit 1
fi

BACKUP_DIR="./docker/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cal3_backup_$TIMESTAMP.sql"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "========================================="
echo "Creating database backup..."
echo "========================================="
echo "Database: $DB_NAME"
echo "Backup file: ${BACKUP_FILE}.gz"
echo ""

# Check which container is running
if docker ps | grep -q "cal3-postgres-dev"; then
    CONTAINER="cal3-postgres-dev"
elif docker ps | grep -q "cal3-postgres"; then
    CONTAINER="cal3-postgres"
else
    echo "ERROR: No running PostgreSQL container found!"
    echo "Please start the application first."
    exit 1
fi

# Create backup
docker exec "$CONTAINER" pg_dump -U "$DB_USERNAME" "$DB_NAME" > "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
    # Compress backup
    gzip "$BACKUP_FILE"

    FILESIZE=$(stat -f%z "${BACKUP_FILE}.gz" 2>/dev/null || stat -c%s "${BACKUP_FILE}.gz" 2>/dev/null)
    echo "Backup created successfully!"
    echo "Size: $(numfmt --to=iec-i --suffix=B $FILESIZE 2>/dev/null || echo $FILESIZE bytes)"
    echo ""

    # Keep only last 7 backups
    echo "Cleaning up old backups (keeping last 7)..."
    ls -t "$BACKUP_DIR"/cal3_backup_*.sql.gz | tail -n +8 | xargs rm -f 2>/dev/null || true

    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/cal3_backup_*.sql.gz 2>/dev/null || echo "  (none)"
else
    echo "ERROR: Backup failed!"
    exit 1
fi

echo ""
echo "========================================="
echo "Backup complete!"
echo "========================================="
