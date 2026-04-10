#!/usr/bin/env python3
"""
enrich-runsignup.py — enrich races-upcoming.json with RunSignUp affiliate data.

Run as: python3 scripts/enrich-runsignup.py [--apply]

Three steps, run in order. Each step can be run independently by passing
--step1, --step2, or --step3. Default (no step flag) runs all three.

  Step 1: Append affiliate token to existing RunSignUp URLs
  Step 2: Replace non-RunSignUp URLs with RunSignUp URLs (via API lookup)
  Step 3: Discover new races from RunSignUp not in our data (via API)

Dry-run by default (shows what would change). Pass --apply to write.

Credentials are read from environment variables:
  RUNSIGNUP_API_KEY
  RUNSIGNUP_API_SECRET
  RUNSIGNUP_AFFILIATE_TOKEN

Or from a .env file at the repo root if python-dotenv is available.
"""

import json
import os
import sys
from pathlib import Path
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

REPO = Path(__file__).resolve().parent.parent
LIVE_PATH = REPO / "data" / "races-upcoming.json"

# Try loading .env if available (not required)
try:
    from dotenv import load_dotenv
    load_dotenv(REPO / ".env")
except ImportError:
    pass

AFFILIATE_TOKEN = os.environ.get(
    "RUNSIGNUP_AFFILIATE_TOKEN",
    "uOWL1MZWQ2qYNlFuqMcOEfxgn0WZFSyH"
)
API_KEY = os.environ.get(
    "RUNSIGNUP_API_KEY",
    "zIPJfii0zCmlvXQsTq5mSlH9kD3hTkee"
)
API_SECRET = os.environ.get(
    "RUNSIGNUP_API_SECRET",
    "1pIKGMD1mhjb4AIQrcw32diIsdugkavH"
)


def is_runsignup_url(url):
    """Check if a URL is a RunSignUp URL."""
    if not url:
        return False
    host = urlparse(url).netloc.lower()
    return "runsignup.com" in host


def has_affiliate_token(url):
    """Check if a URL already has an affiliate_token parameter."""
    if not url:
        return False
    return "affiliate_token=" in url


def append_affiliate_token(url, token):
    """Append affiliate_token to a URL, preserving existing query params."""
    if not url or has_affiliate_token(url):
        return url
    separator = "&" if "?" in url else "?"
    return url + separator + "affiliate_token=" + token


# ---------- Step 1: Enrich existing RunSignUp URLs ----------

def step1_enrich(races, apply=False):
    """Append affiliate token to existing RunSignUp URLs."""
    print("=" * 60)
    print("STEP 1: Append affiliate token to existing RunSignUp URLs")
    print("=" * 60)

    changes = []
    for race in races:
        url = race.get("official_website_url")
        if is_runsignup_url(url) and not has_affiliate_token(url):
            new_url = append_affiliate_token(url, AFFILIATE_TOKEN)
            changes.append((race["id"], url, new_url))
            if apply:
                race["official_website_url"] = new_url

    if not changes:
        print("  No changes needed — all RunSignUp URLs already have the token.\n")
        return 0

    print(f"  {len(changes)} URL(s) to update:\n")
    for rid, old, new in changes[:10]:
        print(f"  {rid}")
        print(f"    old: {old}")
        print(f"    new: {new}")
    if len(changes) > 10:
        print(f"  ... and {len(changes) - 10} more")
    print()
    return len(changes)


# ---------- Step 2: Replace non-RunSignUp URLs via API ----------

import re
import urllib.request

# Confidence threshold for auto-matching. Races below this score
# are listed as "review needed" but not auto-replaced.
MATCH_THRESHOLD = 0.75

# Houston area search params for RunSignUp API
RSU_SEARCH_PARAMS = {
    "zipcode": "77002",
    "radius": "60",
}


def normalize_name(name):
    """Lowercase, strip punctuation, remove common noise words."""
    name = name.lower()
    name = re.sub(r"[''\".,!?&/:;()@#\-–—]", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    for noise in [
        "presented by houston methodist",
        "presented by",
        "annual",
    ]:
        name = name.replace(noise, "")
    # Strip leading ordinals like "29th", "40th", "16th"
    name = re.sub(r"^\d+(st|nd|rd|th)\s+", "", name)
    return name.strip()


def token_overlap(a, b):
    """Fraction of tokens in common (Jaccard-ish on the smaller set)."""
    ta = set(normalize_name(a).split())
    tb = set(normalize_name(b).split())
    if not ta or not tb:
        return 0
    return len(ta & tb) / min(len(ta), len(tb))


def normalize_rsu_date(d):
    """Convert RunSignUp MM/DD/YYYY to YYYY-MM-DD."""
    if not d:
        return None
    if "/" in d:
        parts = d.split("/")
        if len(parts) == 3:
            return f"{parts[2]}-{parts[0].zfill(2)}-{parts[1].zfill(2)}"
    return d


def fetch_rsu_races(start_date, end_date):
    """Fetch all Houston-area races from RunSignUp API for a date range."""
    all_races = []
    page = 1
    while True:
        params = (
            f"api_key={API_KEY}&api_secret={API_SECRET}&format=json"
            f"&zipcode={RSU_SEARCH_PARAMS['zipcode']}"
            f"&radius={RSU_SEARCH_PARAMS['radius']}"
            f"&start_date={start_date}&end_date={end_date}"
            f"&results_per_page=200&page={page}"
            f"&aflt_token={AFFILIATE_TOKEN}"
        )
        url = f"https://runsignup.com/rest/races?{params}"
        resp = urllib.request.urlopen(url)
        data = json.loads(resp.read())
        races = data.get("races", [])
        if not races:
            break
        for r in races:
            race = r.get("race", {})
            all_races.append({
                "name": race.get("name", ""),
                "date": normalize_rsu_date(race.get("next_date", "")),
                "url": race.get("url", ""),
                "city": race.get("address", {}).get("city", ""),
                "race_id": race.get("race_id"),
            })
        if len(races) < 200:
            break
        page += 1
    return all_races


def find_best_match(race, rsu_by_date):
    """Find the best RunSignUp match for a race by date + name similarity."""
    candidates = rsu_by_date.get(race["date"], [])
    best_score = 0
    best_match = None
    for c in candidates:
        score = token_overlap(race["name"], c["name"])
        if score > best_score:
            best_score = score
            best_match = c
    return best_match, best_score


def step2_replace(races, apply=False):
    """Replace non-RunSignUp URLs with RunSignUp URLs via API lookup."""
    print("=" * 60)
    print("STEP 2: Replace non-RunSignUp URLs with RunSignUp URLs")
    print("=" * 60)

    # Find non-RunSignUp races
    non_rsu = [
        r for r in races
        if r.get("official_website_url")
        and not is_runsignup_url(r["official_website_url"])
    ]
    if not non_rsu:
        print("  No non-RunSignUp URLs to check.\n")
        return 0

    # Determine date range from all races
    dates = sorted(r["date"] for r in races if r.get("date"))
    start_date = dates[0]
    end_date = dates[-1]

    print(f"  Fetching RunSignUp races for {start_date} to {end_date}...")
    rsu_races = fetch_rsu_races(start_date, end_date)
    print(f"  Found {len(rsu_races)} RunSignUp races in Houston area.\n")

    # Index by date
    rsu_by_date = {}
    for r in rsu_races:
        if r["date"]:
            rsu_by_date.setdefault(r["date"], []).append(r)

    # Match
    replacements = []
    review = []
    no_match = []

    for race in non_rsu:
        match, score = find_best_match(race, rsu_by_date)
        if match and score >= MATCH_THRESHOLD:
            replacements.append((race, match, score))
            if apply:
                race["official_website_url"] = match["url"]
        elif match and score >= 0.5:
            review.append((race, match, score))
        else:
            no_match.append(race)

    # Report
    print(f"  Non-RunSignUp races checked: {len(non_rsu)}")
    print(f"  Replacements (>={MATCH_THRESHOLD:.0%}): {len(replacements)}")
    print(f"  Review needed (50-{MATCH_THRESHOLD:.0%}): {len(review)}")
    print(f"  No match: {len(no_match)}")
    print()

    if replacements:
        print("  --- REPLACEMENTS ---")
        for race, match, score in replacements:
            print(f"  [{score:.0%}] {race['id']}")
            print(f"       {race['name']}")
            print(f"       old: {race.get('official_website_url', 'none')}")
            print(f"       new: {match['url']}")
            print()

    if review:
        print("  --- REVIEW NEEDED (not auto-replaced) ---")
        for race, match, score in review:
            print(f"  [{score:.0%}] {race['id']}: {race['name']}")
            print(f"       matched: {match['name']}")
            print(f"       url: {match['url']}")
            print()

    if no_match:
        print(f"  --- NO MATCH ({len(no_match)}) ---")
        for race in no_match:
            print(f"  {race['id']}  {race['name']}")
        print()

    return len(replacements)


# ---------- Step 3: Discover new races (placeholder) ----------

def step3_discover(races, apply=False):
    """Discover new races from RunSignUp not in our data."""
    print("=" * 60)
    print("STEP 3: Discover new races from RunSignUp")
    print("=" * 60)
    print("  (Not yet implemented — coming next)\n")
    return 0


# ---------- Main ----------

def main():
    args = set(sys.argv[1:])

    if {"-h", "--help"} & args:
        print(__doc__)
        sys.exit(0)

    apply = "--apply" in args
    run_all = not ({"--step1", "--step2", "--step3"} & args)

    with open(LIVE_PATH) as f:
        races = json.load(f)

    print(f"Loaded {len(races)} races from {LIVE_PATH}\n")

    total_changes = 0

    if run_all or "--step1" in args:
        total_changes += step1_enrich(races, apply=apply)

    if run_all or "--step2" in args:
        total_changes += step2_replace(races, apply=apply)

    if run_all or "--step3" in args:
        total_changes += step3_discover(races, apply=apply)

    if not apply:
        if total_changes > 0:
            print(f"Dry run — {total_changes} change(s) found. Re-run with --apply to write.")
        else:
            print("Nothing to do.")
        return

    if total_changes > 0:
        with open(LIVE_PATH, "w") as f:
            json.dump(races, f, indent=2)
            f.write("\n")
        print(f"Wrote {len(races)} records to {LIVE_PATH}")

        print("Running data validator...")
        import subprocess
        rc = subprocess.call(["python3", str(REPO / "scripts" / "validate-data.py")])
        if rc != 0:
            print("VALIDATION FAILED", file=sys.stderr)
            sys.exit(rc)
    else:
        print("No changes to write.")


if __name__ == "__main__":
    main()
