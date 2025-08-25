#!/usr/bin/env python3
"""
CLI script to export clubs to CSV file.
Usage: python export_clubs.py [output_file]
"""

import sys
import os
import csv
import psycopg
from typing import List, Tuple

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://rh_user:rh_pass@localhost:5432/runhou")

def export_clubs_to_csv(output_file: str = "clubs.csv") -> None:
    """Export clubs to CSV file."""
    # Connect to database
    try:
        conn = psycopg.connect(DATABASE_URL)
        cur = conn.cursor()
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)
    
    try:
        # Query clubs
        cur.execute("SELECT id, club_name, location, website_url FROM clubs ORDER BY club_name")
        clubs = cur.fetchall()
        
        if not clubs:
            print("No clubs found in database")
            return
        
        # Write to CSV
        with open(output_file, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            
            # Write header
            writer.writerow(['id', 'club_name', 'location', 'website_url'])
            
            # Write data
            for club in clubs:
                writer.writerow(club)
        
        print(f"✓ Exported {len(clubs)} clubs to '{output_file}'")
        
        # Show preview
        print(f"\nPreview of exported data:")
        print(f"{'ID':<5} {'Club Name':<40} {'Location':<20} {'Website'}")
        print("-" * 80)
        for club in clubs[:5]:  # Show first 5
            id, name, location, website = club
            name_display = name[:37] + "..." if len(name) > 40 else name
            location_display = location[:17] + "..." if location and len(location) > 20 else (location or "")
            website_display = website[:20] + "..." if website and len(website) > 20 else (website or "")
            print(f"{id:<5} {name_display:<40} {location_display:<20} {website_display}")
        
        if len(clubs) > 5:
            print(f"... and {len(clubs) - 5} more clubs")
    
    except Exception as e:
        print(f"Error exporting clubs: {e}")
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    output_file = sys.argv[1] if len(sys.argv) > 1 else "clubs.csv"
    export_clubs_to_csv(output_file)
