#!/usr/bin/env python3
"""
Generate sitemap.xml for Run Houston static site.
Reads data/*.json and produces a sitemap at the repo root.
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import quote


def main():
    repo_root = Path(__file__).resolve().parent.parent
    data_dir = repo_root / "data"
    sitemap_path = repo_root / "sitemap.xml"

    base_url = "https://runhouston.app"
    now = datetime.now().strftime("%Y-%m-%d")

    urls = []

    # Static pages (excluding report.html since it just redirects to news.html)
    static_pages = [
        ("", "daily"),              # index.html (home/races listing)
        ("clubs.html", "weekly"),
        ("news.html", "weekly"),
        ("about.html", "monthly"),
    ]

    for page, changefreq in static_pages:
        loc = f"{base_url}/{page}" if page else f"{base_url}/"
        urls.append({
            "loc": loc,
            "lastmod": now,
            "changefreq": changefreq,
            "priority": "1.0" if not page else "0.8"
        })

    # Individual race pages (race.html?id=...)
    races_file = data_dir / "races-upcoming.json"
    if races_file.exists():
        with open(races_file, "r", encoding="utf-8") as f:
            races = json.load(f)
        
        for race in races:
            race_id = race.get("id")
            if not race_id:
                continue
            
            race_url = f"{base_url}/race.html?id={quote(race_id)}"
            # Use race date as lastmod if available, otherwise current date
            lastmod = race.get("date", now)
            
            urls.append({
                "loc": race_url,
                "lastmod": lastmod,
                "changefreq": "monthly",
                "priority": "0.7"
            })

    # Generate XML
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    for url in urls:
        xml_lines.append("  <url>")
        xml_lines.append(f"    <loc>{url['loc']}</loc>")
        xml_lines.append(f"    <lastmod>{url['lastmod']}</lastmod>")
        xml_lines.append(f"    <changefreq>{url['changefreq']}</changefreq>")
        xml_lines.append(f"    <priority>{url['priority']}</priority>")
        xml_lines.append("  </url>")

    xml_lines.append("</urlset>")
    
    sitemap_content = "\n".join(xml_lines) + "\n"
    
    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.write(sitemap_content)
    
    print(f"✓ Generated sitemap with {len(urls)} URLs: {sitemap_path}")
    print(f"  - {len(static_pages)} static pages")
    print(f"  - {len(urls) - len(static_pages)} race detail pages")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error generating sitemap: {e}", file=sys.stderr)
        sys.exit(1)
