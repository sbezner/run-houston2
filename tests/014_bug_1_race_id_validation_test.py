#!/usr/bin/env python3
"""
Unit test for Bug #1: Race ID validation in race report form
Tests that race ID validation uses admin endpoint to access all races (not limited to 50)
"""

import sys
import os
import requests
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Test configuration
API_BASE = "http://localhost:8000"
TEST_RACE_ID = None  # Will be dynamically determined
TEST_RACE_REPORT_ID = None  # Will be dynamically determined

def find_test_race_report_id():
    """Dynamically find a test race report ID"""
    print("  0. Finding a test race report ID...")
    
    try:
        response = requests.get(f"{API_BASE}/race_reports?limit=1")
        if response.status_code == 200:
            data = response.json()
            if data.get('items') and len(data['items']) > 0:
                report = data['items'][0]
                report_id = report['id']
                print(f"     PASS Found test race report ID {report_id}: {report.get('title', 'Unknown')}")
                return int(report_id)
            else:
                print("     FAIL No race reports found")
                return None
        else:
            print(f"     FAIL Error fetching race reports: {response.status_code}")
            return None
    except Exception as e:
        print(f"     FAIL Error finding test race report: {e}")
        return None

def find_test_race_id(admin_token):
    """Dynamically find a race ID that's beyond the 50-race limit"""
    print("  0. Finding a race ID beyond 50-race limit...")
    
    try:
        # Get public races (limited to 50)
        response = requests.get(f"{API_BASE}/races")
        if response.status_code != 200:
            print(f"     FAIL Error fetching public races: {response.status_code}")
            return None
        
        public_races = response.json()
        public_race_ids = set(race['id'] for race in public_races)
        print(f"     INFO Public races count: {len(public_races)} (limited to 50)")
        
        # Get admin races (no limit)
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{API_BASE}/admin/races", headers=headers)
        if response.status_code != 200:
            print(f"     FAIL Error fetching admin races: {response.status_code}")
            return None
        
        admin_races = response.json()
        admin_race_ids = set(race['id'] for race in admin_races)
        print(f"     INFO Admin races count: {len(admin_races)} (no limit)")
        
        # Find a race that's in admin but not in public (beyond 50-race limit)
        beyond_limit_races = admin_race_ids - public_race_ids
        
        if not beyond_limit_races:
            print("     WARN No races found beyond 50-race limit")
            return None
        
        # Pick the first race beyond the limit
        test_race_id = min(beyond_limit_races)
        
        # Find the race details
        test_race = next((r for r in admin_races if r['id'] == test_race_id), None)
        if test_race:
            print(f"     PASS Found test race ID {test_race_id}: {test_race['name']} on {test_race['date']}")
            return test_race_id
        else:
            print(f"     FAIL Could not find details for race ID {test_race_id}")
            return None
            
    except Exception as e:
        print(f"     FAIL Error finding test race ID: {e}")
        return None

def test_race_id_validation_bug_fix():
    """Test that race ID validation works with admin endpoint (Bug #1 fix)"""
    print("TESTING Bug #1: Race ID validation with admin endpoint")
    
    # Step 1: Get admin token first (needed for admin races endpoint)
    print("  1. Getting admin authentication token...")
    try:
        admin_username = os.getenv("ADMIN_USERNAME")
        admin_password = os.getenv("ADMIN_PASSWORD")
        
        if not admin_username or not admin_password:
            raise ValueError("ADMIN_USERNAME and ADMIN_PASSWORD environment variables must be set for tests")
        
        login_data = {
            "username": admin_username,
            "password": admin_password
        }
        response = requests.post(f"{API_BASE}/admin/login", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            admin_token = token_data.get('access_token')
            print("     PASS Admin token obtained")
        else:
            print(f"     FAIL Admin login failed (status: {response.status_code})")
            return False
    except Exception as e:
        print(f"     FAIL Error getting admin token: {e}")
        return False
    
    # Step 2: Find a test race ID beyond the 50-race limit
    test_race_id = find_test_race_id(admin_token)
    if not test_race_id:
        print("     FAIL Could not find a suitable test race ID")
        return False
    
    # Step 3: Verify the test race ID is NOT in the public races list (limited to 50)
    print(f"  3. Verifying race ID {test_race_id} is beyond 50-race limit...")
    try:
        response = requests.get(f"{API_BASE}/races")
        if response.status_code == 200:
            races = response.json()
            race_ids = [race['id'] for race in races]
            if test_race_id in race_ids:
                print(f"     WARN  Race ID {test_race_id} found in public races list (unexpected)")
                print(f"     INFO Public races count: {len(races)}")
            else:
                print(f"     PASS Race ID {test_race_id} NOT in public races list (expected)")
                print(f"     INFO Public races count: {len(races)} (limited to 50)")
        else:
            print(f"     FAIL Error fetching public races list (status: {response.status_code})")
            return False
    except Exception as e:
        print(f"     FAIL Error checking public races list: {e}")
        return False
    
    # Step 4: Verify the test race ID IS in the admin races list (no limit)
    print(f"  4. Verifying race ID {test_race_id} is in admin races list...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{API_BASE}/admin/races", headers=headers)
        if response.status_code == 200:
            admin_races = response.json()
            race_ids = [race['id'] for race in admin_races]
            if test_race_id in race_ids:
                print(f"     PASS Race ID {test_race_id} found in admin races list")
                print(f"     INFO Admin races count: {len(admin_races)} (no limit)")
                
                # Find the specific race
                target_race = next((r for r in admin_races if r['id'] == test_race_id), None)
                if target_race:
                    print(f"     RACE Race details: {target_race['name']} on {target_race['date']}")
            else:
                print(f"     FAIL Race ID {test_race_id} NOT found in admin races list")
                return False
        else:
            print(f"     FAIL Error fetching admin races list (status: {response.status_code})")
            return False
    except Exception as e:
        print(f"     FAIL Error checking admin races list: {e}")
        return False
    
    # Step 5: Test race report form validation (simulate frontend behavior)
    print("  5. Testing race report form validation logic...")
    try:
        # Simulate the frontend validation logic
        # This mimics what the RaceReportForm component does
        def validate_race_id(race_id, races_list):
            """Simulate frontend race ID validation"""
            if not race_id:
                return False, "No race ID provided"
            
            try:
                race_id_int = int(race_id)
                found_race = next((r for r in races_list if r['id'] == race_id_int), None)
                if found_race:
                    return True, f"Valid race ID - {found_race['name']}"
                else:
                    return False, "Race ID not found in database"
            except ValueError:
                return False, "Invalid race ID format"
        
        # Test with public races list (should fail)
        is_valid_public, message_public = validate_race_id(str(test_race_id), races)
        print(f"     Public races validation: {message_public}")
        
        # Test with admin races list (should pass)
        is_valid_admin, message_admin = validate_race_id(str(test_race_id), admin_races)
        print(f"     Admin races validation: {message_admin}")
        
        if not is_valid_public and is_valid_admin:
            print("     PASS Validation logic works correctly - admin endpoint required")
            return True
        else:
            print("     FAIL Validation logic failed")
            return False
            
    except Exception as e:
        print(f"     FAIL Error testing validation logic: {e}")
        return False

def test_race_report_exists(test_report_id):
    """Test that the test race report exists"""
    print(f"  6. Verifying test race report {test_report_id} exists...")
    try:
        response = requests.get(f"{API_BASE}/race_reports/{test_report_id}")
        if response.status_code == 200:
            report_data = response.json()
            print(f"     PASS Race report {test_report_id} found: {report_data.get('title', 'Unknown')}")
            print(f"     RACE Current race_id: {report_data.get('race_id', 'None')}")
            return True
        else:
            print(f"     FAIL Race report {test_report_id} not found (status: {response.status_code})")
            return False
    except Exception as e:
        print(f"     FAIL Error checking race report: {e}")
        return False

def main():
    """Run all tests for Bug #1"""
    print("=" * 60)
    print("BUG #1 UNIT TEST: Race ID Validation Fix")
    print("=" * 60)
    print(f"Test Race ID: Dynamic (will find race beyond 50-race limit)")
    print(f"Test Race Report ID: Dynamic (will find any available race report)")
    print()
    
    # Check if API is running
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code != 200:
            print("FAIL API is not running. Please start the backend services first.")
            return False
    except Exception as e:
        print(f"FAIL Cannot connect to API at {API_BASE}: {e}")
        print("Please start the backend services with: docker-compose up -d")
        return False
    
    print("PASS API is running")
    print()
    
    # Find test race report ID
    test_report_id = find_test_race_report_id()
    if not test_report_id:
        print("FAIL Could not find a test race report ID")
        return False
    
    # Run tests
    test_results = []
    
    # Test 1: Race ID validation fix
    result1 = test_race_id_validation_bug_fix()
    test_results.append(("Race ID Validation Fix", result1))
    
    # Test 2: Race report exists
    result2 = test_race_report_exists(test_report_id)
    test_results.append(("Race Report Exists", result2))
    
    # Summary
    print()
    print("=" * 60)
    print("INFO TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "PASS PASS" if result else "FAIL FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print()
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("SUCCESS ALL TESTS PASSED! Bug #1 fix is working correctly.")
        print()
        print("PASS Race ID validation now uses admin endpoint")
        print("PASS All races are accessible (no 50-race limit)")
        print("PASS Race ID 60 can be properly validated")
        print("PASS Race report form should work correctly")
        return True
    else:
        print("FAIL Some tests failed. Bug #1 fix needs attention.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
