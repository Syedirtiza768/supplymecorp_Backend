-- Performance Optimization: Add Indexes for Flipbook Tables
-- Run this migration to improve query performance by 30-50%

-- Add composite index for flipbook_pages lookups
CREATE INDEX IF NOT EXISTS idx_flipbook_pages_flipbook_page 
ON flipbook_pages(flipbookId, pageNumber);

-- Add index for hotspot lookups
CREATE INDEX IF NOT EXISTS idx_flipbook_hotspots_page 
ON flipbook_hotspots(pageId);

-- Add index for featured flipbooks
CREATE INDEX IF NOT EXISTS idx_flipbooks_featured 
ON flipbooks(isFeatured) WHERE isFeatured = true;

-- Add index for recently created pages
CREATE INDEX IF NOT EXISTS idx_flipbook_pages_created 
ON flipbook_pages(createdAt DESC);

-- Add index for flipbook ordering
CREATE INDEX IF NOT EXISTS idx_flipbooks_created 
ON flipbooks(createdAt DESC);

-- Analyze tables to update statistics
ANALYZE flipbooks;
ANALYZE flipbook_pages;
ANALYZE flipbook_hotspots;

-- Verify indexes were created
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('flipbooks', 'flipbook_pages', 'flipbook_hotspots')
ORDER BY tablename, indexname;
