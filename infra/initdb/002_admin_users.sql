-- Migration: Add admin_users table for authentication
-- Date: 2025-08-15

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on username for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- Admin user will be created by the application using environment variables
-- This ensures no hard-coded credentials in the database schema

-- Add comment to table
COMMENT ON TABLE admin_users IS 'Admin users for race management system';
COMMENT ON COLUMN admin_users.username IS 'Unique username for admin login';
COMMENT ON COLUMN admin_users.password_hash IS 'Bcrypt hashed password';
