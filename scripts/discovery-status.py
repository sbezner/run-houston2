#!/usr/bin/env python3
"""
discovery-status.py — summarize the current state of the discovery pipeline.

Usage: python3 scripts/discovery-status.py

Reads discovery-progress.log and discovery-run.log and prints a
quick summary: weeks completed, weeks failed, current activity,
race count, and estimated completion time.
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PROGRESS_LOG = REPO / "discovery-progress.log"
RUN_LOG = REPO / "discovery-run.log"
RACES_FILE = REPO / "data" / "races-upcoming.json"


def check_tmux():
    """Check if the discovery tmux session is running."""
    result = subprocess.run(
        ["tmux", "ls"], capture_output=True, text=True
    )
    if result.returncode == 0 and "discovery" in result.stdout:
        return True
    return False


def parse_progress():
    """Parse discovery-progress.log into completed/failed weeks."""
    ok = []
    failed = []
    if not PROGRESS_LOG.exists():
        return ok, failed
    for line in PROGRESS_LOG.read_text().strip().splitlines():
        if " OK: " in line:
            ok.append(line)
        elif " FAILED: " in line:
            failed.append(line)
    return ok, failed


def get_last_activity():
    """Get the last line from discovery-run.log."""
    if not RUN_LOG.exists():
        return None
    lines = RUN_LOG.read_text().strip().splitlines()
    if not lines:
        return None
    return lines[-1]


def get_total_weeks():
    """Get total weeks from the LAST run's header in the log."""
    if not RUN_LOG.exists():
        return None
    total = None
    for line in RUN_LOG.read_text().splitlines():
        if "Starting:" in line and "for" in line and "weeks" in line:
            try:
                parts = line.split("for")[1].strip().split()
                total = int(parts[0])
            except (IndexError, ValueError):
                pass
    return total


def get_race_count():
    """Count races in the data file."""
    if not RACES_FILE.exists():
        return 0
    return len(json.load(open(RACES_FILE)))


def main():
    running = check_tmux()
    ok_weeks, failed_weeks = parse_progress()
    last_activity = get_last_activity()
    total_weeks = get_total_weeks()
    race_count = get_race_count()

    print("=" * 55)
    print("  Run Houston — Discovery Pipeline Status")
    print("=" * 55)
    print()

    # Running state
    if running:
        print("  Status:    RUNNING")
    else:
        print("  Status:    STOPPED")
    print()

    # Race count
    print(f"  Total races:  {race_count}")
    print()

    # Progress
    completed = len(ok_weeks)
    fails = len(failed_weeks)
    print(f"  Weeks completed:  {completed}")
    print(f"  Weeks failed:     {fails}")
    if total_weeks:
        # Count how many weeks from the current run (not previous runs)
        # by looking at the last "Starting:" entry in the run log
        remaining = max(0, total_weeks - completed)
        print(f"  Total planned:    {total_weeks}")
        print(f"  Weeks remaining:  ~{remaining}")
        if remaining > 0:
            hours = remaining * 2.25
            eta = datetime.now() + timedelta(hours=hours)
            print(f"  Est. completion:  ~{eta.strftime('%a %b %d %I:%M %p')}")
    print()

    # Last activity
    if last_activity:
        print(f"  Last log entry:")
        print(f"    {last_activity}")
    print()

    # Completed weeks table
    if ok_weeks:
        print("  --- Completed Weeks ---")
        for line in ok_weeks:
            # Clean up for display
            parts = line.split("OK: ")
            if len(parts) == 2:
                timestamp = parts[0].strip()
                details = parts[1].strip()
                print(f"    {timestamp}  {details}")
        print()

    # Failed weeks
    if failed_weeks:
        print("  --- Failed Weeks (will retry on re-run) ---")
        for line in failed_weeks:
            parts = line.split("FAILED: ")
            if len(parts) == 2:
                timestamp = parts[0].strip()
                details = parts[1].strip()
                print(f"    {timestamp}  {details}")
        print()

    # Controls reminder
    if running:
        print("  Controls:")
        print("    Attach:  tmux attach -t discovery")
        print("    Pause:   touch pause-discovery")
        print("    Stop:    tmux kill-session -t discovery")
    else:
        print("  To restart: ./run_discovery.sh 2026-04-12 52")

    print()
    print("=" * 55)


if __name__ == "__main__":
    main()
