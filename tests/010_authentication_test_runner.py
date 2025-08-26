#!/usr/bin/env python3
"""
Authentication Tests Runner - Run Houston

Quick test runner specifically for authentication fixes.
Run this to verify all admin secret authentication is working correctly.
"""

import sys
import os

# Add the tests directory to the path
sys.path.insert(0, os.path.dirname(__file__))

# Import and run the authentication tests
from test_009_authentication_fixes_test import run_authentication_tests

if __name__ == "__main__":
    print("🔐 Running Authentication Fixes Tests...")
    print("This will test all the authentication changes we made:")
    print("✅ Races API - Admin secret authentication")
    print("✅ Clubs API - Admin secret authentication")
    print("✅ Race Reports API - Admin secret authentication")
    print("✅ CSV Export - Admin secret authentication")
    print("✅ Public endpoints - No authentication required")
    print("✅ Error handling - Invalid/missing admin secrets")
    print()
    
    try:
        passed, failed, errors = run_authentication_tests()
        
        if failed == 0:
            print("\n🎉 All authentication tests passed!")
            print("Your admin secret authentication is working correctly.")
            sys.exit(0)
        else:
            print(f"\n🚨 {failed} authentication test(s) failed.")
            print("Please check the errors above and fix any issues.")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n💥 Error running authentication tests: {e}")
        print("Make sure your backend is running on http://localhost:8000")
        sys.exit(1)
