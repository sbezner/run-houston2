#!/usr/bin/env python3
"""
merge-clubs.py — diff and merge a clubs research artifact into clubs.json.

Usage:
    python3 scripts/merge-clubs.py PATH_TO_NEW_JSON           # dry-run, show plan
    python3 scripts/merge-clubs.py PATH_TO_NEW_JSON --apply   # write merged file

Behaviour:
- Upsert by id. New ids are added; matching ids are updated only when the
  record actually differs (so re-running the prompt and emitting the same
  content is a no-op).
- Removes are NEVER auto-applied. A club missing from the new sweep just
  wasn't found this time — it is NOT automatically deleted. The dry-run
  output flags possible removals for human review.
- After --apply, the live file is sorted alphabetically by club_name and
  the data validator is run.
"""

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
LIVE_PATH = REPO / "data" / "clubs.json"

REQUIRED_FIELDS = {"id", "club_name"}


def records_equal(a, b):
    return json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True)


def validate_record(r, i):
    errors = []
    if not isinstance(r, dict):
        return [f"record {i}: not an object"]
    for f in REQUIRED_FIELDS:
        if f not in r or not r[f]:
            errors.append(f"record {i}: missing required field '{f}'")
    return errors


def compute_plan(new_records, live_records):
    new_by_id = {r["id"]: r for r in new_records}
    live_by_id = {r["id"]: r for r in live_records}

    adds = []
    real_updates = []
    noop_updates = []
    possible_removals = []

    for rid, n in new_by_id.items():
        if rid not in live_by_id:
            adds.append(n)
        elif records_equal(n, live_by_id[rid]):
            noop_updates.append(rid)
        else:
            real_updates.append((rid, n, live_by_id[rid]))

    for rid in live_by_id:
        if rid not in new_by_id:
            possible_removals.append(rid)

    return {
        "adds": adds,
        "real_updates": real_updates,
        "noop_updates": noop_updates,
        "possible_removals": possible_removals,
    }


def print_plan(plan, new_count, live_count):
    print(f"New file:  {new_count} record(s)")
    print(f"Live file: {live_count} record(s)")
    print()
    print("=== PLAN ===")
    print(f"  Adds:               {len(plan['adds'])}")
    print(f"  Real updates:       {len(plan['real_updates'])}  (fields changed — will overwrite)")
    print(f"  No-op updates:      {len(plan['noop_updates'])}  (identical — will be skipped)")
    print(f"  Possible removals:  {len(plan['possible_removals'])}  (not in new sweep — NOT auto-deleted)")
    print()

    if plan["adds"]:
        print("--- ADDS ---")
        for r in plan["adds"]:
            print(f"  + {r['id']}  {r.get('club_name','')}  ({r.get('location','')})")
        print()

    if plan["real_updates"]:
        print("--- REAL UPDATES ---")
        for rid, n, old in plan["real_updates"]:
            changed = sorted({k for k in set(n) | set(old) if n.get(k) != old.get(k)})
            print(f"  ~ {rid}  changed: {changed}")
        print()

    if plan["possible_removals"]:
        print("--- POSSIBLE REMOVALS (not auto-applied — review manually) ---")
        for rid in plan["possible_removals"]:
            print(f"  ? {rid}")
        print()

    if plan["noop_updates"]:
        print("--- NO-OP UPDATES (skipped) ---")
        for rid in plan["noop_updates"]:
            print(f"  = {rid}")
        print()


def apply_plan(plan, live_records):
    """Return a new list (sorted alphabetically by club_name) with adds + updates applied."""
    out_by_id = {r["id"]: r for r in live_records}
    for r in plan["adds"]:
        out_by_id[r["id"]] = r
    for rid, n, _ in plan["real_updates"]:
        out_by_id[rid] = n
    out = list(out_by_id.values())
    out.sort(key=lambda r: r.get("club_name", "").lower())
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

    all_errors = []
    for i, r in enumerate(new_records):
        all_errors.extend(validate_record(r, i))
    if all_errors:
        for e in all_errors:
            print(f"VALIDATION ERROR: {e}", file=sys.stderr)
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
