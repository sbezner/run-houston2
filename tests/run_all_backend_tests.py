#!/usr/bin/env python3
"""
Run All Backend Tests - Run Houston

This script runs all backend tests to ensure the system is working correctly.
Tests are run in order of criticality and dependencies.
"""

import subprocess
import sys
import os

def run_test(test_file, description):
    """Run a specific test file and report results."""
    print(f"\n{'='*60}")
    print(f"Testing: {description}")
    print(f"File: {test_file}")
    print(f"{'='*60}")
    
    try:
        # Run the test file from the tests directory
        result = subprocess.run([sys.executable, test_file], 
                              capture_output=True, text=True, cwd=os.path.dirname(__file__))
        
        if result.returncode == 0:
            print("Test PASSED")
            if result.stdout:
                print("Output:")
                print(result.stdout)
        else:
            print("Test FAILED")
            if result.stderr:
                print("Errors:")
                print(result.stderr)
            if result.stdout:
                print("Output:")
                print(result.stdout)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"Error running test: {e}")
        return False

def main():
    """Run all backend tests in order."""
    print("Starting Run Houston Backend Test Suite")
    print("=" * 60)
    
    # Test files in order of execution
    tests = [
        ("001_geom_smoke_test.py", "PostGIS Geometry Smoke Test - Critical"),
        ("002_csv_import_test.py", "CSV Import Functionality Test - High Risk"),
        ("003_clubs_api_test.py", "Clubs API Test - Good Coverage"),
        ("004_csv_import_integration_test.py", "CSV Import Integration Test - Good Coverage"),
        ("005_frontend_validation_test.py", "Frontend-Backend Validation Test - Good Coverage"),
        ("008_simplified_critical_tests.py", "Simplified Critical Tests - PostGIS & Coordinates"),
        ("020_pydantic_distance_validation_test.py", "Pydantic Distance Validation Test - Bug #26 Fix"),
        ("014_bug_1_race_id_validation_test.py", "Bug #1 Race ID Validation Test - Admin Endpoint Fix"),
    
        ("015_jwt_authentication_service_test.py", "JWT Authentication Service Test - New JWT Migration"),
        ("016_network_validator_service_test.py", "Network Validator Service Test - New Network Validation"),
        ("017_updated_api_service_test.py", "Updated API Service Test - New JWT Integration"),
        ("018_updated_hooks_test.py", "Updated Hooks Test - New JWT Integration"),
        ("019_admin_components_authentication_test.py", "Admin Components Authentication Test - New JWT Integration")
    ]
    
    passed = 0
    failed = 0
    
    for test_file, description in tests:
        if run_test(test_file, description):
            passed += 1
        else:
            failed += 1
    
    # Summary
    print(f"\n{'='*60}")
    print("FINAL TEST RESULTS")
    print(f"{'='*60}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print("\nALL TESTS PASSED! The system is working correctly.")
        return 0
    else:
        print(f"\n{failed} test(s) failed. Please investigate and fix the issues.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
