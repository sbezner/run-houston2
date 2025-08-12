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
  distance_categories TEXT[] NOT NULL,
  price_min NUMERIC,
  price_max NUMERIC,
  surface TEXT CHECK (surface IN ('road','trail')),
  kid_run BOOLEAN DEFAULT FALSE,
  official_website_url TEXT NOT NULL,
  registration_url TEXT,
  source TEXT DEFAULT 'manual',
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

INSERT INTO races
(name, date, start_time, address, city, state, zip, latitude, longitude, geom, distance_categories, price_min, price_max, surface, kid_run, official_website_url, registration_url)
VALUES
('Bayou City 5K', CURRENT_DATE + INTERVAL '7 day', '07:30', '600 Memorial Dr', 'Houston', 'TX', '77007', 29.7633, -95.3819, ST_SetSRID(ST_MakePoint(-95.3819, 29.7633), 4326)::geography, ARRAY['5K'], 30, 45, 'road', true, 'https://example.com/bayou5k', 'https://example.com/bayou5k/register'),
('Galveston Beach 10K', CURRENT_DATE + INTERVAL '20 day', '08:00', 'Stewart Beach', 'Galveston', 'TX', '77550', 29.3000, -94.7667, ST_SetSRID(ST_MakePoint(-94.7667, 29.3000), 4326)::geography, ARRAY['10K'], 35, 55, 'road', false, 'https://example.com/galv10k', 'https://example.com/galv10k/register');
