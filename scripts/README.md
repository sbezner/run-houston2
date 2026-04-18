# scripts/

Helper scripts that maintain `data/*.json` and run the discovery /
report pipelines. Grouped by what they're for.

---

## Data contract

**`validate-data.py`**
Enforces the schema for every `data/*.json` file. The source of truth
for what shape the data must have.
*Depends on:* nothing.
*Called from:* `.githooks/pre-commit`, `.claude/settings.json` PostToolUse hook,
`.github/workflows/validate.yml` CI, and the merge / enrich / geocode
scripts after they apply changes. Also runnable by hand.

---

## Discovery (upcoming races)

**`fetch-runsignup-window.py`**
Pulls Houston-area races from the RunSignUp API for a given date
window and writes them in the shape `merge-races.py` expects.
*Depends on:* RunSignUp API.
*Called from:* `run_discovery.sh`. Also runnable by hand.

**`merge-races.py`**
Diffs and upserts a race-research artifact into
`data/races-upcoming.json`. Adds new races, updates changed ones,
skips no-ops, and never auto-deletes.
*Depends on:* `validate-data.py`.
*Called from:* `run_discovery.sh`. Also runnable by hand for one-off
research artifact merges.

**`enrich-runsignup.py`**
Appends affiliate tokens to RunSignUp URLs and replaces non-RunSignUp
URLs with RunSignUp ones via API lookup.
*Depends on:* `validate-data.py`, RunSignUp API.
*Called from:* `run_discovery.sh` (`--step1 --apply` only). Also
runnable by hand for the full multi-step run.

**`geocode-missing.py`**
Backfills null `latitude` / `longitude` in `data/races-upcoming.json`
via Nominatim. Rejects hits outside the Houston bbox.
*Depends on:* `validate-data.py`, Nominatim.
*Called from:* by hand only — needs network egress and isn't part of
the weekly pipeline.

**`run_discovery.sh`**
The weekly discovery pipeline. Runs in a tmux session called
`discovery`, processes one date window at a time, fetches from
RunSignUp, runs Claude Code to find the rest, and merges everything.
*Depends on:* `fetch-runsignup-window.py`, `merge-races.py`,
`enrich-runsignup.py`, `prompts/run_discovery.md`, `claude` CLI, tmux.
*Called from:* by hand by the maintainer.

**`discovery-status.py`**
Prints a quick summary of the current discovery pipeline state:
running or stopped, weeks done, weeks remaining, ETA.
*Depends on:* `logs/discovery-*.log`.
*Called from:* by hand.

**`auto-commit.py`**
Commits and pushes `data/races-upcoming.json` if it has uncommitted
changes. Standalone; no longer wired into the discovery pipeline.
*Depends on:* git.
*Called from:* by hand.

---

## Reports (past races)

**`merge-reports.py`**
Diffs and upserts a report artifact into `data/race_reports.json`.
Sorts the result newest first.
*Depends on:* `validate-data.py`.
*Called from:* `reports_discovery.sh`. Also runnable by hand.

**`reports_discovery.sh`**
The weekly race-report pipeline. Walks BACKWARD from a start date,
one week at a time, runs Claude Code to research recaps for each
window, merges the result, and auto-commits and pushes per week. Runs
in a tmux session called `reports_discovery`.
*Depends on:* `merge-reports.py`, `prompts/reports_discovery.md`,
`claude` CLI, tmux.
*Called from:* by hand by the maintainer.
