# Test Category Counts Feature
# Run this script to test the admin endpoints

$baseUrl = "http://localhost:3000/api/products"

Write-Host "🔍 Testing Category Counts Feature" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Get current category counts (public endpoint)
Write-Host "1️⃣  Testing public endpoint (GET /filters/specific-categories/counts)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/filters/specific-categories/counts" -Method Get
    Write-Host "✅ Success! Category counts:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Get detailed category info (admin endpoint)
Write-Host "2️⃣  Testing admin details endpoint (GET /filters/specific-categories/details)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/filters/specific-categories/details" -Method Get
    Write-Host "✅ Success! Detailed info:" -ForegroundColor Green
    $response | Select-Object categoryName, itemCount, updatedAt, isCalculating | Format-Table -AutoSize
    Write-Host ""
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Recalculate single category (Tools as example)
Write-Host "3️⃣  Testing single category recalculation (POST /admin/recalculate-category)" -ForegroundColor Yellow
Write-Host "   Recalculating 'Tools' category..." -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/recalculate-category?categoryName=Tools" -Method Post
    Write-Host "✅ Success!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 4: Clear image cache
Write-Host "4️⃣  Testing clear image cache (POST /admin/clear-image-cache)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/clear-image-cache" -Method Post
    Write-Host "✅ Success! $($response.message)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Optional: Full recalculation (commented out - takes time)
# Uncomment to test full recalculation
<#
Write-Host "5️⃣  Testing full recalculation (POST /admin/recalculate-categories)" -ForegroundColor Yellow
Write-Host "   ⚠️  This will take several minutes..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/recalculate-categories" -Method Post -TimeoutSec 600
    Write-Host "✅ Success! All categories recalculated" -ForegroundColor Green
    $response.results | Select-Object categoryName, finalCount, @{Name='Notes';Expression={$_.notes -join '; '}} | Format-Table -AutoSize
    Write-Host ""
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}
#>

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✅ Tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run the migration: psql -U supplyme_user -d orgill -f migrations/create_category_counts_table.sql"
Write-Host "  2. Trigger full recalculation: Invoke-RestMethod -Uri '$baseUrl/admin/recalculate-categories' -Method Post"
Write-Host "  3. Check results in frontend: http://localhost:3001/"
Write-Host ""
