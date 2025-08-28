-- Migration: Add race_name column to race_reports table
-- Date: 2025-01-27
-- Description: Add race_name column to store race name directly in reports

-- Add race_name column
ALTER TABLE race_reports ADD COLUMN race_name TEXT;

-- Update existing reports with race_id to copy over race names
UPDATE race_reports 
SET race_name = (
    SELECT r.name 
    FROM races r 
    WHERE r.id = race_reports.race_id
)
WHERE race_id IS NOT NULL;

-- Set default race_name for orphaned reports
UPDATE race_reports 
SET race_name = 'No Race' 
WHERE race_id IS NULL AND race_name IS NULL;

-- Make race_name NOT NULL after populating
ALTER TABLE race_reports ALTER COLUMN race_name SET NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN race_reports.race_name IS 'Name of the race. Can be edited independently of the linked race.';
