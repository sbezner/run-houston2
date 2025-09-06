-- Development Seed Data for Run Houston
-- This file contains sample data for development and testing only
-- DO NOT run this in production environments

-- Sample races for development
INSERT INTO races
(name, date, start_time, address, city, state, zip, latitude, longitude, geom, distance, surface, kid_run, official_website_url)
VALUES
('Bayou City 5K', CURRENT_DATE + INTERVAL '7 day', '07:30', '600 Memorial Dr', 'Houston', 'TX', '77007', 29.7633, -95.3819, ST_SetSRID(ST_MakePoint(-95.3819, 29.7633), 4326)::geography, ARRAY['5K'], 'road', true, 'https://example.com/bayou5k'),
('Galveston Beach 10K', CURRENT_DATE + INTERVAL '20 day', '08:00', 'Stewart Beach', 'Galveston', 'TX', '77550', 29.3000, -94.7667, ST_SetSRID(ST_MakePoint(-94.7667, 29.3000), 4326)::geography, ARRAY['10K'], 'road', false, 'https://example.com/galv10k');

-- Sample clubs for development
INSERT INTO clubs (club_name, location, website_url, description) VALUES
  ('Houston Area Road Runners Assoc. (HARRA)', 'Houston, TX', 'https://harra.org', 'Premier running organization in Houston'),
  ('Kung Fu Running Club', 'Houston, TX', 'https://www.kungfurunningclub.com', 'Unique running club with martial arts inspiration'),
  ('Bayou City Road Runners', 'Houston, TX', 'https://www.bcrr.org', 'Community-focused running club'),
  ('Kenyan Way Training Program', 'Houston, TX', 'http://kenyanway.com', 'Elite training program for serious runners'),
  ('Bay Area Running Club (BARC)', 'Clear Lake, TX', 'https://www.barcnorth.org', 'Clear Lake area running community'),
  ('The Woodlands Running Club', 'The Woodlands, TX', 'https://thewoodlandsrunningclub.org', 'The Woodlands area running group'),
  ('Sample Running Club', 'Houston, TX', 'https://example.com', 'A friendly running club for all skill levels'),
  ('Test Marathon Club', 'Austin, TX', 'https://test.com', 'Focused on marathon training and long-distance running'),
  ('Speed Training Group', 'Dallas, TX', 'https://speed.com', 'Specialized in speed work and interval training'),
  ('Trail Running Society', 'San Antonio, TX', 'https://trail.com', 'Dedicated to trail running and outdoor adventures')
ON CONFLICT (lower(club_name), COALESCE(lower(location), '')) DO NOTHING;

-- Add some sample suggestions for development
INSERT INTO suggestions (suggestion_text, user_email, status, created_at) VALUES
  ('Add more trail running events', 'test@example.com', 'pending', NOW()),
  ('Include 5K races for beginners', 'user@example.com', 'pending', NOW()),
  ('Add race photos to event pages', 'photo@example.com', 'pending', NOW())
ON CONFLICT DO NOTHING;
