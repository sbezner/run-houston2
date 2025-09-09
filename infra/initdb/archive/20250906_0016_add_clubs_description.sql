-- Migration: Add description field to clubs table
-- Date: 2025-01-27

-- Add description column to clubs table
ALTER TABLE clubs ADD COLUMN description TEXT;

-- Add constraint for description length
ALTER TABLE clubs ADD CONSTRAINT description_len CHECK (description IS NULL OR char_length(description) <= 500);

-- Sample data removed - use seed_data.sql for development data

-- Add comment for the new column
COMMENT ON COLUMN clubs.description IS 'Description of the running club and its activities';
