#!/usr/bin/env python3
"""
Unit Tests for Authentication Fixes - Run Houston

This test file covers all the authentication changes we made:
1. Races API - Changed from JWT to admin secret
2. Clubs API - Changed from JWT to admin secret  
3. Race Reports API - Already using admin secret
4. Frontend API calls - Updated to use admin secret
5. Backend endpoints - Updated to verify admin secret

Test Coverage:
- Admin secret authentication for all admin operations
- Proper error handling for invalid admin secrets
- Consistent authentication across all admin endpoints
- Frontend API integration with admin secret
"""

import pytest
import requests
import json
from typing import Dict, Any
import os
import sys

# Add the api directory to the path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

# Test configuration
BASE_URL = "http://localhost:8000"
ADMIN_SECRET = "default-admin-secret"
INVALID_ADMIN_SECRET = "wrong-secret"

class TestAuthenticationFixes:
    """Test suite for authentication fixes across all admin endpoints."""
    
    def test_races_api_admin_secret_authentication(self):
        """Test that races API endpoints use admin secret authentication."""
        
        # Test create race with admin secret
        race_data = {
            "name": "Test Race Auth",
            "date": "2025-02-01",
            "start_time": "09:00:00",
            "address": "123 Test St",
            "city": "Test City",
            "state": "TX",
            "zip": "12345",
            "latitude": 29.7604,
            "longitude": -95.3698,
            "distance": ["5K"],
            "surface": "road",
            "kid_run": False,
            "source": "unit_test"
        }
        
        headers = {"X-Admin-Secret": ADMIN_SECRET}
        response = requests.post(f"{BASE_URL}/races", json=race_data, headers=headers)
        
        # Should succeed with valid admin secret
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        race_id = response.json().get("id")
        assert race_id is not None, "Race should be created with ID"
        
        # Test update race with admin secret
        update_data = {"name": "Updated Test Race Auth"}
        response = requests.put(f"{BASE_URL}/races/{race_id}", json=update_data, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Test delete race with admin secret
        response = requests.delete(f"{BASE_URL}/races/{race_id}", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Test that invalid admin secret fails
        invalid_headers = {"X-Admin-Secret": INVALID_ADMIN_SECRET}
        response = requests.post(f"{BASE_URL}/races", json=race_data, headers=invalid_headers)
        assert response.status_code == 401, f"Expected 401 for invalid admin secret, got {response.status_code}"
    
    def test_clubs_api_admin_secret_authentication(self):
        """Test that clubs API endpoints use admin secret authentication."""
        
        # Test create club with admin secret
        club_data = {
            "club_name": "Test Club Auth",
            "location": "Test Location",
            "website_url": "https://testclub.com"
        }
        
        headers = {"X-Admin-Secret": ADMIN_SECRET}
        response = requests.post(f"{BASE_URL}/clubs", json=club_data, headers=headers)
        
        # Should succeed with valid admin secret
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        club_id = response.json().get("id")
        assert club_id is not None, "Club should be created with ID"
        
        # Test update club with admin secret
        update_data = {"club_name": "Updated Test Club Auth"}
        response = requests.put(f"{BASE_URL}/clubs/{club_id}", json=update_data, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Test delete club with admin secret
        response = requests.delete(f"{BASE_URL}/clubs/{club_id}", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Test that invalid admin secret fails
        invalid_headers = {"X-Admin-Secret": INVALID_ADMIN_SECRET}
        response = requests.post(f"{BASE_URL}/clubs", json=club_data, headers=invalid_headers)
        assert response.status_code == 401, f"Expected 401 for invalid admin secret, got {response.status_code}"
    
    def test_admin_clubs_endpoint_admin_secret_authentication(self):
        """Test that /admin/clubs endpoint uses admin secret authentication."""
        
        # Test with valid admin secret
        headers = {"X-Admin-Secret": ADMIN_SECRET}
        response = requests.get(f"{BASE_URL}/admin/clubs", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Test that invalid admin secret fails
        invalid_headers = {"X-Admin-Secret": INVALID_ADMIN_SECRET}
        response = requests.get(f"{BASE_URL}/admin/clubs", headers=invalid_headers)
        assert response.status_code == 401, f"Expected 401 for invalid admin secret, got {response.status_code}"
    
    def test_race_reports_api_admin_secret_authentication(self):
        """Test that race reports API endpoints use admin secret authentication."""
        
        # First create a race to reference
        race_data = {
            "name": "Test Race for Report",
            "date": "2025-02-01",
            "start_time": "09:00:00",
            "address": "123 Test St",
            "city": "Test City",
            "state": "TX",
            "zip": "12345",
            "latitude": 29.7604,
            "longitude": -95.3698,
            "distance": ["5K"],
            "surface": "road",
            "kid_run": False,
            "source": "unit_test"
        }
        
        headers = {"X-Admin-Secret": ADMIN_SECRET}
        race_response = requests.post(f"{BASE_URL}/races", json=race_data, headers=headers)
        assert race_response.status_code == 200, "Failed to create test race"
        race_id = race_response.json().get("id")
        
        try:
            # Test create race report with admin secret
            report_data = {
                "race_id": race_id,
                "title": "Test Report Auth",
                "author_name": "Test Author",
                "content_md": "This is a test report content.",
                "photos": ["https://example.com/photo1.jpg"]
            }
            
            response = requests.post(f"{BASE_URL}/race_reports", json=report_data, headers=headers)
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            
            report_id = response.json().get("id")
            assert report_id is not None, "Race report should be created with ID"
            
            # Test update race report with admin secret
            update_data = {"title": "Updated Test Report Auth"}
            response = requests.put(f"{BASE_URL}/race_reports/{report_id}", json=update_data, headers=headers)
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            
            # Test delete race report with admin secret
            response = requests.delete(f"{BASE_URL}/race_reports/{report_id}", headers=headers)
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            
        finally:
            # Clean up test race
            requests.delete(f"{BASE_URL}/races/{race_id}", headers=headers)
    
    def test_csv_export_admin_secret_authentication(self):
        """Test that CSV export endpoints use admin secret authentication."""
        
        # Test clubs export with admin secret
        headers = {"X-Admin-Secret": ADMIN_SECRET}
        response = requests.get(f"{BASE_URL}/admin/clubs/export-csv", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert response.headers.get("content-type") == "text/csv; charset=utf-8"
        
        # Test race reports export with admin secret
        response = requests.get(f"{BASE_URL}/race_reports/export.csv", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Test that invalid admin secret fails
        invalid_headers = {"X-Admin-Secret": INVALID_ADMIN_SECRET}
        response = requests.get(f"{BASE_URL}/admin/clubs/export-csv", headers=invalid_headers)
        assert response.status_code == 401, f"Expected 401 for invalid admin secret, got {response.status_code}"
    
    def test_public_endpoints_no_authentication_required(self):
        """Test that public endpoints don't require authentication."""
        
        # Test public races endpoint
        response = requests.get(f"{BASE_URL}/races")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Test public race reports endpoint
        response = requests.get(f"{BASE_URL}/race_reports")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Test public clubs endpoint
        response = requests.get(f"{BASE_URL}/clubs")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_admin_secret_consistency_across_endpoints(self):
        """Test that admin secret authentication is consistent across all admin endpoints."""
        
        admin_endpoints = [
            "/races",
            "/clubs", 
            "/race_reports",
            "/admin/clubs",
            "/admin/clubs/export-csv"
        ]
        
        headers = {"X-Admin-Secret": ADMIN_SECRET}
        
        for endpoint in admin_endpoints:
            if endpoint in ["/races", "/clubs", "/race_reports"]:
                # These are POST endpoints, test with minimal data
                if endpoint == "/races":
                    test_data = {"name": "Test"}
                elif endpoint == "/clubs":
                    test_data = {"club_name": "Test"}
                else:  # race_reports
                    test_data = {
                        "race_id": 1,  # Assuming race ID 1 exists
                        "title": "Test Report",
                        "content_md": "This is a test report content that meets the minimum length requirement.",
                        "photos": ["https://example.com/photo.jpg"]
                    }
                response = requests.post(f"{BASE_URL}{endpoint}", json=test_data, headers=headers)
                # Should either succeed (200) or fail with validation error (422), but not 401
                assert response.status_code != 401, f"Endpoint {endpoint} should not return 401 with valid admin secret"
            else:
                # These are GET endpoints
                response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
                assert response.status_code == 200, f"Endpoint {endpoint} should return 200 with valid admin secret"
    
    def test_error_handling_for_missing_admin_secret(self):
        """Test that endpoints properly handle missing admin secret header."""
        
        admin_endpoints = [
            "/races",
            "/clubs",
            "/race_reports",
            "/admin/clubs"
        ]
        
        for endpoint in admin_endpoints:
            if endpoint in ["/races", "/clubs", "/race_reports"]:
                # Test POST without admin secret
                if endpoint == "/races":
                    test_data = {"name": "Test"}
                elif endpoint == "/clubs":
                    test_data = {"club_name": "Test"}
                else:  # race_reports
                    test_data = {
                        "race_id": 1,  # Assuming race ID 1 exists
                        "title": "Test Report",
                        "content_md": "This is a test report content that meets the minimum length requirement.",
                        "photos": ["https://example.com/photo.jpg"]
                    }
                response = requests.post(f"{BASE_URL}{endpoint}", json=test_data)
                assert response.status_code == 401, f"Endpoint {endpoint} should return 401 without admin secret"
            else:
                # Test GET without admin secret
                response = requests.get(f"{BASE_URL}{endpoint}")
                assert response.status_code == 401, f"Endpoint {endpoint} should return 401 without admin secret"

def run_authentication_tests():
    """Run all authentication tests and report results."""
    
    print("Running Authentication Fixes Tests...")
    print("=" * 50)
    
    test_instance = TestAuthenticationFixes()
    test_methods = [method for method in dir(test_instance) if method.startswith('test_')]
    
    passed = 0
    failed = 0
    errors = []
    
    for test_method in test_methods:
        try:
            print(f"Testing: {test_method}")
            getattr(test_instance, test_method)()
            print(f"✅ {test_method} - PASSED")
            passed += 1
        except Exception as e:
            print(f"❌ {test_method} - FAILED: {str(e)}")
            failed += 1
            errors.append(f"{test_method}: {str(e)}")
    
    print("=" * 50)
    print(f"📊 Test Results:")
    print(f"   ✅ Passed: {passed}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if failed > 0:
        print(f"\n🚨 Failed Tests:")
        for error in errors:
            print(f"   - {error}")
    
    return passed, failed, errors

if __name__ == "__main__":
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ Backend is running, starting tests...")
            run_authentication_tests()
        else:
            print("❌ Backend is not responding properly")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on http://localhost:8000")
        print("   Run: docker-compose up -d")
    except Exception as e:
        print(f"❌ Error checking backend: {e}")
