-- Migration: Update content_md constraint
-- Date: 2025-01-XX
-- Description: Change content_md minimum length from 10 to 1 characters

-- Drop the existing constraint
ALTER TABLE race_reports DROP CONSTRAINT race_reports_content_md_check;

-- Add the new constraint
ALTER TABLE race_reports ADD CONSTRAINT race_reports_content_md_check 
    CHECK (char_length(content_md) BETWEEN 1 AND 20000);

-- Add comment for documentation
COMMENT ON COLUMN race_reports.content_md IS 'Markdown content of the race report (1-20,000 characters)';
