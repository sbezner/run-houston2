-- Migration: Fix race table constraints for API compatibility
-- Date: 2025-08-15

-- Make start_time optional (was NOT NULL)
ALTER TABLE races ALTER COLUMN start_time DROP NOT NULL;

-- Make official_website_url optional (was NOT NULL) 
ALTER TABLE races ALTER COLUMN official_website_url DROP NOT NULL;

-- Make distance_categories optional (was NOT NULL)
ALTER TABLE races ALTER COLUMN distance_categories DROP NOT NULL;

-- Add default value for distance_categories
ALTER TABLE races ALTER COLUMN distance_categories SET DEFAULT ARRAY['5K'];

-- Add comment explaining the changes
COMMENT ON COLUMN races.start_time IS 'Race start time (optional)';
COMMENT ON COLUMN races.official_website_url IS 'Official race website (optional)';
COMMENT ON COLUMN races.distance_categories IS 'Available race distances (defaults to 5K)';
