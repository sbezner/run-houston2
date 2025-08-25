-- Migration: Rename distance_categories column to distance
-- Date: 2025-08-22

-- Rename the column
ALTER TABLE races RENAME COLUMN distance_categories TO distance;

-- Update the comment
COMMENT ON COLUMN races.distance IS 'Available race distances (defaults to 5K)';
