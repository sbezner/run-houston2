-- Migration: Add description field to clubs table
-- Date: 2025-01-27

-- Add description column to clubs table
ALTER TABLE clubs ADD COLUMN description TEXT;

-- Add constraint for description length
ALTER TABLE clubs ADD CONSTRAINT description_len CHECK (description IS NULL OR char_length(description) <= 500);

-- Populate existing clubs with test descriptions
UPDATE clubs SET description = 'A friendly running club for all skill levels in ' || location WHERE description IS NULL;

-- Add sample test data with descriptions
INSERT INTO clubs (club_name, location, website_url, description) VALUES
  ('Sample Running Club', 'Houston, TX', 'https://example.com', 'A friendly running club for all skill levels'),
  ('Test Marathon Club', 'Austin, TX', 'https://test.com', 'Focused on marathon training and long-distance running'),
  ('Speed Training Group', 'Dallas, TX', 'https://speed.com', 'Specialized in speed work and interval training'),
  ('Trail Running Society', 'San Antonio, TX', 'https://trail.com', 'Dedicated to trail running and outdoor adventures')
ON CONFLICT (lower(club_name), COALESCE(lower(location), '')) DO NOTHING;

-- Add comment for the new column
COMMENT ON COLUMN clubs.description IS 'Description of the running club and its activities';
