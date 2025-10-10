#!/bin/bash
# ===========================================
# Database Restore Script for Cal3
# ===========================================

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "========================================="
    echo "Cal3 Database Restore"
    echo "========================================="
    echo "Usage: ./db-restore.sh <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh ./docker/backups/cal3_backup_*.sql.gz 2>/dev/null || echo "  (none found)"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "ERROR: .env file not found!"
    exit 1
fi

echo "========================================="
echo "Cal3 Database Restore"
echo "========================================="
echo "WARNING: This will OVERWRITE the current database!"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

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

echo ""
echo "Restoring database from $BACKUP_FILE..."

# Decompress and restore
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -U "$DB_USERNAME" "$DB_NAME"
else
    cat "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -U "$DB_USERNAME" "$DB_NAME"
fi

echo ""
echo "========================================="
echo "Database restored successfully!"
echo "========================================="
echo "You may need to restart the backend:"
echo "  docker-compose restart backend"
echo "========================================="
