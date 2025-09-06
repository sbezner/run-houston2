CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS races (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  tz TEXT NOT NULL DEFAULT 'America/Chicago',
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geom GEOGRAPHY(POINT, 4326),
  distance TEXT[] NOT NULL,
  surface TEXT NOT NULL DEFAULT 'road' CHECK (surface IN ('road', 'trail', 'track', 'virtual', 'other')),
  kid_run BOOLEAN DEFAULT FALSE,
  official_website_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suggestions (
  id SERIAL PRIMARY KEY,
  submitted_by_email TEXT,
  race_payload_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor TEXT,
  action TEXT,
  target_type TEXT,
  target_id INTEGER,
  diff JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Sample data removed - use seed_data.sql for development data
