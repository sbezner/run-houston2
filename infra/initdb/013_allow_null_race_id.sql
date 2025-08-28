-- Migration: Allow null race_id for orphaned race reports
-- Date: 2025-01-27
-- Description: Modify race_reports table to allow null race_id for orphaned reports

-- First, drop the foreign key constraint
ALTER TABLE race_reports DROP CONSTRAINT race_reports_race_id_fkey;

-- Modify race_id column to allow null values
ALTER TABLE race_reports ALTER COLUMN race_id DROP NOT NULL;

-- Note: race_date remains NOT NULL - it's a user-provided field

-- Re-add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE race_reports ADD CONSTRAINT race_reports_race_id_fkey 
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE SET NULL;

-- Update the unique constraint to handle null race_id
-- Drop the existing constraint first
ALTER TABLE race_reports DROP CONSTRAINT race_reports_race_title_unique;

-- Re-add with partial unique constraint that excludes null race_id
CREATE UNIQUE INDEX race_reports_race_title_unique 
    ON race_reports (race_id, lower(title)) 
    WHERE race_id IS NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN race_reports.race_id IS 'References races(id). Can be null for orphaned reports when the referenced race is deleted.';
COMMENT ON COLUMN race_reports.race_date IS 'User-provided date for the race report. Required field independent of race_id.';
