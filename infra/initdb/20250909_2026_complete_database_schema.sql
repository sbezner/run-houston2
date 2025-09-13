-- Complete Database Schema for Run Houston
-- Date: September 9, 2025
-- Purpose: Complete working database schema from scratch
-- Replaces: All individual migration files (0001-0016, 0537, 2026)

-- =============================================
-- EXTENSIONS
-- =============================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to auto-populate geometry from lat/lng
CREATE OR REPLACE FUNCTION set_race_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::GEOGRAPHY;
  ELSE
    NEW.geom := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update race_reports updated_at timestamp
CREATE OR REPLACE FUNCTION update_race_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate distance array values
CREATE OR REPLACE FUNCTION validate_distance_array(distance_array TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM unnest(distance_array) d 
    WHERE d NOT IN ('5k', '10k', 'half marathon', 'marathon', 'ultra', 'other')
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TABLES
-- =============================================

-- Races table
CREATE TABLE races (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    tz TEXT NOT NULL DEFAULT 'America/Chicago',
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geom GEOGRAPHY(POINT, 4326),
    distance TEXT[] DEFAULT ARRAY['5K'],
    surface TEXT,
    kid_run BOOLEAN DEFAULT FALSE,
    official_website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT DEFAULT 'manual'
);

-- Clubs table
CREATE TABLE clubs (
    id SERIAL PRIMARY KEY,
    club_name TEXT NOT NULL,
    location TEXT,
    website_url TEXT,
    description TEXT
);

-- Race reports table
CREATE TABLE race_reports (
    id SERIAL PRIMARY KEY,
    race_id INTEGER,
    race_date DATE NOT NULL,
    title TEXT NOT NULL,
    author_name TEXT,
    content_md TEXT NOT NULL,
    photos TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    race_name TEXT NOT NULL
);

-- Admin users table
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schema migrations table
CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    checksum VARCHAR(255),
    rollback_safe BOOLEAN DEFAULT false
);

-- =============================================
-- CONSTRAINTS
-- =============================================

-- Races table constraints
ALTER TABLE races ADD CONSTRAINT distance_check 
    CHECK (validate_distance_array(distance));

ALTER TABLE races ADD CONSTRAINT races_latlon_pair 
    CHECK (latitude IS NULL AND longitude IS NULL OR 
           latitude IS NOT NULL AND longitude IS NOT NULL);

ALTER TABLE races ADD CONSTRAINT surface_check 
    CHECK (surface = ANY (ARRAY['road', 'trail', 'track', 'virtual', 'other']));

-- Clubs table constraints
ALTER TABLE clubs ADD CONSTRAINT club_name_len 
    CHECK (char_length(club_name) >= 2 AND char_length(club_name) <= 200);

ALTER TABLE clubs ADD CONSTRAINT club_name_not_blank 
    CHECK (length(btrim(club_name)) > 0);

ALTER TABLE clubs ADD CONSTRAINT description_len 
    CHECK (description IS NULL OR char_length(description) <= 500);

ALTER TABLE clubs ADD CONSTRAINT location_len 
    CHECK (location IS NULL OR char_length(location) <= 120);

ALTER TABLE clubs ADD CONSTRAINT website_len 
    CHECK (website_url IS NULL OR char_length(website_url) <= 2048);

ALTER TABLE clubs ADD CONSTRAINT website_protocol 
    CHECK (website_url IS NULL OR website_url ~* '^https?://');

-- Race reports table constraints
ALTER TABLE race_reports ADD CONSTRAINT race_reports_author_name_check 
    CHECK (author_name IS NULL OR 
           (char_length(author_name) >= 2 AND char_length(author_name) <= 80));

ALTER TABLE race_reports ADD CONSTRAINT race_reports_content_md_check 
    CHECK (char_length(content_md) >= 1 AND char_length(content_md) <= 20000);

ALTER TABLE race_reports ADD CONSTRAINT race_reports_title_check 
    CHECK (char_length(title) >= 3 AND char_length(title) <= 120);

-- Foreign key constraints
ALTER TABLE race_reports ADD CONSTRAINT race_reports_race_id_fkey 
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE SET NULL;

-- =============================================
-- INDEXES
-- =============================================

-- Races table indexes
-- Primary key index created automatically with SERIAL PRIMARY KEY

-- Clubs table indexes
-- Primary key index created automatically with SERIAL PRIMARY KEY
CREATE INDEX clubs_name_search_ci ON clubs USING btree (lower(club_name));

-- Race reports table indexes
-- Primary key index created automatically with SERIAL PRIMARY KEY
CREATE INDEX rr_created ON race_reports USING btree (created_at DESC);
CREATE INDEX rr_race_date_created ON race_reports USING btree (race_date DESC, created_at DESC);
CREATE INDEX rr_race_id_created ON race_reports USING btree (race_id, created_at DESC);

-- Admin users table indexes
-- Primary key index created automatically with SERIAL PRIMARY KEY
CREATE UNIQUE INDEX admin_users_username_key ON admin_users USING btree (username);
CREATE INDEX idx_admin_users_username ON admin_users USING btree (username);

-- Schema migrations table indexes
-- Primary key index created automatically with PRIMARY KEY constraint

-- =============================================
-- TRIGGERS
-- =============================================

-- Races table triggers
CREATE TRIGGER races_set_geom 
    BEFORE INSERT OR UPDATE OF latitude, longitude ON races 
    FOR EACH ROW EXECUTE FUNCTION set_race_geom();

-- Race reports table triggers
CREATE TRIGGER race_reports_updated_at_trigger 
    BEFORE UPDATE ON race_reports 
    FOR EACH ROW EXECUTE FUNCTION update_race_reports_updated_at();

-- =============================================
-- COMMENTS
-- =============================================

-- Table comments
COMMENT ON TABLE races IS 'Main race information with geospatial data';
COMMENT ON TABLE clubs IS 'Running clubs and organizations';
COMMENT ON TABLE race_reports IS 'User-submitted race reports with markdown content';
COMMENT ON TABLE admin_users IS 'Admin users for race management system';
COMMENT ON TABLE schema_migrations IS 'Migration tracking table';

-- Column comments
COMMENT ON COLUMN races.start_time IS 'Race start time (optional)';
COMMENT ON COLUMN races.official_website_url IS 'Official race website (optional)';
COMMENT ON COLUMN races.distance IS 'Available race distances (defaults to 5K)';
COMMENT ON COLUMN races.source IS 'Source of the race data (manual, csv_import, web_interface, etc.)';

COMMENT ON COLUMN clubs.club_name IS 'Name of the running club';
COMMENT ON COLUMN clubs.location IS 'City/area where the club is located';
COMMENT ON COLUMN clubs.website_url IS 'Official website URL for the club';
COMMENT ON COLUMN clubs.description IS 'Description of the running club and its activities';

COMMENT ON COLUMN race_reports.race_id IS 'References races(id). Can be null for orphaned reports when the referenced race is deleted.';
COMMENT ON COLUMN race_reports.race_date IS 'User-provided date for the race report. Required field independent of race_id.';
COMMENT ON COLUMN race_reports.content_md IS 'Markdown content of the race report (1-20,000 characters)';
COMMENT ON COLUMN race_reports.photos IS 'Array of absolute URLs to race photos';
COMMENT ON COLUMN race_reports.race_name IS 'Name of the race. Can be edited independently of the linked race.';

COMMENT ON COLUMN admin_users.username IS 'Unique username for admin login';
COMMENT ON COLUMN admin_users.password_hash IS 'Bcrypt hashed password';

-- =============================================
-- ADMIN USER CREATION
-- =============================================

-- Create default admin user for initial setup
-- Username: admin
-- Password: @RunHouston9339
-- IMPORTANT: Change this password after first login!
INSERT INTO admin_users (username, password_hash, created_at, updated_at)
VALUES ('admin', '$2b$12$kD/.f6bbbf3ghpCfNfboKeyrRinJ8xLJrnsCTpeugUE62rbW9wdkG', NOW(), NOW());

-- =============================================
-- MIGRATION RECORD
-- =============================================

-- Record this schema creation in migrations table
INSERT INTO schema_migrations (version, description, rollback_safe)
VALUES ('20250909_2026_complete_database_schema', 'Complete database schema from scratch', true);

-- =============================================
-- END OF SCHEMA
-- =============================================
