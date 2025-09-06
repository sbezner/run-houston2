#!/usr/bin/env python3
"""
Test suite for monitoring and metrics functionality.

This test suite validates:
- Monitoring endpoints functionality
- Metrics collection and tracking
- Performance monitoring
- Version usage tracking
- Error tracking
- Health check enhancements
"""

import requests
import json
import time
import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Test configuration
API_BASE_URL = "http://localhost:8000"
API_PATH = "/api/v1"

def test_monitoring_endpoints():
    """Test monitoring endpoints are accessible and return valid data."""
    print("Testing monitoring endpoints...")
    
    # Test version metrics endpoint
    try:
        response = requests.get(f"{API_BASE_URL}{API_PATH}/monitoring/version-metrics")
        assert response.status_code == 200, f"Version metrics endpoint failed: {response.status_code}"
        
        data = response.json()
        assert "version_usage" in data, "Version metrics missing version_usage"
        assert "total_api_calls" in data, "Version metrics missing total_api_calls"
        assert "total_errors" in data, "Version metrics missing total_errors"
        assert "uptime_seconds" in data, "Version metrics missing uptime_seconds"
        
        print("[PASS] Version metrics endpoint working")
    except Exception as e:
        print(f"[FAIL] Version metrics endpoint failed: {e}")
        return False
    
    # Test performance metrics endpoint
    try:
        response = requests.get(f"{API_BASE_URL}{API_PATH}/monitoring/performance")
        assert response.status_code == 200, f"Performance metrics endpoint failed: {response.status_code}"
        
        data = response.json()
        assert "average_response_time" in data, "Performance metrics missing average_response_time"
        assert "slowest_endpoints" in data, "Performance metrics missing slowest_endpoints"
        assert "total_requests" in data, "Performance metrics missing total_requests"
        
        print("[PASS] Performance metrics endpoint working")
    except Exception as e:
        print(f"[FAIL] Performance metrics endpoint failed: {e}")
        return False
    
    # Test detailed health endpoint
    try:
        response = requests.get(f"{API_BASE_URL}{API_PATH}/monitoring/health-detailed")
        assert response.status_code == 200, f"Detailed health endpoint failed: {response.status_code}"
        
        data = response.json()
        assert "status" in data, "Detailed health missing status"
        assert "api_version" in data, "Detailed health missing api_version"
        assert "schema_version" in data, "Detailed health missing schema_version"
        assert "system_release" in data, "Detailed health missing system_release"
        assert "uptime_seconds" in data, "Detailed health missing uptime_seconds"
        assert "total_api_calls" in data, "Detailed health missing total_api_calls"
        assert "total_errors" in data, "Detailed health missing total_errors"
        assert "average_response_time_ms" in data, "Detailed health missing average_response_time_ms"
        assert "version_usage" in data, "Detailed health missing version_usage"
        assert "error_breakdown" in data, "Detailed health missing error_breakdown"
        assert "api_call_breakdown" in data, "Detailed health missing api_call_breakdown"
        
        print("[PASS] Detailed health endpoint working")
    except Exception as e:
        print(f"[FAIL] Detailed health endpoint failed: {e}")
        return False
    
    return True

def test_metrics_tracking():
    """Test that metrics are being tracked properly."""
    print("Testing metrics tracking...")
    
    # Make some API calls to generate metrics
    test_endpoints = [
        f"{API_BASE_URL}{API_PATH}/version",
        f"{API_BASE_URL}/health",
        f"{API_BASE_URL}{API_PATH}/races",
        f"{API_BASE_URL}{API_PATH}/clubs"
    ]
    
    for endpoint in test_endpoints:
        try:
            response = requests.get(endpoint)
            # Don't assert success as some endpoints might require auth
            print(f"  Called {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"  Error calling {endpoint}: {e}")
    
    # Wait a moment for metrics to be processed
    time.sleep(1)
    
    # Check that metrics are being tracked
    try:
        response = requests.get(f"{API_BASE_URL}{API_PATH}/monitoring/version-metrics")
        assert response.status_code == 200, "Failed to get version metrics"
        
        data = response.json()
        assert data["total_api_calls"] > 0, "No API calls tracked"
        
        print("[PASS] Metrics tracking working")
    except Exception as e:
        print(f"[FAIL] Metrics tracking failed: {e}")
        return False
    
    return True

def test_performance_monitoring():
    """Test performance monitoring functionality."""
    print("Testing performance monitoring...")
    
    # Make multiple requests to generate performance data
    for i in range(5):
        try:
            response = requests.get(f"{API_BASE_URL}{API_PATH}/version")
            time.sleep(0.1)  # Small delay between requests
        except Exception as e:
            print(f"  Error in performance test: {e}")
    
    # Wait for metrics to be processed
    time.sleep(1)
    
    # Check performance metrics
    try:
        response = requests.get(f"{API_BASE_URL}{API_PATH}/monitoring/performance")
        assert response.status_code == 200, "Failed to get performance metrics"
        
        data = response.json()
        assert "average_response_time" in data, "Missing average_response_time"
        assert "slowest_endpoints" in data, "Missing slowest_endpoints"
        assert "total_requests" in data, "Missing total_requests"
        
        # Check that we have some performance data
        assert data["total_requests"] > 0, "No performance data collected"
        
        print("[PASS] Performance monitoring working")
    except Exception as e:
        print(f"[FAIL] Performance monitoring failed: {e}")
        return False
    
    return True

def test_version_usage_tracking():
    """Test version usage tracking."""
    print("Testing version usage tracking...")
    
    # Call the version endpoint multiple times to track usage
    for i in range(3):
        try:
            response = requests.get(f"{API_BASE_URL}{API_PATH}/version")
            time.sleep(0.1)
        except Exception as e:
            print(f"  Error in version usage test: {e}")
    
    # Wait for metrics to be processed
    time.sleep(1)
    
    # Check version usage metrics
    try:
        response = requests.get(f"{API_BASE_URL}{API_PATH}/monitoring/version-metrics")
        assert response.status_code == 200, "Failed to get version metrics"
        
        data = response.json()
        assert "version_usage" in data, "Missing version_usage"
        
        # Check that version usage is being tracked
        version_usage = data["version_usage"]
        assert len(version_usage) > 0, "No version usage tracked"
        
        print("[PASS] Version usage tracking working")
    except Exception as e:
        print(f"[FAIL] Version usage tracking failed: {e}")
        return False
    
    return True

def test_enhanced_health_check():
    """Test enhanced health check with monitoring data."""
    print("Testing enhanced health check...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        assert response.status_code == 200, "Health check failed"
        
        data = response.json()
        assert "status" in data, "Missing status in health check"
        assert "api_version" in data, "Missing api_version in health check"
        assert "schema_version" in data, "Missing schema_version in health check"
        assert "system_release" in data, "Missing system_release in health check"
        assert "uptime_seconds" in data, "Missing uptime_seconds in health check"
        assert "total_api_calls" in data, "Missing total_api_calls in health check"
        assert "total_errors" in data, "Missing total_errors in health check"
        
        # Check that uptime is reasonable (not negative)
        assert data["uptime_seconds"] >= 0, "Invalid uptime_seconds"
        
        # Check that API calls count is reasonable
        assert data["total_api_calls"] >= 0, "Invalid total_api_calls"
        
        print("[PASS] Enhanced health check working")
    except Exception as e:
        print(f"[FAIL] Enhanced health check failed: {e}")
        return False
    
    return True

def test_error_tracking():
    """Test error tracking functionality."""
    print("Testing error tracking...")
    
    # Make some requests that might generate errors
    error_endpoints = [
        f"{API_BASE_URL}{API_PATH}/nonexistent",
        f"{API_BASE_URL}{API_PATH}/races/999999",  # Non-existent race
        f"{API_BASE_URL}{API_PATH}/clubs/999999"   # Non-existent club
    ]
    
    for endpoint in error_endpoints:
        try:
            response = requests.get(endpoint)
            print(f"  Called {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"  Error calling {endpoint}: {e}")
    
    # Wait for metrics to be processed
    time.sleep(1)
    
    # Check error tracking
    try:
        response = requests.get(f"{API_BASE_URL}{API_PATH}/monitoring/health-detailed")
        assert response.status_code == 200, "Failed to get detailed health"
        
        data = response.json()
        assert "error_breakdown" in data, "Missing error_breakdown"
        assert "total_errors" in data, "Missing total_errors"
        
        print("[PASS] Error tracking working")
    except Exception as e:
        print(f"[FAIL] Error tracking failed: {e}")
        return False
    
    return True

def test_monitoring_data_consistency():
    """Test that monitoring data is consistent across endpoints."""
    print("Testing monitoring data consistency...")
    
    try:
        # Get data from all monitoring endpoints
        version_response = requests.get(f"{API_BASE_URL}{API_PATH}/monitoring/version-metrics")
        performance_response = requests.get(f"{API_BASE_URL}{API_PATH}/monitoring/performance")
        health_response = requests.get(f"{API_BASE_URL}{API_PATH}/monitoring/health-detailed")
        
        assert version_response.status_code == 200, "Version metrics failed"
        assert performance_response.status_code == 200, "Performance metrics failed"
        assert health_response.status_code == 200, "Health check failed"
        
        version_data = version_response.json()
        performance_data = performance_response.json()
        health_data = health_response.json()
        
        # Check that total API calls are consistent (allow for small differences due to timing)
        version_calls = version_data["total_api_calls"]
        health_calls = health_data["total_api_calls"]
        call_diff = abs(version_calls - health_calls)
        assert call_diff <= 3, f"API calls count inconsistent: version={version_calls}, health={health_calls}, diff={call_diff}"
        
        # Check that total errors are consistent
        assert version_data["total_errors"] == health_data["total_errors"], "Error count inconsistent"
        
        # Check that uptime is consistent (allow for small differences due to timing)
        version_uptime = version_data["uptime_seconds"]
        health_uptime = health_data["uptime_seconds"]
        uptime_diff = abs(version_uptime - health_uptime)
        assert uptime_diff <= 1.0, f"Uptime inconsistent: version={version_uptime}, health={health_uptime}, diff={uptime_diff}"
        
        print("[PASS] Monitoring data consistency verified")
    except Exception as e:
        print(f"[FAIL] Monitoring data consistency failed: {e}")
        return False
    
    return True

def run_monitoring_tests():
    """Run all monitoring tests."""
    print("=" * 60)
    print("MONITORING SYSTEM TESTS")
    print("=" * 60)
    
    tests = [
        ("Monitoring Endpoints", test_monitoring_endpoints),
        ("Metrics Tracking", test_metrics_tracking),
        ("Performance Monitoring", test_performance_monitoring),
        ("Version Usage Tracking", test_version_usage_tracking),
        ("Enhanced Health Check", test_enhanced_health_check),
        ("Error Tracking", test_error_tracking),
        ("Data Consistency", test_monitoring_data_consistency),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        try:
            if test_func():
                passed += 1
                print(f"[PASS] {test_name} PASSED")
            else:
                print(f"[FAIL] {test_name} FAILED")
        except Exception as e:
            print(f"[ERROR] {test_name} ERROR: {e}")
    
    print("\n" + "=" * 60)
    print(f"MONITORING TESTS COMPLETE: {passed}/{total} PASSED")
    print("=" * 60)
    
    return passed == total

if __name__ == "__main__":
    success = run_monitoring_tests()
    sys.exit(0 if success else 1)
