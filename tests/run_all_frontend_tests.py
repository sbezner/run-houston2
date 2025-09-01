#!/usr/bin/env python3
"""
Frontend Test Runner - Run Houston Web Frontend Tests
Purpose: Execute all frontend tests and provide comprehensive reporting
"""

import subprocess
import sys
import os
from pathlib import Path

def run_frontend_tests():
    """Run all frontend tests and return results."""
    print("Running Frontend Tests (JavaScript)")
    print("=" * 50)
    
    # Find web directory
    web_dir = Path(__file__).parent.parent / "web"
    if not web_dir.exists():
        print(f"Web directory not found at: {web_dir}")
        return False
    
    print(f"Found web directory at: {web_dir}")
    
    # Check if package.json exists
    package_json = web_dir / "package.json"
    if not package_json.exists():
        print(f"package.json not found in web directory")
        return False
    
    # Check if node_modules exists
    node_modules = web_dir / "node_modules"
    if not node_modules.exists():
        print(f"node_modules not found. Please run 'npm install' in the web directory")
        return False
    
    print(f"Using npm for testing")
    
    try:
        # Check if npm is available
        npm_check = subprocess.run(
            ["npm", "--version"],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            shell=True  # Use shell to find npm in PATH
        )
        
        if npm_check.returncode != 0:
            print("Error: 'npm' command not found! Please install Node.js.")
            return False
        
        print(f"Using npm version: {npm_check.stdout.strip()}")
        
        # Change to web directory and run tests
        print("\nStarting Frontend Tests...")
        print("-" * 30)
        
        # Run npm test
        result = subprocess.run(
            ["npm", "test"],
            cwd=web_dir,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            timeout=300,  # 5 minute timeout
            shell=True    # Use shell to find npm in PATH
        )
        
        # Print output
        if result.stdout:
            print("Test Output:")
            print("=" * 40)
            print(result.stdout)
        
        if result.stderr:
            print("Error Output:")
            print("=" * 40)
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
    except FileNotFoundError:
        print("npm not found. Please install Node.js to run frontend tests.")
        return False
    except Exception as e:
        print(f"Unexpected error running frontend tests: {e}")
        return False

def main():
    """Main test runner for frontend tests."""
    print("Frontend Test Suite - Run Houston")
    print("=" * 50)
    print("Testing React web application")
    print("=" * 50)
    
    # Run frontend tests
    success = run_frontend_tests()
    
    # Summary
    print("\n" + "=" * 50)
    print("Frontend Test Results Summary:")
    print("=" * 50)
    
    if success:
        print("Frontend Tests: PASSED")
        print("   All frontend functionality is working correctly!")
        print("   React components are functioning properly!")
        print("   Web application is ready for deployment!")
    else:
        print("Frontend Tests: FAILED")
        print("   Some frontend functionality may have issues!")
        print("   Please review the error output above!")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
