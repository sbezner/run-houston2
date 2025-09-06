-- Migration: Create schema_migrations table for tracking applied migrations
-- This is the foundation migration that enables all future migration tracking

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    checksum VARCHAR(255),
    rollback_safe BOOLEAN DEFAULT false
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations(applied_at);

-- Record this migration as the first one
INSERT INTO schema_migrations (version, description, rollback_safe) 
VALUES ('20250906_0537_create_schema_migrations_table', 'Create migration tracking table', true)
ON CONFLICT (version) DO NOTHING;
