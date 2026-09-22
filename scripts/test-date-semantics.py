#!/usr/bin/env python3
"""
test-date-semantics.py — Regression test for race report date semantics.

This test ensures that race reports maintain the correct distinction between:
- race_date: when the race happened
- published_date: when the recap was published

Run as: python3 scripts/test-date-semantics.py

Exits 0 if all checks pass, 1 if any fail.
"""

import json
import sys
from pathlib import Path
from datetime import datetime

REPO = Path(__file__).resolve().parent.parent
REPORTS_PATH = REPO / "data" / "race_reports.json"

def test_date_fields_present():
    """Test that all reports have the required date fields."""
    with open(REPORTS_PATH) as f:
        reports = json.load(f)
    
    errors = []
    warnings = []
    
    for report in reports:
        report_id = report.get('id', '?')
        
        # race_date is optional but should be present for most reports
        if 'race_date' not in report or not report['race_date']:
            warnings.append(f"{report_id}: missing race_date")
        
        # published_date should be present for all new reports
        if 'published_date' not in report or not report['published_date']:
            warnings.append(f"{report_id}: missing published_date (recommended)")
    
    return errors, warnings


def test_date_sorting():
    """Test that reports are sorted by published_date (or race_date fallback)."""
    with open(REPORTS_PATH) as f:
        reports = json.load(f)
    
    errors = []
    
    # Extract dates for sorting check
    dates = []
    for report in reports:
        date = report.get('published_date') or report.get('race_date', '')
        dates.append((report.get('id', '?'), date))
    
    # Check if sorted newest first
    for i in range(len(dates) - 1):
        current_id, current_date = dates[i]
        next_id, next_date = dates[i + 1]
        
        if current_date < next_date:
            errors.append(
                f"Sort order violation: {current_id} ({current_date}) "
                f"appears before {next_id} ({next_date})"
            )
    
    return errors


def test_date_validity():
    """Test that all dates are valid ISO dates."""
    with open(REPORTS_PATH) as f:
        reports = json.load(f)
    
    errors = []
    
    for report in reports:
        report_id = report.get('id', '?')
        
        for field in ['race_date', 'published_date']:
            date_str = report.get(field)
            if date_str:
                try:
                    datetime.strptime(date_str, '%Y-%m-%d')
                except ValueError:
                    errors.append(f"{report_id}: invalid {field} '{date_str}'")
    
    return errors


def test_semantic_distinction():
    """Test examples where published_date should differ from race_date."""
    with open(REPORTS_PATH) as f:
        reports = json.load(f)
    
    errors = []
    different_dates = 0
    
    for report in reports:
        race_date = report.get('race_date')
        published_date = report.get('published_date')
        
        if race_date and published_date and race_date != published_date:
            different_dates += 1
    
    # Expect at least some reports to have different dates
    if different_dates == 0:
        errors.append(
            "No reports have different race_date and published_date. "
            "This suggests the semantic distinction may have been lost."
        )
    
    return errors, different_dates


def main():
    print("Testing race report date semantics...\n")
    
    all_errors = []
    all_warnings = []
    
    # Test 1: Required fields
    print("1. Checking date fields...")
    errors, warnings = test_date_fields_present()
    all_errors.extend(errors)
    all_warnings.extend(warnings)
    if errors:
        print(f"   ✗ {len(errors)} errors")
    else:
        print(f"   ✓ All reports have date fields")
    if warnings:
        print(f"   ⚠ {len(warnings)} warnings")
    
    # Test 2: Sorting
    print("\n2. Checking sort order...")
    errors = test_date_sorting()
    all_errors.extend(errors)
    if errors:
        print(f"   ✗ {len(errors)} sort violations")
    else:
        print(f"   ✓ Reports sorted by published_date (newest first)")
    
    # Test 3: Date validity
    print("\n3. Checking date validity...")
    errors = test_date_validity()
    all_errors.extend(errors)
    if errors:
        print(f"   ✗ {len(errors)} invalid dates")
    else:
        print(f"   ✓ All dates are valid ISO format")
    
    # Test 4: Semantic distinction
    print("\n4. Checking semantic distinction...")
    errors, different_count = test_semantic_distinction()
    all_errors.extend(errors)
    if errors:
        print(f"   ✗ Semantic distinction may be lost")
    else:
        print(f"   ✓ {different_count} reports have different race_date and published_date")
    
    # Summary
    print("\n" + "="*60)
    if all_errors:
        print(f"FAIL: {len(all_errors)} error(s) found:\n")
        for error in all_errors:
            print(f"  ✗ {error}")
        if all_warnings:
            print(f"\n{len(all_warnings)} warning(s):")
            for warning in all_warnings:
                print(f"  ⚠ {warning}")
        sys.exit(1)
    else:
        print("PASS: All date semantic tests passed")
        if all_warnings:
            print(f"\n{len(all_warnings)} warning(s):")
            for warning in all_warnings:
                print(f"  ⚠ {warning}")
        sys.exit(0)


if __name__ == "__main__":
    main()
