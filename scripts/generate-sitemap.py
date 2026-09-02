#!/usr/bin/env python3
"""
Generate sitemap.xml for Run Houston site.
Includes only real crawlable HTML files - NO query string URLs.
Query-string pages (?id=...) are discovered via JSON-LD structured data,
not sitemap entries.
"""

import sys
from pathlib import Path
from datetime import datetime

def main():
    base_url = "https://runhouston.app"
    now = datetime.now().strftime("%Y-%m-%d")
    
    # Only include real HTML files that exist as static resources
    sitemap_entries = [
        {"loc": f"{base_url}/", "lastmod": now, "changefreq": "daily", "priority": "1.0"},
        {"loc": f"{base_url}/clubs.html", "lastmod": now, "changefreq": "weekly", "priority": "0.8"},
        {"loc": f"{base_url}/reports.html", "lastmod": now, "changefreq": "weekly", "priority": "0.8"},
        {"loc": f"{base_url}/about.html", "lastmod": now, "changefreq": "monthly", "priority": "0.6"},
    ]
    
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
