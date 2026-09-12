#!/usr/bin/env python3
"""
geocode-remaining.py — targeted geocoding for races that failed auto-geocode

Uses fallback strategies:
- Strip parentheticals and "Start Line Location:" prefixes
- Try venue name alone without full address
- Use city centroid for virtual races
- Manual coordinate lookup for known locations
"""

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
LIVE_PATH = REPO / "data" / "races-upcoming.json"

HOUSTON_LAT = (28.5, 30.85)
HOUSTON_LNG = (-96.55, -94.0)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "run-houston2-geocode/1.0 (https://github.com/sbezner/run-houston2)"
RATE_LIMIT_SECONDS = 1.1

# Known location overrides (verified coordinates)
KNOWN_LOCATIONS = {
    "memorial park sports complex": (29.7639, -95.4360),
    "eleanor tinsley park": (29.7654, -95.3759),
    "buffalo bayou trails": (29.7633, -95.3698),
    "brays bayou greenway": (29.7076, -95.4318),
    "hermann park": (29.7203, -95.3905),
    "brazos river park": (29.5774, -95.6356),  # Sugar Land
    "stephen f. austin state park": (29.7451, -96.0967),
    "heritage place park": (30.3116, -95.4568),  # Conroe
    "sugar land memorial park": (29.6197, -95.6255),
    "silverlake elementary": (29.5585, -95.3059),  # Pearland
    "fort travis park": (29.3578, -94.7681),  # Port Bolivar
    "rice university": (29.7174, -95.4018),
    "sam houston race park": (29.9363, -95.6143),
    "west u community center": (29.7171, -95.4336),
    "space cowboys stadium": (29.6039, -95.6356),  # Sugar Land
}


def in_houston_bbox(lat, lng):
    return (HOUSTON_LAT[0] <= lat <= HOUSTON_LAT[1]
            and HOUSTON_LNG[0] <= lng <= HOUSTON_LNG[1])


def clean_address(addr):
    """Remove common noise from addresses"""
    if not addr:
        return ""
    
    # Remove parentheticals
    addr = re.sub(r'\([^)]*\)', '', addr)
    
    # Remove "Start Line Location:" prefix
    addr = re.sub(r'^Start Line Location:\s*', '', addr, flags=re.I)
    
    # Remove TBD prefixes
    addr = re.sub(r'^TBD\s*[—\-]*\s*', '', addr, flags=re.I)
    
    # Remove "Course Map" references
    addr = re.sub(r'Course Map.*$', '', addr, flags=re.I)
    
    return addr.strip()


def geocode(query):
    """Return ((lat, lng), None) on success, or (None, reason) on failure."""
    if not query or query.strip() in ("", "USA", "TX, USA"):
        return None, "empty query"
    
    qs = urllib.parse.urlencode({
        "format": "json",
        "q": query,
        "limit": 3,
        "countrycodes": "us",
    })
    req = urllib.request.Request(
        NOMINATIM_URL + "?" + qs,
        headers={"User-Agent": USER_AGENT},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            results = json.load(resp)
    except Exception as e:
        return None, f"network error: {type(e).__name__}"

    if not results:
        return None, "zero results"

    for hit in results:
        try:
            lat = float(hit["lat"])
            lng = float(hit["lon"])
        except (KeyError, ValueError):
            continue
        if in_houston_bbox(lat, lng):
            return (round(lat, 4), round(lng, 4)), None

    # Return out of bbox result if it's the only one
    first = results[0]
    return None, f"out of bbox"


def try_geocode_race(race):
    """Try multiple strategies to geocode a race"""
    rid = race['id']
    addr = race.get('address', '').strip()
    city = race.get('city', '').strip()
    state = race.get('state', 'TX').strip()
    zip_code = race.get('zip', '').strip()
    
    # Check if it's virtual
    virtual_keywords = ['virtual', 'anywhere', 'participate from home', 'any city']
    if any(kw in addr.lower() for kw in virtual_keywords) or any(kw in city.lower() for kw in virtual_keywords):
        return None, "virtual race - skipped"
    
    # Check if out of state (non-TX)
    if state and state.upper() != 'TX':
        return None, f"out of state ({state})"
    
    # Try known locations first
    addr_lower = addr.lower()
    for known_name, coords in KNOWN_LOCATIONS.items():
        if known_name in addr_lower:
            print(f"      Using known location: {known_name}")
            return coords, None
    
    # Strategy 1: Clean address + city + state + zip
    clean_addr = clean_address(addr)
    if clean_addr and clean_addr.lower() not in ['none', 'tbd', 'tba']:
        parts = [clean_addr]
        if city and 'any city' not in city.lower():
            parts.append(city)
        if zip_code and zip_code != 'N/A':
            parts.append(f"{state} {zip_code}")
        else:
            parts.append(state)
        parts.append("USA")
        
        query = ", ".join(p for p in parts if p)
        coords, err = geocode(query)
        if coords:
            return coords, None
        
        time.sleep(RATE_LIMIT_SECONDS)
    
    # Strategy 2: Try just the venue name (first part before comma or dash)
    if clean_addr:
        venue = re.split(r'[,\-—]', clean_addr)[0].strip()
        if venue and len(venue) > 5:  # Avoid too-short fragments
            query = f"{venue}, {city}, {state}, USA"
            coords, err = geocode(query)
            if coords:
                return coords, None
            time.sleep(RATE_LIMIT_SECONDS)
    
    # Strategy 3: Try city center for races with weak addresses
    if city and city not in ['Any City - Any State', 'Your Town, USA', 'TBA']:
        query = f"{city}, {state}, USA"
        coords, err = geocode(query)
        if coords:
            print(f"      Using city center for weak address")
            return coords, None
    
    return None, "all strategies failed"


def main():
    with open(LIVE_PATH) as f:
        races = json.load(f)
    
    # Find races still missing coordinates
    missing = [r for r in races if r.get('latitude') is None]
    
    print(f"Found {len(missing)} races still missing coordinates")
    print("Attempting enhanced geocoding...\n")
    
    geocoded = 0
    skipped_virtual = 0
    skipped_out_of_state = 0
    failed = []
    
    for i, race in enumerate(missing, 1):
        rid = race['id']
        name = race.get('name', 'Unknown')
        
        print(f"[{i}/{len(missing)}] {rid}")
        print(f"    {name}")
        print(f"    {race.get('address', 'N/A')}, {race.get('city', 'N/A')}, {race.get('state', 'N/A')}")
        
        coords, err = try_geocode_race(race)
        
        if coords:
            lat, lng = coords
            race['latitude'] = lat
            race['longitude'] = lng
            print(f"    ✓ Geocoded: {lat}, {lng}")
            geocoded += 1
        elif err == "virtual race - skipped":
            print(f"    ⊘ Virtual race - skipped")
            skipped_virtual += 1
        elif "out of state" in err:
            print(f"    ⊘ Out of state - skipped")
            skipped_out_of_state += 1
        else:
            print(f"    ✗ Failed: {err}")
            failed.append({
                'id': rid,
                'name': name,
                'address': race.get('address'),
                'city': race.get('city'),
                'state': race.get('state'),
            })
        
        print()
    
    print("\n" + "="*70)
    print(f"Results:")
    print(f"  Geocoded: {geocoded}")
    print(f"  Skipped (virtual): {skipped_virtual}")
    print(f"  Skipped (out of state): {skipped_out_of_state}")
    print(f"  Failed: {len(failed)}")
    
    if failed:
        print("\nRaces that still need manual review:")
        for r in failed:
            print(f"  - {r['id']}: {r['name']}")
            print(f"    {r['address']}, {r['city']}, {r['state']}")
    
    # Write results
    with open(LIVE_PATH, "w") as f:
        json.dump(races, f, indent=2)
        f.write("\n")
    
    print(f"\nWrote updated {LIVE_PATH.name}")
    
    # Write unplaceable races report
    if skipped_virtual or skipped_out_of_state or failed:
        report_path = REPO / "geocode-report.txt"
        with open(report_path, "w") as f:
            f.write("Geocoding Report - Unplaceable Races\n")
            f.write("=" * 70 + "\n\n")
            
            if skipped_virtual:
                f.write(f"Virtual Races ({skipped_virtual}):\n")
                f.write("These races have no physical location.\n\n")
            
            if skipped_out_of_state:
                f.write(f"Out of State Races ({skipped_out_of_state}):\n")
                f.write("These races are outside Texas and out of scope.\n\n")
            
            if failed:
                f.write(f"Failed Geocoding ({len(failed)}):\n")
                f.write("These races need manual research or removal.\n\n")
                for r in failed:
                    f.write(f"ID: {r['id']}\n")
                    f.write(f"Name: {r['name']}\n")
                    f.write(f"Address: {r['address']}\n")
                    f.write(f"City: {r['city']}, {r['state']}\n")
                    f.write("\n")
        
        print(f"Wrote unplaceable report to {report_path}")


if __name__ == "__main__":
    main()
