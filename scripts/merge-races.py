#!/usr/bin/env python3
"""
merge-races.py — diff and merge a research artifact into races-upcoming.json.

Usage:
    python3 scripts/merge-races.py PATH_TO_NEW_JSON           # dry-run, show plan
    python3 scripts/merge-races.py PATH_TO_NEW_JSON --apply   # write merged file

Workflow this supports (matches prompts/upcoming-races-research.md):

  1. Run the upcoming-races research prompt in claude.ai, download the
     resulting JSON artifact (e.g. ~/Downloads/races-2026-04-08-to-2026-07-07.json).
  2. Run this script (no flag) to see the diff: adds, real updates,
     no-op updates, and in-window live races missing from the new file.
  3. If the plan looks right, re-run with --apply to write the merge
     into data/races-upcoming.json. The script then runs the data
     validator and exits non-zero if validation fails.

Design:

- Upsert by id. New ids are added; matching ids are updated only when
  the *canonicalized* record differs.
- Distance values are canonicalized before diffing, so abbreviation-only
  "updates" (1 Mi -> 1 Mile, 100M -> 100 Mile, etc.) become no-ops
  instead of false-positive changes.
- Coordinates are rounded to 4 decimal places before diffing (matches
  the precision the prompt asks for) so geocoding jitter doesn't show
  up as an update.
- Removes are NOT computed automatically. The new file is a window
  snapshot, and a race missing from it could mean either (a) cancelled
  or (b) outside the window. The script lists "in-window live races
  missing from new file" as informational only, never deletes them.
"""

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
LIVE_PATH = REPO / "data" / "races-upcoming.json"

# Map common abbreviations to the canonical forms expected by
# scripts/validate-data.py. Keep this list small and obvious — anything
# ambiguous should fail validation rather than be silently rewritten.
DISTANCE_ALIASES = {
    "1 mi": "1 Mile",
    "1mi": "1 Mile",
    "1mile": "1 Mile",
    "mile": "1 Mile",
    "10 mi": "10 Mile",
    "10mi": "10 Mile",
    "10mile": "10 Mile",
    "10m": "10 Mile",
    "50m": "50 Mile",
    "50mi": "50 Mile",
    "50 mi": "50 Mile",
    "100m": "100 Mile",
    "100mi": "100 Mile",
    "100 mi": "100 Mile",
    "half": "Half Marathon",
    "half marathon": "Half Marathon",
    "hm": "Half Marathon",
    "13.1": "Half Marathon",
    "full": "Marathon",
    "full marathon": "Marathon",
    "26.2": "Marathon",
    "5k": "5K",
    "5 k": "5K",
    "5km": "5K",
    "6k": "6K",
    "10k": "10K",
    "10 k": "10K",
    "10km": "10K",
    "12k": "12K",
    "15k": "15K",
    "50k": "50K",
    "100k": "100K",
    "kid": "Kids",
    "kids fun run": "Kids",
    "children": "Kids",
}


def canonicalize_distance(d):
    if not isinstance(d, str):
        return d
    return DISTANCE_ALIASES.get(d.strip().lower(), d)


def canonicalize(record):
    """Return a copy of `record` with normalized fields used for diffing."""
    r = dict(record)
    if isinstance(r.get("distance"), list):
        r["distance"] = [canonicalize_distance(d) for d in r["distance"]]
    if isinstance(r.get("latitude"), (int, float)):
        r["latitude"] = round(float(r["latitude"]), 4)
    if isinstance(r.get("longitude"), (int, float)):
        r["longitude"] = round(float(r["longitude"]), 4)
    return r


def records_equal(a, b):
    return json.dumps(canonicalize(a), sort_keys=True) == json.dumps(canonicalize(b), sort_keys=True)


def normalize_name(name):
    """Lowercase, strip punctuation, remove common noise for fuzzy matching."""
    name = name.lower()
    name = re.sub(r"[''\".,!?&/:;()@#\-–—']", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    for noise in ["presented by houston methodist", "presented by", "annual"]:
        name = name.replace(noise, "")
    name = re.sub(r"^\d+(st|nd|rd|th)\s+", "", name)
    return name.strip()


def name_overlap(a, b):
    """Fraction of tokens in common (on the smaller set)."""
    ta = set(normalize_name(a).split())
    tb = set(normalize_name(b).split())
    if not ta or not tb:
        return 0
    return len(ta & tb) / min(len(ta), len(tb))


def find_near_dupe(race, live_by_date):
    """Check if a race with a different ID is a near-dupe of a live race
    (same date + high name overlap). Returns the live race if found."""
    candidates = live_by_date.get(race.get("date"), [])
    for c in candidates:
        if name_overlap(race.get("name", ""), c.get("name", "")) >= 0.65:
            return c
    return None


def compute_plan(new_records, live_records):
    new_by_id = {r["id"]: r for r in new_records}
    live_by_id = {r["id"]: r for r in live_records}

    # Index live records by date for near-dupe detection
    live_by_date = {}
    for r in live_records:
        live_by_date.setdefault(r.get("date"), []).append(r)

    adds = []
    real_updates = []
    noop_updates = []  # ids present in both, identical after canonicalization
    near_dupes = []    # new races that match a live race by name+date
    for rid, n in new_by_id.items():
        if rid not in live_by_id:
            # Check for near-dupe before treating as add
            dupe = find_near_dupe(n, live_by_date)
            if dupe:
                near_dupes.append((rid, n, dupe))
            else:
                adds.append(canonicalize(n))
        elif records_equal(n, live_by_id[rid]):
            noop_updates.append(rid)
        else:
            real_updates.append((rid, canonicalize(n), live_by_id[rid]))

    # Window: derived from min/max date in the new file.
    if new_records:
        dates = sorted(r["date"] for r in new_records if "date" in r)
        window_start, window_end = dates[0], dates[-1]
    else:
        window_start = window_end = None

    in_window_live_missing = []
    if window_start and window_end:
        for r in live_records:
            if window_start <= r.get("date", "") <= window_end and r["id"] not in new_by_id:
                in_window_live_missing.append(r)

    return {
        "window": (window_start, window_end),
        "adds": adds,
        "real_updates": real_updates,
        "noop_updates": noop_updates,
        "near_dupes": near_dupes,
        "in_window_live_missing": in_window_live_missing,
    }


def print_plan(plan, new_count, live_count):
    ws, we = plan["window"]
    print(f"New file:  {new_count} record(s)")
    print(f"Live file: {live_count} record(s)")
    if ws:
        print(f"Window:    {ws} -> {we}")
    print()
    print("=== PLAN ===")
    print(f"  Adds:               {len(plan['adds'])}")
    print(f"  Real updates:       {len(plan['real_updates'])}")
    print(f"  No-op updates:      {len(plan['noop_updates'])}  (canonicalization-only, will be skipped)")
    print(f"  Near-dupes:         {len(plan['near_dupes'])}  (same race, different ID — skipped)")
    print(f"  In-window missing:  {len(plan['in_window_live_missing'])}  (informational; never auto-removed)")
    print()

    if plan["adds"]:
        print("--- ADDS ---")
        for r in plan["adds"]:
            dists = ",".join(r.get("distance", []))
            print(f"  + {r['id']}  ({r['date']})  {r['name']} — {r.get('city','?')}, [{dists}]")
        print()

    if plan["real_updates"]:
        print("--- REAL UPDATES ---")
        for rid, n, old in plan["real_updates"]:
            changed = sorted({k for k in set(n) | set(old) if n.get(k) != old.get(k)})
            print(f"  ~ {rid}  changed: {changed}")
            for k in changed:
                print(f"      live: {old.get(k)!r}")
                print(f"      new:  {n.get(k)!r}")
        print()

    if plan["noop_updates"]:
        print("--- NO-OP UPDATES (skipped) ---")
        for rid in plan["noop_updates"]:
            print(f"  = {rid}")
        print()

    if plan["near_dupes"]:
        print("--- NEAR-DUPES (same race, different ID — skipped) ---")
        for new_id, n, live_match in plan["near_dupes"]:
            score = name_overlap(n.get("name", ""), live_match.get("name", ""))
            print(f"  ≈ {new_id}")
            print(f"    new:  {n.get('name')}  ({n.get('date')})")
            print(f"    live: {live_match['id']}  —  {live_match.get('name')}  ({live_match.get('date')})")
            print(f"    overlap: {score:.0%}")
        print()

    if plan["in_window_live_missing"]:
        print("--- IN-WINDOW LIVE RACES NOT IN NEW FILE ---")
        print("    (review by hand — could be cancelled, removed from listings,")
        print("     or just outside the new sweep's coverage. Never auto-removed.)")
        for r in plan["in_window_live_missing"]:
            print(f"  ? {r['id']}  ({r['date']})  {r['name']}")
        print()


def apply_plan(plan, live_records):
    """Return a new sorted list with adds + real updates applied."""
    out_by_id = {r["id"]: r for r in live_records}
    for r in plan["adds"]:
        out_by_id[r["id"]] = r
    for rid, n, _ in plan["real_updates"]:
        out_by_id[rid] = n
    out = list(out_by_id.values())
    out.sort(key=lambda r: r.get("date", ""))
    return out


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        sys.exit(0 if args else 2)

    path = args[0]
    apply = "--apply" in args[1:]

    with open(path) as f:
        new_records = json.load(f)
    if not isinstance(new_records, list):
        print(f"FAIL: {path} is not a JSON array", file=sys.stderr)
        sys.exit(1)

    with open(LIVE_PATH) as f:
        live_records = json.load(f)

    plan = compute_plan(new_records, live_records)
    print_plan(plan, len(new_records), len(live_records))

    if not apply:
        print("Dry run — no files written. Re-run with --apply to merge.")
        return

    if not plan["adds"] and not plan["real_updates"]:
        print("Nothing to apply.")
        return

    merged = apply_plan(plan, live_records)
    with open(LIVE_PATH, "w") as f:
        json.dump(merged, f, indent=2)
        f.write("\n")
    print(f"Wrote {len(merged)} records to {LIVE_PATH}")
    print("Running data validator...")

    import subprocess
    rc = subprocess.call(["python3", str(REPO / "scripts" / "validate-data.py")])
    if rc != 0:
        print("VALIDATION FAILED — review the errors above and fix before committing.", file=sys.stderr)
        sys.exit(rc)


if __name__ == "__main__":
    main()
