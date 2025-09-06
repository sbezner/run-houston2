-- Migration: Create clubs table for running clubs
-- Date: 2025-01-27

CREATE TABLE IF NOT EXISTS clubs (
  id SERIAL PRIMARY KEY,
  club_name TEXT NOT NULL,
  location TEXT,
  website_url TEXT,
  CONSTRAINT club_name_not_blank CHECK (length(btrim(club_name)) > 0),
  CONSTRAINT club_name_len CHECK (char_length(club_name) BETWEEN 2 AND 200),
  CONSTRAINT location_len CHECK (location IS NULL OR char_length(location) <= 120),
  CONSTRAINT website_len CHECK (website_url IS NULL OR char_length(website_url) <= 2048),
  CONSTRAINT website_protocol CHECK (website_url IS NULL OR website_url ~* '^https?://')
);

CREATE UNIQUE INDEX clubs_uniq_name_location_ci
  ON clubs (lower(club_name), COALESCE(lower(location), ''));

CREATE INDEX clubs_name_search_ci
  ON clubs (lower(club_name));

-- Sample data removed - use seed_data.sql for development data

-- Add comments
COMMENT ON TABLE clubs IS 'Running clubs and organizations';
COMMENT ON COLUMN clubs.club_name IS 'Name of the running club';
COMMENT ON COLUMN clubs.location IS 'City/area where the club is located';
COMMENT ON COLUMN clubs.website_url IS 'Official website URL for the club';
