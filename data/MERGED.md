# Merged research artifacts

Log of race-research JSON files that have been merged into
`data/races-upcoming.json`. Append a new row whenever a research
artifact (from `prompts/upcoming-races-research.md`) is merged in.

| Merged on  | Window                  | Source file                              | Adds | Updates | Notes                                                  | Commit    |
|------------|-------------------------|------------------------------------------|------|---------|--------------------------------------------------------|-----------|
| 2026-04-09 | 2026-07-01 → 2026-07-30 | `races-2026-07-01-to-2026-07-30.json`    | 12   | 3       | Houston Fourth Fest kept under existing slug          | `d7c650d` |
| 2026-04-09 | 2026-08-01 → 2026-09-30 | `races-2026-08-01-to-2026-09-30.json`    | 21   | 0       | Clean adds, no near-duplicates                        | `0f22c81` |
| 2026-04-09 | 2026-10-01 → 2026-10-31 | `races-2026-10-01-to-2026-10-31.json`    | 15   | 0       | Clean adds, no near-duplicates                        | `0f22c81` |
| 2026-04-09 | 2026-11-01 → 2026-11-30 | `races-2026-11-01-to-2026-11-30.json`    | 15   | 0       | Clean adds, no near-duplicates                        | `0f22c81` |
| 2026-04-09 | 2026-11-29 → 2027-01-31 | `races-2026-11-29-to-2027-01-31.json`    | 10   | 0       | Normalized 100M/1 Mi/10 Mi aliases; added 6K+12K to canonical vocab for 12K of Christmas | `9ecc729` |
| 2026-04-09 | 2026-11-29 → 2027-01-31 | `races-2026-11-29-to-2027-01-31 (1).json` (dig-deeper) | 3    | 0       | 3 holiday-themed adds (Charlie Brown 5K, Gingerbread Lane, Kingwood Cookie Dash). Skipped 3 false-positive "updates" that only re-introduced 1 Mi/10 Mi/100M abbreviations on already-canonical races. | `2f5bd24` |
| 2026-04-10 | 2026-04-11 → 2026-04-19 | `upcoming-races.json`                    | 7    | 8       | Parkruns, charity runs, improved descriptions/URLs/start times. spring-fling kept live coords where new had null. | `7f6b427` |
| 2026-04-10 | 2026-04-25 → 2026-05-03 | `upcoming-races-apr24-may8.json`          | 2    | 8       | 2 genuine adds (Cinco de Mayo Run, Fuzzy's Taco Dash). 1 real update (el-cinco-cinco date moved). 7 near-dupe merges (kept existing IDs, took improved fields). | `a9c44e8` |
