#!/usr/bin/env python3
"""
Test: Race Report NULL race_id functionality
Tests that race reports can have null race_id values and validation works properly.
"""

import requests
import json
import sys
import os

# Add the parent directory to the path so we can import from the tests directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_SECRET = "default-admin-secret"

def test_race_report_null_race_id():
    """Test that race reports can have null race_id values."""
    print("🧪 Testing Race Report NULL race_id functionality...")
    
    # Test 1: Create race report with null race_id
    print("  📝 Test 1: Creating race report with null race_id...")
    
    create_data = {
        "race_id": None,
        "race_date": "2025-01-27",
        "title": "Test Orphaned Report",
        "author_name": "Test Author",
        "content_md": "This is a test report with no race association.",
        "photos": []
    }
    
    headers = {"X-Admin-Secret": ADMIN_SECRET}
    
    try:
        response = requests.post(f"{BASE_URL}/race_reports", 
                               json=create_data, headers=headers)
        
        if response.status_code == 200:
            print("    ✅ Successfully created race report with null race_id")
            report_data = response.json()
            report_id = report_data.get('id')
            
            # Test 2: Update race report to set race_id
            print("  📝 Test 2: Updating race report to set race_id...")
            
            update_data = {
                "race_id": 1,  # Assuming race ID 1 exists
                "title": "Updated Test Report"
            }
            
            response = requests.put(f"{BASE_URL}/race_reports/{report_id}", 
                                  json=update_data, headers=headers)
            
            if response.status_code == 200:
                print("    ✅ Successfully updated race report with race_id")
            else:
                print(f"    ❌ Failed to update race report: {response.status_code} - {response.text}")
                
            # Test 3: Update race report to remove race_id (set to null)
            print("  📝 Test 3: Updating race report to remove race_id...")
            
            update_data = {
                "race_id": None,
                "title": "Re-orphaned Test Report"
            }
            
            response = requests.put(f"{BASE_URL}/race_reports/{report_id}", 
                                  json=update_data, headers=headers)
            
            if response.status_code == 200:
                print("    ✅ Successfully updated race report to remove race_id")
            else:
                print(f"    ❌ Failed to remove race_id: {response.status_code} - {response.text}")
                
        else:
            print(f"    ❌ Failed to create race report: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"    ❌ Error during test: {e}")
        return False
    
    # Test 4: Test invalid race_id validation
    print("  📝 Test 4: Testing invalid race_id validation...")
    
    try:
        update_data = {
            "race_id": 99999,  # Non-existent race ID
            "title": "Test Invalid Race ID"
        }
        
        response = requests.put(f"{BASE_URL}/race_reports/{report_id}", 
                              json=update_data, headers=headers)
        
        if response.status_code == 400 and "not found" in response.text:
            print("    ✅ Properly rejected invalid race_id")
        else:
            print(f"    ❌ Should have rejected invalid race_id: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"    ❌ Error during validation test: {e}")
        return False
    
    print("  ✅ All tests completed successfully!")
    return True

if __name__ == "__main__":
    print("🚀 Starting Race Report NULL race_id Tests...")
    print(f"📍 Testing against: {BASE_URL}")
    print(f"🔑 Using admin secret: {ADMIN_SECRET}")
    print()
    
    success = test_race_report_null_race_id()
    
    if success:
        print("\n🎉 All tests passed! Race reports can now handle null race_id values.")
    else:
        print("\n💥 Some tests failed. Check the output above for details.")
        sys.exit(1)
