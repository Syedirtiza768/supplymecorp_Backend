-- Update flipbook hotspot URLs from localhost to production domain
-- This script updates all linkUrl values that contain localhost:3001 to use the correct production URL

-- First, let's see what we have
SELECT COUNT(*) as total_hotspots, 
       COUNT(CASE WHEN linkUrl LIKE '%localhost%' THEN 1 END) as localhost_count,
       COUNT(CASE WHEN linkUrl LIKE '/shop/%' THEN 1 END) as relative_path_count
FROM flipbook_hotspots;

-- Update localhost URLs to production domain
UPDATE flipbook_hotspots 
SET linkUrl = REPLACE(linkUrl, 'http://localhost:3001', 'https://dev.rrgeneralsupply.com')
WHERE linkUrl LIKE '%localhost:3001%';

-- Update relative URLs to absolute URLs with the production domain
UPDATE flipbook_hotspots 
SET linkUrl = 'https://dev.rrgeneralsupply.com' || linkUrl
WHERE linkUrl LIKE '/shop/%' 
  AND linkUrl NOT LIKE 'http%';

-- Verify the changes
SELECT linkUrl, COUNT(*) as count
FROM flipbook_hotspots
GROUP BY linkUrl
ORDER BY count DESC
LIMIT 10;
