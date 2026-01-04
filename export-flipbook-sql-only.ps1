#!/usr/bin/env pwsh
# Export Flipbook Database (SQL Only)

param(
    [string]$FlipbookId = "2025-26-Fall-Winter-Catalogue",
    [string]$OutputFile = "flipbook_export_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
)

# Database configuration
$PSQL_PATH = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "orgill"
$DB_USER = "postgres"
$DB_PASSWORD = "global321"

Write-Host "`n========================================"
Write-Host "  FLIPBOOK SQL EXPORT"
Write-Host "========================================`n"

# Set PostgreSQL password
$env:PGPASSWORD = $DB_PASSWORD

# Create SQL file header
$sqlContent = @"
-- Flipbook Database Export
-- Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- FlipbookId: $FlipbookId
-- Database: $DB_NAME

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- ============================================
-- CREATE TABLES (if not exist)
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
    CONSTRAINT "UQ_flipbook_page" UNIQUE ("flipbookId", "pageNumber"),
    CONSTRAINT "FK_flipbook_pages_flipbook" FOREIGN KEY ("flipbookId") REFERENCES flipbooks(id) ON DELETE CASCADE
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
    CONSTRAINT "PK_flipbook_hotspots" PRIMARY KEY (id),
    CONSTRAINT "FK_flipbook_hotspots_page" FOREIGN KEY ("pageId") REFERENCES flipbook_pages(id) ON DELETE CASCADE
);

-- ============================================
-- INSERT DATA
-- ============================================

"@

Write-Host "[1/3] Exporting flipbooks..." -ForegroundColor Cyan

# Export flipbooks as JSON, then convert to SQL
$flipbookJson = & $PSQL_PATH -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "SELECT row_to_json(f) FROM (SELECT * FROM flipbooks WHERE id = '$FlipbookId') f"

if ($flipbookJson) {
    $flipbook = $flipbookJson | ConvertFrom-Json
    $title = $flipbook.title -replace "'", "''"
    $desc = if ($flipbook.description) { "'$($flipbook.description -replace "'", "''")'" } else { "NULL" }
    
    $sqlContent += "INSERT INTO flipbooks (id, title, description, `"isFeatured`", `"createdAt`", `"updatedAt`") VALUES "
    $sqlContent += "('$($flipbook.id)', '$title', $desc, $($flipbook.isFeatured.ToString().ToLower()), '$($flipbook.createdAt)', '$($flipbook.updatedAt)')"
    $sqlContent += " ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, `"isFeatured`" = EXCLUDED.`"isFeatured`", `"updatedAt`" = EXCLUDED.`"updatedAt`";`n`n"
    
    Write-Host "      Exported: 1 flipbook" -ForegroundColor Green
}

Write-Host "[2/3] Exporting pages..." -ForegroundColor Cyan

# Export pages
$pagesJson = & $PSQL_PATH -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "SELECT json_agg(p) FROM (SELECT * FROM flipbook_pages WHERE \`"flipbookId\`" = '$FlipbookId' ORDER BY \`"pageNumber\`") p"

if ($pagesJson -and $pagesJson -ne "null") {
    $pages = $pagesJson | ConvertFrom-Json
    
    foreach ($page in $pages) {
        $imageUrl = $page.imageUrl -replace "'", "''"
        $meta = if ($page.meta) { "'$($page.meta | ConvertTo-Json -Compress -Depth 10 | ForEach-Object { $_ -replace "'", "''" })'" } else { "NULL" }
        
        $sqlContent += "INSERT INTO flipbook_pages (id, `"flipbookId`", `"pageNumber`", `"imageUrl`", meta, `"createdAt`", `"updatedAt`") VALUES "
        $sqlContent += "('$($page.id)', '$($page.flipbookId)', $($page.pageNumber), '$imageUrl', $meta, '$($page.createdAt)', '$($page.updatedAt)')"
        $sqlContent += " ON CONFLICT (`"flipbookId`", `"pageNumber`") DO UPDATE SET id = EXCLUDED.id, `"imageUrl`" = EXCLUDED.`"imageUrl`", meta = EXCLUDED.meta, `"updatedAt`" = EXCLUDED.`"updatedAt`";`n"
    }
    
    $sqlContent += "`n"
    Write-Host "      Exported: $($pages.Count) pages" -ForegroundColor Green
}

Write-Host "[3/3] Exporting hotspots..." -ForegroundColor Cyan

# Export hotspots
$hotspotsJson = & $PSQL_PATH -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -c "SELECT json_agg(h) FROM (SELECT h.* FROM flipbook_hotspots h JOIN flipbook_pages p ON h.\`"pageId\`" = p.id WHERE p.\`"flipbookId\`" = '$FlipbookId') h"

if ($hotspotsJson -and $hotspotsJson -ne "null") {
    $hotspots = $hotspotsJson | ConvertFrom-Json
    
    foreach ($hotspot in $hotspots) {
        $productSku = if ($hotspot.productSku) { "'$($hotspot.productSku -replace "'", "''")'" } else { "NULL" }
        $label = if ($hotspot.label) { "'$($hotspot.label -replace "'", "''")'" } else { "NULL" }
        $linkUrl = if ($hotspot.linkUrl) { "'$($hotspot.linkUrl -replace "'", "''")'" } else { "NULL" }
        
        $sqlContent += "INSERT INTO flipbook_hotspots (id, `"pageId`", `"productSku`", x, y, width, height, label, `"linkUrl`", `"zIndex`", `"createdAt`", `"updatedAt`") VALUES "
        $sqlContent += "('$($hotspot.id)', '$($hotspot.pageId)', $productSku, $($hotspot.x), $($hotspot.y), $($hotspot.width), $($hotspot.height), $label, $linkUrl, $($hotspot.zIndex), '$($hotspot.createdAt)', '$($hotspot.updatedAt)')"
        $sqlContent += " ON CONFLICT (id) DO UPDATE SET `"productSku`" = EXCLUDED.`"productSku`", x = EXCLUDED.x, y = EXCLUDED.y, width = EXCLUDED.width, height = EXCLUDED.height, label = EXCLUDED.label, `"linkUrl`" = EXCLUDED.`"linkUrl`", `"zIndex`" = EXCLUDED.`"zIndex`", `"updatedAt`" = EXCLUDED.`"updatedAt`";`n"
    }
    
    Write-Host "      Exported: $($hotspots.Count) hotspots" -ForegroundColor Green
}

# Write to file
$sqlContent | Out-File -FilePath $OutputFile -Encoding UTF8

$fileSize = [math]::Round((Get-Item $OutputFile).Length / 1KB, 2)

Write-Host "`n========================================"  -ForegroundColor Green
Write-Host "  EXPORT COMPLETE!"  -ForegroundColor Green
Write-Host "========================================`n"  -ForegroundColor Green

Write-Host "SQL File: $OutputFile ($fileSize KB)`n" -ForegroundColor White

Write-Host "To deploy on production server:" -ForegroundColor Cyan
Write-Host "  1. Copy to server:" -ForegroundColor White
Write-Host "     scp $OutputFile root@your-server:/tmp/`n" -ForegroundColor Gray

Write-Host "  2. Import database:" -ForegroundColor White
Write-Host "     ssh root@your-server" -ForegroundColor Gray
Write-Host "     sudo -u postgres psql -d orgill -f /tmp/$OutputFile`n" -ForegroundColor Gray

Write-Host "  3. Restart backend:" -ForegroundColor White
Write-Host "     sudo systemctl restart supplymecorp-backend`n" -ForegroundColor Gray

Write-Host "  4. Verify:" -ForegroundColor White
Write-Host "     curl http://localhost:3000/api/flipbooks/featured/current`n" -ForegroundColor Gray
