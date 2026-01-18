-- Add index on EMAIL_ADRS_1 column for faster customer lookups during login
-- This will dramatically improve login performance

-- Create case-insensitive index for email lookups
CREATE INDEX IF NOT EXISTS idx_customers_email_lower 
ON public.customers (LOWER(EMAIL_ADRS_1));

-- Also ensure we have an index on CUST_NO (primary key)
CREATE INDEX IF NOT EXISTS idx_customers_cust_no 
ON public.customers (CUST_NO);

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'customers'
ORDER BY indexname;
