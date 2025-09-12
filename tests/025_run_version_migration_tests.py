#!/usr/bin/env python3
"""
Version and Migration System Tests Runner

This script runs all versioning and migration system tests to ensure
the versioning infrastructure is working correctly.

Run with: python tests/025_run_version_migration_tests.py
"""

import subprocess
import sys
import os
from pathlib import Path

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
            print("PASS Test PASSED")
            if result.stdout:
                print("Output:")
                print(result.stdout)
        else:
            print("FAIL Test FAILED")
            if result.stderr:
                print("Errors:")
                print(result.stderr)
            if result.stdout:
                print("Output:")
                print(result.stdout)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"FAIL Error running test: {e}")
        return False

def main():
    """Run all version and migration tests."""
    print("Version and Migration System Test Suite")
    print("=" * 60)
    print("This test suite verifies:")
    print("  • API version headers on all endpoints")
    print("  • Version endpoint functionality")
    print("  • Health check version information")
    print("  • System release manifest")
    print("  • Migration runner functionality")
    print("  • Migration tracking system")
    print("  • Version consistency across components")
    print("=" * 60)
    
    # Test files in order of execution
    tests = [
        ("022_version_test.py", "Version System Test - API Headers, Endpoints, and Consistency"),
        ("023_migration_test.py", "Migration System Test - Migration Runner and Tracking"),
        ("024_monitoring_test.py", "Monitoring System Test - Metrics, Performance, and Health Tracking")
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
    print("VERSION AND MIGRATION TEST RESULTS")
    print(f"{'='*60}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print("\nSUCCESS ALL VERSION AND MIGRATION TESTS PASSED!")
        print("The versioning system is working correctly.")
        return 0
    else:
        print(f"\nFAIL {failed} test(s) failed. Please investigate and fix the issues.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
