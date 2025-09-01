#!/usr/bin/env python3
"""
SIMPLIFIED CRITICAL: PostGIS Triggers and Coordinate Validation Test Suite
Purpose: Test critical functionality with simple, reliable SQL commands
Tests the core map functionality that powers your application
"""

import subprocess
import sys
import os

# Docker container details
CONTAINER_NAME = "runhou_db"
DB_USER = "rh_user"
DB_NAME = "runhou"

def run_docker_command(cmd):
    """Run a Docker command and return the result."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        return result.stdout, None
    except subprocess.CalledProcessError as e:
        return None, f"Command failed: {e.stderr}"

def test_postgis_extension():
    """Test 1: Verify PostGIS extension is available."""
    print("Test 1: PostGIS Extension Availability")
    print("=" * 60)
    
    cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "SELECT PostGIS_Version();"'
    stdout, stderr = run_docker_command(cmd)
    
    if stderr:
        print(f"FAIL: PostGIS extension not available: {stderr}")
        return False
    
    if 'PostGIS' in stdout or 'postgis' in stdout.lower():
        print(f"PASS: PostGIS extension available: {stdout.strip()}")
        return True
    else:
        print(f"FAIL: PostGIS extension not working properly: {stdout}")
        return False

def test_geom_trigger_basic():
    """Test 2: Test basic geometry trigger functionality."""
    print("\nTest 2: Basic Geometry Trigger")
    print("=" * 60)
    
    # Insert a test race with coordinates
    insert_cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "INSERT INTO races (name, date, surface, latitude, longitude, distance) VALUES (\'TRIGGER_TEST_BASIC\', \'2025-01-15\', \'road\', 29.7604, -95.3698, ARRAY[\'5k\']);"'
    stdout, stderr = run_docker_command(insert_cmd)
    
    if stderr:
        print(f"FAIL: Insert failed: {stderr}")
        return False
    
    # Check if geom was created
    check_cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "SELECT name, latitude, longitude, ST_AsText(geom) as geom_text FROM races WHERE name = \'TRIGGER_TEST_BASIC\';"'
    stdout, stderr = run_docker_command(check_cmd)
    
    if stderr:
        print(f"FAIL: Check failed: {stderr}")
        return False
    
    if 'POINT(-95.3698 29.7604)' in stdout:
        print("PASS: Geometry trigger working - geom created correctly")
        
        # Clean up
        cleanup_cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "DELETE FROM races WHERE name = \'TRIGGER_TEST_BASIC\';"'
        run_docker_command(cleanup_cmd)
        return True
    else:
        print(f"FAIL: Geometry not created correctly: {stdout}")
        return False

def test_coordinate_constraints():
    """Test 3: Test coordinate constraint enforcement."""
    print("\nTest 3: Coordinate Constraints")
    print("=" * 60)
    
    # Test 1: Insert with only latitude (should fail)
    test1_cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "INSERT INTO races (name, date, surface, latitude, distance) VALUES (\'CONSTRAINT_TEST_LAT_ONLY\', \'2025-01-16\', \'road\', 29.7604, ARRAY[\'5k\']);"'
    stdout, stderr = run_docker_command(test1_cmd)
    
    if stderr and 'check constraint "races_latlon_pair"' in stderr:
        print("PASS: Correctly prevented latitude-only insert")
    else:
        print(f"FAIL: Should have prevented latitude-only insert: {stderr}")
        return False
    
    # Test 2: Insert with only longitude (should fail)
    test2_cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "INSERT INTO races (name, date, surface, longitude, distance) VALUES (\'CONSTRAINT_TEST_LON_ONLY\', \'2025-01-17\', \'road\', -95.3698, ARRAY[\'5k\']);"'
    stdout, stderr = run_docker_command(test2_cmd)
    
    if stderr and 'check constraint "races_latlon_pair"' in stderr:
        print("PASS: Correctly prevented longitude-only insert")
    else:
        print(f"FAIL: Should have prevented longitude-only insert: {stderr}")
        return False
    
    # Test 3: Insert with both NULL (should succeed)
    test3_cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "INSERT INTO races (name, date, surface, latitude, longitude, distance) VALUES (\'CONSTRAINT_TEST_BOTH_NULL\', \'2025-01-18\', \'road\', NULL, NULL, ARRAY[\'5k\']);"'
    stdout, stderr = run_docker_command(test3_cmd)
    
    if not stderr:
        print("PASS: Both NULL coordinates accepted")
        
        # Clean up
        cleanup_cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "DELETE FROM races WHERE name = \'CONSTRAINT_TEST_BOTH_NULL\';"'
        run_docker_command(cleanup_cmd)
        return True
    else:
        print(f"FAIL: Both NULL coordinates should be accepted: {stderr}")
        return False

def test_coordinate_boundaries():
    """Test 4: Test coordinate boundary conditions."""
    print("\nTest 4: Coordinate Boundaries")
    print("=" * 60)
    
    # Test valid boundary coordinates
    test_cases = [
        (90.0, 0.0, "Maximum latitude"),
        (-90.0, 0.0, "Minimum latitude"),
        (0.0, 180.0, "Maximum longitude"),
        (0.0, -180.0, "Minimum longitude"),
        (0.0, 0.0, "Zero coordinates")
    ]
    
    for lat, lon, description in test_cases:
        test_name = f"BOUNDARY_TEST_{lat}_{lon}".replace('.', '_').replace('-', 'NEG')
        insert_cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "INSERT INTO races (name, date, surface, latitude, longitude, distance) VALUES (\'{test_name}\', \'2025-01-19\', \'road\', {lat}, {lon}, ARRAY[\'5k\']);"'
        stdout, stderr = run_docker_command(insert_cmd)
        
        if stderr:
            print(f"FAIL: {description} failed: {stderr}")
            return False
        
        print(f"PASS: {description} accepted")
        
        # Clean up
        cleanup_cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "DELETE FROM races WHERE name = \'{test_name}\';"'
        run_docker_command(cleanup_cmd)
    
    return True

def test_coordinate_precision():
    """Test 5: Test coordinate precision handling."""
    print("\nTest 5: Coordinate Precision")
    print("=" * 60)
    
    # Test high precision coordinates
    test_name = "PRECISION_TEST_HIGH"
    lat = 29.7604278
    lon = -95.3698029
    
    insert_cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "INSERT INTO races (name, date, surface, latitude, longitude, distance) VALUES (\'{test_name}\', \'2025-01-20\', \'road\', {lat}, {lon}, ARRAY[\'5k\']);"'
    stdout, stderr = run_docker_command(insert_cmd)
    
    if stderr:
        print(f"FAIL: High precision insert failed: {stderr}")
        return False
    
    # Verify precision is maintained
    check_cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "SELECT latitude, longitude FROM races WHERE name = \'{test_name}\';"'
    stdout, stderr = run_docker_command(check_cmd)
    
    if stderr:
        print(f"FAIL: Precision check failed: {stderr}")
        return False
    
    if str(lat) in stdout and str(lon) in stdout:
        print("PASS: High precision coordinates handled correctly")
        
        # Clean up
        cleanup_cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "DELETE FROM races WHERE name = \'{test_name}\';"'
        run_docker_command(cleanup_cmd)
        return True
    else:
        print(f"FAIL: Precision not maintained: {stdout}")
        return False

def test_geom_accuracy():
    """Test 6: Test geometric accuracy."""
    print("\nTest 6: Geometric Accuracy")
    print("=" * 60)
    
    # Insert test race with known coordinates
    test_name = "ACCURACY_TEST"
    lat = 29.7604
    lon = -95.3698
    
    insert_cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "INSERT INTO races (name, date, surface, latitude, longitude, distance) VALUES (\'{test_name}\', \'2025-01-21\', \'road\', {lat}, {lon}, ARRAY[\'5k\']);"'
    stdout, stderr = run_docker_command(insert_cmd)
    
    if stderr:
        print(f"FAIL: Accuracy test insert failed: {stderr}")
        return False
    
    # Check geometric properties
    check_cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "SELECT ST_SRID(geom::geometry) as srid, ST_GeometryType(geom::geometry) as geom_type, ST_AsText(geom::geometry) as coords FROM races WHERE name = \'{test_name}\';"'
    stdout, stderr = run_docker_command(check_cmd)
    
    if stderr:
        print(f"FAIL: Accuracy check failed: {stderr}")
        return False
    
    # Verify results
    if '4326' in stdout and 'ST_Point' in stdout and 'POINT(-95.3698 29.7604)' in stdout:
        print("PASS: Geometric accuracy verified - correct SRID, type, and coordinates")
        
        # Clean up
        cleanup_cmd = f'docker exec -i {CONTAINER_NAME} psql -U {DB_USER} -d {DB_NAME} -c "DELETE FROM races WHERE name = \'{test_name}\';"'
        run_docker_command(cleanup_cmd)
        return True
    else:
        print(f"FAIL: Geometric accuracy issues: {stdout}")
        return False

def main():
    """Main test runner for simplified critical tests."""
    print("CRITICAL: SIMPLIFIED PostGIS Triggers and Coordinate Validation Test Suite")
    print("=" * 80)
    print("Testing core map functionality with simple, reliable SQL commands")
    print("=" * 80)
    
    # Check if Docker is running
    print("Checking Docker status...")
    stdout, stderr = run_docker_command("docker ps")
    if stderr:
        print(f"FAIL: Docker is not running: {stderr}")
        return False
    
    # Check if our container is running
    if CONTAINER_NAME not in stdout:
        print(f"FAIL: Container '{CONTAINER_NAME}' is not running.")
        return False
    
    print(f"Container '{CONTAINER_NAME}' is running")
    
    # Run all tests
    test_results = []
    
    test_results.append(test_postgis_extension())
    test_results.append(test_geom_trigger_basic())
    test_results.append(test_coordinate_constraints())
    test_results.append(test_coordinate_boundaries())
    test_results.append(test_coordinate_precision())
    test_results.append(test_geom_accuracy())
    
    # Summary
    print("\nTest Results Summary:")
    print("=" * 50)
    
    passed = sum(test_results)
    total = len(test_results)
    
    for i, result in enumerate(test_results, 1):
        status = "PASS" if result else "FAIL"
        print(f"{status} Test {i}")
    
    print(f"\nOverall Results:")
    print(f"   Total Tests: {total}")
    print(f"   Passed: {passed}")
    print(f"   Failed: {total - passed}")
    
    if passed == total:
        print("\nSUCCESS: ALL CRITICAL TESTS PASSED!")
        print("   Your map functionality is properly protected!")
        print("   PostGIS triggers are working correctly!")
        print("   Coordinate validation is robust!")
    else:
        print(f"\nWARNING: {total - passed} test(s) failed.")
        print("   Your map functionality may be at risk!")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
