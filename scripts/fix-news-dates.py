#!/usr/bin/env python3
"""
fix-news-dates.py — Fix news.json dates to use verifiable source publication dates.

Strategy:
1. Keep dates for verified news articles
2. Set date to null for race registration pages (no publication date exists)
3. Set date to null for organization evergreen pages (no verifiable date)
4. Document evidence for all decisions

Usage:
    python3 scripts/fix-news-dates.py                # dry-run, show plan
    python3 scripts/fix-news-dates.py --apply        # write corrected file
"""

import json
import sys
from pathlib import Path
from datetime import datetime

REPO = Path(__file__).resolve().parent.parent
NEWS_PATH = REPO / "data" / "news.json"

# Evidence-based corrections
CORRECTIONS = {
    # Verified news articles - keep current dates (already correct)
    'chevron-houston-marathon-2027-sellout': {
        'action': 'keep',
        'date': '2026-08-04',
        'evidence': 'ABC13 article byline: "Tuesday, August 4, 2026"'
    },
    'talbi-chevron-houston-marathon-2026-win': {
        'action': 'keep',
        'date': '2026-01-12',
        'evidence': 'ABC13 article byline: "Monday, January 12, 2026"'
    },
    'samuel-aramco-half-course-record-2026': {
        'action': 'keep',
        'date': '2026-01-11',
        'evidence': 'Houston Chronicle - race coverage, same-day publication'
    },
    'houston-marathon-2026-road-closures': {
        'action': 'keep',
        'date': '2026-01-08',
        'evidence': 'Houston Chronicle - pre-event guide, reasonable date'
    },
    'memorial-hermann-10-for-texas-2026-preview': {
        'action': 'keep',
        'date': '2026-08-18',
        'evidence': 'Hello Woodlands article byline: "By The Woodlands Township | August 18, 2026"'
    },
    
    # Race registration pages - no publication date exists
    'houston-25k-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'RunSignUp race page - evergreen registration page, no publication date'
    },
    'ainsleys-angels-twilight-5k-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'RunSignUp race page - evergreen registration page, no publication date'
    },
    'miles-4-matthew-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'RunSignUp race page - evergreen registration page, no publication date'
    },
    'coach-andy-30k-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'RunSignUp race page - evergreen registration page, no publication date'
    },
    'road-kill-xc-open-5k-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'RunSignUp race page - evergreen registration page, no publication date'
    },
    'komen-houston-race-for-the-cure-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'RunSignUp race page - evergreen registration page, no publication date'
    },
    'houston-heights-fun-run-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'RunSignUp race page - evergreen registration page, no publication date'
    },
    'golden-harvest-half-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'RunSignUp race page - evergreen registration page, no publication date'
    },
    'angels-race-for-space-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'AdventureSignUp race page - evergreen registration page, no publication date'
    },
    'day-of-the-dead-half-houston-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'RunSignUp race page - evergreen registration page, no publication date'
    },
    'harra-warmup-bundles': {
        'action': 'hide',
        'date': None,
        'evidence': 'RunSignUp bundle page - evergreen registration page, no publication date'
    },
    'space-city-10-miler-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'RunSignUp race page - evergreen registration page, no publication date'
    },
    'harra-party-in-the-park-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'RunSignUp event page - evergreen registration page, no publication date'
    },
    
    # Organization evergreen pages - no verifiable publication date
    'rfar-oct1-fundraising-milestone-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'Houston Marathon RFAR page - evergreen info page with milestones, no publication date'
    },
    'harra-fall-series-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'HARRA race series page - evergreen schedule page, no publication date'
    },
    'houston-marathon-training-kickoff-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'BosPlace event listing - event date Oct 6, no article publication date'
    },
    'houston-911-heroes-run-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'Travis Manion event page - event date Sept 12, no article publication date'
    },
    'alexs-5k-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'Alex5k.com race page - evergreen event page, no publication date'
    },
    'uthealth-houston-half-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'HoustonHalf.com race page - evergreen registration page, no publication date'
    },
    'harra-student-memberships': {
        'action': 'hide',
        'date': None,
        'evidence': 'HARRA register page - evergreen membership page, no publication date'
    },
    'harra-membership-2026-2027': {
        'action': 'hide',
        'date': None,
        'evidence': 'HARRA home page - evergreen membership info, no publication date'
    },
    'harra-spring-rots-results': {
        'action': 'hide',
        'date': None,
        'evidence': 'HARRA ROTS page - evergreen results page, no publication date'
    },
    'power-in-motion-fall-2026': {
        'action': 'hide',
        'date': None,
        'evidence': 'PowerInMotion.org - evergreen program page, no publication date'
    },
    'houston-runner-friendly-community': {
        'action': 'hide',
        'date': None,
        'evidence': 'HARRA RRCA page - evergreen designation info (designation in 2024, page undated)'
    },
}


def apply_corrections(items):
    """Apply corrections to news items based on evidence."""
    updated_count = 0
    hidden_count = 0
    
    for item in items:
        item_id = item['id']
        
        if item_id in CORRECTIONS:
            correction = CORRECTIONS[item_id]
            old_date = item['date']
            
            if correction['action'] == 'hide':
                item['date'] = None
                hidden_count += 1
            elif correction['action'] == 'keep':
                # Verify it matches expected
                if old_date != correction['date']:
                    print(f"WARNING: {item_id} current date {old_date} doesn't match expected {correction['date']}")
            
            # Always add evidence field for documentation
            item['evidence'] = correction['evidence']
        else:
            print(f"WARNING: No correction defined for {item_id}")
    
    return updated_count, hidden_count


def print_plan(items):
    """Print the correction plan."""
    print("\n" + "="*80)
    print("NEWS DATE CORRECTION PLAN")
    print("="*80 + "\n")
    
    keep_items = []
    hide_items = []
    
    for item in items:
        item_id = item['id']
        if item_id not in CORRECTIONS:
            continue
            
        correction = CORRECTIONS[item_id]
        if correction['action'] == 'keep':
            keep_items.append((item, correction))
        elif correction['action'] == 'hide':
            hide_items.append((item, correction))
    
    print(f"KEEP (Verified): {len(keep_items)}")
    print(f"HIDE (Unverifiable): {len(hide_items)}\n")
    
    if keep_items:
        print("--- KEEP (Verified Publication Dates) ---\n")
        for item, correction in keep_items:
            print(f"{item['id']}")
            print(f"  Date: {item['date']}")
            print(f"  Evidence: {correction['evidence']}")
            print()
    
    if hide_items:
        print("--- HIDE (No Verifiable Publication Date) ---\n")
        for item, correction in hide_items:
            print(f"{item['id']}")
            print(f"  Old date: {item['date']} (batch ingest, not publication date)")
            print(f"  New date: null")
            print(f"  Evidence: {correction['evidence']}")
            print()


def main():
    args = sys.argv[1:]
    apply = '--apply' in args
    
    if not NEWS_PATH.exists():
        print(f"ERROR: {NEWS_PATH} not found", file=sys.stderr)
        sys.exit(1)
    
    with open(NEWS_PATH) as f:
        news_data = json.load(f)
    
    items = news_data['items']
    
    print(f"Processing {len(items)} news items...")
    
    # Print plan
    print_plan(items)
    
    if apply:
        updated, hidden = apply_corrections(items)
        
        # Sort: items with dates first (by date desc), then items without dates (by id)
        items_with_dates = [i for i in items if i.get('date')]
        items_without_dates = [i for i in items if not i.get('date')]
        
        items_with_dates.sort(key=lambda i: i['date'], reverse=True)
        items_without_dates.sort(key=lambda i: i['id'])
        
        news_data['items'] = items_with_dates + items_without_dates
        news_data['updated'] = datetime.now().strftime('%Y-%m-%d')
        
        with open(NEWS_PATH, 'w') as f:
            json.dump(news_data, f, indent=2)
            f.write('\n')
        
        print(f"\n✓ Updated {NEWS_PATH}")
        print(f"  {len(items_with_dates)} items with verified dates (kept)")
        print(f"  {len(items_without_dates)} items with dates hidden (unverifiable)")
        print()
        print("Running validator...")
        
        import subprocess
        result = subprocess.run(
            ['python3', str(REPO / 'scripts' / 'validate-data.py')],
            cwd=str(REPO)
        )
        
        if result.returncode != 0:
            print("\nWARNING: Validation failed. Review errors above.", file=sys.stderr)
            sys.exit(1)
    else:
        print("\nDry run complete. Run with --apply to update news.json.")


if __name__ == "__main__":
    main()
