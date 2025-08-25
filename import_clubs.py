#!/usr/bin/env python3
"""
CLI script to import clubs from CSV file.
Usage: python import_clubs.py <csv_file>
"""

import sys
import os
import csv
import psycopg
from typing import List, Dict, Any

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://rh_user:rh_pass@localhost:5432/runhou")

def validate_club_row(row: Dict[str, Any]) -> List[str]:
    """Validate a club row and return list of errors."""
    errors = []
    
    # Check required fields
    if not row.get('club_name') or not row['club_name'].strip():
        errors.append("club_name is required")
    
    # Check club_name length
    if row.get('club_name') and len(row['club_name'].strip()) < 2:
        errors.append("club_name must be at least 2 characters")
    if row.get('club_name') and len(row['club_name'].strip()) > 200:
        errors.append("club_name must be less than 200 characters")
    
    # Check location length
    if row.get('location') and len(row['location'].strip()) > 120:
        errors.append("location must be less than 120 characters")
    
    # Check website URL format
    if row.get('website_url') and row['website_url'].strip():
        url = row['website_url'].strip()
        if not (url.startswith('http://') or url.startswith('https://')):
            errors.append("website_url must start with http:// or https://")
        if len(url) > 2048:
            errors.append("website_url must be less than 2048 characters")
    
    return errors

def import_clubs_from_csv(csv_file: str) -> None:
    """Import clubs from CSV file."""
    if not os.path.exists(csv_file):
        print(f"Error: CSV file '{csv_file}' not found")
        sys.exit(1)
    
    # Connect to database
    try:
        conn = psycopg.connect(DATABASE_URL)
        cur = conn.cursor()
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            # Validate headers
            expected_headers = ['id', 'club_name', 'location', 'website_url']
            if not all(header in reader.fieldnames for header in expected_headers):
                print(f"Error: CSV must contain headers: {expected_headers}")
                print(f"Found headers: {reader.fieldnames}")
                sys.exit(1)
            
            total_rows = 0
            successful_imports = 0
            errors = []
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 for header row
                total_rows += 1
                
                # Validate row
                row_errors = validate_club_row(row)
                if row_errors:
                    errors.append(f"Row {row_num}: {', '.join(row_errors)}")
                    continue
                
                try:
                    # Clean data
                    club_name = row['club_name'].strip()
                    location = row['location'].strip() if row['location'] else None
                    website_url = row['website_url'].strip() if row['website_url'] else None
                    
                    # Insert club
                    cur.execute(
                        "INSERT INTO clubs (club_name, location, website_url) VALUES (%s, %s, %s) RETURNING id",
                        (club_name, location, website_url)
                    )
                    club_id = cur.fetchone()[0]
                    conn.commit()
                    
                    print(f"✓ Imported club: {club_name} (ID: {club_id})")
                    successful_imports += 1
                    
                except psycopg.errors.UniqueViolation:
                    errors.append(f"Row {row_num}: Club '{club_name}' already exists")
                    conn.rollback()
                except Exception as e:
                    errors.append(f"Row {row_num}: Database error - {e}")
                    conn.rollback()
            
            # Summary
            print(f"\nImport Summary:")
            print(f"Total rows processed: {total_rows}")
            print(f"Successfully imported: {successful_imports}")
            print(f"Errors: {len(errors)}")
            
            if errors:
                print(f"\nErrors:")
                for error in errors:
                    print(f"  {error}")
    
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python import_clubs.py <csv_file>")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    import_clubs_from_csv(csv_file)
