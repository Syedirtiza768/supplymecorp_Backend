# Dump Flipbook Tables from PostgreSQL
# Usage: .\dump-flipbook-tables.ps1

# Find pg_dump executable
$PG_DUMP = "pg_dump"
$COMMON_PATHS = @(
    "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe",
    "C:\PostgreSQL\bin\pg_dump.exe"
)

foreach ($path in $COMMON_PATHS) {
    if (Test-Path $path) {
        $PG_DUMP = $path
        break
    }
}

# Database configuration
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "orgill"
$DB_USER = "postgres"

# Prompt for password
$DB_PASSWORD = Read-Host -Prompt "Enter PostgreSQL password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set password environment variable
$env:PGPASSWORD = $PlainPassword

# Output directory
$OUTPUT_DIR = "flipbook-data-export"
if (-not (Test-Path $OUTPUT_DIR)) {
    New-Item -ItemType Directory -Path $OUTPUT_DIR | Out-Null
}

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$OUTPUT_FILE = "$OUTPUT_DIR/flipbook_dump_$TIMESTAMP.sql"

Write-Host "Dumping flipbook tables to $OUTPUT_FILE..." -ForegroundColor Cyan
Write-Host "Using pg_dump: $PG_DUMP" -ForegroundColor Gray

# Dump only flipbook-related tables
$TABLES = @(
    "flipbooks",
    "flipbook_pages",
    "flipbook_hotspots"
)

# Build pg_dump command with table filters
$tableArgs = $TABLES | ForEach-Object { "--table=$_" }

try {
    & $PG_DUMP -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME @tableArgs --inserts -f $OUTPUT_FILE

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dump completed successfully!" -ForegroundColor Green
        Write-Host "Output file: $OUTPUT_FILE" -ForegroundColor Green
        
        # Show file size
        $fileSize = (Get-Item $OUTPUT_FILE).Length / 1KB
        Write-Host "File size: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Cyan
    } else {
        Write-Host "Dump failed with exit code $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
} finally {
    # Clear password from environment
    $env:PGPASSWORD = $null
}
