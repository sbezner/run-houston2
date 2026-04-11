#!/usr/bin/env python3
"""
geocode-missing.py — backfill null coordinates in races-upcoming.json
from each record's existing address fields, using Nominatim (OSM).

Usage:
    python3 scripts/geocode-missing.py                   # dry run, prints plan
    python3 scripts/geocode-missing.py --apply           # write results back
    python3 scripts/geocode-missing.py --include-weak    # also try "TBD" rows

Rules this script follows:

- Only TOUCHES records whose latitude is currently null. Never overwrites
  an existing coordinate.
- Uses the record's own `address`, `city`, `state`, `zip` — does not
  invent data. If a Nominatim hit falls outside the Houston bbox defined
  in scripts/validate-data.py, the result is REJECTED (not written),
  since it almost always means a lat/lng swap, a wrong-state match, or
  a bad input address.
- Skips "weak" rows (address is null, "TBD", or just "Houston area")
  unless `--include-weak` is passed. Those records need a research
  pass via prompts/upcoming-races-research.md, not a geocode.
- Respects Nominatim's 1-req/sec usage policy. A full pass over the
  current ~43 geocodable rows takes ~50 seconds.
- Rounds results to 4 decimal places, matching the precision
  prompts/upcoming-races-research.md asks for and scripts/merge-races.py
  canonicalizes to.
- After --apply, runs scripts/validate-data.py. If validation fails,
  the script exits non-zero without suppressing the errors.

Run this script LOCALLY (not inside Claude Code's sandbox); it needs
network egress to reach https://nominatim.openstreetmap.org/.
"""

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
LIVE_PATH = REPO / "data" / "races-upcoming.json"

# Houston metro bbox — must stay in sync with scripts/validate-data.py.
# If you widen one, widen the other.
HOUSTON_LAT = (28.5, 30.85)
HOUSTON_LNG = (-96.55, -94.0)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "run-houston2-geocode/1.0 (https://github.com/sbezner/run-houston2)"
RATE_LIMIT_SECONDS = 1.1  # slightly over 1/s to stay under Nominatim's policy

WEAK_ADDRS = {"", "tbd", "houston area", "none"}


def has_street_number(r):
    a = (r.get("address") or "").strip()
    return bool(re.search(r"\b\d{2,6}\b", a))


def has_named_venue(r):
    a = (r.get("address") or "").strip().lower()
    venues = [
        "park", "stadium", "plaza", "beach", "library", "cityplace",
        "brewery", "brewing", "center", "centre", "bayou", "trail", "forest",
    ]
    return any(v in a for v in venues)


def classify(r):
    if r.get("latitude") is not None and r.get("longitude") is not None:
        return "has_coords"
    a = (r.get("address") or "").strip().lower()
    if a in WEAK_ADDRS:
        return "weak"
    if has_street_number(r):
        return "street"
    if has_named_venue(r):
        return "venue"
    return "weak"


def build_query(r):
    """Build a free-form Nominatim query from the record's address fields."""
    parts = []
    addr = (r.get("address") or "").strip()
    # Drop "TBD — ..." prefixes so the venue hint that follows can still match.
    addr = re.sub(r"^TBD\s*[—\-]*\s*", "", addr, flags=re.I).strip()
    if addr and addr.lower() not in WEAK_ADDRS:
        parts.append(addr)
    if r.get("city"):
        parts.append(r["city"])
    state = r.get("state") or "TX"
    zip_ = r.get("zip")
    parts.append(state + (" " + zip_ if zip_ else ""))
    parts.append("USA")
    return ", ".join(p for p in parts if p)


def in_houston_bbox(lat, lng):
    return (HOUSTON_LAT[0] <= lat <= HOUSTON_LAT[1]
            and HOUSTON_LNG[0] <= lng <= HOUSTON_LNG[1])


def geocode(query):
    """Return ((lat, lng), None) on success, or (None, reason) on failure."""
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
        return None, f"network error: {type(e).__name__}: {e}"

    if not results:
        return None, "zero results"

    # Prefer the first in-bbox hit. Rejecting out-of-bbox rules out obvious
    # wrong-state matches (e.g. an "11200 Broadway St" that lands in NYC).
    for hit in results:
        try:
            lat = float(hit["lat"])
            lng = float(hit["lon"])
        except (KeyError, ValueError):
            continue
        if in_houston_bbox(lat, lng):
            return (round(lat, 4), round(lng, 4)), None

    first = results[0]
    return None, f"out of bbox (first hit: {first.get('display_name', '?')})"


def main():
    ap = argparse.ArgumentParser(
        description="Backfill missing coordinates in races-upcoming.json via Nominatim.",
    )
    ap.add_argument("--apply", action="store_true",
                    help="write geocoded results back to the JSON file")
    ap.add_argument("--include-weak", action="store_true",
                    help="also attempt rows whose address is null, 'TBD', or 'Houston area'")
    args = ap.parse_args()

    with open(LIVE_PATH) as f:
        races = json.load(f)

    counts = {"has_coords": 0, "street": 0, "venue": 0, "weak": 0}
    todo = []
    for r in races:
        cat = classify(r)
        counts[cat] += 1
        if cat == "has_coords":
            continue
        if cat == "weak" and not args.include_weak:
            continue
        todo.append(r)

    print(f"races-upcoming.json: {len(races)} records")
    print(f"  with coordinates:   {counts['has_coords']}")
    print(f"  missing (street):   {counts['street']}")
    print(f"  missing (venue):    {counts['venue']}")
    print(f"  missing (weak):     {counts['weak']}")
    print()
    print(f"Will attempt geocode on {len(todo)} record(s)"
          f"{' (including weak)' if args.include_weak else ''}.")
    if not args.apply:
        print("(dry run — re-run with --apply to write results)")
    print()

    ok, skipped, failed = 0, 0, 0
    for i, r in enumerate(todo, 1):
        q = build_query(r)
        if not q or q.strip(" ,") in ("", "USA", "TX, USA"):
            print(f"  [{i}/{len(todo)}] SKIP  {r['id']:45}  no usable address")
            skipped += 1
            continue

        coords, err = geocode(q)
        if coords is None:
            print(f"  [{i}/{len(todo)}] FAIL  {r['id']:45}  {err}")
            print(f"                            query: {q}")
            failed += 1
        else:
            lat, lng = coords
            print(f"  [{i}/{len(todo)}] OK    {r['id']:45}  {lat}, {lng}")
            if args.apply:
                r["latitude"] = lat
                r["longitude"] = lng
            ok += 1

        time.sleep(RATE_LIMIT_SECONDS)

    print()
    print(f"Done: {ok} geocoded, {failed} failed, {skipped} skipped")

    if not args.apply:
        print("\nDry run — no file written. Re-run with --apply to save.")
        return

    if ok == 0:
        print("\nNothing to write.")
        return

    with open(LIVE_PATH, "w") as f:
        json.dump(races, f, indent=2)
        f.write("\n")
    print(f"\nWrote updated {LIVE_PATH.name}.")
    print("Running validator...")
    rc = subprocess.call(["python3", str(REPO / "scripts" / "validate-data.py")])
    if rc != 0:
        print("VALIDATION FAILED — review errors above and fix before committing.",
              file=sys.stderr)
        sys.exit(rc)


if __name__ == "__main__":
    main()
