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
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DATA = REPO / "data"

# ----- Canonical vocabularies (must match what the data + index.js use) -----

CANONICAL_DISTANCES = {
    "1 Mile", "4 Mile", "5K", "6K", "6 Mile", "10K", "12K", "15K", "10 Mile",
    "Half Marathon", "Marathon",
    "50K", "50 Mile", "100K", "100 Mile",
    "Ultra", "Kids",
}

CANONICAL_SURFACES = {"road", "trail", "track", "virtual", "other"}

# Houston metro bounding box: generous enough to include Galveston,
# Port Bolivar, Conroe, Katy, and the drive-to state parks explicitly
# listed as in-scope by prompts/upcoming-races-research.md (Brazos
# Bend, Huntsville State Park, Sam Houston National Forest, Stephen
# F. Austin State Park). Tight enough to catch lat/lng swaps or a
# race accidentally geocoded to the wrong hemisphere.
HOUSTON_LAT = (28.5, 30.85)
HOUSTON_LNG = (-96.55, -94.0)

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


def check_coords(label, rid, lat, lng, required=False):
    """Latitude/longitude must both be null or both be numbers in the Houston bbox.
    
    If required=True, null coordinates are not allowed (enforces geocoding invariant).
    """
    if lat is None and lng is None:
        if required:
            error(f"{label}[{rid}]: latitude and longitude are required (cannot be null)")
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

def validate_news_item(i, item):
    """Validate a single news item from news.json."""
    iid = item.get('id', f"index {i}")
    
    for field in ('id', 'headline', 'source', 'url', 'summary', 'date'):
        if field not in item:
            error(f"news[{iid}]: missing required field {field!r}")
            return
    
    if not isinstance(item['headline'], str) or not item['headline'].strip():
        error(f"news[{iid}]: 'headline' must be a non-empty string")
    
    # date is REQUIRED - must be non-null YYYY-MM-DD
    # Use source publication date when verifiable, or load date as fallback
    dt = item.get('date')
    if dt is None:
        error(f"news[{iid}]: 'date' is required and cannot be null. "
              f"Use source publication date if verifiable, or load date (first commit date) as fallback.")
        return
    
    if not isinstance(dt, str) or not ISO_DATE_RE.match(dt):
        error(f"news[{iid}]: 'date' must be YYYY-MM-DD, got {dt!r}")
    else:
        try:
            datetime.strptime(dt, "%Y-%m-%d")
        except ValueError:
            error(f"news[{iid}]: 'date' {dt!r} is not a real calendar date")
    
    # evidence is required for all items (to document whether date is source or load date)
    evidence = item.get('evidence')
    if not evidence or not isinstance(evidence, str) or not evidence.strip():
        error(f"news[{iid}]: 'evidence' field is required and must be non-empty. "
              f"Document the source of the date (article byline for source dates, "
              f"or 'load date: first added to news.json on YYYY-MM-DD' for load dates).")
    
    url = item.get('url')
    if not isinstance(url, str) or not url.strip():
        error(f"news[{iid}]: 'url' must be a non-empty string")


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
    else:
        try:
            datetime.strptime(r["date"], "%Y-%m-%d")
        except ValueError:
            error(f"races-upcoming[{rid}]: 'date' {r['date']!r} is not a real calendar date")

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

    # Coordinates are REQUIRED for races (geocoding invariant enforced as of 2026-09-12)
    check_coords("races-upcoming", rid, r.get("latitude"), r.get("longitude"), required=True)

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
    if rd is not None:
        if not isinstance(rd, str) or not ISO_DATE_RE.match(rd):
            error(f"race_reports[{rid}]: 'race_date' must be YYYY-MM-DD or null, got {rd!r}")
        else:
            try:
                datetime.strptime(rd, "%Y-%m-%d")
            except ValueError:
                error(f"race_reports[{rid}]: 'race_date' {rd!r} is not a real calendar date")

    # published_date is optional but recommended
    pd = r.get("published_date")
    if pd is not None:
        if not isinstance(pd, str) or not ISO_DATE_RE.match(pd):
            error(f"race_reports[{rid}]: 'published_date' must be YYYY-MM-DD or null, got {pd!r}")
        else:
            try:
                datetime.strptime(pd, "%Y-%m-%d")
            except ValueError:
                error(f"race_reports[{rid}]: 'published_date' {pd!r} is not a real calendar date")
    # Note: published_date is strongly recommended for new reports but not required
    # to maintain compatibility with older reports that may not have it yet


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

    # Validate news.json
    news_path = DATA / "news.json"
    if news_path.exists():
        try:
            with open(news_path) as f:
                news_data = json.load(f)
            if not isinstance(news_data, dict):
                error("news.json: top-level value must be an object")
            elif 'items' not in news_data:
                error("news.json: missing required 'items' array")
            elif not isinstance(news_data['items'], list):
                error("news.json: 'items' must be an array")
            else:
                items = news_data['items']
                check_unique_ids("news", items)
                for i, item in enumerate(items):
                    if isinstance(item, dict):
                        validate_news_item(i, item)
                print(f"  news.json: {len(items)} item(s) checked")
        except json.JSONDecodeError as e:
            error(f"news.json: invalid JSON at line {e.lineno}, col {e.colno}: {e.msg}")
        except Exception as e:
            error(f"news.json: {e}")

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
