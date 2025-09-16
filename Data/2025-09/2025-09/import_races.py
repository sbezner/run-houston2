#!/usr/bin/env python3
"""
Race Data Import Script
Safely imports race data from CSV into the database without schema changes.
"""

import csv
import psycopg
import os
import sys
from datetime import datetime, date, time
from typing import List, Dict, Any
import re

# Database connection
DATABASE_URL = "postgresql://rh_user:rh_pass@localhost:5432/runhou"

def normalize_distance(distance_str: str) -> List[str]:
    """Convert distance string to normalized array format."""
    if not distance_str or distance_str.strip() == '':
        return ['5k']  # default
    
    # Split by comma, clean up, and normalize
    distances = [d.strip().lower() for d in distance_str.split(',') if d.strip()]
    
    # Normalize to canonical forms
    normalized = []
    for d in distances:
        if d in ['5k', '5k']:
            normalized.append('5k')
        elif d in ['10k', '10k']:
            normalized.append('10k')
        elif d in ['half', 'half marathon', 'halfmarathon']:
            normalized.append('half marathon')
        elif d in ['full', 'marathon']:
            normalized.append('marathon')
        elif d in ['ultra']:
            normalized.append('ultra')
        elif d in ['kids', 'other']:
            normalized.append('other')
        else:
            normalized.append('other')  # fallback
    
    return normalized if normalized else ['5k']

def parse_date(date_str: str) -> date:
    """Parse flexible date formats."""
    if not date_str:
        raise ValueError("Empty date")
    
    # Try different formats
    formats = ['%m/%d/%Y', '%Y-%m-%d', '%m-%d-%Y']
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError:
            continue
    
    raise ValueError(f"Unable to parse date: {date_str}")

def parse_time(time_str: str) -> time:
    """Parse time string."""
    if not time_str:
        raise ValueError("Empty time")
    
    try:
        return datetime.strptime(time_str.strip(), '%H:%M:%S').time()
    except ValueError:
        raise ValueError(f"Unable to parse time: {time_str}")

def parse_boolean(bool_str: str) -> bool:
    """Parse boolean from string."""
    return bool_str.strip().upper() == 'TRUE'

def validate_race_data(row: Dict[str, str]) -> Dict[str, Any]:
    """Validate and transform race data."""
    try:
        # Required fields
        required = ['name', 'date', 'start_time', 'city', 'state', 'surface']
        for field in required:
            if not row.get(field) or not row[field].strip():
                raise ValueError(f"Missing required field: {field}")
        
        # Parse and validate
        race_data = {
            'name': row['name'].strip(),
            'date': parse_date(row['date']),
            'start_time': parse_time(row['start_time']),
            'tz': row.get('tz', 'America/Chicago').strip(),
            'address': row.get('address', '').strip() or None,
            'city': row['city'].strip(),
            'state': row['state'].strip(),
            'zip': row.get('zip', '').strip() or None,
            'latitude': float(row['latitude']) if row.get('latitude') else None,
            'longitude': float(row['longitude']) if row.get('longitude') else None,
            'surface': row['surface'].strip(),
            'distance': normalize_distance(row.get('distance', '')),
            'kid_run': parse_boolean(row.get('kid_run', 'FALSE')),
            'official_website_url': row.get('official_website_url', '').strip() or None,
            'source': row.get('source', 'csv_import').strip()
        }
        
        # Validate coordinates
        if race_data['latitude'] is not None:
            if not (-90 <= race_data['latitude'] <= 90):
                raise ValueError(f"Invalid latitude: {race_data['latitude']}")
        
        if race_data['longitude'] is not None:
            if not (-180 <= race_data['longitude'] <= 180):
                raise ValueError(f"Invalid longitude: {race_data['longitude']}")
        
        return race_data
        
    except Exception as e:
        raise ValueError(f"Validation error for row: {e}")

def check_duplicates(conn, race_data: Dict[str, Any]) -> bool:
    """Check if race already exists (name + date + city)."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT COUNT(*) FROM races 
            WHERE name = %s AND date = %s AND city = %s
        """, (race_data['name'], race_data['date'], race_data['city']))
        return cur.fetchone()[0] > 0

def import_races(csv_file: str, dry_run: bool = False):
    """Import races from CSV file."""
    print(f"Starting race import from: {csv_file}")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE IMPORT'}")
    print("-" * 50)
    
    # Connect to database
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            print("✓ Connected to database")
            
            # Read and process CSV
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                rows = list(reader)
            
            print(f"✓ Loaded {len(rows)} rows from CSV")
            
            # Process each row
            imported = 0
            skipped = 0
            errors = 0
            
            for i, row in enumerate(rows, 1):
                try:
                    # Validate and transform data
                    race_data = validate_race_data(row)
                    
                    # Check for duplicates
                    if check_duplicates(conn, race_data):
                        print(f"  Row {i}: SKIPPED (duplicate) - {race_data['name']} on {race_data['date']}")
                        skipped += 1
                        continue
                    
                    if dry_run:
                        print(f"  Row {i}: WOULD IMPORT - {race_data['name']} on {race_data['date']}")
                        imported += 1
                    else:
                        # Insert into database
                        with conn.cursor() as cur:
                            cur.execute("""
                                INSERT INTO races (
                                    name, date, start_time, tz, address, city, state, zip,
                                    latitude, longitude, surface, distance, kid_run,
                                    official_website_url, source
                                ) VALUES (
                                    %(name)s, %(date)s, %(start_time)s, %(tz)s, %(address)s,
                                    %(city)s, %(state)s, %(zip)s, %(latitude)s, %(longitude)s,
                                    %(surface)s, %(distance)s, %(kid_run)s, %(official_website_url)s, %(source)s
                                )
                            """, race_data)
                        
                        print(f"  Row {i}: IMPORTED - {race_data['name']} on {race_data['date']}")
                        imported += 1
                
                except Exception as e:
                    print(f"  Row {i}: ERROR - {e}")
                    errors += 1
            
            # Commit if not dry run
            if not dry_run:
                conn.commit()
                print("✓ Changes committed to database")
            
            # Summary
            print("-" * 50)
            print(f"IMPORT SUMMARY:")
            print(f"  Total rows processed: {len(rows)}")
            print(f"  Imported: {imported}")
            print(f"  Skipped (duplicates): {skipped}")
            print(f"  Errors: {errors}")
            
            if not dry_run:
                # Verify final count
                with conn.cursor() as cur:
                    cur.execute("SELECT COUNT(*) FROM races")
                    final_count = cur.fetchone()[0]
                print(f"  Final race count in database: {final_count}")
    
    except Exception as e:
        print(f"✗ Database error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Import race data from CSV')
    parser.add_argument('csv_file', help='Path to CSV file')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be imported without making changes')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.csv_file):
        print(f"Error: CSV file not found: {args.csv_file}")
        sys.exit(1)
    
    import_races(args.csv_file, dry_run=args.dry_run)
