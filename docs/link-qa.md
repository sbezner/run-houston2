# Link QA System

## Overview

The `scripts/check-links.py` script validates all outbound links from Run Houston cards (races, clubs, news, and reports). It ensures links are accessible, point to specific pages (not generic homepages), and contain expected context.

## Usage

```bash
# Check all links
python3 scripts/check-links.py

# Check only cards changed vs master (faster for PRs)
python3 scripts/check-links.py --only-changed

# Check specific card type
python3 scripts/check-links.py --type races
python3 scripts/check-links.py --type clubs
python3 scripts/check-links.py --type news
```

## Exit Codes

- **0**: All links pass (no hard failures, no unreviewed flags)
- **1**: Hard failures or unreviewed flags found

## Link Categories

### 1. Hard Failures

These always fail the check and must be fixed:

- **HTTP 4xx/5xx errors** - Broken links (404, 500, etc.)
- **Network errors** - DNS failures, timeouts, SSL errors
- **Missing RunSignUp affiliate token** - **All `runsignup.com` URLs must include `aflt_token=uOWL1MZWQ2qYNlFuqMcOEfxgn0WZFSyH`**
  - No exceptions or waivers allowed
  - Applies to all URL fields: `official_website_url`, `source_url`, news article bodies, etc.
  - Enforced in `--only-changed` mode for daily PR enforcement

### 2. Generic Page Flags

Links that resolve to generic landing pages instead of specific content:

- Homepage (`/`, `/index.html`)
- Generic event listings (`/events`, `/calendar`, `/races`)
- Search pages (`/search`, `/find`)
- RunSignUp/RaceRoster search results

### 3. Context Flags

Page content doesn't match expected card information:

- **Races**: Race name or year missing from landing page
- **Clubs**: Club name missing from landing page
- **News**: Headline terms missing from article
- **Reports**: Report title or race name missing

## Reviewed Exceptions

Per-card exceptions can be documented in `data/link-review.json`:

```json
{
  "https://example.com/event": {
    "race-id-2026": {
      "note": "Dedicated event page; homepage names the race and shows 2026 date",
      "reviewer": "RunHouston",
      "date": "2026-09-24"
    }
  }
}
```

**Important**: Reviewed exceptions **cannot** waive the RunSignUp affiliate token requirement. All RunSignUp URLs must have `aflt_token=` regardless of review status.

## Configuration

Edit `scripts/check-links.py` constants:

- `REQUEST_TIMEOUT`: Max seconds per URL fetch (default: 15)
- `MAX_RETRIES`: Retry attempts for failed requests (default: 2)
- `HOST_THROTTLE`: Seconds between requests to same host (default: 1.0)
- `GENERIC_PATTERNS`: URL patterns flagged as generic pages
- `REGISTRATION_SEARCH_PATTERNS`: Registration platform search patterns

## CI Integration

The link-qa job runs on:

- **Pull requests**: `--only-changed` mode (fast, only checks modified cards)
- **Push to master**: Full check
- **Daily schedule**: Full check at 2 AM UTC

## RunSignUp Affiliate Token Requirement

**Standing rule** (effective 2026-09-25): Every RunSignUp URL across the entire site must carry the affiliate token `aflt_token=uOWL1MZWQ2qYNlFuqMcOEfxgn0WZFSyH`.

### Canonical Form

- **Parameter name**: `aflt_token` (NOT `affiliate_token`)
- **Token value**: `uOWL1MZWQ2qYNlFuqMcOEfxgn0WZFSyH`
- **Placement**: Append to existing query string with `&`, or start query string with `?`
- **Existing tokens**: Keep any existing `affiliate_token=` parameters (both can coexist)

### Where It Applies

All RunSignUp URLs in:

- `data/races-upcoming.json` - all URL fields (`official_website_url`, `source_url`)
- `data/news.json` - `url` field and article bodies/summaries
- `data/clubs.json` - `website` field  
- `data/race_reports.json` - all fields containing URLs
- HTML files with hardcoded RunSignUp links
- JS files with hardcoded RunSignUp links
- Generated files (`sitemap.xml`, `calendar.html`)

### Scripts That Add Tokens Automatically

The following scripts add `aflt_token` to RunSignUp URLs automatically:

- `scripts/enrich-runsignup.py` - Enriches existing race URLs
- `scripts/fetch-runsignup-window.py` - Fetches races from RunSignUp API
- Any future script that writes RunSignUp URLs should use the helper:

```python
def add_affiliate_token(url):
    """Ensure aflt_token is present in URL."""
    if not url or "aflt_token=" in url:
        return url
    separator = "&" if "?" in url else "?"
    return url + separator + "aflt_token=uOWL1MZWQ2qYNlFuqMcOEfxgn0WZFSyH"
```

### Evidence for Canonical Form

The canonical form `aflt_token=` is confirmed by:

1. **RunSignUp API documentation**: The API uses `aflt_token` in request parameters
2. **scripts/enrich-runsignup.py** (line 172): API calls include `aflt_token={AFFILIATE_TOKEN}`
3. **scripts/fetch-runsignup-window.py** (line 54): API calls include `aflt_token={AFFILIATE_TOKEN}`

### Enforcement

Hard failure added to `scripts/check-links.py`:

```python
# HARD REQUIREMENT: All RunSignUp URLs must have aflt_token
# No exceptions or waivers allowed
if 'runsignup.com' in url.lower() and 'aflt_token=' not in url:
    stats["hard_fail"] += 1
    return ("hard_fail", "RunSignUp URL missing required aflt_token parameter")
```

This check:
- Runs **before** reviewed exceptions (cannot be waived)
- Applies in **--only-changed** mode (enforces in daily news PRs)
- Applies to **all URL sources** (data files, news bodies, etc.)

## Troubleshooting

**Q: Link check fails but URL works in browser**

A: Check for:
- Bot detection / rate limiting
- JavaScript-dependent pages (check-links uses requests, not a browser)
- Geo-blocking or region restrictions

**Q: How do I add a reviewed exception?**

A: Edit `data/link-review.json` with a per-card entry showing the specific page proves the event/club. Include reviewer name and date.

**Q: Can I waive the RunSignUp affiliate token requirement?**

A: **No.** This is a hard requirement with no exceptions. All RunSignUp URLs must have `aflt_token=uOWL1MZWQ2qYNlFuqMcOEfxgn0WZFSyH`.
