-- Migration: Add geom trigger and lat/lon guard constraint
-- Purpose: Auto-populate races.geom from coordinates, backfill existing rows, enforce lat/lon consistency

-- UP Migration

-- Ensure PostGIS is available (idempotent)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1) Function to derive geom from lon/lat
CREATE OR REPLACE FUNCTION set_race_geom()
RETURNS trigger AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::GEOGRAPHY;
  ELSE
    NEW.geom := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Trigger on INSERT and when lat/lon change
DROP TRIGGER IF EXISTS races_set_geom ON races;

CREATE TRIGGER races_set_geom
BEFORE INSERT OR UPDATE OF latitude, longitude
ON races
FOR EACH ROW
EXECUTE FUNCTION set_race_geom();

-- 3) Backfill existing rows where lat/lon exist but geom is NULL
UPDATE races
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::GEOGRAPHY
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  AND geom IS NULL;

-- 4) Guard: lat & lon must be both NULL or both non-NULL
ALTER TABLE races
  DROP CONSTRAINT IF EXISTS races_latlon_pair,
  ADD  CONSTRAINT races_latlon_pair
  CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude IS NOT NULL AND longitude IS NOT NULL)
  );

-- DOWN Migration (Rollback)
-- Uncomment and run these lines to rollback:

-- Remove guard constraint
-- ALTER TABLE races
--   DROP CONSTRAINT IF EXISTS races_latlon_pair;

-- Remove trigger
-- DROP TRIGGER IF EXISTS races_set_geom ON races;

-- Remove function
-- DROP FUNCTION IF EXISTS set_race_geom();

-- Optional: clear geom if desired (commented)
-- UPDATE races SET geom = NULL;
