#!/bin/bash
# Production Diagnostic Script
# Run this on your production server to diagnose the issues

echo "🔍 SupplyMe Production Diagnostics"
echo "=================================="
echo ""

# Check if backend is running
echo "1️⃣ Checking Backend Status..."
if pm2 list | grep -q "supplyme-backend"; then
    echo "✅ Backend is running"
    pm2 info supplyme-backend | grep -E "status|uptime|restarts"
else
    echo "❌ Backend is NOT running"
fi
echo ""

# Check if frontend is running
echo "2️⃣ Checking Frontend Status..."
if pm2 list | grep -q "supplyme-frontend"; then
    echo "✅ Frontend is running"
    pm2 info supplyme-frontend | grep -E "status|uptime|restarts"
else
    echo "❌ Frontend is NOT running"
fi
echo ""

# Test backend API endpoints
echo "3️⃣ Testing Backend API Endpoints..."
echo "Most Viewed Products:"
curl -s http://localhost:3000/api/products/most-viewed?limit=2 | jq -r '.[] | "  SKU: \(.id), Price: \(.price // "NULL"), Title: \(.onlineTitleDescription[:60])..."' 2>/dev/null || echo "❌ Failed to fetch most viewed products"
echo ""

echo "New Products:"
curl -s http://localhost:3000/api/products/new?limit=2 | jq -r '.[] | "  SKU: \(.id), Price: \(.price // "NULL"), Title: \(.onlineTitleDescription[:60])..."' 2>/dev/null || echo "❌ Failed to fetch new products"
echo ""

echo "Featured Products:"
curl -s http://localhost:3000/api/products/featured?limit=2 | jq -r '.[] | "  SKU: \(.id), Price: \(.price // "NULL"), Title: \(.onlineTitleDescription[:60])..."' 2>/dev/null || echo "❌ Failed to fetch featured products"
echo ""

# Check NCR Counterpoint API accessibility
echo "4️⃣ Testing NCR Counterpoint API Access..."
if curl -s -o /dev/null -w "%{http_code}" https://utility.rrgeneralsupply.com/Item/7520653 | grep -q "200"; then
    echo "✅ NCR Counterpoint API is accessible"
else
    echo "❌ NCR Counterpoint API is NOT accessible from this server"
    echo "   This is why prices are showing as NULL!"
fi
echo ""

# Check featured flipbook hotspots
echo "5️⃣ Checking Featured Flipbook Hotspots..."
FEATURED_ID=$(curl -s http://localhost:3000/api/flipbooks/featured/current | jq -r '.id' 2>/dev/null)
if [ ! -z "$FEATURED_ID" ] && [ "$FEATURED_ID" != "null" ]; then
    echo "Featured Flipbook ID: $FEATURED_ID"
    
    # Get first 3 pages
    PAGES=$(curl -s "http://localhost:3000/api/flipbooks/${FEATURED_ID}/pages" | jq -r '.[0:3][] | .pageNumber' 2>/dev/null)
    
    for PAGE in $PAGES; do
        HOTSPOT_COUNT=$(curl -s "http://localhost:3000/api/flipbooks/${FEATURED_ID}/pages/${PAGE}/hotspots" | jq '. | length' 2>/dev/null)
        echo "  Page $PAGE: $HOTSPOT_COUNT hotspots"
        
        # Show sample hotspot
        curl -s "http://localhost:3000/api/flipbooks/${FEATURED_ID}/pages/${PAGE}/hotspots" | jq -r '.[0] | "    Sample: linkUrl=\(.linkUrl // "NONE"), productSku=\(.productSku // "NONE")"' 2>/dev/null
    done
else
    echo "❌ No featured flipbook found"
fi
echo ""

# Check environment variables
echo "6️⃣ Checking Backend Environment Variables..."
cd /var/www/supplymecorp_Backend 2>/dev/null || cd ~/supplymecorp_Backend 2>/dev/null || echo "❌ Cannot find backend directory"

if [ -f .env ]; then
    echo "Environment file exists"
    echo "  COUNTERPOINT_BASE: $(grep COUNTERPOINT_BASE .env | cut -d'=' -f2)"
    echo "  COUNTERPOINT_API_KEY: $(grep COUNTERPOINT_API_KEY .env | wc -c) characters"
    echo "  DB_HOST: $(grep DB_HOST .env | cut -d'=' -f2)"
    echo "  DB_PASS: $(grep DB_PASS .env | wc -c) characters"
else
    echo "❌ .env file not found!"
fi
echo ""

# Check backend logs for errors
echo "7️⃣ Recent Backend Errors (last 20 lines)..."
pm2 logs supplyme-backend --lines 20 --nostream --err 2>/dev/null | tail -20
echo ""

echo "=================================="
echo "✅ Diagnostic complete!"
echo ""
echo "📋 Action Items:"
echo "1. If NCR API is not accessible, check firewall rules"
echo "2. If prices are NULL, verify COUNTERPOINT_* env vars"
echo "3. If hotspots are 0, check database or re-upload flipbook"
echo "4. Check pm2 logs for detailed error messages"
