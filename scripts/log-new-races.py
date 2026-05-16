#!/usr/bin/env python3
"""
log-new-races.py — append newly added races to a per-session log file.

Called automatically by run_discovery.sh after each merge step.
Usage: python3 scripts/log-new-races.py SESSION_ID WEEK_START WEEK_END SOURCE BEFORE_IDS_FILE SESSION_LOG_FILE
"""
import json
import sys
import datetime
from pathlib import Path

session_id, week_start, week_end, source, before_ids_file, session_log = sys.argv[1:]

before_ids = set(Path(before_ids_file).read_text().strip().splitlines())
repo = Path(__file__).parent.parent
races_file = repo / "data" / "races-upcoming.json"

if not races_file.exists():
    sys.exit(0)

races = json.load(open(races_file))
ts = datetime.datetime.now().isoformat()
log_path = Path(session_log)
log_path.parent.mkdir(parents=True, exist_ok=True)

new_count = 0
with open(log_path, "a") as f:
    for r in races:
        if r["id"] not in before_ids:
            entry = {
                "session": session_id,
                "added_at": ts,
                "week": f"{week_start}/{week_end}",
                "id": r["id"],
                "name": r["name"],
                "date": r["date"],
                "distance": r.get("distance", []),
                "surface": r.get("surface"),
                "city": r.get("city"),
                "source": source,
            }
            f.write(json.dumps(entry) + "\n")
            new_count += 1

print(f"Logged {new_count} new races to {log_path.name}")
