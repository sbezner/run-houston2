#!/usr/bin/env python3
"""
verify-news-dates.py — Verify and correct news item dates to use source publication dates.

This script:
1. Reads data/news.json
2. For each news item, attempts to verify the publication date from the source URL
3. Reports discrepancies between current dates and source dates
4. Can apply corrections with --apply flag

Usage:
    python3 scripts/verify-news-dates.py                # dry-run, show issues
    python3 scripts/verify-news-dates.py --apply        # write corrected file
    python3 scripts/verify-news-dates.py --item-id ID   # check specific item
"""

import json
import sys
import re
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse

REPO = Path(__file__).resolve().parent.parent
NEWS_PATH = REPO / "data" / "news.json"


def extract_date_from_url(url):
    """
    Attempt to extract a date from common URL patterns.
    Returns (date_string, confidence) tuple or (None, None) if no date found.
    
    Confidence levels: 'high', 'medium', 'low', None
    """
    # ABC13 pattern: /story/title/YYYYMMDD/
    m = re.search(r'/(\d{8})/?$', url)
    if m:
        date_str = m.group(1)
        try:
            dt = datetime.strptime(date_str, '%Y%m%d')
            return dt.strftime('%Y-%m-%d'), 'high'
        except ValueError:
            pass
    
    # Houston Chronicle pattern: /article/title-YYYYMMDD.php
    m = re.search(r'-(\d{8})\.php', url)
    if m:
        date_str = m.group(1)
        try:
            dt = datetime.strptime(date_str, '%Y%m%d')
            return dt.strftime('%Y-%m-%d'), 'high'
        except ValueError:
            pass
    
    # General YYYY-MM-DD pattern in path
    m = re.search(r'/(\d{4}-\d{2}-\d{2})/', url)
    if m:
        date_str = m.group(1)
        try:
            datetime.strptime(date_str, '%Y-%m-%d')
            return date_str, 'medium'
        except ValueError:
            pass
    
    return None, None


def classify_news_item(item):
    """
    Classify news item type based on source URL.
    Returns: 'article', 'race_page', 'org_page', 'other'
    """
    url = item.get('url', '')
    domain = urlparse(url).netloc.lower()
    
    # News article domains
    if any(d in domain for d in ['abc13.com', 'houstonchronicle.com', 'chron.com',
                                   'khou.com', 'click2houston.com', 'community-impact.com']):
        return 'article'
    
    # Race registration pages
    if 'runsignup.com' in domain or 'adventuresignup.com' in domain:
        return 'race_page'
    
    # Organization pages
    if any(d in domain for d in ['harra.org', 'bcrr.org', 'houstonhalf.com',
                                   'travismanion.org', 'alex5k.com']):
        return 'org_page'
    
    return 'other'


def analyze_news_item(item):
    """
    Analyze a single news item and return analysis results.
    """
    result = {
        'id': item['id'],
        'headline': item['headline'],
        'current_date': item['date'],
        'source': item['source'],
        'url': item['url'],
        'type': classify_news_item(item),
        'url_date': None,
        'url_date_confidence': None,
        'suggested_date': None,
        'needs_review': False,
        'notes': []
    }
    
    # Try to extract date from URL
    url_date, confidence = extract_date_from_url(item['url'])
    result['url_date'] = url_date
    result['url_date_confidence'] = confidence
    
    # For news articles, URL date is likely the publication date
    if result['type'] == 'article' and url_date:
        result['suggested_date'] = url_date
        if url_date != result['current_date']:
            result['needs_review'] = True
            result['notes'].append(f"URL suggests publication date {url_date}, current {result['current_date']}")
    
    # For race pages, the date might be when registration opened or event date
    # These need manual review
    elif result['type'] == 'race_page':
        result['needs_review'] = True
        result['notes'].append("Race registration page - date should be when news was first available")
    
    # For org pages, need to check when the announcement was made
    elif result['type'] == 'org_page':
        result['needs_review'] = True
        result['notes'].append("Organization page - verify announcement/post date")
    
    return result


def print_analysis(analyses, verbose=False):
    """Print analysis results."""
    print(f"\n{'='*80}")
    print(f"NEWS DATE VERIFICATION REPORT")
    print(f"{'='*80}\n")
    
    needs_review = [a for a in analyses if a['needs_review']]
    articles_with_url_dates = [a for a in analyses if a['type'] == 'article' and a['url_date']]
    
    print(f"Total news items: {len(analyses)}")
    print(f"Items needing review: {len(needs_review)}")
    print(f"News articles with URL dates: {len(articles_with_url_dates)}")
    print()
    
    # Group by type
    by_type = {}
    for a in analyses:
        t = a['type']
        by_type.setdefault(t, []).append(a)
    
    print("By type:")
    for t, items in sorted(by_type.items()):
        print(f"  {t}: {len(items)}")
    print()
    
    if needs_review:
        print(f"\n{'='*80}")
        print("ITEMS NEEDING REVIEW:")
        print(f"{'='*80}\n")
        
        for a in needs_review:
            print(f"ID: {a['id']}")
            print(f"  Headline: {a['headline'][:70]}...")
            print(f"  Type: {a['type']}")
            print(f"  Current date: {a['current_date']}")
            if a['url_date']:
                print(f"  URL date: {a['url_date']} (confidence: {a['url_date_confidence']})")
            if a['suggested_date']:
                print(f"  Suggested date: {a['suggested_date']}")
            print(f"  URL: {a['url']}")
            for note in a['notes']:
                print(f"  NOTE: {note}")
            print()


def main():
    args = sys.argv[1:]
    apply = '--apply' in args
    verbose = '--verbose' in args or '-v' in args
    
    item_id = None
    if '--item-id' in args:
        idx = args.index('--item-id')
        if idx + 1 < len(args):
            item_id = args[idx + 1]
    
    if not NEWS_PATH.exists():
        print(f"ERROR: {NEWS_PATH} not found", file=sys.stderr)
        sys.exit(1)
    
    with open(NEWS_PATH) as f:
        news_data = json.load(f)
    
    items = news_data.get('items', [])
    
    if item_id:
        items = [i for i in items if i['id'] == item_id]
        if not items:
            print(f"ERROR: Item {item_id!r} not found", file=sys.stderr)
            sys.exit(1)
    
    # Analyze all items
    analyses = [analyze_news_item(item) for item in items]
    
    # Print report
    print_analysis(analyses, verbose=verbose)
    
    if apply:
        print("\n--apply mode not yet implemented. Manual review required.")
        print("After verifying source dates manually, update data/news.json directly.")
        sys.exit(1)
    else:
        print("\nDry run complete. Review the report above.")
        print("To check a specific item: python3 scripts/verify-news-dates.py --item-id <id>")


if __name__ == "__main__":
    main()
