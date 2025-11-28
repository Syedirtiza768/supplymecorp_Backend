#!/bin/bash
# Import Flipbook Tables from pg_dump SQL file
# Usage: ./import-from-dump.sh [dump-file.sql]

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="orgill"
DB_USER="postgres"

# Get dump file (use first argument or find latest)
if [ -z "$1" ]; then
    DUMP_FILE=$(ls -t flipbook_dump_*.sql 2>/dev/null | head -n 1)
    if [ -z "$DUMP_FILE" ]; then
        echo "Error: No dump file found. Please specify a file."
        echo "Usage: $0 [dump-file.sql]"
        exit 1
    fi
else
    DUMP_FILE="$1"
fi

if [ ! -f "$DUMP_FILE" ]; then
    echo "Error: Dump file '$DUMP_FILE' not found."
    exit 1
fi

echo "Importing flipbook data from: $DUMP_FILE"
echo "Target database: $DB_NAME on $DB_HOST"
echo ""
read -s -p "Enter PostgreSQL password: " DB_PASSWORD
echo ""

export PGPASSWORD="$DB_PASSWORD"

echo "Running import..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DUMP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "Import completed successfully!"
else
    echo ""
    echo "Import failed with exit code $?"
fi

# Clear password
unset PGPASSWORD
