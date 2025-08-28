#!/usr/bin/env python3
"""
Test Runner for Bug #1: Race Reports Import/Export System

This script runs the comprehensive test suite for Bug #1.
"""

import sys
import os

# Add the tests directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from tests.test_012_bug_1_comprehensive_test import run_bug_1_tests

if __name__ == "__main__":
    print("Starting Bug #1 Test Suite...")
    success = run_bug_1_tests()
    
    if success:
        print("\nAll tests passed! Bug #1 is fully resolved.")
        sys.exit(0)
    else:
        print("\nSome tests failed. Please review the output above.")
        sys.exit(1)
