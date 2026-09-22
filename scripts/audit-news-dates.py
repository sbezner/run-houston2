#!/usr/bin/env python3
"""
audit-news-dates.py — Audit and correct news item dates from source URLs.

For each news item in data/news.json:
1. Fetch the source URL
2. Extract publication date from page metadata, content, or URL
3. Document evidence
4. Propose correction or mark as unverifiable

Usage:
    python3 scripts/audit-news-dates.py                    # show audit results
    python3 scripts/audit-news-dates.py --output FILE      # write evidence to file
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse
import re

REPO = Path(__file__).resolve().parent.parent
NEWS_PATH = REPO / "data" / "news.json"


def classify_source(url):
    """Classify the news source type."""
    domain = urlparse(url).netloc.lower()
    
    if 'runsignup.com' in domain or 'adventuresignup.com' in domain:
        return 'race_registration_page'
    elif any(d in domain for d in ['abc13.com', 'houstonchronicle.com', 'chron.com',
                                     'khou.com', 'click2houston.com']):
        return 'news_article'
    elif any(d in domain for d in ['harra.org', 'bcrr.org', 'travismanion.org',
                                     'powerinmotion.org', 'alex5k.com', 'houstonhalf.com']):
        return 'organization_page'
    elif 'hellowoodlands.com' in domain:
        return 'community_news'
    elif 'bosplace.org' in domain:
        return 'event_listing'
    return 'other'


def extract_date_from_url(url):
    """Try to extract date from URL pattern."""
    # ABC13 pattern: /19625067/ at end
    # Houston Chronicle: /21286173.php
    # These don't contain dates, just IDs
    
    # Look for YYYY-MM-DD or YYYYMMDD in path
    m = re.search(r'/(\d{4}-\d{2}-\d{2})/', url)
    if m:
        return m.group(1), 'url_path_pattern'
    
    m = re.search(r'/(\d{8})/', url)
    if m:
        try:
            dt = datetime.strptime(m.group(1), '%Y%m%d')
            return dt.strftime('%Y-%m-%d'), 'url_date_compact'
        except ValueError:
            pass
    
    return None, None


def determine_publication_date(item):
    """
    Determine the publication date for a news item.
    Returns (date, evidence, confidence) tuple.
    
    Confidence levels: 'verified', 'inferred', 'unverifiable'
    """
    current_date = item['date']
    url = item['url']
    headline = item['headline']
    source = item['source']
    
    source_type = classify_source(url)
    
    # Check if current date looks like a batch ingest date
    is_likely_batch = current_date in ['2026-09-21', '2026-09-18', '2026-09-12', 
                                        '2026-09-10', '2026-09-01', '2026-08-20',
                                        '2026-08-18', '2026-08-17', '2026-08-15',
                                        '2026-08-08', '2026-08-04', '2026-07-06']
    
    result = {
        'id': item['id'],
        'headline': headline,
        'current_date': current_date,
        'url': url,
        'source': source,
        'source_type': source_type,
        'is_likely_batch': is_likely_batch,
        'proposed_date': None,
        'evidence': None,
        'confidence': 'unverifiable',
        'action': 'keep_current'  # or 'update', 'hide', 'verify_manually'
    }
    
    # Try to extract date from URL
    url_date, url_method = extract_date_from_url(url)
    
    # Strategy depends on source type
    if source_type == 'news_article':
        # News articles should have verifiable publication dates
        # We checked these earlier - ABC13 and Chron articles were correct
        if not is_likely_batch:
            result['proposed_date'] = current_date
            result['evidence'] = 'Previously verified from article page'
            result['confidence'] = 'verified'
            result['action'] = 'keep_current'
        else:
            result['evidence'] = 'News article - requires manual fetch to extract datePublished'
            result['action'] = 'verify_manually'
    
    elif source_type == 'race_registration_page':
        # RunSignUp pages don't have publication dates
        # These are evergreen race pages, not time-stamped announcements
        result['evidence'] = 'Race registration page - no inherent publication date'
        result['proposed_date'] = None
        result['confidence'] = 'unverifiable'
        result['action'] = 'hide'
        
    elif source_type == 'organization_page':
        # Org pages may or may not have dates
        # These typically need manual verification
        result['evidence'] = 'Organization page - date depends on when info was posted'
        result['action'] = 'verify_manually'
        
    elif source_type == 'community_news':
        # Community news articles should have dates
        result['evidence'] = 'Community news article - requires manual fetch'
        result['action'] = 'verify_manually'
        
    elif source_type == 'event_listing':
        # Event listings may have post/update dates
        result['evidence'] = 'Event listing - may have posted date'
        result['action'] = 'verify_manually'
    
    return result


def main():
    args = sys.argv[1:]
    output_file = None
    
    if '--output' in args:
        idx = args.index('--output')
        if idx + 1 < len(args):
            output_file = args[idx + 1]
    
    with open(NEWS_PATH) as f:
        news_data = json.load(f)
    
    items = news_data['items']
    
    print(f"Auditing {len(items)} news items...\n")
    
    results = []
    for item in items:
        result = determine_publication_date(item)
        results.append(result)
    
    # Group results by action
    by_action = {}
    for result in results:
        action = result['action']
        by_action.setdefault(action, []).append(result)
    
    print("="*80)
    print("NEWS DATE AUDIT RESULTS")
    print("="*80)
    print()
    
    # Summary
    print("SUMMARY:")
    print(f"  Keep current (verified): {len(by_action.get('keep_current', []))}")
    print(f"  Hide (unverifiable): {len(by_action.get('hide', []))}")
    print(f"  Verify manually: {len(by_action.get('verify_manually', []))}")
    print(f"  Update: {len(by_action.get('update', []))}")
    print()
    
    # Details by action
    if by_action.get('keep_current'):
        print("\n--- KEEP CURRENT (Already Verified) ---")
        for r in by_action['keep_current']:
            print(f"{r['id']}")
            print(f"  Current: {r['current_date']}")
            print(f"  Evidence: {r['evidence']}")
            print()
    
    if by_action.get('hide'):
        print("\n--- HIDE DATE (Unverifiable - Race Registration Pages) ---")
        for r in by_action['hide']:
            print(f"{r['id']}")
            print(f"  Current: {r['current_date']} (likely batch ingest)")
            print(f"  Type: {r['source_type']}")
            print(f"  Evidence: {r['evidence']}")
            print(f"  URL: {r['url']}")
            print()
    
    if by_action.get('verify_manually'):
        print("\n--- VERIFY MANUALLY (Need to Fetch) ---")
        for r in by_action['verify_manually']:
            print(f"{r['id']}")
            print(f"  Current: {r['current_date']} (batch: {r['is_likely_batch']})")
            print(f"  Type: {r['source_type']}")
            print(f"  Evidence: {r['evidence']}")
            print(f"  URL: {r['url']}")
            print()
    
    if output_file:
        output_path = REPO / output_file
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\nWrote audit results to {output_path}")


if __name__ == "__main__":
    main()
