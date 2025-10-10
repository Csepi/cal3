#!/bin/bash
# ===========================================
# Database Initialization Script
# Runs on first PostgreSQL container startup
# ===========================================

set -e

echo "========================================="
echo "Cal3 Database Initialization"
echo "========================================="

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h localhost -U "$POSTGRES_USER"; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is ready!"

# Check if database exists
DB_EXISTS=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "Database $POSTGRES_DB already exists"
else
    echo "Creating database $POSTGRES_DB..."
    psql -U "$POSTGRES_USER" -c "CREATE DATABASE $POSTGRES_DB"
    echo "Database created successfully!"
fi

echo "========================================="
echo "Database initialization complete!"
echo "========================================="
