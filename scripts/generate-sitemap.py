#!/usr/bin/env python3
"""
Generate sitemap.xml for Run Houston site.
Includes static pages and dynamic race/report pages.
"""

import json
import sys
from pathlib import Path
from xml.sax.saxutils import escape
from datetime import datetime

def main():
    base_url = "https://runhouston.app"
    now = datetime.utcnow().strftime("%Y-%m-%d")
    
    sitemap_entries = []
    
    # Static pages (high priority, frequently updated)
    static_pages = [
        ("", "1.0", "daily"),  # index.html
        ("clubs.html", "0.8", "weekly"),
        ("reports.html", "0.8", "weekly"),
        ("about.html", "0.6", "monthly"),
    ]
    
    for page, priority, changefreq in static_pages:
        url = f"{base_url}/{page}" if page else f"{base_url}/"
        sitemap_entries.append({
            "loc": url,
            "lastmod": now,
            "changefreq": changefreq,
            "priority": priority
        })
    
    # Race detail pages - only include races with a date
    races_file = Path(__file__).parent.parent / "data" / "races-upcoming.json"
    if races_file.exists():
        with open(races_file, 'r', encoding='utf-8') as f:
            races = json.load(f)
        
        for race in races:
            if race.get('date') and race.get('id'):
                url = f"{base_url}/race.html?id={escape(race['id'])}"
                sitemap_entries.append({
                    "loc": url,
                    "lastmod": now,
                    "changefreq": "weekly",
                    "priority": "0.7"
                })
    
    # Report detail pages
    reports_file = Path(__file__).parent.parent / "data" / "race_reports.json"
    if reports_file.exists():
        with open(reports_file, 'r', encoding='utf-8') as f:
            reports = json.load(f)
        
        for report in reports:
            if report.get('id'):
                url = f"{base_url}/report.html?id={escape(report['id'])}"
                sitemap_entries.append({
                    "loc": url,
                    "lastmod": now,
                    "changefreq": "monthly",
                    "priority": "0.6"
                })
    
    # Generate sitemap XML
    xml_lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml_lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    
    for entry in sitemap_entries:
        xml_lines.append("  <url>")
        xml_lines.append(f"    <loc>{entry['loc']}</loc>")
        xml_lines.append(f"    <lastmod>{entry['lastmod']}</lastmod>")
        xml_lines.append(f"    <changefreq>{entry['changefreq']}</changefreq>")
        xml_lines.append(f"    <priority>{entry['priority']}</priority>")
        xml_lines.append("  </url>")
    
    xml_lines.append("</urlset>")
    
    # Write to stdout or file
    output = "\n".join(xml_lines)
    if len(sys.argv) > 1:
        output_file = Path(sys.argv[1])
        output_file.write_text(output, encoding='utf-8')
        print(f"Generated sitemap with {len(sitemap_entries)} URLs: {output_file}", file=sys.stderr)
    else:
        print(output)

if __name__ == "__main__":
    main()
