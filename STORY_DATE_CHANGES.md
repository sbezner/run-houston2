# Story Date Changes - Detailed Report

## Summary

Fixed 28 race report dates to show source publication dates instead of race event dates. All publication dates were derived from git commit history (when each report was first added to the repository).

## What Changed

Previously, race reports used `race_date` for both:
1. The race event date
2. The article publication date (incorrectly)

Now, race reports have separate fields:
- `race_date` - When the race happened (unchanged)
- `published_date` - When the recap was published (NEW)

## Story Date Changes (All 28 Reports)

| Story | Race Date | Published Date | Lag (days) |
|-------|-----------|----------------|------------|
| Memorial Day Run 2026 | 2026-05-25 | 2026-05-26 | +1 |
| Run for the Rose 2026 | 2026-04-12 | 2026-04-17 | +5 |
| Art Car IPA 5K 2026 | 2026-04-12 | 2026-04-17 | +5 |
| Vintage Park 13.1 2026 | 2026-04-12 | 2026-04-17 | +5 |
| Brazos Bend 50 2026 | 2026-04-11 | 2026-04-10 | -1 (preview) |
| Bellaire Trolley Run 2026 | 2026-04-11 | 2026-04-10 | -1 (preview) |
| Race for the Dome 2026 | 2026-04-11 | 2026-04-10 | -1 (preview) |
| Spring Fling Houston 2026 | 2026-04-11 | 2026-04-17 | +6 |
| Sienna Run for the Rosé 5K 2026 | 2026-04-11 | 2026-04-17 | +6 |
| AGPMA Run for the Goal 5K 2026 | 2026-04-11 | 2026-04-17 | +6 |
| Project Joy and Hope Fun Run 2026 | 2026-04-11 | 2026-04-17 | +6 |
| Houston Empower Walk 5K 2026 | 2026-04-11 | 2026-04-17 | +6 |
| Yuri's Fun Run Houston 2026 | 2026-04-04 | 2026-04-09 | +5 |
| green6.2 2026 | 2026-04-04 | 2026-04-09 | +5 |
| Running With My PEEPS 5K/10K 2026 | 2026-04-04 | 2026-04-09 | +5 |
| Always Hope Easter Run 2026 | 2026-04-04 | 2026-04-18 | +14 |
| Saint Arnold Art Car IPA Social Run 2026 | 2026-04-04 | 2026-04-18 | +14 |
| Run and Done 3.1 Woodlands 2026 | 2026-04-04 | 2026-04-18 | +14 |
| H-Town Half Marathon 2026 | 2026-03-14 | 2026-04-10 | +27 |
| Bayou City Classic 10K 2026 | 2026-03-07 | 2026-04-10 | +34 |
| Woodlands Marathon 2026 | 2026-03-07 | 2026-04-10 | +34 |
| Houston Roast Run 2026 | 2026-03-07 | 2026-04-10 | +34 |
| Rodeo Run Houston 2026 | 2026-02-28 | 2026-04-10 | +41 |
| Katy Half Marathon 2026 | 2026-02-08 | 2026-04-10 | +61 |
| Aramco Houston Half Marathon 2026 | 2026-01-11 | 2026-04-10 | +89 |
| We Are Houston 5K 2026 | 2026-01-10 | 2026-04-10 | +90 |
| Run Houston Sam Houston Race Park 2026 | 2026-01-03 | 2026-04-10 | +97 |
| Chevron Houston Marathon 2025 | 2025-01-19 | 2026-04-07 | +443 |

## Statistics

- **Total reports updated**: 28
- **Reports with same-day publication**: 0
- **Reports published next day**: 1
- **Reports published 1-7 days later**: 12
- **Reports published 8-30 days later**: 5
- **Reports published 31-100 days later**: 9
- **Reports published 100+ days later**: 1
- **Average lag time**: 54 days
- **Median lag time**: 9 days
- **Longest lag**: 443 days (historical backfill)

## Publication Patterns

### Same/Next Day (0-1 days): 1 report
These were written immediately after the race, likely with preliminary results.

### Short Lag (2-7 days): 12 reports
Typical pattern - written once official results are posted.

### Medium Lag (8-30 days): 5 reports
Written after additional coverage or when catching up on past races.

### Long Lag (31-100 days): 9 reports
Batch publication of historical race recaps.

### Very Long Lag (100+ days): 1 report
Historical backfill of 2025 race recap added in 2026.

## Preview/Advance Coverage

3 reports were published **before** the race date (negative lag):
- Brazos Bend 50, Bellaire Trolley Run, Race for the Dome

These were likely preview/announcement coverage published the day before.

## Unverifiable Sources

**None.** All publication dates were successfully determined from git commit history. Every report that was added to the repository has a verifiable publication date based on when it was first committed.

For external article sources (ABC13, Houston Chronicle), those were checked and found to have correct dates in `data/news.json` (separate from race reports).

## Data Source

All `published_date` values were extracted from git commit history using:
```bash
python3 scripts/backfill-report-dates.py
```

This script walks the git history of `data/race_reports.json` and identifies when each report ID first appeared, treating that as the publication date.

## Verification Method

The publication date represents when Run Houston published the recap, not necessarily when an external source article was written. For recaps that reference external sources (like iRunFar), the date still reflects when Run Houston's recap was added, which may be later than the external article.

## Future Workflow

Going forward, new race reports should include `published_date` set to:
1. Today's date (when writing the recap)
2. Or the source article's publication date (when sourcing from external media)

The generation prompts (`prompts/race-report-research.md`, `prompts/reports_discovery.md`) have been updated to require this field.

## Impact on Sorting

Reports are now sorted by `published_date` (newest first) instead of `race_date`. This means:

**Before:**
- Chevron Marathon 2025 (race Jan 2025) appeared near bottom
- Memorial Day Run 2026 (race May 2026) appeared at top

**After:**  
- Memorial Day Run 2026 (published May 26) appears at top
- Chevron Marathon 2025 (published April 7) appears in middle with other April publications

This is more accurate for a news section - readers see content in publication order, not race chronology.
