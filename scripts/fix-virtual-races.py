#!/usr/bin/env python3
"""
fix-virtual-races.py — handle virtual races and out-of-scope races

Actions:
1. Remove out-of-state races (CA races not relevant to Houston)
2. Mark virtual races with surface="virtual" and assign city center coords
3. Remove or mark races with insufficient location data (TBA)
"""

import json
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
LIVE_PATH = REPO / "data" / "races-upcoming.json"

# City center coordinates for virtual races
CITY_CENTERS = {
    "houston": (29.7589, -95.3677),  # Downtown Houston
    "pasadena": (29.6911, -95.2091),
    "sugar land": (29.6197, -95.6255),
    "katy": (29.7858, -95.8244),
    "the woodlands": (30.1658, -95.4613),
}


def main():
    with open(LIVE_PATH) as f:
        races = json.load(f)
    
    removed = []
    fixed_virtual = []
    
    races_to_keep = []
    
    for race in races:
        rid = race['id']
        name = race.get('name', '')
        addr = (race.get('address') or '').lower()
        city = (race.get('city') or '').lower()
        state = race.get('state', 'TX')
        
        # Remove out-of-state races
        if state and state.upper() != 'TX':
            print(f"Removing out-of-state race: {rid}")
            print(f"  {name} ({state})")
            removed.append({'id': rid, 'name': name, 'reason': f'Out of state ({state})'})
            continue
        
        # Handle virtual races
        is_virtual = any(kw in addr or kw in city for kw in [
            'virtual', 'anywhere', 'participate from home', 'any city'
        ]) or 'VIRTUAL' in name.upper()
        
        if is_virtual and race.get('latitude') is None:
            # Mark as virtual surface and assign city center
            race['surface'] = 'virtual'
            
            # Try to find city center
            city_key = None
            for known_city in CITY_CENTERS:
                if known_city in city:
                    city_key = known_city
                    break
            
            if city_key:
                coords = CITY_CENTERS[city_key]
                race['latitude'] = coords[0]
                race['longitude'] = coords[1]
                print(f"Fixed virtual race: {rid}")
                print(f"  {name}")
                print(f"  Assigned {city_key} center: {coords}")
                fixed_virtual.append(rid)
            else:
                # Use Houston as default for TX virtual races
                coords = CITY_CENTERS['houston']
                race['latitude'] = coords[0]
                race['longitude'] = coords[1]
                print(f"Fixed virtual race (default Houston): {rid}")
                print(f"  {name}")
                fixed_virtual.append(rid)
            
            races_to_keep.append(race)
            continue
        
        # Handle TBA races - remove if still TBA
        if race.get('latitude') is None and (
            'tba' in addr or 'tba' in city or city == 'tba'
        ):
            print(f"Removing TBA race (insufficient location data): {rid}")
            print(f"  {name}")
            removed.append({'id': rid, 'name': name, 'reason': 'TBA location, insufficient data'})
            continue
        
        # Keep all other races
        races_to_keep.append(race)
    
    print(f"\n{'='*70}")
    print(f"Summary:")
    print(f"  Original races: {len(races)}")
    print(f"  Fixed virtual races: {len(fixed_virtual)}")
    print(f"  Removed races: {len(removed)}")
    print(f"  Final races: {len(races_to_keep)}")
    
    if removed:
        print(f"\nRemoved races:")
        for r in removed:
            print(f"  - {r['id']}: {r['name']}")
            print(f"    Reason: {r['reason']}")
    
    # Check final state
    still_missing = sum(1 for r in races_to_keep if r.get('latitude') is None)
    print(f"\nRaces still missing coordinates: {still_missing}")
    
    if still_missing == 0:
        print("✓ All races now have coordinates!")
    
    # Write results
    with open(LIVE_PATH, "w") as f:
        json.dump(races_to_keep, f, indent=2)
        f.write("\n")
    
    print(f"\nWrote updated {LIVE_PATH.name}")
    
    # Write removal report
    if removed:
        report_path = REPO / "races-removed-for-geocoding.txt"
        with open(report_path, "w") as f:
            f.write("Races Removed During Geocoding Project\n")
            f.write("="*70 + "\n\n")
            for r in removed:
                f.write(f"ID: {r['id']}\n")
                f.write(f"Name: {r['name']}\n")
                f.write(f"Reason: {r['reason']}\n")
                f.write("\n")
        print(f"Wrote removal report to {report_path}")


if __name__ == "__main__":
    main()
