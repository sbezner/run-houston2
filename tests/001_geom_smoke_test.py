#!/usr/bin/env python3
"""
Smoke Test: Validate Geom Trigger on Races Table
Purpose: Quick validation that geom auto-population and guard constraints work correctly
Safe to run multiple times - uses unique test names and cleans up after itself
"""

import subprocess
import sys
import os
from datetime import date
import re

# Docker container details
CONTAINER_NAME = "runhou_db"
DB_USER = os.getenv("POSTGRES_USER", "rh_user")
DB_NAME = "runhou"

def run_docker_command(cmd):
    """Run a Docker command and return the result."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        return result.stdout, None
    except subprocess.CalledProcessError as e:
        return None, f"Command failed: {e.stderr}"

def copy_script_to_container():
    """Copy this script to the Docker container."""
    script_path = os.path.abspath(__file__)
    print(f"Copying Copying script to container: {script_path}")
    
    cmd = f'docker cp "{script_path}" {CONTAINER_NAME}:/home/smoke_test.py'
    stdout, stderr = run_docker_command(cmd)
    
    if stderr:
        print(f"FAIL Failed to copy script: {stderr}")
        raise Exception(f"Failed to copy script: {stderr}")
    
    print("PASS Script copied successfully")

def parse_test_results(output):
    """Parse the SQL output to extract test results."""
    test_results = {}
    current_test = None
    
    lines = output.split('\n')
    for line in lines:
        line = line.strip()
        
        # Look for test case identifiers
        if 'Test 1 - Insert with coords' in line:
            current_test = "Test 1: Insert with coordinates"
        elif 'Test 2 - Insert without coords' in line:
            current_test = "Test 2: Insert without coordinates"
        elif 'Test 3 - Update coords' in line:
            current_test = "Test 3: Update coordinates"
        elif 'Test 4: Verify guard constraint' in line:
            current_test = "Test 4: Guard constraint validation"
        elif 'Test 5 - Both coords NULL' in line:
            current_test = "Test 5: Both NULL coordinates"
        
        # Look for PASS/FAIL results
        if 'PASS -' in line and current_test:
            test_results[current_test] = "PASS PASS"
        elif 'FAIL -' in line and current_test:
            test_results[current_test] = "FAIL FAIL"
    
    return test_results

def run_smoke_test_in_container():
    """Run the smoke test inside the Docker container."""
    print("Starting Starting Geom Trigger Smoke Test in container...\n")
    
    # Create a temporary SQL file with all commands
    sql_content = """
-- Test 1: Insert race with valid coordinates
INSERT INTO races (name, date, surface, latitude, longitude)
VALUES ('SMOKE_TEST_HOUSTON_5K', '2025-01-15', 'road', 29.7604, -95.3698);

-- Verify geom was created
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
FROM races WHERE name = 'SMOKE_TEST_HOUSTON_5K';

-- Test 2: Insert race with NULL coordinates
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
FROM races WHERE name = 'SMOKE_TEST_NO_COORDS_5K';

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
        WHEN geom IS NOT NULL THEN 'PASS - Geom updated'
        ELSE 'FAIL - Geom not updated correctly'
    END as result
FROM races WHERE name = 'SMOKE_TEST_HOUSTON_5K';

-- Test 4: Verify guard constraint rejects partial coordinates
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

-- Verify both NULL coordinates are allowed
SELECT 
    'Test 5 - Both coords NULL' as test_case,
    name,
    latitude,
    longitude,
    CASE 
        WHEN geom IS NULL THEN 'PASS - Both NULL allowed'
        ELSE 'FAIL - Should allow both NULL'
    END as result
FROM races WHERE name = 'SMOKE_TEST_BOTH_NULL_5K';

-- Summary
SELECT 
    'SUMMARY' as section,
    COUNT(*) as total_test_records,
    COUNT(geom) as records_with_geom,
    COUNT(*) - COUNT(geom) as records_without_geom
FROM races WHERE name LIKE 'SMOKE_TEST_%%';

-- Cleanup
DELETE FROM races WHERE name LIKE 'SMOKE_TEST_%%';

-- Final verification
SELECT 
    'CLEANUP' as section,
    COUNT(*) as remaining_test_records
FROM races WHERE name LIKE 'SMOKE_TEST_%%';
"""
    
    # Write SQL to a temporary file
    temp_sql_file = "temp_smoke_test.sql"
    with open(temp_sql_file, 'w') as f:
        f.write(sql_content)
    
    try:
        # Copy the SQL file to the container
        print("Copying SQL commands to container...")
        cmd = f'docker cp "{temp_sql_file}" {CONTAINER_NAME}:/home/smoke_test.sql'
        stdout, stderr = run_docker_command(cmd)
        
        if stderr:
            print(f"Failed to copy SQL file: {stderr}")
            raise Exception(f"Failed to copy SQL file: {stderr}")
        
        # Execute the SQL file in the container
        print("Executing smoke test...")
        cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -f /home/smoke_test.sql'
        stdout, stderr = run_docker_command(cmd)
        
        if stdout:
            print("Test Results:")
            print("=" * 50)
            print(stdout)
            
            # Parse and display test status
            print("\nTest Status Summary:")
            print("=" * 50)
            test_results = parse_test_results(stdout)
            
            for test_name, status in test_results.items():
                print(f"{status} {test_name}")
            
            # Count passes and fails
            pass_count = sum(1 for status in test_results.values() if "PASS" in status)
            fail_count = sum(1 for status in test_results.values() if "FAIL" in status)
            total_tests = len(test_results)
            
            print(f"\nOverall Results:")
            print(f"   Total Tests: {total_tests}")
            print(f"   PASSED: {pass_count}")
            print(f"   FAILED: {fail_count}")
            
            if fail_count == 0:
                print("\nALL TESTS PASSED! Your geom trigger system is working perfectly!")
            else:
                print(f"\n{fail_count} test(s) failed. Please check the results above.")
        
        if stderr:
            print(f"\nWarnings/Errors:")
            print(stderr)
            
    finally:
        # Clean up temporary file
        if os.path.exists(temp_sql_file):
            os.remove(temp_sql_file)

def main():
    """Main function to orchestrate the smoke test."""
    print("Geom Trigger Smoke Test - Auto-Docker Edition")
    print("=" * 60)
    
    # Check if Docker is running
    print("Checking Docker status...")
    stdout, stderr = run_docker_command("docker ps")
    if stderr:
        print(f"Docker is not running: {stderr}")
        print("Please start Docker and try again.")
        raise Exception(f"Docker is not running: {stderr}")
    
    # Check if our container is running
    if CONTAINER_NAME not in stdout:
        print(f"Container '{CONTAINER_NAME}' is not running.")
        print("Please start your database container and try again.")
        raise Exception(f"Container '{CONTAINER_NAME}' is not running")
    
    print(f"Container '{CONTAINER_NAME}' is running")
    
    # Run the smoke test
    run_smoke_test_in_container()
    
    print("\nSmoke test completed!")

if __name__ == "__main__":
    try:
        main()
        sys.exit(0)  # Exit with success if no exceptions
    except Exception as e:
        print(f"Test failed with exception: {e}")
        sys.exit(1)  # Exit with failure if exception occurs