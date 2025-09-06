-- Migration: Remove title unique constraint
-- Date: 2025-01-XX
-- Description: Remove unique constraint on race_id + lower(title) to allow duplicate titles

-- Drop the existing unique constraint
ALTER TABLE race_reports DROP CONSTRAINT race_reports_race_title_unique;

-- Add comment for documentation
COMMENT ON TABLE race_reports IS 'Race reports table - allows duplicate titles per race';
