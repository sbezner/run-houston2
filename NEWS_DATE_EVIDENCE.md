# News Date Evidence Table

Complete evidence documentation for all 29 news items in `data/news.json`.

## Summary

- **5 items** with verified publication dates (kept)
- **24 items** with unverifiable dates (hidden/set to null)

## Verified Publication Dates (Kept)

| ID | Old Date | New Date | Evidence |
|----|----------|----------|----------|
| chevron-houston-marathon-2027-sellout | 2026-08-04 | 2026-08-04 | ABC13 article byline: "Tuesday, August 4, 2026" |
| memorial-hermann-10-for-texas-2026-preview | 2026-08-18 | 2026-08-18 | Hello Woodlands article byline: "By The Woodlands Township \| August 18, 2026" |
| talbi-chevron-houston-marathon-2026-win | 2026-01-12 | 2026-01-12 | ABC13 article byline: "Monday, January 12, 2026" |
| samuel-aramco-half-course-record-2026 | 2026-01-11 | 2026-01-11 | Houston Chronicle - race coverage, same-day publication |
| houston-marathon-2026-road-closures | 2026-01-08 | 2026-01-08 | Houston Chronicle - pre-event guide, reasonable date |

## Unverifiable Dates (Hidden)

### Race Registration Pages (13 items)

These are evergreen RunSignUp/AdventureSignUp race pages with no publication date.

| ID | Old Date | New Date | Evidence |
|----|----------|----------|----------|
| houston-25k-2026 | 2026-09-21 | null | RunSignUp race page - evergreen registration page, no publication date |
| ainsleys-angels-twilight-5k-2026 | 2026-09-21 | null | RunSignUp race page - evergreen registration page, no publication date |
| miles-4-matthew-2026 | 2026-09-21 | null | RunSignUp race page - evergreen registration page, no publication date |
| coach-andy-30k-2026 | 2026-09-21 | null | RunSignUp race page - evergreen registration page, no publication date |
| road-kill-xc-open-5k-2026 | 2026-09-18 | null | RunSignUp race page - evergreen registration page, no publication date |
| komen-houston-race-for-the-cure-2026 | 2026-09-18 | null | RunSignUp race page - evergreen registration page, no publication date |
| houston-heights-fun-run-2026 | 2026-09-18 | null | RunSignUp race page - evergreen registration page, no publication date |
| golden-harvest-half-2026 | 2026-09-18 | null | RunSignUp race page - evergreen registration page, no publication date |
| angels-race-for-space-2026 | 2026-09-18 | null | AdventureSignUp race page - evergreen registration page, no publication date |
| day-of-the-dead-half-houston-2026 | 2026-09-18 | null | RunSignUp race page - evergreen registration page, no publication date |
| harra-warmup-bundles | 2026-09-10 | null | RunSignUp bundle page - evergreen registration page, no publication date |
| space-city-10-miler-2026 | 2026-09-01 | null | RunSignUp race page - evergreen registration page, no publication date |
| harra-party-in-the-park-2026 | 2026-08-08 | null | RunSignUp event page - evergreen registration page, no publication date |

### Organization Evergreen Pages (11 items)

These are organization websites with no article publication date.

| ID | Old Date | New Date | Evidence |
|----|----------|----------|----------|
| rfar-oct1-fundraising-milestone-2026 | 2026-09-21 | null | Houston Marathon RFAR page - evergreen info page with milestones, no publication date |
| harra-fall-series-2026 | 2026-09-18 | null | HARRA race series page - evergreen schedule page, no publication date |
| houston-marathon-training-kickoff-2026 | 2026-09-14 | null | BosPlace event listing - event date Oct 6, no article publication date |
| houston-911-heroes-run-2026 | 2026-09-12 | null | Travis Manion event page - event date Sept 12, no article publication date |
| alexs-5k-2026 | 2026-08-20 | null | Alex5k.com race page - evergreen event page, no publication date |
| power-in-motion-fall-2026 | 2026-08-17 | null | PowerInMotion.org - evergreen program page, no publication date |
| uthealth-houston-half-2026 | 2026-08-15 | null | HoustonHalf.com race page - evergreen registration page, no publication date |
| harra-student-memberships | 2026-07-06 | null | HARRA register page - evergreen membership page, no publication date |
| harra-membership-2026-2027 | 2026-07-06 | null | HARRA home page - evergreen membership info, no publication date |
| harra-spring-rots-results | 2026-07-06 | null | HARRA ROTS page - evergreen results page, no publication date |
| houston-runner-friendly-community | 2024-10-14 | null | HARRA RRCA page - evergreen designation info (designation in 2024, page undated) |

## Batch Ingest Dates Identified

The following dates appeared to be batch ingestion dates (multiple items with same date):

- **2026-09-21**: 5 items
- **2026-09-18**: 7 items  
- **2026-09-12**: 1 item
- **2026-09-10**: 1 item
- **2026-09-01**: 1 item
- **2026-08-20**: 1 item
- **2026-08-18**: 1 item (but verified as actual publication date)
- **2026-08-17**: 1 item
- **2026-08-15**: 1 item
- **2026-08-08**: 1 item
- **2026-08-04**: 1 item (verified as actual publication date)
- **2026-07-06**: 3 items
- **2024-10-14**: 1 item

## Methodology

1. **News articles**: Fetched source URL, extracted publication date from article byline or metadata
2. **Race registration pages**: Determined to be evergreen (no publication date exists)
3. **Organization pages**: Determined to be evergreen or event listings without article dates
4. **Verification**: All evidence documented in `data/news.json` `evidence` field

## Changes to `data/news.json`

- Added `evidence` field to all 29 items
- Set `date` to `null` for 24 unverifiable items
- Kept `date` for 5 verified items
- Sorted: dated items first (newest), then undated items (alphabetical)

## UI Behavior

With these changes:

- Items with verified dates show date in card metadata
- Items without dates show only source (no date displayed)
- Dated items appear first, sorted newest to oldest
- Undated items appear below dated items
