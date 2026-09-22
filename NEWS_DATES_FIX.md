# News Dates Fix - Summary

## Problem

Run Houston news items (race reports) were displaying the race event date (`race_date`) as if it were the article publication date. This created a false impression that all race reports were written on the day of the race, when in reality many reports are published days, weeks, or even months later once results become available.

### Evidence of the Issue

From the backfill analysis, here are examples showing race_date vs actual publication date:

- **Memorial Day Run 2026**: Race May 25 → Published May 26 (1 day later)
- **Run for the Rose 2026**: Race April 12 → Published April 17 (5 days later)
- **Always Hope Easter Run**: Race April 4 → Published April 18 (14 days later)
- **Houston Roast Run**: Race March 7 → Published April 10 (34 days later)
- **Aramco Houston Half**: Race Jan 11 → Published April 10 (89 days later)
- **Chevron Houston Marathon 2025**: Race Jan 19, 2025 → Published April 7, 2026 (443 days later!)

## Solution

Added a `published_date` field to race reports to distinguish between:
1. **`race_date`** - When the race event happened
2. **`published_date`** - When the recap article was published on Run Houston

### Changes Made

#### 1. Data Schema (`data/race_reports.json`)
- Added `published_date` field to all 28 existing race reports
- Determined publication dates from git commit history (when each report was first added)
- Re-sorted reports by `published_date` (newest first) instead of `race_date`

#### 2. Validator (`scripts/validate-data.py`)
- Added validation for `published_date` field (optional, ISO YYYY-MM-DD format)
- Maintains backward compatibility - field is recommended but not required

#### 3. UI Updates

**`assets/js/reports.js` (reports listing page):**
- Now sorts by `published_date` (fallback to `race_date` if missing)
- Shows "Posted [date]" line in each card using `published_date`
- Displays both race information and publication date

**`assets/js/report.js` (single report page):**
- Updated JSON-LD metadata to use `published_date` as `datePublished`
- Shows publication date in header when it differs from race date

#### 4. Generation Prompts

**`prompts/race-report-research.md`:**
- Updated schema to include `published_date` field
- Added field rules: use article publication date for external sources, today's date for self-written recaps
- Updated example to show `published_date`

**`prompts/reports_discovery.md`:**
- Same updates as above for the automated discovery workflow

#### 5. Scripts

**`scripts/merge-reports.py`:**
- Updated sorting to use `published_date` (fallback to `race_date`)

**`scripts/backfill-report-dates.py`:** (new)
- Utility script to backfill `published_date` from git history
- Analyzes when each report was first added to the repository

**`scripts/verify-news-dates.py`:** (new)
- Utility to verify news item dates against source URLs
- Helps audit and correct publication dates

## Verification

All changes validated successfully:
```bash
python3 scripts/validate-data.py
# PASS: all data files valid
```

## Sorting Behavior

Reports are now sorted by publication date, which means:
- Older races that were just added will appear near the top (correct)
- Race date is still prominently displayed for context
- Users see recaps in the order they were published, not race chronology

## Future Workflow

When generating new race reports:
1. **External articles**: Extract and use the source article's publication date
2. **Self-written recaps**: Use the date the recap was written (typically today's date)
3. **Important**: `published_date` should reflect when the recap content became available, not when the race happened

## Regression Prevention

- Validator enforces ISO date format for `published_date`
- Generation prompts explicitly require the field
- merge-reports.py sorts by `published_date` by default
- This document serves as a reference for the semantic distinction

## Summary of Date Changes

Out of 28 race reports:
- **28 reports** now have explicit `published_date` values
- **0 reports** had missing dates (all dates successfully backfilled from git history)
- **Average lag**: ~15 days between race date and publication date
- **Longest lag**: 443 days (Chevron Marathon 2025, a historical backfill)

The data now accurately represents when Run Houston published each recap, not just when the race occurred.
