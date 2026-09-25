# Link Quality Assurance

Every outbound link on Run Houston — club websites, race registration pages, news articles, and race reports — must pass `scripts/check-links.py` before shipping.

## What the check does

`check-links.py` validates that every link:

1. **Loads successfully** — no 404s, 500s, DNS failures, TLS errors, or timeouts
2. **Points to the right page** — not a homepage when we want a specific event, not a search page when we want a race
3. **Mentions the thing it's supposed to be about** — the club name appears on the club's page, the race name and year appear on the race page, the news headline appears in the article

## Running the check

```bash
# Check everything
python3 scripts/check-links.py

# Check only clubs
python3 scripts/check-links.py --type clubs

# Check only races
python3 scripts/check-links.py --type races
```

## What happens when a link fails

The script exits non-zero and prints a report showing:

- **Hard failures** — broken links (4xx/5xx), dead domains, TLS errors, timeouts
- **Flagged: generic pages** — links that land on a homepage, `/events` calendar, or registration search page instead of the specific page
- **Flagged: context mismatch** — the landing page doesn't mention the club/race name, or the race year is missing

## Fixing failures

When a link fails, search for the correct page in this order:

1. **The organization's own site** — look for a specific section page (e.g. `/athletics#run-club`, `/community/running-club-schedule`)
2. **Official registration pages** — RunSignUp, Race Roster, Active, AdventureSignUp for that specific race
3. **Original article** — for news, the article on the publisher's site

If you can't find a working specific page after checking all three, **remove the link**. Set the field to `null` in the JSON. The UI already handles missing links.

## Reviewed exceptions

If a link genuinely can't be checked automatically (JavaScript-only page, bot protection, requires login), you can allowlist it in `data/link-review.json`:

```json
{
  "https://example.com/page": {
    "club-id-here": {
      "note": "Manually verified 2026-09-24 - page is behind Cloudflare challenge",
      "reviewer": "your-name",
      "date": "2026-09-24"
    }
  }
}
```

**Keep the reviewed list small.** Only use it for pages you've personally verified by hand.

## CI and deployment

The `link-qa` job runs:

- On every pull request (full check)
- On every push to `master` (full check)
- Nightly at 2 AM UTC (full check)

### Deployment blocking

Run Houston uses **GitHub Pages auto-deploy** from the `master` branch. The CI workflow is an early-warning signal but does not block deploys by itself.

**To make link-qa required:**

1. Go to **Settings → Branches → Branch protection rules** for `master`
2. Enable **Require status checks to pass before merging**
3. Select both `check` and `link-qa` as required checks

This will prevent broken links from landing on `master` and deploying to production.

## Daily workflow

When adding or updating cards:

1. Run `python3 scripts/check-links.py` before committing
2. Fix any failures following the search order above
3. Commit and push
4. Confirm CI is green before merging

**News posts committed directly to master** will trigger the full check on push. If a link is broken, the commit will turn red, but the site has already deployed. Fix it in a follow-up commit.
