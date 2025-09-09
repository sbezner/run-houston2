-- Migration: Expand surface constraint to include more allowed values
-- Purpose: Enforce allowed surface values: road, trail, track, virtual, other
-- Date: 2025-01-XX

-- UP Migration: Add expanded surface constraint
ALTER TABLE races 
  DROP CONSTRAINT IF EXISTS surface_check,
  ADD CONSTRAINT surface_check 
  CHECK (surface IN ('road', 'trail', 'track', 'virtual', 'other'));

-- DOWN Migration (Rollback)
-- Uncomment and run these lines to rollback:

-- Remove expanded constraint
-- ALTER TABLE races DROP CONSTRAINT IF EXISTS surface_check;

-- Restore original constraint (if needed)
-- ALTER TABLE races ADD CONSTRAINT surface_check CHECK (surface IN ('road','trail'));
