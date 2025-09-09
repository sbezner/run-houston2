-- Migration: Remove unused price and registration fields
-- Date: 2025-08-22

-- Remove unused columns that have no data
ALTER TABLE races DROP COLUMN IF EXISTS price_min;
ALTER TABLE races DROP COLUMN IF EXISTS price_max;
ALTER TABLE races DROP COLUMN IF EXISTS registration_url;

-- These fields were empty (0/9 races had values) and not used by the API
-- Removing them simplifies the schema and API response
