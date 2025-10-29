#!/bin/bash

# Database backup script for Basalam Product Manager
set -e

echo "💾 Starting database backup..."

# Configuration
BACKUP_DIR=${BACKUP_DIR:-"/var/backups/basalam-product-manager"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"basalam_product_manager"}
DB_USER=${DB_USER:-"postgres"}
RETENTION_DAYS=${RETENTION_DAYS:-"30"}

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/basalam_backup_$TIMESTAMP.sql"

echo "📋 Backup Configuration:"
echo "  Database: $DB_NAME"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  User: $DB_USER"
echo "  Backup file: $BACKUP_FILE"
echo "  Retention: $RETENTION_DAYS days"

# Create database backup
echo "🗄️  Creating database backup..."
PGPASSWORD=$DB_PASSWORD pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    > $BACKUP_FILE

# Compress backup
echo "🗜️  Compressing backup..."
gzip $BACKUP_FILE
BACKUP_FILE="$BACKUP_FILE.gz"

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup created successfully: $BACKUP_FILE ($BACKUP_SIZE)"
else
    echo "❌ Backup failed"
    exit 1
fi

# Clean up old backups
echo "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "basalam_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# List remaining backups
echo "📁 Current backups:"
ls -lh $BACKUP_DIR/basalam_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo "🎉 Backup process completed successfully!"