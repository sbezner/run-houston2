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
    print("🚀 Running ALL Unit Tests (Backend + Frontend)")
    print("=" * 50)
    print(f"Platform: {platform.system()} {platform.release()}")
    print(f"Python: {sys.version.split()[0]}")
    print("=" * 50)
    print("📋 Test Coverage Includes:")
    print("   • PostGIS Geometry & Coordinate Validation")
    print("   • CSV Import/Export Functionality")
    print("   • Clubs & Races API Endpoints")
    print("   • Frontend-Backend Validation")
    print("   • 🔐 NEW: Authentication Fixes (Admin Secret)")
    print("=" * 50)

def run_backend_tests():
    """Run the Python backend tests."""
    print("\n🐍 Running Backend Tests (Python)...")
    
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
        print("❌ Error: 'tests' directory with run_all_backend_tests.py not found!")
        print("   Tried paths:")
        for path in possible_tests_paths:
            print(f"     - {path.absolute()}")
        return False
    
    print(f"📁 Found tests directory at: {tests_dir.absolute()}")
    
    try:
        # Run the backend tests
        result = subprocess.run(
            [sys.executable, "run_all_backend_tests.py"],
            cwd=tests_dir,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        # Print output
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr)
        
        if result.returncode == 0:
            print("✅ Backend Tests: PASSED")
            return True
        else:
            print(f"❌ Backend Tests: FAILED (Exit code: {result.returncode})")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Backend Tests: TIMEOUT (took longer than 5 minutes)")
        return False
    except Exception as e:
        print(f"❌ Backend Tests: ERROR - {e}")
        return False

def run_frontend_tests():
    """Run the JavaScript frontend tests."""
    print("\n⚛️  Running Frontend Tests (JavaScript)...")
    
    # Try multiple possible paths for the web directory
    possible_paths = [
        Path("../web"),           # From tests directory
        Path("web"),              # From project root
        Path("../../web"),        # From deeper subdirectory
    ]
    
    web_dir = None
    for path in possible_paths:
        if path.exists():
            web_dir = path
            break
    
    if web_dir is None:
        print("❌ Error: 'web' directory not found!")
        print("   Tried paths:")
        for path in possible_paths:
            print(f"     - {path.absolute()}")
        return False
    
    print(f"📁 Found web directory at: {web_dir.absolute()}")
    
    # Check if package.json exists
    package_json = web_dir / "package.json"
    if not package_json.exists():
        print("❌ Error: '../web/package.json' not found!")
        return False
    
    try:
        # Check if npm is available
        npm_check = subprocess.run(
            ["npm", "--version"],
            capture_output=True,
            text=True,
            shell=True  # Use shell to find npm in PATH
        )
        
        if npm_check.returncode != 0:
            print("❌ Error: 'npm' command not found! Please install Node.js.")
            return False
        
        print(f"📦 Using npm version: {npm_check.stdout.strip()}")
        
        # Run the frontend tests
        result = subprocess.run(
            ["npm", "test"],
            cwd=web_dir,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            shell=True    # Use shell to find npm in PATH
        )
        
        # Print output
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr)
        
        if result.returncode == 0:
            print("✅ Frontend Tests: PASSED")
            return True
        else:
            print(f"❌ Frontend Tests: FAILED (Exit code: {result.returncode})")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Frontend Tests: TIMEOUT (took longer than 5 minutes)")
        return False
    except Exception as e:
        print(f"❌ Frontend Tests: ERROR - {e}")
        return False

def main():
    """Main function to run all tests."""
    print_header()
    
    # Store results
    backend_success = False
    frontend_success = False
    
    # Run backend tests
    backend_success = run_backend_tests()
    
    # Run frontend tests
    frontend_success = run_frontend_tests()
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print("=" * 50)
    
    print(f"Backend Tests:  {'✅ PASSED' if backend_success else '❌ FAILED'}")
    print(f"   • PostGIS & Geometry (Critical)")
    print(f"   • CSV Import/Export (High Risk)")
    print(f"   • API Endpoints (Clubs, Races, Race Reports)")
    print(f"   • Frontend-Backend Validation")
    print(f"   • 🔐 Authentication Fixes (Admin Secret)")
    print(f"   • 🏃 Bug #1 Race Reports (Comprehensive)")
    print(f"Frontend Tests: {'✅ PASSED' if frontend_success else '❌ FAILED'}")
    
    print("\n" + "=" * 50)
    
    if backend_success and frontend_success:
        print("🎉 ALL TESTS PASSED!")
        print("Your application is ready for deployment! 🚀")
        return 0
    else:
        print("💥 Some tests failed. Check the output above.")
        print("Please fix the failing tests before proceeding.")
        return 1

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user.")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n💥 Unexpected error: {e}")
        sys.exit(1)
