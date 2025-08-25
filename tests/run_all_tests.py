#!/usr/bin/env python3
"""
Test Runner: All CSV Import Tests
Purpose: Run all CSV import related tests in sequence
Provides comprehensive validation of the import system
"""

import os
import sys
import subprocess
import time

def run_test_file(test_file, description):
    """Run a specific test file and return the result."""
    print(f"\n{'='*80}")
    print(f"🧪 Running: {description}")
    print(f"📁 File: {test_file}")
    print(f"{'='*80}")
    
    if not os.path.exists(test_file):
        print(f"❌ Test file not found: {test_file}")
        return False
    
    try:
        # Run the test file
        result = subprocess.run([sys.executable, test_file], 
                              capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            print("✅ Test completed successfully!")
            if result.stdout:
                print("\n📋 Test Output:")
                print(result.stdout)
        else:
            print("❌ Test failed!")
            if result.stdout:
                print("\n📋 Test Output:")
                print(result.stdout)
            if result.stderr:
                print("\n🚨 Test Errors:")
                print(result.stderr)
            raise Exception("Test failed")
            
    except subprocess.TimeoutExpired:
        print("⏰ Test timed out after 5 minutes")
        raise
    except Exception as e:
        print(f"💥 Test execution error: {e}")
        raise

def run_pytest_tests():
    """Run pytest-based tests."""
    print(f"\n{'='*80}")
    print("🧪 Running Pytest Tests")
    print(f"{'='*80}")
    
    try:
        # Check if pytest is available
        result = subprocess.run([sys.executable, "-m", "pytest", "--version"], 
                              capture_output=True, text=True)
        
        if result.returncode != 0:
            print("❌ Pytest not available. Install with: pip install pytest")
            raise Exception("Pytest not available")
        
        # Run the validation tests
        print("\n🔍 Running Frontend-Backend Validation Tests...")
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "tests/test_frontend_validation.py", "-v", "--tb=short"
        ], capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            print("✅ Validation tests passed!")
            if result.stdout:
                print("\n📋 Test Summary:")
                # Show just the summary part
                lines = result.stdout.split('\n')
                summary_lines = [line for line in lines if 'passed' in line.lower() or 'failed' in line.lower()]
                for line in summary_lines[-5:]:  # Last 5 lines
                    print(line)
        else:
            print("❌ Validation tests failed!")
            if result.stderr:
                print("\n🚨 Test Errors:")
                print(result.stderr)
            raise Exception("Validation tests failed")
        
        # Run the integration tests
        print("\n🔍 Running Integration Tests...")
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "tests/test_csv_import_integration.py", "-v", "--tb=short"
        ], capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            print("✅ Integration tests passed!")
            if result.stdout:
                print("\n📋 Test Summary:")
                # Show just the summary part
                lines = result.stdout.split('\n')
                summary_lines = [line for line in lines if 'passed' in line.lower() or 'failed' in line.lower()]
                for line in summary_lines[-5:]:  # Last 5 lines
                    print(line)
        else:
            print("❌ Integration tests failed!")
            if result.stderr:
                print("\n🚨 Test Errors:")
                print(result.stderr)
            raise Exception("Integration tests failed")
        
        # Run the clubs API tests
        print("\n🔍 Running Clubs API Tests...")
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "tests/003_clubs_api_test.py", "-v", "--tb=short"
        ], capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            print("✅ Clubs API tests passed!")
            if result.stdout:
                print("\n📋 Test Summary:")
                # Show just the summary part
                lines = result.stdout.split('\n')
                summary_lines = [line for line in lines if 'passed' in line.lower() or 'failed' in line.lower()]
                for line in summary_lines[-5:]:  # Last 5 lines
                    print(line)
        else:
            print("❌ Clubs API tests failed!")
            if result.stderr:
                print("\n🚨 Test Errors:")
                print(result.stderr)
            raise Exception("Clubs API tests failed")
        
        # If we get here, all tests passed
        return True
        
    except subprocess.TimeoutExpired:
        print("⏰ Pytest tests timed out")
        return False
    except Exception as e:
        print(f"💥 Pytest execution error: {e}")
        return False

def main():
    """Main test runner."""
    print("🧪 Complete Test Suite Runner")
    print("=" * 80)
    print("This will run all tests to ensure:")
    print("✅ Frontend validation matches backend expectations")
    print("✅ CSV parsing works correctly")
    print("✅ Database constraints are enforced")
    print("✅ Integration workflow functions properly")
    print("✅ Clubs API endpoints work correctly")
    print("=" * 80)
    
    start_time = time.time()
    test_results = []
    
    # Run the existing CSV import test
    test_results.append(run_test_file(
        "tests/002_csv_import_test.py",
        "Database CSV Import Tests (Existing)"
    ))
    
    # Run pytest-based tests
    test_results.append(run_pytest_tests())
    
    # Calculate total time
    total_time = time.time() - start_time
    
    # Summary
    print(f"\n{'='*80}")
    print("📊 TEST RESULTS SUMMARY")
    print(f"{'='*80}")
    
    # Handle mixed result types (some tests return None for success)
    valid_results = []
    for result in test_results:
        if result is None:
            valid_results.append(True)  # None means success for some test functions
        else:
            valid_results.append(bool(result))
    
    passed = sum(valid_results)
    total = len(valid_results)
    
    print(f"⏱️  Total Time: {total_time:.1f} seconds")
    print(f"📈 Overall Results:")
    print(f"   Total Test Suites: {total}")
    print(f"   ✅ Passed: {passed}")
    print(f"   ❌ Failed: {total - passed}")
    
    if passed == total:
        print(f"\n🎉 ALL TEST SUITES PASSED!")
        print("   Your CSV import system is working correctly!")
        print("   Frontend validation matches backend expectations.")
        print("   No more 'parse OK' then backend failure scenarios!")
    else:
        print(f"\n⚠️  {total - passed} test suite(s) failed.")
        print("   Please check the results above and fix any issues.")
    
    print(f"\n💡 Next Steps:")
    print("   • Run individual tests: python tests/test_frontend_validation.py")
    print("   • Run clubs tests: python tests/003_clubs_api_test.py")
    print("   • Run with pytest: python -m pytest tests/ -v")
    print("   • Check specific test files for detailed output")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
