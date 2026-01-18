-- Migration to create category_counts table
-- This table stores pre-calculated category counts with Counterpoint availability and image validation

CREATE TABLE IF NOT EXISTS category_counts (
  "categoryName" VARCHAR(100) PRIMARY KEY,
  "itemCount" INTEGER DEFAULT 0 NOT NULL,
  "totalInOrgill" INTEGER DEFAULT 0 NOT NULL,
  "availableInCounterpoint" INTEGER DEFAULT 0 NOT NULL,
  "withValidImages" INTEGER DEFAULT 0 NOT NULL,
  "calculationNotes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "isCalculating" BOOLEAN DEFAULT FALSE NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_category_counts_updated 
ON category_counts("updatedAt" DESC);

-- Initialize with default categories (counts will be 0 until first calculation)
INSERT INTO category_counts ("categoryName") VALUES
  ('Building'),
  ('Materials'),
  ('Tools'),
  ('Hardware'),
  ('Plumbing'),
  ('Electrical'),
  ('Flooring'),
  ('Roofing'),
  ('Gutters'),
  ('Paint'),
  ('Decor'),
  ('Safety'),
  ('Workwear'),
  ('Landscaping'),
  ('Outdoor'),
  ('HVAC')
ON CONFLICT ("categoryName") DO NOTHING;

-- Add comment
COMMENT ON TABLE category_counts IS 'Pre-calculated category counts with Counterpoint availability and image validation';
