# Category Counts Feature - Admin Guide

## Overview
Category counts are now **pre-calculated and cached** in the database for instant response times. The system validates items against NCR Counterpoint and checks image availability before counting them.

## Architecture

### Data Flow:
1. **Orgill Products Table** → All catalog items with category info
2. **NCR Counterpoint API** → Validates item availability (`IS_ECOMM_ITEM = 'Y'`)
3. **Image Validation** → Checks if image URLs return valid responses (not 404)
4. **Category Counts Table** → Stores pre-calculated results

### Database Table: `category_counts`
```sql
categoryName             VARCHAR(100) PRIMARY KEY
itemCount                INTEGER      -- Final count (available items with valid images)
totalInOrgill            INTEGER      -- Total items in orgill_products
availableInCounterpoint  INTEGER      -- Items available in Counterpoint
withValidImages          INTEGER      -- Items with valid images
calculationNotes         TEXT         -- Details about calculation
createdAt                TIMESTAMPTZ
updatedAt                TIMESTAMPTZ
isCalculating            BOOLEAN      -- Prevents concurrent calculations
```

## Setup

### 1. Run the Migration
```bash
cd d:\supplyme\supplymecorp_Backend
psql -U supplyme_user -d orgill -f migrations/create_category_counts_table.sql
```

### 2. Initial Calculation
After the migration, trigger the first calculation:
```bash
curl -X POST http://localhost:3000/api/products/admin/recalculate-categories
```

This will:
- Query all items per category from `orgill_products`
- Check each SKU against NCR Counterpoint API
- Validate image URLs
- Store results in `category_counts` table

**Expected time:** 5-15 minutes for all 16 categories (depending on item count)

## API Endpoints

### Public Endpoint (Fast - reads from cache)
```
GET /api/products/filters/specific-categories/counts
```
Returns:
```json
{
  "Building": 245,
  "Materials": 189,
  "Tools": 512,
  ...
}
```

### Admin Endpoints

#### 1. Get Detailed Category Info
```
GET /api/products/filters/specific-categories/details
```
Returns full details including calculation timestamps and breakdown:
```json
[
  {
    "categoryName": "Tools",
    "itemCount": 512,
    "totalInOrgill": 687,
    "availableInCounterpoint": 589,
    "withValidImages": 512,
    "calculationNotes": "Found 687 items in Orgill; 589 items available in Counterpoint; 512 items with valid images",
    "updatedAt": "2026-01-10T15:30:00Z",
    "isCalculating": false
  },
  ...
]
```

#### 2. Recalculate All Categories
```
POST /api/products/admin/recalculate-categories
```
Triggers full recalculation of all 16 categories.

**Use when:**
- New products added to Orgill
- Counterpoint inventory updated
- Image URLs changed

#### 3. Recalculate Single Category
```
POST /api/products/admin/recalculate-category/:categoryName
```
Example:
```bash
curl -X POST "http://localhost:3000/api/products/admin/recalculate-category?categoryName=Tools"
```

#### 4. Clear Image Cache
```
POST /api/products/admin/clear-image-cache
```
Clears the in-memory image validation cache. Useful when image URLs are updated.

## How It Works

### Validation Pipeline:
```
For each category:
  1. Query orgill_products WHERE category-title-description ILIKE '%CategoryName%'
  2. For each SKU (batched, 10 at a time):
     - Call NCR Counterpoint API: GET /Item/{SKU}
     - Check if IS_ECOMM_ITEM === 'Y'
  3. For each available item (batched, 20 at a time):
     - HEAD request to image URL
     - Check if response is 200 OK
  4. Count items passing both checks
  5. Save to category_counts table
```

### Performance Optimizations:
- **Batching:** Processes items in batches to avoid overwhelming APIs
- **Caching:** Image validation results cached for 6 hours
- **Rate Limiting:** Small delays between batches
- **Parallel Processing:** Multiple items checked simultaneously within batches

## Monitoring & Maintenance

### Check Calculation Status
```sql
SELECT 
  "categoryName", 
  "itemCount", 
  "updatedAt",
  "isCalculating"
FROM category_counts
ORDER BY "updatedAt" DESC;
```

### Recommended Update Schedule:
- **Daily:** Automated recalculation (off-peak hours)
- **On-demand:** When bulk product updates occur
- **Manual:** When image URLs are updated

### Setting Up Automated Updates (Optional)
You can use a cron job or scheduled task to trigger recalculation:

**Linux/Mac (crontab):**
```bash
# Run every day at 2 AM
0 2 * * * curl -X POST http://localhost:3000/api/products/admin/recalculate-categories
```

**Windows (Task Scheduler):**
```powershell
# PowerShell script
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/products/admin/recalculate-categories" -Method Post
Write-Host "Category counts updated: $($response.message)"
```

## Troubleshooting

### Issue: Counts seem low
**Check:**
1. Are items marked as `IS_ECOMM_ITEM = 'Y'` in Counterpoint?
2. Are image URLs valid and accessible?
3. Review `calculationNotes` in the database

### Issue: Calculation takes too long
**Solutions:**
- Reduce batch sizes in the service
- Increase API timeout settings
- Check Counterpoint API performance

### Issue: Some categories showing 0
**Check:**
- Category name mapping in `orgill.repository.ts`
- `category-title-description` field in orgill_products
- Run detailed query to see what's in the database

## Example Queries

### See category breakdown:
```sql
SELECT 
  "categoryName",
  "totalInOrgill" AS "In Catalog",
  "availableInCounterpoint" AS "Available",
  "withValidImages" AS "With Images",
  "itemCount" AS "Final Count",
  "updatedAt"
FROM category_counts
ORDER BY "itemCount" DESC;
```

### Find categories needing update:
```sql
SELECT "categoryName", "updatedAt"
FROM category_counts
WHERE "updatedAt" < NOW() - INTERVAL '24 hours'
OR "isCalculating" = true;
```
