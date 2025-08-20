-- Smoke Test: Validate Geom Trigger on Races Table
-- Purpose: Quick validation that geom auto-population and guard constraints work correctly
-- Safe to run multiple times - uses unique test names and cleans up after itself

-- Test 1: Insert race with valid coordinates and verify geom auto-populates
INSERT INTO races (name, date, surface, latitude, longitude)
VALUES ('SMOKE_TEST_HOUSTON_5K', '2025-01-15', 'road', 29.7604, -95.3698);

-- Verify geom was created correctly
SELECT 
    'Test 1 - Insert with coords' as test_case,
    name,
    latitude,
    longitude,
    ST_AsText(geom) as geom_text,
    CASE 
        WHEN geom IS NOT NULL THEN 'PASS - Geom auto-populated'
        ELSE 'FAIL - Geom is NULL'
    END as result
FROM races 
WHERE name = 'SMOKE_TEST_HOUSTON_5K';

-- Test 2: Insert race with NULL coordinates and verify geom is NULL
INSERT INTO races (name, date, surface)
VALUES ('SMOKE_TEST_NO_COORDS_5K', '2025-01-16', 'road');

-- Verify geom is NULL
SELECT 
    'Test 2 - Insert without coords' as test_case,
    name,
    latitude,
    longitude,
    CASE 
        WHEN geom IS NULL THEN 'PASS - Geom is NULL'
        ELSE 'FAIL - Geom should be NULL'
    END as result
FROM races 
WHERE name = 'SMOKE_TEST_NO_COORDS_5K';

-- Test 3: Update coordinates and verify geom updates
UPDATE races 
SET latitude = 30.2672, longitude = -97.7431
WHERE name = 'SMOKE_TEST_HOUSTON_5K';

-- Verify geom updated correctly
SELECT 
    'Test 3 - Update coords' as test_case,
    name,
    latitude,
    longitude,
    ST_AsText(geom) as geom_text,
    CASE 
        WHEN geom IS NOT NULL AND ST_X(ST_GeometryN(geom, 1))::numeric(10,6) = -97.7431 THEN 'PASS - Geom updated'
        ELSE 'FAIL - Geom not updated correctly'
    END as result
FROM races 
WHERE name = 'SMOKE_TEST_HOUSTON_5K';

-- Test 4: Verify guard constraint rejects partial coordinates
-- This should fail with constraint violation
DO $$
BEGIN
    BEGIN
        INSERT INTO races (name, date, surface, latitude)
        VALUES ('SMOKE_TEST_BAD_CONSTRAINT', '2025-01-17', 'road', 30.0);
        
        RAISE NOTICE 'FAIL - Constraint should have prevented this insert';
    EXCEPTION 
        WHEN check_violation THEN
            RAISE NOTICE 'PASS - Guard constraint working correctly';
        WHEN OTHERS THEN
            RAISE NOTICE 'Unexpected error: %', SQLERRM;
    END;
END $$;

-- Test 5: Verify both NULL coordinates are allowed
INSERT INTO races (name, date, surface, latitude, longitude)
VALUES ('SMOKE_TEST_BOTH_NULL_5K', '2025-01-18', 'road', NULL, NULL);

SELECT 
    'Test 5 - Both coords NULL' as test_case,
    name,
    latitude,
    longitude,
    CASE 
        WHEN geom IS NULL THEN 'PASS - Both NULL allowed'
        ELSE 'FAIL - Should allow both NULL'
    END as result
FROM races 
WHERE name = 'SMOKE_TEST_BOTH_NULL_5K';

-- Summary: Show all test results
SELECT 
    'SUMMARY' as section,
    COUNT(*) as total_test_records,
    COUNT(geom) as records_with_geom,
    COUNT(*) - COUNT(geom) as records_without_geom
FROM races 
WHERE name LIKE 'SMOKE_TEST_%';

-- Cleanup: Remove all test records
DELETE FROM races WHERE name LIKE 'SMOKE_TEST_%';

-- Final verification: Confirm cleanup
SELECT 
    'CLEANUP' as section,
    COUNT(*) as remaining_test_records
FROM races 
WHERE name LIKE 'SMOKE_TEST_%';
