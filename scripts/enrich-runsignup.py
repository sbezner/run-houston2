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


# ---------- Step 2: Replace non-RunSignUp URLs (placeholder) ----------

def step2_replace(races, apply=False):
    """Replace non-RunSignUp URLs with RunSignUp URLs via API lookup."""
    print("=" * 60)
    print("STEP 2: Replace non-RunSignUp URLs with RunSignUp URLs")
    print("=" * 60)
    print("  (Not yet implemented — coming next)\n")
    return 0


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
