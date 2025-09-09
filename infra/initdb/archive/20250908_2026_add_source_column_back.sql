-- Migration: Add source column back to races table
ALTER TABLE races ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
