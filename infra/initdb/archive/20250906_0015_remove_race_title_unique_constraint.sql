-- Migration: Remove race title unique constraint
-- Date: 2025-01-27
-- Description: Remove the unique constraint on race_id + title to allow multiple reports with same title per race

-- Drop the unique constraint that prevents duplicate titles for the same race
DROP INDEX IF EXISTS race_reports_race_title_unique;

-- Add comment explaining the change
COMMENT ON TABLE race_reports IS 'Stores race reports with markdown content linked to races. Multiple reports can have the same title for the same race.';
