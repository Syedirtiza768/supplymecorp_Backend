# Flipbook Data Export/Import Guide

## Overview

This guide explains how to export and import flipbook-related data (flipbooks, pages, and hotspots) from your PostgreSQL database.

## Files

- **`export-flipbook.ts`** - Exports flipbook data to JSON and SQL formats
- **`import-flipbook.ts`** - Imports flipbook data from JSON files
- **Export directory** - `D:\supplyme\flipbook-data-export\`

## Export

### What Gets Exported

1. **flipbooks** table - All flipbook records
2. **flipbook_pages** table - All page records with image URLs
3. **flipbook_hotspots** table - All hotspot records with coordinates and product data

### Export Process

Run the export script:

```bash
cd D:\supplyme\supplymecorp_Backend
npx ts-node export-flipbook.ts
```

### Output Files

The script generates 4 files with a timestamp:

```
flipbook-data-export/
├── flipbook_2025-11-28T09-03-41-802Z.json           # 3 flipbooks
├── flipbook_page_2025-11-28T09-03-41-802Z.json      # 14 pages
├── flipbook_hotspot_2025-11-28T09-03-41-802Z.json   # 54 hotspots
└── flipbook_export_2025-11-28T09-03-41-802Z.sql     # SQL dump for manual import
```

## Import

### Import Modes

1. **insert (default)** - Adds data, updates existing records if IDs match
2. **replace** - Truncates tables first, then imports (full replacement)

### Import Process

#### Mode: Insert (Add Data)

```bash
cd D:\supplyme\supplymecorp_Backend
npx ts-node import-flipbook.ts insert
```

**Use this when:**
- Adding flipbooks from another database to your current database
- Merging data from multiple sources
- Restoring lost records

#### Mode: Replace (Full Replacement)

```bash
cd D:\supplyme\supplymecorp_Backend
npx ts-node import-flipbook.ts replace
```

**Use this when:**
- Completely replacing all flipbook data
- Resetting to a known good state
- Migrating from one environment to another

⚠️ **WARNING:** Replace mode truncates all tables. All existing flipbook data will be deleted!

## Use Cases

### Backup & Restore

```bash
# Backup current data
npx ts-node export-flipbook.ts

# Later, restore from backup
npx ts-node import-flipbook.ts replace
```

### Development to Production Migration

```bash
# On development server
cd D:\supplyme\supplymecorp_Backend
npx ts-node export-flipbook.ts

# Copy flipbook-data-export directory to production server

# On production server
npx ts-node import-flipbook.ts replace
```

### Merge Multiple Sources

```bash
# Export from Database A
npx ts-node export-flipbook.ts

# On Database B, insert the data
npx ts-node import-flipbook.ts insert
```

## Data Format

### JSON Format (Export)

```json
[
  {
    "id": "2025-26-Fall---Winter-Catalogue",
    "title": "2025-26 Fall - Winter Catalogue",
    "description": "Fall and Winter collection 2025-26",
    "isFeatured": true,
    "createdAt": "2025-11-28T09:03:41.802Z",
    "updatedAt": "2025-11-28T09:03:41.802Z"
  }
]
```

### Hotspot Structure

```json
{
  "id": "hotspot-123",
  "pageId": "page-456",
  "productSku": "PROD-789",
  "x": 50.5,
  "y": 30.2,
  "width": 15,
  "height": 20,
  "label": "Product Label",
  "linkUrl": "/shop/PROD-789",
  "zIndex": 0,
  "createdAt": "2025-11-28T09:03:41.802Z",
  "updatedAt": "2025-11-28T09:03:41.802Z"
}
```

## Manual SQL Import

If you prefer manual SQL import, use the generated SQL file:

```bash
# Run the SQL dump directly
psql -h localhost -U postgres -d orgill -f flipbook_export_2025-11-28T09-03-41-802Z.sql
```

Or in your database tool (pgAdmin, DBeaver, etc.):

1. Open the SQL file
2. Connect to target database
3. Execute the SQL

## Troubleshooting

### Foreign Key Constraint Errors

The scripts handle this automatically by:
- Disabling foreign key checks during truncation
- Re-enabling them after data import

### Duplicate Key Errors (Insert Mode)

The import script uses `ON CONFLICT ... DO UPDATE` to handle duplicate IDs:
- Existing records are updated with new values
- No data is lost

### File Not Found

Make sure export files are in the correct directory:

```
D:\supplyme\flipbook-data-export\flipbook_*.json
D:\supplyme\flipbook-data-export\flipbook_page_*.json
D:\supplyme\flipbook-data-export\flipbook_hotspot_*.json
```

### Database Connection Failed

Check your environment variables:

```bash
# Windows
set DB_HOST=localhost
set DB_PORT=5432
set DB_USERNAME=postgres
set DB_PASSWORD=global321
set DB_DATABASE=orgill
```

## Automation

### Scheduled Backups (Windows Task Scheduler)

Create a batch file `backup-flipbooks.bat`:

```batch
@echo off
cd D:\supplyme\supplymecorp_Backend
npx ts-node export-flipbook.ts
echo Backup completed at %date% %time%
```

Schedule it to run daily/weekly in Windows Task Scheduler.

### CI/CD Integration

Add to your deployment pipeline:

```yaml
# Example: GitHub Actions
- name: Backup flipbook data
  run: |
    cd supplymecorp_Backend
    npx ts-node export-flipbook.ts
```

## Support

For issues or questions:

1. Check database connectivity: `psql -h localhost -U postgres -d orgill`
2. Verify file permissions on export directory
3. Check PostgreSQL logs for detailed errors
4. Ensure TypeORM entities are up to date

## Statistics

Current database has:

- **3 Flipbooks**
- **14 Pages**
- **54 Hotspots**

Last export: 2025-11-28 09:03:41 UTC
