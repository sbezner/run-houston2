#!/usr/bin/env python3
"""
fetch-runsignup-window.py — fetch Houston-area races from RunSignUp API
for a given date window and save as a JSON file ready for merge-races.py.

Usage: python3 scripts/fetch-runsignup-window.py START_DATE END_DATE OUTPUT_FILE
Example: python3 scripts/fetch-runsignup-window.py 2026-06-01 2026-06-07 ~/Downloads/rsu-2026-06-01-to-2026-06-07.json
"""

import json
import re
import sys
import urllib.request

API_KEY = "zIPJfii0zCmlvXQsTq5mSlH9kD3hTkee"
API_SECRET = "1pIKGMD1mhjb4AIQrcw32diIsdugkavH"
AFFILIATE_TOKEN = "uOWL1MZWQ2qYNlFuqMcOEfxgn0WZFSyH"


def normalize_date(d):
    """Convert RunSignUp MM/DD/YYYY to YYYY-MM-DD."""
    if not d:
        return None
    if "/" in d:
        parts = d.split("/")
        if len(parts) == 3:
            return f"{parts[2]}-{parts[0].zfill(2)}-{parts[1].zfill(2)}"
    return d


def make_id(name, date):
    """Generate a slug id from race name and date."""
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9 ]", "", slug)
    slug = re.sub(r"\s+", "-", slug.strip())
    slug = re.sub(r"-+", "-", slug).strip("-")
    year = date[:4] if date else "2026"
    if not slug.endswith(year):
        slug += "-" + year
    return slug


def fetch(start_date, end_date):
    """Fetch all Houston-area races from RunSignUp for the window."""
    all_races = []
    page = 1
    while True:
        url = (
            f"https://runsignup.com/rest/races?"
            f"api_key={API_KEY}&api_secret={API_SECRET}&format=json"
            f"&zipcode=77002&radius=60"
            f"&start_date={start_date}&end_date={end_date}"
            f"&results_per_page=200&page={page}"
            f"&aflt_token={AFFILIATE_TOKEN}"
        )
        try:
            resp = urllib.request.urlopen(url)
            data = json.loads(resp.read())
        except Exception as e:
            print(f"  API error: {e}", file=sys.stderr)
            break

        races = data.get("races", [])
        if not races:
            break

        for r in races:
            race = r.get("race", {})
            nd = normalize_date(race.get("next_date", ""))
            addr = race.get("address", {})

            entry = {
                "id": make_id(race.get("name", ""), nd or ""),
                "name": race.get("name", ""),
                "date": nd,
                "start_time": None,
                "tz": "America/Chicago",
                "address": addr.get("street") or None,
                "city": addr.get("city", ""),
                "state": addr.get("state", "TX"),
                "zip": addr.get("zipcode") or None,
                "latitude": None,
                "longitude": None,
                "distance": ["5K"],  # default; merge-races.py won't overwrite existing
                "surface": "road",
                "kid_run": False,
                "official_website_url": race.get("url", ""),
                "source_url": race.get("url", ""),
                "description": "A running race in "
                + (addr.get("city") or "Houston")
                + ", TX.",
            }
            all_races.append(entry)

        if len(races) < 200:
            break
        page += 1

    return all_races


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(2)

    start_date = sys.argv[1]
    end_date = sys.argv[2]
    output_file = sys.argv[3]

    races = fetch(start_date, end_date)
    with open(output_file, "w") as f:
        json.dump(races, f, indent=2)

    print(f"  RunSignUp API: {len(races)} races for {start_date} to {end_date}")
    print(f"  Saved to {output_file}")


if __name__ == "__main__":
    main()
