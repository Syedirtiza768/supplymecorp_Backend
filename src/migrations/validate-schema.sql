-- Check if required columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'orgill_products' 
AND column_name IN ('created_at', 'view_count', 'featured')
ORDER BY column_name;

-- Check sample data
SELECT sku, "brand-name", created_at, view_count, featured
FROM orgill_products
LIMIT 5;
