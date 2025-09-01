-- Sample Race Data for Greater Houston Area
-- Counties that touch Harris County: Fort Bend, Montgomery, Liberty, Chambers, Waller, Galveston, Brazoria

-- Reset sequence
SELECT setval('races_id_seq', 1, false);

-- Past Races (10 races before today)
INSERT INTO races (name, date, start_time, tz, address, city, state, zip, latitude, longitude, distance, surface, kid_run, official_website_url, source) VALUES
('Houston Heights 5K', '2025-08-20', '07:00:00', 'America/Chicago', '1001 Studewood St', 'Houston', 'TX', '77008', 29.8027, -95.4083, ARRAY['5K'], 'road', true, 'https://houstonheights5k.com', 'sample'),
('Sugar Land Memorial 10K', '2025-08-18', '07:30:00', 'America/Chicago', '15300 University Blvd', 'Sugar Land', 'TX', '77479', 29.6197, -95.6349, ARRAY['10K'], 'road', false, 'https://sugarlandmemorial10k.com', 'sample'),
('The Woodlands Half Marathon', '2025-08-15', '06:00:00', 'America/Chicago', '2000 Lake Robbins Dr', 'The Woodlands', 'TX', '77380', 30.1579, -95.4894, ARRAY['Half'], 'road', true, 'https://woodlandshalf.com', 'sample'),
('Katy Prairie Trail Run', '2025-08-12', '08:00:00', 'America/Chicago', '31975 Hebert Rd', 'Waller', 'TX', '77484', 29.7897, -95.8234, ARRAY['5K', '10K'], 'trail', false, 'https://katyprairietrail.com', 'sample'),
('Galveston Island Beach Run', '2025-08-10', '07:00:00', 'America/Chicago', '2027 61st St', 'Galveston', 'TX', '77551', 29.3013, -94.7977, ARRAY['5K'], 'road', true, 'https://galvestonbeachrun.com', 'sample'),
('Pearland Running Festival', '2025-08-08', '07:30:00', 'America/Chicago', '4719 Bailey Rd', 'Pearland', 'TX', '77584', 29.5636, -95.2860, ARRAY['5K', '10K', 'Half'], 'road', true, 'https://pearlandrunning.com', 'sample'),
('Montgomery County 5K', '2025-08-05', '08:00:00', 'America/Chicago', '1 Liberty St', 'Conroe', 'TX', '77301', 30.3119, -95.4561, ARRAY['5K'], 'road', false, 'https://montgomery5k.com', 'sample'),
('Baytown Bayou Run', '2025-08-03', '07:00:00', 'America/Chicago', '2200 Market St', 'Baytown', 'TX', '77520', 29.7355, -94.9774, ARRAY['5K', '10K'], 'road', true, 'https://baytownbayou.com', 'sample'),
('Rosenberg Heritage 10K', '2025-08-01', '07:30:00', 'America/Chicago', '412 5th St', 'Rosenberg', 'TX', '77471', 29.5446, -95.8086, ARRAY['10K'], 'road', false, 'https://rosenbergheritage.com', 'sample'),
('League City Marathon', '2025-07-30', '06:00:00', 'America/Chicago', '100 W Main St', 'League City', 'TX', '77573', 29.5074, -95.0949, ARRAY['Full', 'Half'], 'road', true, 'https://leaguecitymarathon.com', 'sample');

-- Today's Races (3 races)
INSERT INTO races (name, date, start_time, tz, address, city, state, zip, latitude, longitude, distance, surface, kid_run, official_website_url, source) VALUES
('Houston Downtown 5K', '2025-08-29', '18:00:00', 'America/Chicago', '1001 McKinney St', 'Houston', 'TX', '77002', 29.7604, -95.3698, ARRAY['5K'], 'road', true, 'https://houstondowntown5k.com', 'sample'),
('Clear Lake Evening Run', '2025-08-29', '19:00:00', 'America/Chicago', '500 Clear Lake City Blvd', 'Houston', 'TX', '77059', 29.5589, -95.1198, ARRAY['5K'], 'road', false, 'https://clearlakeevening.com', 'sample'),
('Spring Branch Trail Run', '2025-08-29', '17:30:00', 'America/Chicago', '9000 Katy Fwy', 'Houston', 'TX', '77024', 29.7833, -95.5478, ARRAY['5K', '10K'], 'trail', true, 'https://springbranchtrail.com', 'sample');

-- This Weekend Races (5 races)
INSERT INTO races (name, date, start_time, tz, address, city, state, zip, latitude, longitude, distance, surface, kid_run, official_website_url, source) VALUES
('Houston Heights Weekend 10K', '2025-08-30', '07:00:00', 'America/Chicago', '1001 Studewood St', 'Houston', 'TX', '77008', 29.8027, -95.4083, ARRAY['10K'], 'road', true, 'https://houstonheights10k.com', 'sample'),
('Sugar Land Saturday 5K', '2025-08-30', '08:00:00', 'America/Chicago', '15300 University Blvd', 'Sugar Land', 'TX', '77479', 29.6197, -95.6349, ARRAY['5K'], 'road', false, 'https://sugarlandsaturday5k.com', 'sample'),
('The Woodlands Sunday Half', '2025-08-31', '06:30:00', 'America/Chicago', '2000 Lake Robbins Dr', 'The Woodlands', 'TX', '77380', 30.1579, -95.4894, ARRAY['Half'], 'road', true, 'https://woodlandssundayhalf.com', 'sample'),
('Katy Prairie Weekend Trail', '2025-08-31', '08:30:00', 'America/Chicago', '31975 Hebert Rd', 'Waller', 'TX', '77484', 29.7897, -95.8234, ARRAY['5K', '10K'], 'trail', false, 'https://katyprairieweekend.com', 'sample'),
('Galveston Sunday Beach Run', '2025-08-31', '07:30:00', 'America/Chicago', '2027 61st St', 'Galveston', 'TX', '77551', 29.3013, -94.7977, ARRAY['5K'], 'road', true, 'https://galvestonsundaybeach.com', 'sample');

-- Future Races (50 races over next 30-90 days)
INSERT INTO races (name, date, start_time, tz, address, city, state, zip, latitude, longitude, distance, surface, kid_run, official_website_url, source) VALUES
-- Next 30 days
('Houston September 5K', '2025-09-05', '07:00:00', 'America/Chicago', '1001 McKinney St', 'Houston', 'TX', '77002', 29.7604, -95.3698, ARRAY['5K'], 'road', true, 'https://houstonseptember5k.com', 'sample'),
('Sugar Land Labor Day 10K', '2025-09-01', '07:30:00', 'America/Chicago', '15300 University Blvd', 'Sugar Land', 'TX', '77479', 29.6197, -95.6349, ARRAY['10K'], 'road', false, 'https://sugarlandlaborday.com', 'sample'),
('The Woodlands September Half', '2025-09-07', '06:00:00', 'America/Chicago', '2000 Lake Robbins Dr', 'The Woodlands', 'TX', '77380', 30.1579, -95.4894, ARRAY['Half'], 'road', true, 'https://woodlandsseptemberhalf.com', 'sample'),
('Katy Prairie September Trail', '2025-09-14', '08:00:00', 'America/Chicago', '31975 Hebert Rd', 'Waller', 'TX', '77484', 29.7897, -95.8234, ARRAY['5K', '10K'], 'trail', false, 'https://katyprairieseptember.com', 'sample'),
('Galveston September Beach', '2025-09-21', '07:00:00', 'America/Chicago', '2027 61st St', 'Galveston', 'TX', '77551', 29.3013, -94.7977, ARRAY['5K'], 'road', true, 'https://galvestonseptemberbeach.com', 'sample'),
('Pearland September 5K', '2025-09-28', '07:30:00', 'America/Chicago', '4719 Bailey Rd', 'Pearland', 'TX', '77584', 29.5636, -95.2860, ARRAY['5K'], 'road', true, 'https://pearlandseptember5k.com', 'sample'),
('Montgomery September 10K', '2025-09-15', '08:00:00', 'America/Chicago', '1 Liberty St', 'Conroe', 'TX', '77301', 30.3119, -95.4561, ARRAY['10K'], 'road', false, 'https://montgomeryseptember10k.com', 'sample'),
('Baytown September Half', '2025-09-22', '07:00:00', 'America/Chicago', '2200 Market St', 'Baytown', 'TX', '77520', 29.7355, -94.9774, ARRAY['Half'], 'road', true, 'https://baytownseptemberhalf.com', 'sample'),
('Rosenberg September 5K', '2025-09-08', '07:30:00', 'America/Chicago', '412 5th St', 'Rosenberg', 'TX', '77471', 29.5446, -95.8086, ARRAY['5K'], 'road', false, 'https://rosenbergseptember5k.com', 'sample'),
('League City September 10K', '2025-09-29', '06:00:00', 'America/Chicago', '100 W Main St', 'League City', 'TX', '77573', 29.5074, -95.0949, ARRAY['10K'], 'road', true, 'https://leaguecityseptember10k.com', 'sample'),

-- 30-60 days
('Houston October 5K', '2025-10-05', '07:00:00', 'America/Chicago', '1001 McKinney St', 'Houston', 'TX', '77002', 29.7604, -95.3698, ARRAY['5K'], 'road', true, 'https://houstonoctober5k.com', 'sample'),
('Sugar Land October 10K', '2025-10-12', '07:30:00', 'America/Chicago', '15300 University Blvd', 'Sugar Land', 'TX', '77479', 29.6197, -95.6349, ARRAY['10K'], 'road', false, 'https://sugarlandoctober10k.com', 'sample'),
('The Woodlands October Half', '2025-10-19', '06:00:00', 'America/Chicago', '2000 Lake Robbins Dr', 'The Woodlands', 'TX', '77380', 30.1579, -95.4894, ARRAY['Half'], 'road', true, 'https://woodlandsoctoberhalf.com', 'sample'),
('Katy Prairie October Trail', '2025-10-26', '08:00:00', 'America/Chicago', '31975 Hebert Rd', 'Waller', 'TX', '77484', 29.7897, -95.8234, ARRAY['5K', '10K'], 'trail', false, 'https://katyprairieoctober.com', 'sample'),
('Galveston October Beach', '2025-10-05', '07:00:00', 'America/Chicago', '2027 61st St', 'Galveston', 'TX', '77551', 29.3013, -94.7977, ARRAY['5K'], 'road', true, 'https://galvestonoctoberbeach.com', 'sample'),
('Pearland October 5K', '2025-10-12', '07:30:00', 'America/Chicago', '4719 Bailey Rd', 'Pearland', 'TX', '77584', 29.5636, -95.2860, ARRAY['5K'], 'road', true, 'https://pearlandoctober5k.com', 'sample'),
('Montgomery October 10K', '2025-10-19', '08:00:00', 'America/Chicago', '1 Liberty St', 'Conroe', 'TX', '77301', 30.3119, -95.4561, ARRAY['10K'], 'road', false, 'https://montgomeryoctober10k.com', 'sample'),
('Baytown October Half', '2025-10-26', '07:00:00', 'America/Chicago', '2200 Market St', 'Baytown', 'TX', '77520', 29.7355, -94.9774, ARRAY['Half'], 'road', true, 'https://baytownoctoberhalf.com', 'sample'),
('Rosenberg October 5K', '2025-10-05', '07:30:00', 'America/Chicago', '412 5th St', 'Rosenberg', 'TX', '77471', 29.5446, -95.8086, ARRAY['5K'], 'road', false, 'https://rosenbergoctober5k.com', 'sample'),
('League City October 10K', '2025-10-12', '06:00:00', 'America/Chicago', '100 W Main St', 'League City', 'TX', '77573', 29.5074, -95.0949, ARRAY['10K'], 'road', true, 'https://leaguecityoctober10k.com', 'sample'),

-- 60-90 days
('Houston November 5K', '2025-11-02', '07:00:00', 'America/Chicago', '1001 McKinney St', 'Houston', 'TX', '77002', 29.7604, -95.3698, ARRAY['5K'], 'road', true, 'https://houstonnovember5k.com', 'sample'),
('Sugar Land November 10K', '2025-11-09', '07:30:00', 'America/Chicago', '15300 University Blvd', 'Sugar Land', 'TX', '77479', 29.6197, -95.6349, ARRAY['10K'], 'road', false, 'https://sugarlandnovember10k.com', 'sample'),
('The Woodlands November Half', '2025-11-16', '06:00:00', 'America/Chicago', '2000 Lake Robbins Dr', 'The Woodlands', 'TX', '77380', 30.1579, -95.4894, ARRAY['Half'], 'road', true, 'https://woodlandsnovemberhalf.com', 'sample'),
('Katy Prairie November Trail', '2025-11-23', '08:00:00', 'America/Chicago', '31975 Hebert Rd', 'Waller', 'TX', '77484', 29.7897, -95.8234, ARRAY['5K', '10K'], 'trail', false, 'https://katyprairienovember.com', 'sample'),
('Galveston November Beach', '2025-11-30', '07:00:00', 'America/Chicago', '2027 61st St', 'Galveston', 'TX', '77551', 29.3013, -94.7977, ARRAY['5K'], 'road', true, 'https://galvestonnovemberbeach.com', 'sample'),
('Pearland November 5K', '2025-11-02', '07:30:00', 'America/Chicago', '4719 Bailey Rd', 'Pearland', 'TX', '77584', 29.5636, -95.2860, ARRAY['5K'], 'road', true, 'https://pearlandnovember5k.com', 'sample'),
('Montgomery November 10K', '2025-11-09', '08:00:00', 'America/Chicago', '1 Liberty St', 'Conroe', 'TX', '77301', 30.3119, -95.4561, ARRAY['10K'], 'road', false, 'https://montgomerynovember10k.com', 'sample'),
('Baytown November Half', '2025-11-16', '07:00:00', 'America/Chicago', '2200 Market St', 'Baytown', 'TX', '77520', 29.7355, -94.9774, ARRAY['Half'], 'road', true, 'https://baytownnovemberhalf.com', 'sample'),
('Rosenberg November 5K', '2025-11-23', '07:30:00', 'America/Chicago', '412 5th St', 'Rosenberg', 'TX', '77471', 29.5446, -95.8086, ARRAY['5K'], 'road', false, 'https://rosenbergnovember5k.com', 'sample'),
('League City November 10K', '2025-11-30', '06:00:00', 'America/Chicago', '100 W Main St', 'League City', 'TX', '77573', 29.5074, -95.0949, ARRAY['10K'], 'road', true, 'https://leaguecitynovember10k.com', 'sample'),

-- Additional variety races
('Houston Track Meet', '2025-09-10', '18:00:00', 'America/Chicago', '3100 Cleburne St', 'Houston', 'TX', '77004', 29.7236, -95.3589, ARRAY['5K'], 'track', false, 'https://houstontrackmeet.com', 'sample'),
('Sugar Land Ultra Marathon', '2025-09-20', '05:00:00', 'America/Chicago', '15300 University Blvd', 'Sugar Land', 'TX', '77479', 29.6197, -95.6349, ARRAY['Ultra'], 'road', false, 'https://sugarlandultra.com', 'sample'),
('The Woodlands Kids Run', '2025-09-25', '09:00:00', 'America/Chicago', '2000 Lake Robbins Dr', 'The Woodlands', 'TX', '77380', 30.1579, -95.4894, ARRAY['Kids'], 'road', true, 'https://woodlandskidsrun.com', 'sample'),
('Katy Prairie Full Marathon', '2025-10-18', '06:00:00', 'America/Chicago', '31975 Hebert Rd', 'Waller', 'TX', '77484', 29.7897, -95.8234, ARRAY['Full'], 'trail', false, 'https://katyprairiefull.com', 'sample'),
('Galveston Island Ultra', '2025-10-25', '05:30:00', 'America/Chicago', '2027 61st St', 'Galveston', 'TX', '77551', 29.3013, -94.7977, ARRAY['Ultra'], 'road', false, 'https://galvestonislandultra.com', 'sample'),
('Pearland Track Meet', '2025-11-08', '17:00:00', 'America/Chicago', '4719 Bailey Rd', 'Pearland', 'TX', '77584', 29.5636, -95.2860, ARRAY['5K'], 'track', true, 'https://pearlandtrackmeet.com', 'sample'),
('Montgomery Trail Run', '2025-11-15', '08:30:00', 'America/Chicago', '1 Liberty St', 'Conroe', 'TX', '77301', 30.3119, -95.4561, ARRAY['5K', '10K'], 'trail', false, 'https://montgomerytrailrun.com', 'sample'),
('Baytown Kids Run', '2025-11-22', '09:30:00', 'America/Chicago', '2200 Market St', 'Baytown', 'TX', '77520', 29.7355, -94.9774, ARRAY['Kids'], 'road', true, 'https://baytownkidsrun.com', 'sample'),
('Rosenberg Track Meet', '2025-11-29', '18:00:00', 'America/Chicago', '412 5th St', 'Rosenberg', 'TX', '77471', 29.5446, -95.8086, ARRAY['5K'], 'track', false, 'https://rosenbergtrackmeet.com', 'sample'),
('League City Trail Run', '2025-12-06', '08:00:00', 'America/Chicago', '100 W Main St', 'League City', 'TX', '77573', 29.5074, -95.0949, ARRAY['5K', '10K'], 'trail', true, 'https://leaguecitytrailrun.com', 'sample'),

-- December races
('Houston December 5K', '2025-12-07', '07:00:00', 'America/Chicago', '1001 McKinney St', 'Houston', 'TX', '77002', 29.7604, -95.3698, ARRAY['5K'], 'road', true, 'https://houstondecember5k.com', 'sample'),
('Sugar Land December 10K', '2025-12-14', '07:30:00', 'America/Chicago', '15300 University Blvd', 'Sugar Land', 'TX', '77479', 29.6197, -95.6349, ARRAY['10K'], 'road', false, 'https://sugarlanddecember10k.com', 'sample'),
('The Woodlands December Half', '2025-12-21', '06:00:00', 'America/Chicago', '2000 Lake Robbins Dr', 'The Woodlands', 'TX', '77380', 30.1579, -95.4894, ARRAY['Half'], 'road', true, 'https://woodlandsdecemberhalf.com', 'sample'),
('Katy Prairie December Trail', '2025-12-28', '08:00:00', 'America/Chicago', '31975 Hebert Rd', 'Waller', 'TX', '77484', 29.7897, -95.8234, ARRAY['5K', '10K'], 'trail', false, 'https://katyprairiedecember.com', 'sample'),
('Galveston December Beach', '2025-12-14', '07:00:00', 'America/Chicago', '2027 61st St', 'Galveston', 'TX', '77551', 29.3013, -94.7977, ARRAY['5K'], 'road', true, 'https://galvestondecemberbeach.com', 'sample'),
('Pearland December 5K', '2025-12-21', '07:30:00', 'America/Chicago', '4719 Bailey Rd', 'Pearland', 'TX', '77584', 29.5636, -95.2860, ARRAY['5K'], 'road', true, 'https://pearlanddecember5k.com', 'sample'),
('Montgomery December 10K', '2025-12-28', '08:00:00', 'America/Chicago', '1 Liberty St', 'Conroe', 'TX', '77301', 30.3119, -95.4561, ARRAY['10K'], 'road', false, 'https://montgomerydecember10k.com', 'sample'),
('Baytown December Half', '2025-12-07', '07:00:00', 'America/Chicago', '2200 Market St', 'Baytown', 'TX', '77520', 29.7355, -94.9774, ARRAY['Half'], 'road', true, 'https://baytowndecemberhalf.com', 'sample'),
('Rosenberg December 5K', '2025-12-14', '07:30:00', 'America/Chicago', '412 5th St', 'Rosenberg', 'TX', '77471', 29.5446, -95.8086, ARRAY['5K'], 'road', false, 'https://rosenbergdecember5k.com', 'sample'),
('League City December 10K', '2025-12-21', '06:00:00', 'America/Chicago', '100 W Main St', 'League City', 'TX', '77573', 29.5074, -95.0949, ARRAY['10K'], 'road', true, 'https://leaguecitydecember10k.com', 'sample');

-- Update sequence to continue from the last inserted ID
SELECT setval('races_id_seq', (SELECT MAX(id) FROM races) + 1, true);
