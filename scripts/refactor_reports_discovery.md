# Refactor plan: RunSignUp results integration for `reports_discovery`

Status: **planned, not started.** This is the spec we agreed on; we'll
execute it in a later session.

## Goal

Pre-fetch authoritative race results from the RunSignUp API before
Claude runs, so recaps cite verified winners and finish times instead
of relying on whatever Claude can scrape from results pages and news.

## Decisions already made

| # | Question | Choice |
|---|---|---|
| 1 | Per-race detail | **(b)** Top 3 male overall + top 3 female overall + masters M/F + total finishers (~13 records/race) |
| 2 | Race exists but results not posted | **(b)** Include with `results.available: false` so Claude knows the race happened but doesn't invent results |
| 3 | Backfill the 16 existing recaps? | **(c)** Defer — they'll get re-enriched naturally if those weeks are re-run through the pipeline |
| 4 | Behavior when RunSignUp API fails | **(b)** Soft warn + continue — log `WARN:`, write `[]` ground-truth file, run Claude anyway |
| 5 | Ground-truth JSON shape | **(a)** Nested per race (one object per race, events + results inside) |

## What gets built

### 1. New script: `scripts/fetch-runsignup-results.py`

Mirrors `fetch-runsignup-window.py`. Pulls past races + their results
from RunSignUp for a date window, writes a nested JSON file Claude
reads as ground truth.

**Args:** `START_DATE END_DATE OUTPUT_FILE`

**Logic:**
1. `/rest/races` with `zipcode=77002`, `radius=60`, `start_date`,
   `end_date` → list of Houston-area races in window
2. For each race_id, `/rest/race/{race_id}/results/has-result-sets`
   (cheap precheck — skips races whose results aren't posted)
3. For races with results: `/rest/race/{race_id}/results/get-result-sets`
   → list of events (one per distance)
4. For each event: `/rest/race/{race_id}/results/get-results` → full
   finisher list
5. From each event's finisher list, extract:
   - Top 3 male overall (sorted by overall_place)
   - Top 3 female overall
   - Masters male winner (gender=M, age ≥ 40, fastest)
   - Masters female winner (gender=F, age ≥ 40, fastest)
   - `total_finishers` (count of rows)
6. Races without results posted: included as `results.available: false`
7. Output the nested shape:
   ```json
   [
     {
       "race_id": 12345,
       "race_name": "Bayou City Classic 10K",
       "race_date": "2026-03-07",
       "city": "Houston",
       "url": "https://runsignup.com/...",
       "results": {
         "available": true,
         "by_event": {
           "10K": {
             "total_finishers": 1547,
             "overall_male_top3":   [{"name":"...","time":"30:42","city":"Houston"}, ...],
             "overall_female_top3": [...],
             "masters_male":   {"name":"...","time":"..."},
             "masters_female": {"name":"...","time":"..."}
           },
           "5K": { ... }
         }
       }
     }
   ]
   ```
8. Auth: same hardcoded API key + secret + affiliate token as the
   existing two RunSignUp scripts (consistent, not best practice but
   matches what's there).

**Known unknown:** the exact response shape of `get-results` isn't in
the docs index — the build will start with one live API call to confirm
field names (`gender`, `age`, `chip_time`, `overall_place`, etc.) before
writing the extraction logic. Cheap to verify.

### 2. `scripts/reports_discovery.sh` — insert Step 1, renumber existing

Per-week steps become:
1. **NEW: RunSignUp pre-flight.** Call `fetch-runsignup-results.py`
   for the window → `~/Downloads/runsignup-results-{start}-to-{end}.json`.
   On failure: log `WARN: RunSignUp pre-flight failed`, write `[]` so
   the prompt's `Read` doesn't crash, continue.
2. Claude Code (was Step 1)
3. Merge into `data/race_reports.json` via `merge-reports.py` (was Step 2)
4. Auto-commit + push (was Step 3)

The existing low-yield WARN logic stays as-is.

### 3. `prompts/reports_discovery.md` — add ground-truth instruction

New section near the top, before the search procedure:

> **Step 0: Read RunSignUp ground truth.** Before any web search,
> `Read ~/Downloads/runsignup-results-{start}-to-{end}.json`. This is
> the authoritative source for: race name, date, location, RunSignUp
> URL, total finisher count, top 3 male/female overall, masters M/F.
> **Use these values directly in the Results paragraph — do not
> re-search them.** Use web search only for (a) races not in the file,
> (b) historical weather (RunSignUp has none), (c) charity beneficiary,
> course details, weather impact, race history.

Plus minor edits:
- Required-searches list: add a note that RunSignUp result-page searches
  are now redundant for races in the ground-truth file
- content_md results-paragraph rule: cite RunSignUp ground truth as
  the primary source
- Quality checklist: add a check that races in the ground-truth file
  have their finisher data reflected verbatim

### 4. `scripts/README.md` — add new entry

Under the "Reports (past races)" section, before `merge-reports.py`:

> **`fetch-runsignup-results.py`** — pulls past Houston-area races +
> top-3/masters results from RunSignUp for a date window. Writes the
> nested JSON consumed by the recap prompt as ground truth.
> *Depends on:* RunSignUp API.
> *Called from:* `reports_discovery.sh`. Also runnable by hand.

## Tests (cheap, no Claude calls)

1. **API call test:** invoke `fetch-runsignup-results.py` for a known
   window. Inspect the JSON. Confirms endpoints work and the response
   shape matches assumptions. ~30 sec.
2. **Worker generation test:** stub-launch `reports_discovery.sh` and
   verify the renumbered steps and pre-flight call appear correctly in
   `.reports_discovery-worker.sh`.
3. **End-to-end:** a fresh `reports_discovery.sh` run exercises the
   full path.

## Notes / risks

- **API call volume:** ~22 calls per 7-day window (6 has-result-sets +
  6 get-result-sets + 10 get-results, give or take). Well under
  RunSignUp's "max 2 concurrent" limit when sequential.
- **Race-id stability:** RunSignUp's `race_id` is used transiently to
  fetch results and then discarded. If we ever want it persisted in
  `data/race_reports.json` as a join key, that's a separate ask.
- **Coverage:** RunSignUp doesn't host every Houston race. Trail and
  small charity races often use SweatEngineering, FisherCreative, or
  Chiptime. This integration helps the ~50–70% of races on RunSignUp;
  the rest still depend on Claude's web search quality.
- **Weather:** RunSignUp has none. Claude still owns the weather
  paragraph.

## Explicitly NOT in scope

- Backfill of the 16 existing recaps
- Hard-fail behavior on RunSignUp API errors
- Flat result-row JSON format
- Adding `race_id` as a persisted field in `data/race_reports.json`
- A separate enrichment step for non-RunSignUp timing companies
