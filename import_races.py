#!/usr/bin/env python3
"""
Race CSV Import Script with Detailed Error Reporting
Use this script to import your race CSV files and get detailed error messages for any failures.
"""

import sys
import os

# Add the tests directory to path to import the import function
sys.path.append(os.path.join(os.path.dirname(__file__), 'tests'))

try:
    # Import the function using importlib to handle the filename with numbers
    import importlib.util
    spec = importlib.util.spec_from_file_location("csv_import_test", os.path.join(os.path.dirname(__file__), 'tests', '002_csv_import_test.py'))
    csv_import_test = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(csv_import_test)
    import_csv_with_error_reporting = csv_import_test.import_csv_with_error_reporting
except ImportError as e:
    print(f"❌ Error: Could not import import function: {e}")
    print("   Make sure you're running this from the project root directory.")
    sys.exit(1)

def main():
    """Main import function."""
    if len(sys.argv) != 2:
        print("Usage: python import_races.py <path_to_csv_file>")
        print("Example: python import_races.py races.csv")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    
    # Check if file exists
    if not os.path.exists(csv_file):
        print(f"❌ Error: CSV file '{csv_file}' not found.")
        sys.exit(1)
    
    print(f"🚀 Starting import of: {csv_file}")
    print("=" * 60)
    
    # Import the CSV file
    results = import_csv_with_error_reporting(csv_file)
    
    # Print final summary
    print("\n" + "=" * 60)
    print("📊 FINAL IMPORT SUMMARY")
    print("=" * 60)
    print(f"📁 File: {csv_file}")
    print(f"📊 Total Rows: {results['total_rows']}")
    print(f"✅ Successful: {results['successful_imports']}")
    print(f"❌ Failed: {results['failed_imports']}")
    
    if results['failed_imports'] > 0:
        print(f"\n⚠️  {results['failed_imports']} rows failed to import!")
        print("   Check the error details above to fix the issues.")
        print("   Common issues include:")
        print("   - Invalid date format (use YYYY-MM-DD)")
        print("   - Invalid time format (use HH:MM or HH:MM:SS)")
        print("   - Invalid surface type (use: road, trail, track, virtual, other)")
        print("   - Missing required fields (name, date, start_time, city, state, surface)")
        print("   - Invalid coordinates (latitude: -90 to 90, longitude: -180 to 180)")
        
        # Save errors to file for reference
        error_file = f"{csv_file}_errors.txt"
        with open(error_file, 'w') as f:
            f.write(f"Import Errors for {csv_file}\n")
            f.write("=" * 50 + "\n\n")
            for error in results['errors']:
                f.write(f"Row {error['row']}: {error['race_name']}\n")
                f.write(f"Error: {error['error']}\n")
                f.write(f"Data: {error['data']}\n\n")
        
        print(f"\n📝 Detailed errors saved to: {error_file}")
        sys.exit(1)
    else:
        print("\n🎉 All rows imported successfully!")
        print("   Your races are now in the database.")
        sys.exit(0)

if __name__ == "__main__":
    main()
