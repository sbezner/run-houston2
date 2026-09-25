#!/usr/bin/env python3
"""
Generate calendar.html with static HTML of all upcoming races.

This script reads data/races-upcoming.json and generates a static HTML
calendar page with races grouped by month. The output is fully crawlable
by search engines (no JavaScript required to see race listings).

Regenerate whenever races change:
  python3 scripts/generate-calendar.py
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from html import escape


def format_date(date_str):
    """Format ISO date (YYYY-MM-DD) to readable format like 'Sat, Sep 12'."""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%a, %b %-d" if sys.platform != "win32" else "%a, %b %d").replace(" 0", " ")
    except (ValueError, TypeError):
        return ""


def get_month_name(date_str):
    """Get month name and year from ISO date (e.g., 'September 2026')."""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%B %Y")
    except (ValueError, TypeError):
        return ""


def main():
    repo_root = Path(__file__).resolve().parent.parent
    races_file = repo_root / "data" / "races-upcoming.json"
    output_file = repo_root / "calendar.html"

    if not races_file.exists():
        print(f"Error: {races_file} not found", file=sys.stderr)
        sys.exit(1)

    with open(races_file, "r", encoding="utf-8") as f:
        races = json.load(f)

    # Group races by month
    races_by_month = {}
    for race in races:
        if not race.get("date"):
            continue
        month_key = get_month_name(race["date"])
        if not month_key:
            continue
        if month_key not in races_by_month:
            races_by_month[month_key] = []
        races_by_month[month_key].append(race)

    # Sort months chronologically
    sorted_months = sorted(
        races_by_month.keys(),
        key=lambda m: datetime.strptime(m, "%B %Y")
    )

    # Generate race HTML for each month
    months_html = []
    for month in sorted_months:
        month_races = races_by_month[month]
        # Sort races by date within month
        month_races.sort(key=lambda r: r.get("date", ""))

        race_rows = []
        for race in month_races:
            race_id = escape(race["id"])
            race_name = escape(race["name"])
            date_formatted = format_date(race.get("date"))
            city = escape(race.get("city", ""))
            
            # Format distances
            distances = race.get("distance", [])
            distances_str = ", ".join(escape(d) for d in distances) if distances else ""
            
            # Registration link
            reg_url = race.get("official_website_url") or race.get("source_url")
            reg_link = ""
            if reg_url:
                reg_link = f'<a href="{escape(reg_url)}" target="_blank" rel="noopener noreferrer" class="cal-race-register">Register</a>'
            
            race_rows.append(f"""
              <div class="cal-race-row">
                <div class="cal-race-date">{date_formatted}</div>
                <div class="cal-race-info">
                  <div class="cal-race-name">
                    <a href="race.html?id={escape(race_id)}">{race_name}</a>
                  </div>
                  <div class="cal-race-meta">
                    {distances_str}{' · ' + city if city and distances_str else city}
                  </div>
                </div>
                <div class="cal-race-action">
                  {reg_link}
                </div>
              </div>""")

        months_html.append(f"""
    <section class="cal-month">
      <h2 class="cal-month-title">{escape(month)}</h2>
      <div class="cal-month-races">
{''.join(race_rows)}
      </div>
    </section>""")

    # Build full HTML page
    calendar_content = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Houston Race Calendar 2026 — Upcoming Runs by Month | Run Houston</title>
  <meta name="description" content="Month-by-month Houston running calendar: 5K, 10K, half marathon, marathon, and trail races with dates, cities, and registration links.">
  <link rel="canonical" href="https://runhouston.app/calendar.html">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Run Houston">
  <meta property="og:title" content="Houston Race Calendar 2026 — Upcoming Runs by Month | Run Houston">
  <meta property="og:description" content="Month-by-month Houston running calendar: 5K, 10K, half marathon, marathon, and trail races with dates, cities, and registration links.">
  <meta property="og:url" content="https://runhouston.app/calendar.html">
  <meta property="og:image" content="https://runhouston.app/social-card.png?v=62">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Houston Race Calendar 2026 — Upcoming Runs by Month | Run Houston">
  <meta name="twitter:description" content="Month-by-month Houston running calendar: 5K, 10K, half marathon, marathon, and trail races with dates, cities, and registration links.">
  <meta name="theme-color" content="#f2eee6">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="stylesheet" href="assets/css/styles.css?v=62">
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Houston Race Calendar 2026",
    "description": "Month-by-month Houston running calendar: 5K, 10K, half marathon, marathon, and trail races with dates, cities, and registration links.",
    "url": "https://runhouston.app/calendar.html",
    "isPartOf": {{
      "@type": "WebSite",
      "name": "Run Houston",
      "url": "https://runhouston.app/"
    }}
  }}
  </script>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-0HSJBPL4J0"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', 'G-0HSJBPL4J0');
  </script>
</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <a href="index.html" class="brand">Run<span class="brand-mark"> Houston</span></a>
      <nav class="site-nav" aria-label="Primary">
        <a href="index.html">Races</a>
        <a href="calendar.html" aria-current="page">Calendar</a>
        <a href="clubs.html">Clubs</a>
        <a href="news.html">News</a>
        <a href="about.html">About</a>
      </nav>
    </div>
  </header>

  <section class="page-hero" aria-label="Houston race calendar">
    <div class="page-hero__inner">
      <p class="page-hero__eyebrow">Houston race calendar 2026</p>
      <h1 class="page-hero__title hero-dm">Race<br><em>Calendar</em></h1>
      <p class="page-hero__stats">
        Month-by-month guide to Houston running events
      </p>
    </div>
  </section>

  <main class="calendar-main">
    
    <div class="calendar-intro">
      <p>Run Houston is a calendar of road, trail, and track running races in the Houston metro — 5Ks through marathons. It is not a car or horse racing site.</p>
    </div>

{''.join(months_html)}

  </main>

  <footer class="site-footer">
    <div class="site-footer-inner">
      <div>
        <h3>Explore</h3>
        <ul>
          <li><a href="index.html">Upcoming races</a></li>
          <li><a href="calendar.html">Calendar</a></li>
          <li><a href="clubs.html">Running clubs</a></li>
          <li><a href="news.html">News</a></li>
          <li><a href="about.html">About</a></li>
        </ul>
      </div>
      <div>
        <h3>Community</h3>
        <ul>
          <li><a href="https://harra.org/" target="_blank" rel="noopener noreferrer">HARRA</a></li>
          <li><a href="https://www.bcrr.org/" target="_blank" rel="noopener noreferrer">Bayou City Road Runners</a></li>
          <li><a href="https://www.houstonrunningcalendar.com/" target="_blank" rel="noopener noreferrer">Houston Running Calendar</a></li>
          <li><a href="https://runsignup.com/?aflt_token=uOWL1MZWQ2qYNlFuqMcOEfxgn0WZFSyH" target="_blank" rel="noopener noreferrer">RunSignUp</a></li>
        </ul>
      </div>
      <div>
        <h3>Run Houston</h3>
        <ul>
          <li>Built for Houston runners</li>
          <li><a href="https://github.com/sbezner/run-houston2" target="_blank" rel="noopener noreferrer">Open source on GitHub</a></li>
          <li><a href="https://github.com/sbezner/run-houston2/issues/new?template=feedback.yml" target="_blank" rel="noopener noreferrer">Send feedback</a></li>
        </ul>
      </div>
      <div class="site-footer-bottom">
        Run Houston &middot; A community race guide for the Bayou City.
      </div>
    </div>
  </footer>
  <script src="assets/js/common.js?v=62"></script>
</body>
</html>
"""

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(calendar_content)

    total_races = sum(len(races_by_month[m]) for m in sorted_months)
    print(f"✓ Generated {output_file}")
    print(f"  - {len(sorted_months)} months")
    print(f"  - {total_races} races")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error generating calendar: {e}", file=sys.stderr)
        sys.exit(1)
