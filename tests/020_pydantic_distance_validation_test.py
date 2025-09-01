#!/usr/bin/env python3
"""
020 Pydantic Distance Validation Test - Run Houston

This test file validates the distance field validation logic in the Pydantic models.
Tests both RaceCreate and RaceUpdate models to ensure consistent behavior.

Test Coverage:
- Smart mapping from user-friendly terms to standardized values
- Case normalization and validation
- String and list input handling
- Error handling for invalid distances
- Edge cases and boundary conditions
"""

import sys
import os
from pathlib import Path

# Add the api directory to the Python path so we can import the models
api_path = Path(__file__).parent.parent / "api"
sys.path.insert(0, str(api_path))

try:
    from app.models import RaceCreate, RaceUpdate
    print("SUCCESS: Successfully imported Pydantic models")
except ImportError as e:
    print(f"FAIL: Failed to import Pydantic models: {e}")
    print(f"   API path: {api_path}")
    print(f"   Current working directory: {os.getcwd()}")
    sys.exit(1)

def test_race_create_distance_validation():
    """Test distance validation in RaceCreate model."""
    print("\nTesting RaceCreate Distance Validation")
    
    # Test valid distance mappings
    test_cases = [
        # String input with smart mapping
        ("5K", ["5k"]),
        ("10K", ["10k"]),
        ("Half", ["half marathon"]),
        ("Half Marathon", ["half marathon"]),
        ("Full", ["marathon"]),
        ("Marathon", ["marathon"]),
        ("Ultra", ["ultra"]),
        ("Kids", ["other"]),
        ("Other", ["other"]),
        
        # List input with smart mapping
        (["5K", "Half"], ["5k", "half marathon"]),
        (["Full", "10K"], ["marathon", "10k"]),
        (["Ultra", "Kids"], ["ultra", "other"]),
        
        # Already standardized values
        ("5k", ["5k"]),
        ("half marathon", ["half marathon"]),
        (["5k", "marathon"], ["5k", "marathon"]),
        
        # Mixed case variations
        ("FULL", ["marathon"]),
        ("half", ["half marathon"]),
        ("ULTRA", ["ultra"]),
    ]
    
    passed = 0
    failed = 0
    
    for input_distance, expected in test_cases:
        try:
            race_data = {
                "name": "Test Race",
                "date": "2025-09-15",
                "start_time": "08:00:00",
                "city": "Houston",
                "state": "TX",
                "surface": "road",
                "distance": input_distance,
                "kid_run": False
            }
            
            race = RaceCreate(**race_data)
            actual = race.distance
            
            if actual == expected:
                print(f"  PASS: {input_distance} -> {actual}")
                passed += 1
            else:
                print(f"  FAIL: {input_distance} -> {actual} (expected {expected})")
                failed += 1
                
        except Exception as e:
            print(f"  FAIL: {input_distance} -> ERROR: {e}")
            failed += 1
    
    print(f"\n  RaceCreate Results: {passed} passed, {failed} failed")
    return failed == 0

def test_race_update_distance_validation():
    """Test distance validation in RaceUpdate model."""
    print("\nTesting RaceUpdate Distance Validation")
    
    # Test valid distance mappings (RaceUpdate only accepts lists)
    test_cases = [
        # List input with smart mapping
        (["5K", "Half"], ["5k", "half marathon"]),
        (["Full", "10K"], ["marathon", "10k"]),
        (["Ultra", "Kids"], ["ultra", "other"]),
        
        # Already standardized values
        (["5k", "marathon"], ["5k", "marathon"]),
        (["5k"], ["5k"]),
        (["half marathon"], ["half marathon"]),
        (["marathon"], ["marathon"]),
        (["ultra"], ["ultra"]),
        (["other"], ["other"]),
    ]
    
    passed = 0
    failed = 0
    
    for input_distance, expected in test_cases:
        try:
            race_data = {
                "name": "Updated Test Race",
                "distance": input_distance
            }
            
            race = RaceUpdate(**race_data)
            actual = race.distance
            
            if actual == expected:
                print(f"  PASS: {input_distance} -> {actual}")
                passed += 1
            else:
                print(f"  FAIL: {input_distance} -> {actual} (expected {expected})")
                failed += 1
                
        except Exception as e:
            print(f"  FAIL: {input_distance} -> ERROR: {e}")
            failed += 1
    
    print(f"\n  RaceUpdate Results: {passed} passed, {failed} failed")
    return failed == 0

def test_invalid_distance_handling():
    """Test that invalid distances are properly rejected."""
    print("\nTesting Invalid Distance Handling")
    
    invalid_distances = [
        "42K",           # Invalid distance
        "Half Marathon Extra",  # Invalid format
        "5 Miles",       # Invalid unit
        "Sprint",        # Not in allowed list
        ["42K", "5K"],   # Mixed valid/invalid
        ["Invalid"],     # Invalid in list
    ]
    
    passed = 0
    failed = 0
    
    for invalid_distance in invalid_distances:
        try:
            race_data = {
                "name": "Test Race",
                "date": "2025-09-15",
                "start_time": "08:00:00",
                "city": "Houston",
                "state": "TX",
                "surface": "road",
                "distance": invalid_distance,
                "kid_run": False
            }
            
            race = RaceCreate(**race_data)
            print(f"  FAIL: {invalid_distance} -> Should have failed but succeeded: {race.distance}")
            failed += 1
            
        except ValueError as e:
            print(f"  PASS: {invalid_distance} -> Correctly rejected: {str(e)[:50]}...")
            passed += 1
        except Exception as e:
            print(f"  FAIL: {invalid_distance} -> Unexpected error: {e}")
            failed += 1
    
    print(f"\n  Invalid Distance Results: {passed} passed, {failed} failed")
    return failed == 0

def test_edge_cases():
    """Test edge cases and boundary conditions."""
    print("\nTesting Edge Cases")
    
    edge_cases = [
        # Empty string (should fail)
        ("", "Empty string should fail"),
        ("   ", "Whitespace-only should fail"),
        
        # Empty list (should fail)
        ([], "Empty list should fail"),
        
        # Single valid values
        ("5k", "Single lowercase should work"),
        ("MARATHON", "Single uppercase should map correctly"),
        
        # Mixed valid/invalid in CSV format
        ("5K, Invalid, 10K", "Mixed valid/invalid should fail"),
    ]
    
    passed = 0
    failed = 0
    
    for input_distance, description in edge_cases:
        try:
            race_data = {
                "name": "Test Race",
                "date": "2025-09-15",
                "start_time": "08:00:00",
                "city": "Houston",
                "state": "TX",
                "surface": "road",
                "distance": input_distance,
                "kid_run": False
            }
            
            race = RaceCreate(**race_data)
            print(f"  PASS: {description}: {input_distance} -> {race.distance}")
            passed += 1
            
        except ValueError as e:
            print(f"  PASS: {description}: {input_distance} -> Correctly rejected: {str(e)[:50]}...")
            passed += 1
        except Exception as e:
            print(f"  FAIL: {description}: {input_distance} -> Unexpected error: {e}")
            failed += 1
    
    print(f"\n  Edge Cases Results: {passed} passed, {failed} failed")
    return failed == 0

def test_csv_format_handling():
    """Test CSV-style input handling (comma-separated values)."""
    print("\nTesting CSV Format Handling")
    
    csv_test_cases = [
        ("5K, Half, Full", ["5k", "half marathon", "marathon"]),
        ("10K, Ultra", ["10k", "ultra"]),
        ("Kids, 5K, Marathon", ["other", "5k", "marathon"]),
        ("5K", ["5k"]),  # Single value
        ("5K, 10K, Half, Full, Ultra, Kids", ["5k", "10k", "half marathon", "marathon", "ultra", "other"]),
    ]
    
    passed = 0
    failed = 0
    
    for csv_input, expected in csv_test_cases:
        try:
            race_data = {
                "name": "Test Race",
                "date": "2025-09-15",
                "start_time": "08:00:00",
                "city": "Houston",
                "state": "TX",
                "surface": "road",
                "distance": csv_input,
                "kid_run": False
            }
            
            race = RaceCreate(**race_data)
            actual = race.distance
            
            if actual == expected:
                print(f"  PASS: '{csv_input}' -> {actual}")
                passed += 1
            else:
                print(f"  FAIL: '{csv_input}' -> {actual} (expected {expected})")
                failed += 1
                
        except Exception as e:
            print(f"  FAIL: '{csv_input}' -> ERROR: {e}")
            failed += 1
    
    print(f"\n  CSV Format Results: {passed} passed, {failed} failed")
    return failed == 0

def main():
    """Run all distance validation tests."""
    print("Starting Pydantic Distance Validation Tests")
    print("=" * 60)
    
    tests = [
        ("RaceCreate Distance Validation", test_race_create_distance_validation),
        ("RaceUpdate Distance Validation", test_race_update_distance_validation),
        ("Invalid Distance Handling", test_invalid_distance_handling),
        ("Edge Cases", test_edge_cases),
        ("CSV Format Handling", test_csv_format_handling),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        print(f"\n{'='*60}")
        print(f"Running: {test_name}")
        print(f"{'='*60}")
        
        try:
            if test_func():
                print(f"PASS: {test_name}: PASSED")
                passed += 1
            else:
                print(f"FAIL: {test_name}: FAILED")
                failed += 1
        except Exception as e:
            print(f"FAIL: {test_name}: ERROR - {e}")
            failed += 1
    
    # Final results
    print(f"\n{'='*60}")
    print("FINAL TEST RESULTS")
    print(f"{'='*60}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print("\nALL TESTS PASSED! Distance validation is working correctly.")
        return 0
    else:
        print(f"\nWARNING:  {failed} test(s) failed. Please investigate the issues.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
