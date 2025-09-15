#!/usr/bin/env python3
"""
Run All Tests Combined Script
Runs both backend (Python) and frontend (JavaScript) tests regardless of environment.
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def print_header():
    """Print a nice header for the test runner."""
    print("Running ALL Unit Tests (Backend + Frontend + Mobile)")
    print("=" * 50)
    print(f"Platform: {platform.system()} {platform.release()}")
    print(f"Python: {sys.version.split()[0]}")
    print("=" * 50)
    print("Test Coverage Includes:")
    print("   • PostGIS Geometry & Coordinate Validation")
    print("   • CSV Import/Export Functionality")
    print("   • Clubs & Races API Endpoints")
    print("   • Frontend-Backend Validation")
    print("   • Authentication & JWT Tests")
    print("   • Network Validation Tests")
    print("   • Admin Components Authentication Tests")
    print("   • Mobile App Infinite Scroll Tests")
    print("   • Version System Tests (API Headers, Endpoints)")
    print("   • Migration System Tests (Runner, Tracking)")
    print("   • Monitoring System Tests (Metrics, Performance)")
    print("=" * 50)

def run_backend_tests():
    """Run the Python backend tests."""
    print("\nRunning Backend Tests (Python)...")
    
    # Try multiple possible paths for the tests directory
    possible_tests_paths = [
        Path("."),                # From tests directory
        Path("tests"),            # From project root
        Path("../tests"),         # From deeper subdirectory
    ]
    
    tests_dir = None
    for path in possible_tests_paths:
        if path.exists() and (path / "run_all_backend_tests.py").exists():
            tests_dir = path
            break
    
    if tests_dir is None:
        print("ERROR: 'tests' directory with run_all_backend_tests.py not found!")
        print("   Tried paths:")
        for path in possible_tests_paths:
            print(f"     - {path.absolute()}")
        return False
    
    print(f"Found tests directory at: {tests_dir.absolute()}")
    
    try:
        # Run the backend tests
        result = subprocess.run(
            [sys.executable, "run_all_backend_tests.py"],
            cwd=tests_dir,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=300  # 5 minute timeout
        )
        
        # Print output
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr)
        
        if result.returncode == 0:
            print("Backend Tests: PASSED")
            return True
        else:
            print(f"Backend Tests: FAILED (Exit code: {result.returncode})")
            return False
            
    except subprocess.TimeoutExpired:
        print("Backend Tests: TIMEOUT (took longer than 5 minutes)")
        return False
    except Exception as e:
        print(f"Backend Tests: ERROR - {e}")
        return False

def run_frontend_tests():
    """Run the JavaScript frontend tests using the dedicated runner."""
    print("\nRunning Frontend Tests (JavaScript)...")
    
    try:
        # Import and run the dedicated frontend test runner
        frontend_runner_path = Path(__file__).parent / "run_all_frontend_tests.py"
        
        if not frontend_runner_path.exists():
            print("ERROR: Frontend test runner not found!")
            return False
        
        # Run the dedicated frontend test runner
        result = subprocess.run(
            [sys.executable, str(frontend_runner_path)],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=300,  # 5 minute timeout
            cwd=Path(__file__).parent  # Run from tests directory
        )
        
        # Print output
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr)
        
        if result.returncode == 0:
            print("Frontend Tests: PASSED")
            return True
        else:
            print(f"Frontend Tests: FAILED (Exit code: {result.returncode})")
            return False
            
    except subprocess.TimeoutExpired:
        print("Frontend Tests: TIMEOUT (took longer than 5 minutes)")
        return False
    except Exception as e:
        print(f"Frontend Tests: ERROR - {e}")
        return False

def run_mobile_tests():
    """Run the mobile app tests using the dedicated runner."""
    print("\nRunning Mobile Tests (React Native)...")
    
    try:
        # Import and run the dedicated mobile test runner
        mobile_runner_path = Path(__file__).parent / "run_all_mobile_tests.py"
        
        if not mobile_runner_path.exists():
            print("ERROR: Mobile test runner not found!")
            return False
        
        print(f"Using mobile test runner: {mobile_runner_path}")
        
        # Run the mobile tests
        result = subprocess.run(
            [sys.executable, "run_all_mobile_tests.py"],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=120,  # 2 minute timeout
            shell=True    # Use shell to find python in PATH
        )
        
        # Print output
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr)
        
        if result.returncode == 0:
            print("Mobile Tests: PASSED")
            return True
        else:
            print(f"Mobile Tests: FAILED (Exit code: {result.returncode})")
            return False
            
    except subprocess.TimeoutExpired:
        print("Mobile Tests: TIMEOUT (took longer than 2 minutes)")
        return False
    except Exception as e:
        print(f"Mobile Tests: ERROR - {e}")
        return False

def main():
    """Main function to run all tests."""
    print_header()
    
    # Store results
    backend_success = False
    frontend_success = False
    mobile_success = False
    
    # Run backend tests
    backend_success = run_backend_tests()
    
    # Run frontend tests
    frontend_success = run_frontend_tests()
    
    # Run mobile tests
    mobile_success = run_mobile_tests()
    
    # Print summary
    print("\n" + "=" * 50)
    print("Test Results Summary:")
    print("=" * 50)
    
    print(f"Backend Tests:  {'PASSED' if backend_success else 'FAILED'}")
    print(f"   • PostGIS & Geometry (Critical)")
    print(f"   • CSV Import/Export (High Risk)")
    print(f"   • API Endpoints (Clubs, Races, Race Reports)")
    print(f"   • Frontend-Backend Validation")
    print(f"   • Version System (API Headers, Endpoints)")
    print(f"   • Migration System (Runner, Tracking)")
    print(f"")
    print(f"Frontend Tests: {'PASSED' if frontend_success else 'FAILED'}")
    print(f"   • React Components & Validation")
    print(f"   • Admin Dashboard Functionality")
    print(f"   • CSV Import/Export UI")
    print(f"")
    print(f"Mobile Tests:   {'PASSED' if mobile_success else 'FAILED'}")
    print(f"   • Infinite Scroll Logic (Bug #22)")
    print(f"   • Pagination State Management")
    print(f"   • Performance & Error Handling")
    
    print("\n" + "=" * 50)
    
    if backend_success and frontend_success and mobile_success:
        print("ALL TESTS PASSED!")
        print("Your application is ready for deployment!")
        return 0
    else:
        print("Some tests failed. Check the output above.")
        print("Please fix the failing tests before proceeding.")
        return 1

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user.")
        sys.exit(130)
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        sys.exit(1)
