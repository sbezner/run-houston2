-- Migration: Create race_reports table
-- Date: 2025-01-XX
-- Description: Add race_reports table for storing race reports with markdown content

-- Create race_reports table
CREATE TABLE race_reports (
    id SERIAL PRIMARY KEY,
    race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    race_date DATE NOT NULL,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
    author_name TEXT NULL CHECK (author_name IS NULL OR char_length(author_name) BETWEEN 2 AND 80),
    content_md TEXT NOT NULL CHECK (char_length(content_md) BETWEEN 1 AND 20000),
    photos TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique constraint for race_id and title (case-insensitive)
ALTER TABLE race_reports ADD CONSTRAINT race_reports_race_title_unique 
    UNIQUE (race_id, lower(title));

-- Create indexes for performance
CREATE INDEX rr_race_id_created ON race_reports(race_id, created_at DESC);
CREATE INDEX rr_race_date_created ON race_reports(race_date DESC, created_at DESC);
CREATE INDEX rr_created ON race_reports(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_race_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER race_reports_updated_at_trigger
    BEFORE UPDATE ON race_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_race_reports_updated_at();

-- Add comments for documentation
COMMENT ON TABLE race_reports IS 'Stores race reports with markdown content linked to races';
COMMENT ON COLUMN race_reports.race_date IS 'Server-managed field derived from races.date';
COMMENT ON COLUMN race_reports.photos IS 'Array of absolute URLs to race photos';
COMMENT ON COLUMN race_reports.content_md IS 'Markdown content of the race report';
