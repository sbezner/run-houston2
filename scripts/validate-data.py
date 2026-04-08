#!/usr/bin/env python3
"""
validate-data.py — enforces the data contract for Run Houston JSON files.

Run as: python3 scripts/validate-data.py

Exits 0 on success, 1 on any validation failure. Used by
.github/workflows/validate.yml to gate commits to master (Option A:
CI is an early-warning signal; GitHub Pages still auto-deploys from
master regardless).

The contract checked here is the same one the assets/js/*.js files
assume at runtime. If you legitimately extend the data model (new
field, new canonical distance, new surface), update this file too.
"""

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DATA = REPO / "data"

# ----- Canonical vocabularies (must match what the data + index.js use) -----

CANONICAL_DISTANCES = {
    "1 Mile", "5K", "10K", "15K", "10 Mile",
    "Half Marathon", "Marathon",
    "50K", "50 Mile", "100K", "100 Mile",
    "Ultra", "Kids",
}

CANONICAL_SURFACES = {"road", "trail", "track", "virtual", "other"}

# Houston metro bounding box: generous enough to include Galveston,
# Port Bolivar, Conroe, and Katy, tight enough to catch lat/lng swaps
# or a race accidentally geocoded to the wrong hemisphere.
HOUSTON_LAT = (28.5, 30.5)
HOUSTON_LNG = (-96.5, -94.0)

ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TIME_RE = re.compile(r"^\d{2}:\d{2}$")

errors = []


def error(msg):
    errors.append(msg)


# ----- Loaders + shared validators ------------------------------------------

def load_json_array(path, label):
    if not path.exists():
        error(f"{label}: file missing at {path}")
        return None
    try:
        with open(path) as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        error(f"{label}: invalid JSON at line {e.lineno}, col {e.colno}: {e.msg}")
        return None
    if not isinstance(data, list):
        error(f"{label}: top-level value must be an array, got {type(data).__name__}")
        return None
    return data


def check_unique_ids(label, records):
    seen = {}
    for i, r in enumerate(records):
        if not isinstance(r, dict):
            error(f"{label}[{i}]: record is not an object")
            continue
        rid = r.get("id")
        if not isinstance(rid, str) or not rid.strip():
            error(f"{label}[{i}]: missing or empty 'id'")
            continue
        if rid in seen:
            error(f"{label}: duplicate id {rid!r} (indices {seen[rid]} and {i})")
        else:
            seen[rid] = i


def check_coords(label, rid, lat, lng):
    """Latitude/longitude must both be null or both be numbers in the Houston bbox."""
    if lat is None and lng is None:
        return
    if lat is None or lng is None:
        error(f"{label}[{rid}]: latitude and longitude must both be null or both numbers")
        return
    if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
        error(f"{label}[{rid}]: latitude and longitude must be numbers")
        return
    if not (HOUSTON_LAT[0] <= lat <= HOUSTON_LAT[1]):
        error(f"{label}[{rid}]: latitude {lat} outside Houston bbox {HOUSTON_LAT} "
              f"(check for a lat/lng swap)")
    if not (HOUSTON_LNG[0] <= lng <= HOUSTON_LNG[1]):
        error(f"{label}[{rid}]: longitude {lng} outside Houston bbox {HOUSTON_LNG} "
              f"(check for a lat/lng swap)")


# ----- Per-file record validators -------------------------------------------

def validate_race(i, r):
    rid = r.get("id", f"index {i}")

    for field in ("id", "name", "date", "distance", "surface", "kid_run"):
        if field not in r:
            error(f"races-upcoming[{rid}]: missing required field {field!r}")
            return

    if not isinstance(r["name"], str) or not r["name"].strip():
        error(f"races-upcoming[{rid}]: 'name' must be a non-empty string")

    if not isinstance(r["date"], str) or not ISO_DATE_RE.match(r["date"]):
        error(f"races-upcoming[{rid}]: 'date' must be YYYY-MM-DD, got {r['date']!r}")

    if not isinstance(r["distance"], list) or not r["distance"]:
        error(f"races-upcoming[{rid}]: 'distance' must be a non-empty array")
    else:
        for d in r["distance"]:
            if d not in CANONICAL_DISTANCES:
                error(f"races-upcoming[{rid}]: distance {d!r} is not in the canonical "
                      f"vocabulary (expected one of: "
                      f"{', '.join(sorted(CANONICAL_DISTANCES))})")

    if r["surface"] not in CANONICAL_SURFACES:
        error(f"races-upcoming[{rid}]: surface {r['surface']!r} is not in the canonical "
              f"vocabulary (expected one of: {', '.join(sorted(CANONICAL_SURFACES))})")

    if not isinstance(r["kid_run"], bool):
        error(f"races-upcoming[{rid}]: 'kid_run' must be a boolean")

    check_coords("races-upcoming", rid, r.get("latitude"), r.get("longitude"))

    st = r.get("start_time")
    if st is not None and (not isinstance(st, str) or not TIME_RE.match(st)):
        error(f"races-upcoming[{rid}]: 'start_time' must be HH:MM or null, got {st!r}")

    for url_field in ("official_website_url", "source_url"):
        url = r.get(url_field)
        if url is not None and (not isinstance(url, str) or not url.strip()):
            error(f"races-upcoming[{rid}]: {url_field!r} must be a non-empty string or null")


def validate_club(i, c):
    cid = c.get("id", f"index {i}")

    for field in ("id", "club_name"):
        if field not in c:
            error(f"clubs[{cid}]: missing required field {field!r}")
            return

    if not isinstance(c["club_name"], str) or not c["club_name"].strip():
        error(f"clubs[{cid}]: 'club_name' must be a non-empty string")

    check_coords("clubs", cid, c.get("latitude"), c.get("longitude"))

    url = c.get("website_url")
    if url is not None and (not isinstance(url, str) or not url.strip()):
        error(f"clubs[{cid}]: 'website_url' must be a non-empty string or null")


def validate_report(i, r):
    rid = r.get("id", f"index {i}")

    for field in ("id", "title", "content_md"):
        if field not in r:
            error(f"race_reports[{rid}]: missing required field {field!r}")
            return

    if not isinstance(r["title"], str) or not r["title"].strip():
        error(f"race_reports[{rid}]: 'title' must be a non-empty string")

    if not isinstance(r["content_md"], str) or not r["content_md"].strip():
        error(f"race_reports[{rid}]: 'content_md' must be a non-empty string")

    rd = r.get("race_date")
    if rd is not None and (not isinstance(rd, str) or not ISO_DATE_RE.match(rd)):
        error(f"race_reports[{rid}]: 'race_date' must be YYYY-MM-DD or null, got {rd!r}")


# ----- Main ------------------------------------------------------------------

def main():
    print("Validating data files against contract...\n")

    races = load_json_array(DATA / "races-upcoming.json", "races-upcoming")
    if races is not None:
        check_unique_ids("races-upcoming", races)
        for i, r in enumerate(races):
            if isinstance(r, dict):
                validate_race(i, r)
        print(f"  races-upcoming.json: {len(races)} record(s) checked")

    clubs = load_json_array(DATA / "clubs.json", "clubs")
    if clubs is not None:
        check_unique_ids("clubs", clubs)
        for i, c in enumerate(clubs):
            if isinstance(c, dict):
                validate_club(i, c)
        print(f"  clubs.json: {len(clubs)} record(s) checked")

    reports = load_json_array(DATA / "race_reports.json", "race_reports")
    if reports is not None:
        check_unique_ids("race_reports", reports)
        for i, r in enumerate(reports):
            if isinstance(r, dict):
                validate_report(i, r)
        print(f"  race_reports.json: {len(reports)} record(s) checked")

    print()
    if errors:
        print(f"FAIL: {len(errors)} validation error(s):\n")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)

    print("PASS: all data files valid")
    sys.exit(0)


if __name__ == "__main__":
    main()
