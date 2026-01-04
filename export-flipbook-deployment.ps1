#!/usr/bin/env pwsh
# Export Complete Flipbook Database + Images for Production Deployment

param(
    [string]$FlipbookId = "2025-26-Fall-Winter-Catalogue",
    [string]$OutputDir = "flipbook-deployment-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
)

# Database configuration
$PSQL_PATH = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "orgill"
$DB_USER = "postgres"
$DB_PASSWORD = "global321"

Write-Host "`n========================================"
Write-Host "  FLIPBOOK DEPLOYMENT PACKAGE EXPORTER"
Write-Host "========================================`n"

# Create output directory
Write-Host "[1/4] Creating deployment directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
Write-Host "      Created: $OutputDir`n" -ForegroundColor Green

# Set PostgreSQL password
$env:PGPASSWORD = $DB_PASSWORD

# Step 1: Export database using psql
Write-Host "[2/4] Exporting database tables..." -ForegroundColor Cyan
$SQL_FILE = "$OutputDir/flipbook_database.sql"

try {
    # Create SQL dump file
    $sqlHeader = @"
-- Flipbook Database Export
-- Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Database: $DB_NAME
-- FlipbookId: $FlipbookId

SET client_encoding = 'UTF8';

-- Drop existing tables if they exist
DROP TABLE IF EXISTS flipbook_hotspots CASCADE;
DROP TABLE IF EXISTS flipbook_pages CASCADE;
DROP TABLE IF EXISTS flipbooks CASCADE;

-- Create flipbooks table
CREATE TABLE flipbooks (
    id character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    "isFeatured" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "PK_flipbooks" PRIMARY KEY (id)
);

-- Create flipbook_pages table
CREATE TABLE flipbook_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "flipbookId" character varying NOT NULL,
    "pageNumber" integer NOT NULL,
    "imageUrl" character varying NOT NULL,
    meta jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT "PK_flipbook_pages" PRIMARY KEY (id),
    CONSTRAINT "UQ_flipbook_page" UNIQUE ("flipbookId", "pageNumber"),
    CONSTRAINT "FK_flipbook_pages_flipbook" FOREIGN KEY ("flipbookId") REFERENCES flipbooks(id) ON DELETE CASCADE
);

-- Create flipbook_hotspots table
CREATE TABLE flipbook_hotspots (
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
    CONSTRAINT "PK_flipbook_hotspots" PRIMARY KEY (id),
    CONSTRAINT "FK_flipbook_hotspots_page" FOREIGN KEY ("pageId") REFERENCES flipbook_pages(id) ON DELETE CASCADE
);

"@

    $sqlHeader | Out-File -FilePath $SQL_FILE -Encoding UTF8
    
    # Export flipbooks data
    Write-Host "      Exporting flipbooks..." -ForegroundColor Gray
    $query = "COPY (SELECT * FROM flipbooks WHERE id = '$FlipbookId') TO STDOUT WITH (FORMAT text, DELIMITER '|', NULL 'NULL')"
    $flipbookData = & $PSQL_PATH -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $query
    
    if ($flipbookData) {
        $flipbookData | ForEach-Object {
            $fields = $_ -split '\|'
            $insertSQL = "INSERT INTO flipbooks (id, title, description, `"isFeatured`", `"createdAt`", `"updatedAt`") VALUES ('$($fields[0])', '$($fields[1] -replace "'", "''")', "
            if ($fields[2] -eq 'NULL') { $insertSQL += "NULL, " } else { $insertSQL += "'$($fields[2] -replace "'", "''")', " }
            $insertSQL += "$($fields[3]), '$($fields[4])', '$($fields[5])');"
            $insertSQL | Out-File -FilePath $SQL_FILE -Encoding UTF8 -Append
        }
        Write-Host "      Flipbooks: $($flipbookData.Count)" -ForegroundColor Green
    }
    
    # Export pages data
    Write-Host "      Exporting pages..." -ForegroundColor Gray
    $query = "COPY (SELECT * FROM flipbook_pages WHERE \`"flipbookId\`" = '$FlipbookId' ORDER BY \`"pageNumber\`") TO STDOUT WITH (FORMAT text, DELIMITER '|', NULL 'NULL')"
    $pagesData = & $PSQL_PATH -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $query
    
    if ($pagesData) {
        $pagesData | ForEach-Object {
            $fields = $_ -split '\|'
            $insertSQL = "INSERT INTO flipbook_pages (id, `"flipbookId`", `"pageNumber`", `"imageUrl`", meta, `"createdAt`", `"updatedAt`") VALUES ('$($fields[0])', '$($fields[1])', $($fields[2]), '$($fields[3])', "
            if ($fields[4] -eq 'NULL') { $insertSQL += "NULL, " } else { $insertSQL += "'$($fields[4] -replace "'", "''")', " }
            $insertSQL += "'$($fields[5])', '$($fields[6])');"
            $insertSQL | Out-File -FilePath $SQL_FILE -Encoding UTF8 -Append
        }
        Write-Host "      Pages: $($pagesData.Count)" -ForegroundColor Green
    }
    
    # Export hotspots data
    Write-Host "      Exporting hotspots..." -ForegroundColor Gray
    $query = "COPY (SELECT h.* FROM flipbook_hotspots h JOIN flipbook_pages p ON h.`"pageId`" = p.id WHERE p.`"flipbookId`" = '$FlipbookId') TO STDOUT WITH (FORMAT text, DELIMITER '|', NULL 'NULL')"
    $hotspotsData = & $PSQL_PATH -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $query
    
    if ($hotspotsData) {
        $hotspotsData | ForEach-Object {
            $fields = $_ -split '\|'
            $insertSQL = "INSERT INTO flipbook_hotspots (id, `"pageId`", `"productSku`", x, y, width, height, label, `"linkUrl`", `"zIndex`", `"createdAt`", `"updatedAt`") VALUES ('$($fields[0])', '$($fields[1])', "
            if ($fields[2] -eq 'NULL') { $insertSQL += "NULL, " } else { $insertSQL += "'$($fields[2])', " }
            $insertSQL += "$($fields[3]), $($fields[4]), $($fields[5]), $($fields[6]), "
            if ($fields[7] -eq 'NULL') { $insertSQL += "NULL, " } else { $insertSQL += "'$($fields[7] -replace "'", "''")', " }
            if ($fields[8] -eq 'NULL') { $insertSQL += "NULL, " } else { $insertSQL += "'$($fields[8] -replace "'", "''")', " }
            $insertSQL += "$($fields[9]), '$($fields[10])', '$($fields[11])');"
            $insertSQL | Out-File -FilePath $SQL_FILE -Encoding UTF8 -Append
        }
        Write-Host "      Hotspots: $($hotspotsData.Count)" -ForegroundColor Green
    }
    
    $fileSize = [math]::Round((Get-Item $SQL_FILE).Length / 1KB, 2)
    Write-Host "      Database exported: $fileSize KB`n" -ForegroundColor Green
    
} catch {
    Write-Host "      Error exporting database: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Copy image files
Write-Host "[3/4] Copying flipbook images..." -ForegroundColor Cyan
$uploadsSource = "uploads\flipbooks\$FlipbookId"
$uploadsDestination = "$OutputDir\uploads\flipbooks"

if (Test-Path $uploadsSource) {
    New-Item -ItemType Directory -Path $uploadsDestination -Force | Out-Null
    Copy-Item -Path $uploadsSource -Destination $uploadsDestination -Recurse -Force
    
    $imageCount = (Get-ChildItem "$uploadsDestination\$FlipbookId" -File -Recurse).Count
    $imageSize = [math]::Round((Get-ChildItem "$uploadsDestination\$FlipbookId" -File -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    
    Write-Host "      Images copied: $imageCount files ($imageSize MB)" -ForegroundColor Green
    Write-Host "      Source: $uploadsSource`n" -ForegroundColor Gray
} else {
    Write-Host "      WARNING: Flipbook images folder not found!" -ForegroundColor Yellow
    Write-Host "      Looking for: $uploadsSource`n" -ForegroundColor Gray
}

# Step 3: Create deployment scripts
Write-Host "[4/4] Creating deployment scripts..." -ForegroundColor Cyan

# Linux deployment script
$deployScriptLinux = @'
#!/bin/bash
echo "================================================"
echo "  FLIPBOOK DEPLOYMENT TO PRODUCTION"
echo "================================================"
echo ""

DB_NAME="orgill"
DB_USER="supplyme_user"
BACKEND_DIR="/var/www/supplymecorp_Backend"

echo "[1/3] Importing database..."
sudo -u postgres psql -d $DB_NAME -f flipbook_database.sql
if [ $? -eq 0 ]; then
    echo "      Database imported successfully"
else
    echo "      ERROR: Database import failed"
    exit 1
fi

echo ""
echo "[2/3] Deploying images..."
if [ -d "uploads" ]; then
    sudo mkdir -p $BACKEND_DIR/uploads
    sudo cp -r uploads/* $BACKEND_DIR/uploads/
    sudo chown -R www-data:www-data $BACKEND_DIR/uploads
    sudo chmod -R 755 $BACKEND_DIR/uploads
    IMAGE_COUNT=$(find uploads -type f | wc -l)
    echo "      Copied $IMAGE_COUNT images"
else
    echo "      WARNING: No uploads folder found"
fi

echo ""
echo "[3/3] Restarting backend service..."
sudo systemctl restart supplymecorp-backend
if [ $? -eq 0 ]; then
    echo "      Backend restarted"
else
    echo "      WARNING: Failed to restart backend"
fi

echo ""
echo "================================================"
echo "  DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "Verification:"
echo "  API: curl http://localhost:3000/api/flipbooks/featured/current"
echo "  Logs: sudo journalctl -u supplymecorp-backend -f"
echo ""
'@

$deployScriptLinux | Out-File -FilePath "$OutputDir/deploy.sh" -Encoding UTF8 -NoNewline
Write-Host "      Created: deploy.sh" -ForegroundColor Green

# README
$readmeContent = @"
# Flipbook Deployment Package
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
FlipbookId: $FlipbookId

## Contents
- **flipbook_database.sql** - Complete database dump (tables + data)
- **uploads/** - Flipbook images (WebP format)
- **deploy.sh** - Automated Linux deployment script
- **README.md** - This file

## Quick Deployment (Ubuntu Server)

### 1. Upload to Server
``````bash
scp -r $OutputDir root@your-server:/tmp/
``````

### 2. Deploy
``````bash
ssh root@your-server
cd /tmp/$OutputDir
chmod +x deploy.sh
./deploy.sh
``````

### 3. Verify
``````bash
curl http://localhost:3000/api/flipbooks/featured/current
``````

## Manual Deployment Steps

### Import Database
``````bash
sudo -u postgres psql -d orgill -f flipbook_database.sql
``````

### Deploy Images
``````bash
sudo cp -r uploads/* /var/www/supplymecorp_Backend/uploads/
sudo chown -R www-data:www-data /var/www/supplymecorp_Backend/uploads
sudo chmod -R 755 /var/www/supplymecorp_Backend/uploads
``````

### Restart Backend
``````bash
sudo systemctl restart supplymecorp-backend
``````

### Clear Cache (Optional)
``````bash
redis-cli FLUSHDB
``````

## Verification Checklist
- [ ] API responds: http://your-domain.com/api/flipbooks/featured/current
- [ ] Images load: http://your-domain.com/uploads/flipbooks/$FlipbookId/page-1.webp
- [ ] Backend logs clean: `sudo journalctl -u supplymecorp-backend -n 50`
- [ ] Flipbook renders on frontend

## Troubleshooting

### Database Import Fails
``````bash
# Check if tables exist
sudo -u postgres psql -d orgill -c "\dt flipbook*"

# Manual import
sudo -u postgres psql -d orgill < flipbook_database.sql
``````

### Images Not Loading
``````bash
# Check permissions
ls -la /var/www/supplymecorp_Backend/uploads/flipbooks/

# Fix permissions
sudo chown -R www-data:www-data /var/www/supplymecorp_Backend/uploads
sudo chmod -R 755 /var/www/supplymecorp_Backend/uploads
``````

### Backend Not Responding
``````bash
# Check status
sudo systemctl status supplymecorp-backend

# View logs
sudo journalctl -u supplymecorp-backend -f

# Restart
sudo systemctl restart supplymecorp-backend
``````
"@

$readmeContent | Out-File -FilePath "$OutputDir/README.md" -Encoding UTF8
Write-Host "      Created: README.md`n" -ForegroundColor Green

# Summary
Write-Host "========================================"  -ForegroundColor Green
Write-Host "  EXPORT COMPLETE!"  -ForegroundColor Green
Write-Host "========================================`n"  -ForegroundColor Green

Write-Host "Package Location: $OutputDir`n" -ForegroundColor White

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Upload to server:" -ForegroundColor White
Write-Host "     scp -r $OutputDir root@your-server:/tmp/`n" -ForegroundColor Gray

Write-Host "  2. Deploy on server:" -ForegroundColor White
Write-Host "     ssh root@your-server" -ForegroundColor Gray
Write-Host "     cd /tmp/$OutputDir" -ForegroundColor Gray
Write-Host "     chmod +x deploy.sh && ./deploy.sh`n" -ForegroundColor Gray

Write-Host "  3. Verify deployment:" -ForegroundColor White
Write-Host "     curl http://localhost:3000/api/flipbooks/featured/current`n" -ForegroundColor Gray

Write-Host "See README.md for detailed instructions and troubleshooting.`n" -ForegroundColor Yellow

# Create ZIP archive
Write-Host "Creating ZIP archive..." -ForegroundColor Cyan
$archivePath = "$OutputDir.zip"
if (Test-Path $archivePath) {
    Remove-Item $archivePath -Force
}
Compress-Archive -Path $OutputDir -DestinationPath $archivePath -CompressionLevel Optimal
$archiveSize = [math]::Round((Get-Item $archivePath).Length / 1MB, 2)
Write-Host "Archive created: $archivePath ($archiveSize MB)`n" -ForegroundColor Green
