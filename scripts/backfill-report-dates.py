#!/usr/bin/env python3
"""
backfill-report-dates.py — Add published_date field to race reports.

This script:
1. Reads data/race_reports.json
2. For each report, determines when it was first added to the repo (via git log)
3. Adds a 'published_date' field with that date
4. Writes the updated file

Usage:
    python3 scripts/backfill-report-dates.py           # dry-run, show plan
    python3 scripts/backfill-report-dates.py --apply   # write updated file
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime

REPO = Path(__file__).resolve().parent.parent
REPORTS_PATH = REPO / "data" / "race_reports.json"


def get_git_history():
    """Get all commits that modified race_reports.json."""
    result = subprocess.run(
        ['git', 'log', '--follow', '--format=%H|%ai', '--', str(REPORTS_PATH)],
        capture_output=True, text=True, cwd=str(REPO)
    )
    
    if result.returncode != 0:
        print(f"ERROR: Could not get git log: {result.stderr}", file=sys.stderr)
        return []
    
    commits = []
    for line in result.stdout.strip().split('\n'):
        if '|' in line:
            commit_hash, date_str = line.split('|', 1)
            # Extract just the date part (YYYY-MM-DD)
            date = date_str.split()[0]
            commits.append((commit_hash, date))
    
    return commits


def get_report_first_appearance(report_id, commits):
    """
    Find when a report ID first appeared in the file.
    Walk commits from oldest to newest, checking when the ID first shows up.
    """
    if not commits:
        return None
    
    # Walk commits from oldest to newest
    for commit_hash, commit_date in reversed(commits):
        # Get file content at this commit
        result = subprocess.run(
            ['git', 'show', f'{commit_hash}:data/race_reports.json'],
            capture_output=True, text=True, cwd=str(REPO)
        )
        
        if result.returncode != 0:
            continue
        
        try:
            data = json.loads(result.stdout)
            # Check if this report ID exists in this version
            if any(r.get('id') == report_id for r in data):
                # Found it! This is when it was first added
                return commit_date
        except json.JSONDecodeError:
            continue
    
    return None


def main():
    args = sys.argv[1:]
    apply = '--apply' in args
    
    if not REPORTS_PATH.exists():
        print(f"ERROR: {REPORTS_PATH} not found", file=sys.stderr)
        sys.exit(1)
    
    with open(REPORTS_PATH) as f:
        reports = json.load(f)
    
    print(f"Analyzing {len(reports)} race reports...\n")
    
    # Get git history
    print("Fetching git history...")
    commits = get_git_history()
    print(f"Found {len(commits)} commits to race_reports.json")
    if commits:
        print(f"  Date range: {commits[-1][1]} to {commits[0][1]}")
    print()
    
    # Process each report
    updates = []
    for i, report in enumerate(reports):
        report_id = report.get('id')
        race_date = report.get('race_date')
        current_published = report.get('published_date')
        
        if not report_id:
            print(f"WARNING: Report at index {i} has no ID, skipping")
            continue
        
        # Find when this report was first added
        first_seen = get_report_first_appearance(report_id, commits)
        
        # Determine the published_date
        if current_published:
            # Already has a published_date, keep it unless it's clearly wrong
            published_date = current_published
            status = "already set"
        elif first_seen:
            # Use the date from git history
            published_date = first_seen
            status = "from git history"
        elif race_date:
            # Fallback: assume published shortly after the race (add 1-3 days)
            # For simplicity, just use race_date for now
            published_date = race_date
            status = "fallback to race_date"
        else:
            published_date = None
            status = "NO DATE AVAILABLE"
        
        updates.append({
            'id': report_id,
            'race_date': race_date,
            'published_date': published_date,
            'status': status
        })
        
        # Update the report dict
        if published_date and not current_published:
            report['published_date'] = published_date
    
    # Print summary
    print("="*80)
    print("PUBLISHED DATE BACKFILL PLAN")
    print("="*80)
    print()
    
    for update in updates:
        print(f"{update['id']}")
        print(f"  Race date: {update['race_date']}")
        print(f"  Published date: {update['published_date']} ({update['status']})")
        print()
    
    if apply:
        # Reorder reports by published_date (or race_date as fallback), newest first
        reports.sort(
            key=lambda r: (r.get('published_date') or r.get('race_date', '')),
            reverse=True
        )
        
        with open(REPORTS_PATH, 'w') as f:
            json.dump(reports, f, indent=2)
            f.write('\n')
        
        print(f"✓ Updated {REPORTS_PATH}")
        print(f"  Added published_date to {sum(1 for u in updates if u['status'] != 'already set')} reports")
        print()
        print("Running validator...")
        
        result = subprocess.run(
            ['python3', str(REPO / 'scripts' / 'validate-data.py')],
            cwd=str(REPO)
        )
        
        if result.returncode != 0:
            print("\nWARNING: Validation failed. Review errors above.", file=sys.stderr)
            sys.exit(1)
    else:
        print("\nDry run complete. Run with --apply to update the file.")
        
        needs_dates = sum(1 for u in updates if not u['published_date'])
        if needs_dates:
            print(f"WARNING: {needs_dates} reports have no determinable published_date")


if __name__ == "__main__":
    main()
