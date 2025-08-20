-- Migration: Remove unnecessary fields from races table
-- Drops: price_min, price_max, registration_url, source

-- Drop the columns
ALTER TABLE races DROP COLUMN IF EXISTS price_min;
ALTER TABLE races DROP COLUMN IF EXISTS price_max;
ALTER TABLE races DROP COLUMN IF EXISTS registration_url;
ALTER TABLE races DROP COLUMN IF EXISTS source;

-- Rollback migration (uncomment to rollback):
-- ALTER TABLE races ADD COLUMN price_min NUMERIC;
-- ALTER TABLE races ADD COLUMN price_max NUMERIC;
-- ALTER TABLE races ADD COLUMN registration_url TEXT;
-- ALTER TABLE races ADD COLUMN source TEXT DEFAULT 'manual';
