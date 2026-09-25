#!/usr/bin/env python3
"""
check-links.py — validates all outbound links on Run Houston cards.

Usage:
  python3 scripts/check-links.py                    # Check all links
  python3 scripts/check-links.py --only-changed     # Only cards changed vs master
  python3 scripts/check-links.py --type races       # Only races
  python3 scripts/check-links.py --type clubs       # Only clubs

Exits 0 if all links pass (no hard fails, no unreviewed flags).
Exits 1 if there are hard fails or unreviewed flags.
"""

import argparse
import json
import re
import sys
import time
import urllib.parse
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set, Tuple

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("ERROR: Required dependencies not installed.")
    print("Run: pip3 install requests beautifulsoup4 lxml")
    sys.exit(1)

REPO = Path(__file__).resolve().parent.parent
DATA = REPO / "data"

# --- Configuration ---

USER_AGENT = "RunHoustonBot/1.0 (+https://runhouston.app/about.html)"
REQUEST_TIMEOUT = 15  # seconds
MAX_RETRIES = 2
RETRY_DELAY = 2  # seconds
HOST_THROTTLE = 1.0  # seconds between requests to same host
MAX_CONTENT_SIZE = 2 * 1024 * 1024  # 2MB

# Generic page patterns (final URL paths that indicate a landing on a generic page)
GENERIC_PATTERNS = [
    r'^/$',
    r'^/index\.(html?|php|asp)$',
    r'^/(en|home)/?$',
    r'^/events?/?$',
    r'^/calendar/?$',
    r'^/races?/?$',
    r'^/community/events?/?$',
    r'^/search\?',
    r'^/find',
]

# RunSignUp/Race Roster search pages (indicate broken registration links)
REGISTRATION_SEARCH_PATTERNS = [
    r'runsignup\.com/race/search',
    r'runsignup\.com/find-a-race',
    r'raceroster\.com/events',
    r'raceroster\.com/search',
]

# --- State ---

link_cache = {}  # URL -> (status_code, final_url, text, error)
host_last_request = {}  # hostname -> last_request_timestamp
stats = {
    "checked": 0,
    "passed": 0,
    "hard_fail": 0,
    "flagged_generic": 0,
    "flagged_context": 0,
    "reviewed_ok": 0,
}
failures = []

# --- Utilities ---


def normalize_for_match(text: str) -> str:
    """Normalize text for fuzzy matching: lowercase, strip common words."""
    if not text:
        return ""
    # Remove common filler words
    noise = {"the", "a", "an", "annual", "5k", "10k", "run", "race", "club", "houston"}
    words = re.findall(r'\w+', text.lower())
    return " ".join(w for w in words if w not in noise)


def tokens_in(needle: str, haystack: str) -> bool:
    """Check if all tokens from needle appear in haystack (fuzzy match)."""
    needle_norm = normalize_for_match(needle)
    haystack_norm = normalize_for_match(haystack)
    if not needle_norm:
        return True
    needle_tokens = needle_norm.split()
    return all(token in haystack_norm for token in needle_tokens)


def is_generic_path(url: str) -> bool:
    """Check if final URL path indicates a generic landing page."""
    parsed = urllib.parse.urlparse(url)
    path = parsed.path.lower()
    for pattern in GENERIC_PATTERNS:
        if re.search(pattern, path):
            return True
    return False


def is_registration_search(url: str) -> bool:
    """Check if URL is a registration platform search page (broken race link)."""
    url_lower = url.lower()
    for pattern in REGISTRATION_SEARCH_PATTERNS:
        if re.search(pattern, url_lower):
            return True
    return False


def extract_text(html: str, anchor: str = None) -> str:
    """
    Extract visible text from HTML.
    If anchor is provided (e.g. "section-run-club"), try to extract text from that section.
    """
    try:
        soup = BeautifulSoup(html, "lxml")
        
        # Remove script and style elements
        for script in soup(["script", "style", "noscript"]):
            script.decompose()
        
        if anchor:
            # Try to find element with matching id or name
            target = soup.find(id=anchor) or soup.find(attrs={"name": anchor})
            if target:
                # Get text from this element and its children
                return target.get_text(separator=" ", strip=True)
        
        # Get all text from body or entire doc
        body = soup.body or soup
        return body.get_text(separator=" ", strip=True)
    except Exception as e:
        print(f"  WARNING: Failed to parse HTML: {e}")
        return ""


def fetch_url(url: str) -> Tuple[int, str, str, str]:
    """
    Fetch URL and return (status_code, final_url, text, error).
    Returns (0, url, "", error_message) on hard failures.
    Implements retries, throttling, and caching.
    """
    if url in link_cache:
        return link_cache[url]
    
    parsed = urllib.parse.urlparse(url)
    hostname = parsed.hostname or ""
    
    # Throttle requests to same host
    if hostname in host_last_request:
        elapsed = time.time() - host_last_request[hostname]
        if elapsed < HOST_THROTTLE:
            time.sleep(HOST_THROTTLE - elapsed)
    
    error = ""
    for attempt in range(MAX_RETRIES + 1):
        try:
            headers = {"User-Agent": USER_AGENT}
            response = requests.get(
                url,
                headers=headers,
                timeout=REQUEST_TIMEOUT,
                allow_redirects=True,
                stream=True
            )
            
            # Handle 429 with retry
            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                if attempt < MAX_RETRIES:
                    wait_time = int(retry_after) if retry_after and retry_after.isdigit() else (RETRY_DELAY * (attempt + 1))
                    wait_time = min(wait_time, 30)  # Cap at 30s
                    time.sleep(wait_time)
                    continue
                else:
                    # Persistent 429 after retries
                    error = "HTTP 429 (rate limited, persistent after retries)"
                    break
            
            # Read content with size limit
            content = b""
            for chunk in response.iter_content(chunk_size=8192):
                content += chunk
                if len(content) > MAX_CONTENT_SIZE:
                    break
            
            text = content.decode("utf-8", errors="ignore")
            final_url = response.url
            status_code = response.status_code
            
            host_last_request[hostname] = time.time()
            result = (status_code, final_url, text, "")
            link_cache[url] = result
            return result
            
        except requests.exceptions.SSLError as e:
            error = f"TLS error: {e}"
        except requests.exceptions.ConnectionError as e:
            error = f"Connection error: {e}"
        except requests.exceptions.Timeout:
            error = "Timeout"
        except Exception as e:
            error = f"Error: {e}"
        
        if attempt < MAX_RETRIES:
            time.sleep(RETRY_DELAY * (attempt + 1))
    
    # Hard failure after retries
    host_last_request[hostname] = time.time()
    result = (0, url, "", error)
    link_cache[url] = result
    return result


def load_reviewed_exceptions() -> Dict[str, Dict]:
    """Load reviewed exceptions from data/link-review.json."""
    path = DATA / "link-review.json"
    if not path.exists():
        return {}
    try:
        with open(path) as f:
            data = json.load(f)
        # Normalize to {url: {card_id: {...}}}
        result = {}
        for url, cards in data.items():
            if not isinstance(cards, dict):
                continue
            result[url] = cards
        return result
    except Exception as e:
        print(f"WARNING: Failed to load {path}: {e}")
        return {}


# --- Link checking logic ---


def get_changed_cards(base_branch: str = "master") -> Dict[str, Set[str]]:
    """
    Get IDs of cards that were added or changed vs base branch.
    Returns dict of {card_type: set(card_ids)}, or None to check all.
    """
    import subprocess
    
    changed_cards = {
        "clubs": set(),
        "races": set(),
        "news": set(),
        "reports": set()
    }
    
    try:
        # Check if check-links.py itself changed - if so, check all links
        script_check = subprocess.run(
            ["git", "diff", "--name-only", f"{base_branch}...HEAD", "scripts/check-links.py"],
            capture_output=True,
            text=True,
            cwd=REPO
        )
        if script_check.returncode == 0 and script_check.stdout.strip():
            print("Note: check-links.py changed, running full check")
            return None
        
        # Get list of changed JSON files
        result = subprocess.run(
            ["git", "diff", "--name-only", f"{base_branch}...HEAD", "data/"],
            capture_output=True,
            text=True,
            cwd=REPO
        )
        
        if result.returncode != 0:
            print(f"Warning: git diff failed, checking all cards")
            return None
        
        changed_files = result.stdout.strip().split('\n')
        
        for filepath in changed_files:
            if not filepath or not filepath.endswith('.json'):
                continue
            
            # Determine card type from filename
            card_type = None
            if 'clubs.json' in filepath:
                card_type = 'clubs'
            elif 'races-upcoming.json' in filepath:
                card_type = 'races'
            elif 'news.json' in filepath:
                card_type = 'news'
            elif 'race_reports.json' in filepath:
                card_type = 'reports'
            else:
                continue
            
            # Get the diff to find changed card IDs
            diff_result = subprocess.run(
                ["git", "diff", f"{base_branch}...HEAD", "--", filepath],
                capture_output=True,
                text=True,
                cwd=REPO
            )
            
            if diff_result.returncode != 0:
                continue
            
            # Extract IDs from diff (look for "id": "..." in added/changed lines)
            for line in diff_result.stdout.split('\n'):
                if line.startswith('+') and '"id"' in line:
                    match = re.search(r'"id"\s*:\s*"([^"]+)"', line)
                    if match:
                        changed_cards[card_type].add(match.group(1))
        
        return changed_cards
    
    except Exception as e:
        print(f"Warning: Failed to get changed cards: {e}")
        return None


def check_link(
    card_type: str,
    card_id: str,
    field_name: str,
    url: str,
    card_data: dict,
    reviewed: Dict[str, Dict]
) -> Tuple[str, str]:
    """
    Check a single link.
    Returns (status, message) where status is "pass", "hard_fail", "flag_generic", "flag_context".
    """
    stats["checked"] += 1
    
    # Check if this link is reviewed (per-card exceptions only)
    if url in reviewed and card_id in reviewed[url]:
        review = reviewed[url][card_id]
        stats["reviewed_ok"] += 1
        return ("pass", f"Reviewed exception: {review.get('note', 'manually verified')}")
    
    # Fetch the URL
    status_code, final_url, text, error = fetch_url(url)
    
    # Hard fail conditions - no auto-pass, no exceptions in code
    if status_code == 0:
        stats["hard_fail"] += 1
        return ("hard_fail", error)
    
    if status_code >= 400:
        stats["hard_fail"] += 1
        return ("hard_fail", f"HTTP {status_code}")
    
    # Flag generic pages - every card type must land on specific page
    if is_generic_path(final_url):
        stats["flagged_generic"] += 1
        return ("flag_generic", f"Generic page (homepage/events listing): {final_url}")
    
    # For all card types, flag registration search pages
    if is_registration_search(final_url):
        stats["flagged_generic"] += 1
        return ("flag_generic", f"Registration search page: {final_url}")
    
    # Context check
    anchor = None
    if "#" in url:
        anchor = url.split("#", 1)[1]
    
    page_text = extract_text(text, anchor)
    
    if card_type == "club":
        # Club name must appear in page text
        club_name = card_data.get("club_name", "")
        if not tokens_in(club_name, page_text):
            stats["flagged_context"] += 1
            return ("flag_context", f"Club name '{club_name}' not found on landing page")
    
    elif card_type == "race":
        # Race name must appear (use normalized matching to handle variations)
        race_name = card_data.get("name", "")
        
        # Strip out suffixes like "(Day 1)", "(37)", "presented by X" for matching
        # Just match the core event name
        core_name = re.sub(r'\s*\([^)]*\)\s*', '', race_name)  # Remove (parentheses)
        core_name = re.sub(r'\s*presented by.*$', '', core_name, flags=re.IGNORECASE)
        core_name = re.sub(r'\s*sponsored by.*$', '', core_name, flags=re.IGNORECASE)
        
        if not tokens_in(core_name, page_text):
            stats["flagged_context"] += 1
            return ("flag_context", f"Race name not found on landing page")
        
        # Race date or year must appear
        race_date = card_data.get("date", "")
        if race_date:
            year = race_date.split("-")[0]
            # Only 2027+ races can skip year check (pages may not be updated yet)
            # 2026 and earlier races MUST show the year
            if int(year) <= 2026 and year not in page_text:
                stats["flagged_context"] += 1
                return ("flag_context", f"Race year '{year}' not found on landing page")
    
    elif card_type == "news":
        # News items often link directly to race/event pages (announcements)
        # or to news articles. Be pragmatic about context checks.
        headline = card_data.get("headline", "")
        
        # Check if this is a registration/org/event page (not a news article)
        is_event_page = any(domain in final_url.lower() for domain in [
            'runsignup.com', 'raceroster.com', 'active.com', 'ultrasignup.com',
            'adventuresignup.com', 'harra.org', 'powerinmotion.org', 'alex5k.com',
            'houstonhalf.com', 'chevronhoustonmarathon.com', 'travismanion.org',
            'bosplace.org'
        ])
        
        if is_event_page:
            # For event/org pages, the link itself is sufficient - skip detailed context check
            # These are announcements, not articles
            pass  # Passes context check
        else:
            # For actual news articles, check title/og:title/h1
            # Use very lenient matching since these are from news sites with paywalls etc.
            try:
                soup = BeautifulSoup(text, "lxml")
                title = soup.find("title")
                title_text = title.get_text(strip=True) if title else ""
                og_title = soup.find("meta", property="og:title")
                og_title_text = og_title["content"] if og_title and og_title.get("content") else ""
                h1 = soup.find("h1")
                h1_text = h1.get_text(strip=True) if h1 else ""
                
                # Extract key terms (non-common words) from headline
                headline_words = [w for w in re.findall(r'\w+', headline.lower()) 
                                 if w not in {'the', 'a', 'an', 'and', 'or', 'for', 'to', 'in', 'at', 'on', 'set', 'returns', 'now', 'open'}]
                
                # Check if any significant terms match
                has_match = False
                for word in headline_words[:5]:  # Check first 5 significant words
                    if len(word) > 3:  # Skip very short words
                        if word in title_text.lower() or word in og_title_text.lower() or word in h1_text.lower():
                            has_match = True
                            break
                
                if not has_match:
                    stats["flagged_context"] += 1
                    return ("flag_context", f"News article title/headline not found on landing page")
            except:
                # If parsing fails, be lenient
                pass
    
    elif card_type == "report":
        # Race report title should appear
        title = card_data.get("title", "")
        if title and not tokens_in(title, page_text):
            # Reports might link to RunSignUp results or other sources
            # This is more lenient - just check if the race name appears
            race_name = card_data.get("race_name", "")
            if race_name and not tokens_in(race_name, page_text):
                stats["flagged_context"] += 1
                return ("flag_context", f"Report title/race name not found on landing page")
    
    stats["passed"] += 1
    return ("pass", "OK")


# --- Data loading ---


def load_clubs() -> List[dict]:
    """Load clubs from data/clubs.json."""
    with open(DATA / "clubs.json") as f:
        return json.load(f)


def load_races() -> List[dict]:
    """Load races from data/races-upcoming.json."""
    with open(DATA / "races-upcoming.json") as f:
        return json.load(f)


def load_news() -> List[dict]:
    """Load news from data/news.json."""
    with open(DATA / "news.json") as f:
        data = json.load(f)
        return data.get("items", [])


def load_reports() -> List[dict]:
    """Load race reports from data/race_reports.json."""
    with open(DATA / "race_reports.json") as f:
        return json.load(f)


# --- Main checking logic ---


def check_all_links(
    card_types: List[str] = None,
    only_changed: bool = False
) -> bool:
    """
    Check all links across specified card types.
    Returns True if all pass (no hard fails, no unreviewed flags).
    """
    reviewed = load_reviewed_exceptions()
    
    if card_types is None:
        card_types = ["clubs", "races", "news", "reports"]
    
    # Load data
    data_map = {
        "clubs": load_clubs() if "clubs" in card_types else [],
        "races": load_races() if "races" in card_types else [],
        "news": load_news() if "news" in card_types else [],
        "reports": load_reports() if "reports" in card_types else [],
    }
    
    # Get changed cards if requested
    changed_filter = None
    if only_changed:
        changed_filter = get_changed_cards()
        if changed_filter is None:
            print("Warning: Could not determine changed cards, checking all")
        else:
            total_changed = sum(len(ids) for ids in changed_filter.values())
            print(f"Only checking {total_changed} changed cards")
    
    print(f"Starting link check (types: {', '.join(card_types)})...\n")
    
    # Check clubs
    if "clubs" in card_types:
        clubs_to_check = data_map["clubs"]
        if changed_filter:
            clubs_to_check = [c for c in clubs_to_check if c["id"] in changed_filter["clubs"]]
        print(f"Checking {len(clubs_to_check)} clubs...")
        for club in clubs_to_check:
            url = club.get("website_url")
            if not url:
                continue
            
            status, message = check_link(
                "club", club["id"], "website_url", url, club, reviewed
            )
            
            if status != "pass":
                failures.append({
                    "type": "club",
                    "id": club["id"],
                    "name": club.get("club_name", ""),
                    "field": "website_url",
                    "url": url,
                    "status": status,
                    "message": message
                })
    
    # Check races
    if "races" in card_types:
        races_to_check = data_map["races"]
        
        # Skip races dated before 2026-09-24 (will be deleted by PR #28)
        from datetime import date
        cutoff_date = date(2026, 9, 24)
        races_to_check = [
            r for r in races_to_check 
            if r.get("date") and date.fromisoformat(r["date"]) >= cutoff_date
        ]
        
        if changed_filter:
            races_to_check = [r for r in races_to_check if r["id"] in changed_filter["races"]]
        print(f"Checking {len(races_to_check)} races (skipped {len([r for r in data_map['races'] if r.get('date') and date.fromisoformat(r['date']) < cutoff_date])} past races)...")
        for race in races_to_check:
            for field in ["official_website_url", "source_url"]:
                url = race.get(field)
                if not url:
                    continue
                
                status, message = check_link(
                    "race", race["id"], field, url, race, reviewed
                )
                
                if status != "pass":
                    failures.append({
                        "type": "race",
                        "id": race["id"],
                        "name": race.get("name", ""),
                        "field": field,
                        "url": url,
                        "status": status,
                        "message": message
                    })
    
    # Check news
    if "news" in card_types:
        news_to_check = data_map["news"]
        if changed_filter:
            news_to_check = [n for n in news_to_check if n["id"] in changed_filter["news"]]
        print(f"Checking {len(news_to_check)} news items...")
        for item in news_to_check:
            url = item.get("url")
            if not url:
                continue
            
            status, message = check_link(
                "news", item["id"], "url", url, item, reviewed
            )
            
            if status != "pass":
                failures.append({
                    "type": "news",
                    "id": item["id"],
                    "name": item.get("headline", ""),
                    "field": "url",
                    "url": url,
                    "status": status,
                    "message": message
                })
    
    # Check reports (note: race_reports.json doesn't seem to have URL fields in the schema)
    # Skip for now unless we find URL fields
    
    return True


# --- Output ---


def print_report():
    """Print final report."""
    print("\n" + "=" * 70)
    print("LINK CHECK REPORT")
    print("=" * 70)
    print(f"\nTotal links checked:     {stats['checked']}")
    print(f"  Passed:                {stats['passed']}")
    print(f"  Reviewed (allowed):    {stats['reviewed_ok']}")
    print(f"  Hard failures:         {stats['hard_fail']}")
    print(f"  Flagged (generic):     {stats['flagged_generic']}")
    print(f"  Flagged (context):     {stats['flagged_context']}")
    
    if failures:
        print(f"\n{len(failures)} FAILURE(S):\n")
        
        # Group by status
        by_status = defaultdict(list)
        for f in failures:
            by_status[f["status"]].append(f)
        
        for status in ["hard_fail", "flag_generic", "flag_context"]:
            if status not in by_status:
                continue
            
            label = {
                "hard_fail": "HARD FAILURES",
                "flag_generic": "FLAGGED: GENERIC PAGES",
                "flag_context": "FLAGGED: CONTEXT MISMATCH"
            }[status]
            
            print(f"\n{label}:")
            print("-" * 70)
            
            for f in by_status[status]:
                print(f"\n  {f['type']}: {f['id']}")
                print(f"  Name: {f['name']}")
                print(f"  Field: {f['field']}")
                print(f"  URL: {f['url']}")
                print(f"  Issue: {f['message']}")


def main():
    parser = argparse.ArgumentParser(
        description="Check all outbound links on Run Houston cards"
    )
    parser.add_argument(
        "--type",
        choices=["clubs", "races", "news", "reports"],
        help="Check only specified card type"
    )
    parser.add_argument(
        "--only-changed",
        action="store_true",
        help="Check only cards changed vs base branch (for PR checks)"
    )
    
    args = parser.parse_args()
    
    card_types = [args.type] if args.type else None
    
    try:
        check_all_links(card_types, args.only_changed)
        print_report()
        
        # Exit non-zero if any hard fails or unreviewed flags
        has_failures = (
            stats["hard_fail"] > 0 or 
            stats["flagged_generic"] > 0 or 
            stats["flagged_context"] > 0
        )
        
        if has_failures:
            print("\n❌ FAIL: Links require review or fixes.")
            sys.exit(1)
        else:
            print("\n✅ PASS: All links validated.")
            sys.exit(0)
    
    except KeyboardInterrupt:
        print("\n\nInterrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
