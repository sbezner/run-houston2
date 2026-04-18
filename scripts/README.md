# scripts/

Reference for the helper scripts that maintain `data/*.json` and run the
discovery / recap pipelines.

All paths below are relative to the repo root. Run scripts from the repo
root unless noted.

## Data contract

### `validate-data.py`
Enforces the schema for every `data/*.json` file: required fields,
canonical distance/surface vocabularies, unique ids, ISO dates,
HH:MM times, and Houston-bbox lat/lng. Source of truth for the data
contract — extend this file when the data model changes.

```
python3 scripts/validate-data.py
```

Exits 0 on success, 1 on any error. Run automatically by:
- `.claude/settings.json` PostToolUse hook (after Edit/Write on `data/*`)
- `.githooks/pre-commit` (if you've enabled `git config core.hooksPath .githooks`)
- `.github/workflows/validate.yml` (CI early-warning, non-blocking)

## Race data refresh

### `merge-races.py`
Diff and upsert a research-artifact JSON into `data/races-upcoming.json`.
Upsert by id; canonicalizes distances and rounds coords before diffing
so abbreviation-only changes are no-ops. Detects near-dupes (same date +
65%+ name overlap). Never auto-removes records.

```
python3 scripts/merge-races.py PATH_TO_NEW_JSON           # dry-run
python3 scripts/merge-races.py PATH_TO_NEW_JSON --apply   # write + validate
```

### `fetch-runsignup-window.py`
Pull all Houston-area races from the RunSignUp API for a date window
and write them in the shape `merge-races.py` expects.

```
python3 scripts/fetch-runsignup-window.py START_DATE END_DATE OUTPUT_FILE
```

### `enrich-runsignup.py`
Three-step enrichment of `data/races-upcoming.json` against RunSignUp:
1. Append affiliate token to existing RunSignUp URLs.
2. Replace non-RunSignUp URLs with RunSignUp URLs (API lookup, ≥75% name match).
3. Discover new races (placeholder, not yet implemented).

```
python3 scripts/enrich-runsignup.py                 # dry-run, all steps
python3 scripts/enrich-runsignup.py --step1 --apply # one step, write
```

### `geocode-missing.py`
Backfill null `latitude`/`longitude` in `data/races-upcoming.json` via
Nominatim, using each record's existing address fields. Rejects hits
outside the Houston bbox. Skips weak addresses ("TBD", "Houston area",
null) unless `--include-weak`. Rate-limited to 1.1 req/s. Run locally
(needs network egress).

```
python3 scripts/geocode-missing.py                  # dry-run
python3 scripts/geocode-missing.py --apply
python3 scripts/geocode-missing.py --include-weak
```

## Pipeline runners

### `run_discovery.sh`
Launches the weekly race-discovery pipeline in a detachable tmux session
called `discovery`. Per week: RunSignUp fetch → merge → Claude Code
search → merge → affiliate-token enrich. Resumable (skips weeks already
in the progress log); use `--fresh` to start over. 2-hour cooldown
between weeks; one 4-hour retry on Claude failure.

```
./scripts/run_discovery.sh START_DATE NUM_WEEKS [--fresh]
./scripts/run_discovery.sh 2026-06-01 4
```

Controls: `tmux attach -t discovery` · `Ctrl+B D` to detach ·
`tmux kill-session -t discovery` · `touch pause-discovery` to pause ·
`rm pause-discovery` to resume.

Logs: `logs/discovery-run.log` (full output), `logs/discovery-progress.log`
(one line per week).

### `run_recaps.sh`
Same shape as `run_discovery.sh` but for race recaps. tmux session
`recaps`, 20-min cooldown, 4-hour retry. Writes recap JSON to
`~/Downloads/`; merge into `data/race_reports.json` by hand.

```
./scripts/run_recaps.sh START_DATE NUM_WEEKS
```

Log: `logs/recaps-progress.log`.

### `discovery-status.py`
Quick summary of the current discovery pipeline state: tmux session
status, race count, weeks done / failed / remaining, ETA, last log
line. Reads `logs/discovery-*.log`.

```
python3 scripts/discovery-status.py
```

### `auto-commit.py`
Commits and pushes `data/races-upcoming.json` if it has uncommitted
changes. Designed to be called by `run_discovery.sh` after each week
so the live site stays current during unattended runs.

```
python3 scripts/auto-commit.py
```
