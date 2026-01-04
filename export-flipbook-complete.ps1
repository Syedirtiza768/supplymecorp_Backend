#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Export Complete Flipbook Database (Tables + Images)
.DESCRIPTION
    Exports flipbook tables (flipbooks, flipbook_pages, flipbook_hotspots) 
    and associated images from uploads/flipbooks directory.
    Creates a complete deployment package for production.
.EXAMPLE
    .\export-flipbook-complete.ps1
    .\export-flipbook-complete.ps1 -FlipbookId "2025-26-Fall-Winter-Catalogue"
#>

param(
    [string]$FlipbookId = $null,
    [string]$OutputDir = "flipbook-deployment-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
)

# Database configuration
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "orgill"
$DB_USER = "supplyme_user"
$DB_PASSWORD = "supplyme2024"

# Colors
$ColorInfo = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"

Write-Host "`n========================================" -ForegroundColor $ColorInfo
Write-Host "  FLIPBOOK DEPLOYMENT PACKAGE EXPORTER" -ForegroundColor $ColorInfo
Write-Host "========================================`n" -ForegroundColor $ColorInfo

# Create output directory
Write-Host "[1/5] Creating deployment directory..." -ForegroundColor $ColorInfo
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
Write-Host "      ✓ Created: $OutputDir" -ForegroundColor $ColorSuccess

# Set PostgreSQL password
$env:PGPASSWORD = $DB_PASSWORD

# Step 1: Export Database Schema + Data
Write-Host "`n[2/5] Exporting database tables..." -ForegroundColor $ColorInfo

$SQL_FILE = "$OutputDir/flipbook_database.sql"

# Build WHERE clause for specific flipbook
$whereClause = ""
if ($FlipbookId) {
    $whereClause = "WHERE id = '$FlipbookId'"
    Write-Host "      Filtering for flipbook: $FlipbookId" -ForegroundColor $ColorWarning
}

# Create comprehensive SQL dump
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$fbId = if ($FlipbookId) { $FlipbookId } else { "ALL" }

$sqlContent = @"
-- ============================================
-- FLIPBOOK DATABASE EXPORT
-- Generated: $timestamp
-- Database: $DB_NAME
-- FlipbookId: $fbId
-- ============================================

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ============================================
-- 1. CREATE TABLES (if not exist)
-- ============================================

CREATE TABLE IF NOT EXISTS flipbooks (
    id character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    "isFeatured" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "PK_flipbooks" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS flipbook_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "flipbookId" character varying NOT NULL,
    "pageNumber" integer NOT NULL,
    "imageUrl" character varying NOT NULL,
    meta jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "PK_flipbook_pages" PRIMARY KEY (id),
    CONSTRAINT "UQ_flipbook_page" UNIQUE ("flipbookId", "pageNumber")
);

CREATE TABLE IF NOT EXISTS flipbook_hotspots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "pageId" uuid NOT NULL,
    "productSku" character varying,
    x double precision NOT NULL,
    y double precision NOT NULL,
    width double precision NOT NULL,
    height double precision NOT NULL,
    label character varying,
    "linkUrl" character varying,
    "zIndex" integer DEFAULT 0,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "PK_flipbook_hotspots" PRIMARY KEY (id)
);

-- ============================================
-- 2. ADD FOREIGN KEYS (if not exist)
-- ============================================

DO `$`$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_flipbook_pages_flipbook'
    ) THEN
        ALTER TABLE flipbook_pages
            ADD CONSTRAINT "FK_flipbook_pages_flipbook" 
            FOREIGN KEY ("flipbookId") REFERENCES flipbooks(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FK_flipbook_hotspots_page'
    ) THEN
        ALTER TABLE flipbook_hotspots
            ADD CONSTRAINT "FK_flipbook_hotspots_page" 
            FOREIGN KEY ("pageId") REFERENCES flipbook_pages(id) ON DELETE CASCADE;
    END IF;
END`$`$;

-- ============================================
-- 3. CLEAR EXISTING DATA (Optional - Comment out to append)
-- ============================================

-- Uncomment below lines to replace existing data
-- DELETE FROM flipbook_hotspots $whereClause;
-- DELETE FROM flipbook_pages $whereClause;
-- DELETE FROM flipbooks $whereClause;

-- ============================================
-- 4. INSERT FLIPBOOK DATA
-- ============================================

"@

Write-Host "      Querying flipbooks..." -ForegroundColor Gray

# Query flipbooks
$flipbooksQuery = "SELECT id, title, description, `"isFeatured`", `"createdAt`", `"updatedAt`" FROM flipbooks $whereClause ORDER BY id"
$flipbooks = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -F '|' -c $flipbooksQuery

if ($flipbooks) {
    $sqlContent += "`n-- Flipbooks`n"
    foreach ($row in $flipbooks) {
        if ($row.Trim()) {
            $fields = $row.Split('|')
            $id = $fields[0]
            $title = $fields[1] -replace "'", "''"
            $description = if ($fields[2]) { "'$($fields[2] -replace "'", "''")'" } else { "NULL" }
            $isFeatured = $fields[3]
            $createdAt = $fields[4]
            $updatedAt = $fields[5]
            
            $sqlContent += "INSERT INTO flipbooks (id, title, description, `"isFeatured`", `"createdAt`", `"updatedAt`") VALUES ('$id', '$title', $description, $isFeatured, '$createdAt', '$updatedAt') ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, `"isFeatured`" = EXCLUDED.`"isFeatured`", `"updatedAt`" = EXCLUDED.`"updatedAt`";`n"
        }
    }
    Write-Host "      ✓ Exported flipbooks: $($flipbooks.Count)" -ForegroundColor $ColorSuccess
}

# Query pages
Write-Host "      Querying pages..." -ForegroundColor Gray
$pagesWhere = if ($FlipbookId) { "WHERE `"flipbookId`" = '$FlipbookId'" } else { "" }
$pagesQuery = "SELECT id, `"flipbookId`", `"pageNumber`", `"imageUrl`", meta, `"createdAt`", `"updatedAt`" FROM flipbook_pages $pagesWhere ORDER BY `"flipbookId`", `"pageNumber`""
$pages = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -F '|' -c $pagesQuery

if ($pages) {
    $sqlContent += "`n-- Flipbook Pages`n"
    foreach ($row in $pages) {
        if ($row.Trim()) {
            $fields = $row.Split('|')
            $id = $fields[0]
            $flipbookId = $fields[1]
            $pageNumber = $fields[2]
            $imageUrl = $fields[3] -replace "'", "''"
            $meta = if ($fields[4]) { "'$($fields[4] -replace "'", "''")'" } else { "NULL" }
            $createdAt = $fields[5]
            $updatedAt = $fields[6]
            
            $sqlContent += "INSERT INTO flipbook_pages (id, `"flipbookId`", `"pageNumber`", `"imageUrl`", meta, `"createdAt`", `"updatedAt`") VALUES ('$id', '$flipbookId', $pageNumber, '$imageUrl', $meta, '$createdAt', '$updatedAt') ON CONFLICT (`"flipbookId`", `"pageNumber`") DO UPDATE SET id = EXCLUDED.id, `"imageUrl`" = EXCLUDED.`"imageUrl`", meta = EXCLUDED.meta, `"updatedAt`" = EXCLUDED.`"updatedAt`";`n"
        }
    }
    Write-Host "      ✓ Exported pages: $($pages.Count)" -ForegroundColor $ColorSuccess
}

# Query hotspots
Write-Host "      Querying hotspots..." -ForegroundColor Gray
$hotspotsWhere = if ($FlipbookId) { "WHERE p.`"flipbookId`" = '$FlipbookId'" } else { "" }
$hotspotsQuery = "SELECT h.id, h.`"pageId`", h.`"productSku`", h.x, h.y, h.width, h.height, h.label, h.`"linkUrl`", h.`"zIndex`", h.`"createdAt`", h.`"updatedAt`" FROM flipbook_hotspots h JOIN flipbook_pages p ON h.`"pageId`" = p.id $hotspotsWhere ORDER BY h.`"pageId`""
$hotspots = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -F '|' -c $hotspotsQuery

if ($hotspots) {
    $sqlContent += "`n-- Hotspots`n"
    foreach ($row in $hotspots) {
        if ($row.Trim()) {
            $fields = $row.Split('|')
            $id = $fields[0]
            $pageId = $fields[1]
            $productSku = if ($fields[2]) { "'$($fields[2] -replace "'", "''")'" } else { "NULL" }
            $x = $fields[3]
            $y = $fields[4]
            $width = $fields[5]
            $height = $fields[6]
            $label = if ($fields[7]) { "'$($fields[7] -replace "'", "''")'" } else { "NULL" }
            $linkUrl = if ($fields[8]) { "'$($fields[8] -replace "'", "''")'" } else { "NULL" }
            $zIndex = if ($fields[9]) { $fields[9] } else { "0" }
            $createdAt = $fields[10]
            $updatedAt = $fields[11]
            
            $sqlContent += "INSERT INTO flipbook_hotspots (id, `"pageId`", `"productSku`", x, y, width, height, label, `"linkUrl`", `"zIndex`", `"createdAt`", `"updatedAt`") VALUES ('$id', '$pageId', $productSku, $x, $y, $width, $height, $label, $linkUrl, $zIndex, '$createdAt', '$updatedAt') ON CONFLICT (id) DO UPDATE SET `"productSku`" = EXCLUDED.`"productSku`", x = EXCLUDED.x, y = EXCLUDED.y, width = EXCLUDED.width, height = EXCLUDED.height, label = EXCLUDED.label, `"linkUrl`" = EXCLUDED.`"linkUrl`", `"zIndex`" = EXCLUDED.`"zIndex`", `"updatedAt`" = EXCLUDED.`"updatedAt`";`n"
        }
    }
    Write-Host "      ✓ Exported hotspots: $($hotspots.Count)" -ForegroundColor $ColorSuccess
}

$sqlContent += "`n-- Export completed successfully`n"
$sqlContent | Out-File -FilePath $SQL_FILE -Encoding UTF8
Write-Host "      ✓ SQL file saved: $SQL_FILE" -ForegroundColor $ColorSuccess

# Step 2: Copy Image Files
Write-Host "`n[3/5] Copying flipbook images..." -ForegroundColor $ColorInfo

$uploadsSource = "uploads\flipbooks"
$uploadsDestination = "$OutputDir\uploads"

if (Test-Path $uploadsSource) {
    if ($FlipbookId) {
        # Copy specific flipbook folder
        $specificFolder = Join-Path $uploadsSource $FlipbookId
        if (Test-Path $specificFolder) {
            $destFolder = Join-Path $uploadsDestination $FlipbookId
            Copy-Item -Path $specificFolder -Destination $destFolder -Recurse -Force
            $imageCount = (Get-ChildItem $destFolder -File -Recurse).Count
            Write-Host "      ✓ Copied $imageCount images for flipbook: $FlipbookId" -ForegroundColor $ColorSuccess
        } else {
            Write-Host "      ⚠ Flipbook folder not found: $FlipbookId" -ForegroundColor $ColorWarning
        }
    } else {
        # Copy all flipbooks
        Copy-Item -Path $uploadsSource -Destination $uploadsDestination -Recurse -Force
        $imageCount = (Get-ChildItem "$uploadsDestination\flipbooks" -File -Recurse).Count
        Write-Host "      ✓ Copied $imageCount images from all flipbooks" -ForegroundColor $ColorSuccess
    }
} else {
    Write-Host "      ⚠ No uploads folder found" -ForegroundColor $ColorWarning
}

# Step 3: Create deployment script
Write-Host "`n[4/5] Creating deployment script..." -ForegroundColor $ColorInfo

$deployScript = @"
#!/bin/bash
# Flipbook Deployment Script for Ubuntu Production Server
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

echo "================================================"
echo "  FLIPBOOK DEPLOYMENT"
echo "================================================"

# Configuration
DB_NAME="orgill"
DB_USER="supplyme_user"
BACKEND_DIR="/var/www/supplymecorp_Backend"

echo ""
echo "[1/3] Deploying database..."
sudo -u postgres psql -d \$DB_NAME -f flipbook_database.sql
if [ \$? -eq 0 ]; then
    echo "      ✓ Database imported successfully"
else
    echo "      ✗ Database import failed"
    exit 1
fi

echo ""
echo "[2/3] Deploying images..."
if [ -d "uploads" ]; then
    sudo mkdir -p \$BACKEND_DIR/uploads
    sudo cp -r uploads/* \$BACKEND_DIR/uploads/
    sudo chown -R www-data:www-data \$BACKEND_DIR/uploads
    sudo chmod -R 755 \$BACKEND_DIR/uploads
    IMAGE_COUNT=\$(find uploads -type f | wc -l)
    echo "      ✓ Copied \$IMAGE_COUNT images"
else
    echo "      ⚠ No uploads folder found"
fi

echo ""
echo "[3/3] Restarting backend service..."
sudo systemctl restart supplymecorp-backend
if [ \$? -eq 0 ]; then
    echo "      ✓ Backend restarted"
else
    echo "      ⚠ Failed to restart backend (may need manual restart)"
fi

echo ""
echo "================================================"
echo "  DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Verify flipbook at: http://your-domain.com/api/flipbooks/featured/current"
echo "2. Clear Redis cache if needed: redis-cli FLUSHDB"
echo "3. Check logs: sudo journalctl -u supplymecorp-backend -f"
echo ""
"@

$deployScript | Out-File -FilePath "$OutputDir/deploy.sh" -Encoding UTF8
Write-Host "      ✓ Created: deploy.sh" -ForegroundColor $ColorSuccess

# Create README
$readme = @"
# Flipbook Deployment Package
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
$(if ($FlipbookId) { "FlipbookId: $FlipbookId" } else { "Scope: ALL FLIPBOOKS" })

## Contents
- flipbook_database.sql - Database schema and data
- uploads/ - Flipbook images
- deploy.sh - Automated deployment script
- README.md - This file

## Deployment Instructions

### Option 1: Automated Deployment (Recommended)
1. Copy this entire folder to your Ubuntu server:
   scp -r $OutputDir root@your-server:/tmp/

2. SSH into your server:
   ssh root@your-server

3. Navigate to the deployment folder:
   cd /tmp/$OutputDir

4. Make the deployment script executable:
   chmod +x deploy.sh

5. Run the deployment:
   ./deploy.sh

### Option 2: Manual Deployment
1. Import database:
   sudo -u postgres psql -d orgill -f flipbook_database.sql

2. Copy images:
   sudo cp -r uploads/* /var/www/supplymecorp_Backend/uploads/
   sudo chown -R www-data:www-data /var/www/supplymecorp_Backend/uploads
   sudo chmod -R 755 /var/www/supplymecorp_Backend/uploads

3. Restart backend:
   sudo systemctl restart supplymecorp-backend

4. Clear cache (optional):
   redis-cli FLUSHDB

## Verification
- Test API: http://your-domain.com/api/flipbooks/featured/current
- Check logs: sudo journalctl -u supplymecorp-backend -f
- Verify images load: http://your-domain.com/uploads/flipbooks/{flipbook-id}/page-1.webp

## Database Statistics
"@ + (if ($flipbooks) { "- Flipbooks: $($flipbooks.Count)`n" } else { "" }) +
     (if ($pages) { "- Pages: $($pages.Count)`n" } else { "" }) +
     (if ($hotspots) { "- Hotspots: $($hotspots.Count)`n" } else { "" })

$readme | Out-File -FilePath "$OutputDir/README.md" -Encoding UTF8
Write-Host "      ✓ Created: README.md" -ForegroundColor $ColorSuccess

# Step 4: Create archive
Write-Host "`n[5/5] Creating deployment archive..." -ForegroundColor $ColorInfo
$archivePath = "$OutputDir.zip"
if (Test-Path $archivePath) {
    Remove-Item $archivePath -Force
}
Compress-Archive -Path $OutputDir -DestinationPath $archivePath -CompressionLevel Optimal
$archiveSize = [math]::Round((Get-Item $archivePath).Length / 1MB, 2)
Write-Host "      ✓ Created archive: $archivePath ($archiveSize MB)" -ForegroundColor $ColorSuccess

# Summary
Write-Host "`n========================================" -ForegroundColor $ColorSuccess
Write-Host "  EXPORT COMPLETE!" -ForegroundColor $ColorSuccess
Write-Host "========================================`n" -ForegroundColor $ColorSuccess

Write-Host "Package Location:" -ForegroundColor $ColorInfo
Write-Host "  Folder: $OutputDir" -ForegroundColor White
Write-Host "  Archive: $archivePath ($archiveSize MB)" -ForegroundColor White

Write-Host "`nContents:" -ForegroundColor $ColorInfo
if ($flipbooks) { Write-Host "  ✓ Flipbooks: $($flipbooks.Count)" -ForegroundColor White }
if ($pages) { Write-Host "  ✓ Pages: $($pages.Count)" -ForegroundColor White }
if ($hotspots) { Write-Host "  ✓ Hotspots: $($hotspots.Count)" -ForegroundColor White }

Write-Host "`nNext Steps:" -ForegroundColor $ColorInfo
Write-Host "  1. Upload to server:" -ForegroundColor White
Write-Host "     scp $archivePath root@your-server:/tmp/" -ForegroundColor Gray
Write-Host "`n  2. Extract and deploy:" -ForegroundColor White
Write-Host "     ssh root@your-server" -ForegroundColor Gray
Write-Host "     cd /tmp && unzip $archivePath" -ForegroundColor Gray
Write-Host "     cd $OutputDir && chmod +x deploy.sh && ./deploy.sh" -ForegroundColor Gray

Write-Host "`n  See README.md for detailed instructions`n" -ForegroundColor Yellow
