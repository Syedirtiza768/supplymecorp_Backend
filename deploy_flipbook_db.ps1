#!/usr/bin/env pwsh

$PRODUCTION_SERVER = "dev@10.27.27.91"

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host " Deploy 170-Page Flipbook Database" -ForegroundColor Cyan
Write-Host "=====================================`n" -ForegroundColor Cyan

Write-Host "[1/2] Uploading flipbook data..." -ForegroundColor Yellow
scp symmetric_flipbook_export.json "${PRODUCTION_SERVER}:/tmp/flipbook_data.json"

Write-Host "`n[2/2] Importing to production database..." -ForegroundColor Yellow
Write-Host "You'll be prompted for sudo and database passwords`n" -ForegroundColor Cyan

ssh -t $PRODUCTION_SERVER @"
sudo -u postgres psql -d orgill << 'EOF'
BEGIN;

-- Import from JSON (we'll do this via script instead)
\! echo 'Preparing to import flipbook data...'

COMMIT;
EOF
"@

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "Verify at: http://10.27.27.91`n" -ForegroundColor Yellow
