# SEO Documentation for Run Houston

This document describes the SEO implementation for runhouston.app.

## Overview

Run Houston implements production SEO to enable Google and other search engines to crawl and index:
- Static pages (home, clubs, news, about)
- Individual race detail pages (race.html?id={race_id})
- News index and external news sources

## Files

### Core SEO Files

- **`sitemap.xml`** — Generated sitemap covering all crawlable URLs
- **`robots.txt`** — Robots file allowing all crawlers, references sitemap
- **`scripts/generate-sitemap.py`** — Python script to regenerate sitemap from data files

### Page-Level SEO

Each page includes:
- Unique `<title>` and `<meta name="description">`
- Open Graph tags (`og:title`, `og:description`, `og:url`, `og:image`)
- Canonical URL
- JSON-LD structured data

#### JSON-LD by Page

| Page | Schema Type | Fields |
|------|-------------|--------|
| `index.html` | WebSite | name, description, url, potentialAction (SearchAction) |
| `race.html` | SportsEvent | name, url, startDate, description, location, offers |
| `clubs.html` | CollectionPage | name, description, url, isPartOf |
| `news.html` | CollectionPage | name, description, url, isPartOf |
| `about.html` | AboutPage | name, description, url, isPartOf |

**Note:** `race.html` injects JSON-LD dynamically via JavaScript (see `assets/js/race.js` lines 20-82) so each race gets structured data with its specific details.

## Crawlable URL Patterns

### Static Pages
- `https://runhouston.app/` (index.html)
- `https://runhouston.app/clubs.html`
- `https://runhouston.app/news.html`
- `https://runhouston.app/about.html`

### Race Detail Pages
- `https://runhouston.app/race.html?id={race_id}`
- Query parameter URLs are crawlable by Googlebot
- Example: `https://runhouston.app/race.html?id=chevron-houston-marathon-2027`

### Non-Crawlable / Excluded
- `report.html` — HTTP redirect to news.html (excluded from sitemap)
- No individual news article pages exist on-site (news.html links to external sources)

## Regenerating the Sitemap

The sitemap is **generated from data files**, not hand-maintained. Regenerate it whenever:
- `data/races-upcoming.json` changes (races added/updated/removed)
- Static pages are added or removed

### How to Regenerate

```bash
cd /workspace
python3 scripts/generate-sitemap.py
```

This reads:
- `data/races-upcoming.json` — for race detail URLs
- Hardcoded list of static pages in the script

Output:
- `sitemap.xml` at repo root

The script outputs a summary:
```
✓ Generated sitemap with 379 URLs: /workspace/sitemap.xml
  - 4 static pages
  - 375 race detail pages
```

### When to Regenerate

- **After race data updates:** Run after merging race refreshes
- **Before deployment:** Regenerate before pushing to master if data changed
- **Automated option:** Could be added to `.github/workflows/validate.yml` or a pre-commit hook if desired

## Google Search Console Setup

After deploying to production (`master` branch), submit these URLs to Google Search Console:

1. **Sitemap:** https://runhouston.app/sitemap.xml
2. **Robots:** https://runhouston.app/robots.txt (verify crawl allowed)
3. **Sample pages to verify indexing:**
   - https://runhouston.app/
   - https://runhouston.app/clubs.html
   - https://runhouston.app/news.html
   - https://runhouston.app/race.html?id=chevron-houston-marathon-2027

### Search Console Actions

1. Submit sitemap at: Search Console → Sitemaps → Add new sitemap
2. Verify robots.txt accessibility
3. Request indexing for key pages (optional, Google will find them via sitemap)
4. Monitor Coverage report for indexing issues

## Known Gaps and Limitations

### What's Crawlable
- All static pages (index, clubs, news, about)
- All individual race detail pages via query param URLs
- Sitemap is comprehensive and up-to-date with current data

### What's Not Crawlable
- **No individual news detail pages** — news items on news.html link to external sources (HARRA, RunSignUp, etc.), not internal pages
- **SPA-only views** — cards/list/map/calendar views on index.html are client-side only; the crawlable entry point is index.html itself
- **Filtered states** — query params like `?q=search` on index.html are not in the sitemap (intentional; race detail pages are the indexable units)

### News Structured Data
News items do **not** have individual ArticlePosting or NewsArticle JSON-LD because:
1. They live on an external source (linked from news.html)
2. There are no individual news detail pages on runhouston.app
3. The news.html page itself has CollectionPage JSON-LD

## Testing Locally

### Validate Sitemap
```bash
# Check sitemap exists and is well-formed
xmllint --noout sitemap.xml && echo "✓ Valid XML"

# Count URLs
grep -c '<loc>' sitemap.xml
```

### Validate Robots
```bash
cat robots.txt
```

### Check Page Meta/JSON-LD
Open any page in a browser and:
1. View source to see `<head>` meta tags
2. Check for `<script type="application/ld+json">` blocks
3. Use Google's [Rich Results Test](https://search.google.com/test/rich-results) to validate structured data

## Cache-Busting

If you modify linked CSS or JS assets, update their `?v=N` query param to bust caches:

- `assets/css/styles.css?v=53` → `?v=54`
- `assets/js/common.js?v=7` → `?v=8`

This ensures crawlers and users get fresh versions after changes.

## Maintenance Checklist

- [ ] Regenerate sitemap after race data changes
- [ ] Validate sitemap XML is well-formed
- [ ] Confirm robots.txt allows crawling
- [ ] Test a sample race detail page has SportsEvent JSON-LD
- [ ] Submit updated sitemap to Google Search Console (if major changes)

## Contact

For SEO questions or issues, open an issue on the [GitHub repo](https://github.com/sbezner/run-houston2).
