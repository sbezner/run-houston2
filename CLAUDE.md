# CLAUDE.md

Project guidance for Claude Code working in this repo.

## What this project is

**Run Houston** — a community race-discovery site for runners in the
Houston, TX metro area. Static HTML/CSS/JS, no build step, no
framework, no bundler. Hosted on GitHub Pages from `master`.

- Live preview: https://sbezner.github.io/run-houston2/
- Eventual: https://runhouston.app

## Architecture in one paragraph

Pages are plain `.html` files in the repo root. They `fetch()` JSON
from `data/` and query it client-side with AlaSQL (CDN). There is no
backend, no API, no database, no admin UI, no bundler, and no CI gate
on deploys — pushing to `master` deploys. CI (`.github/workflows/validate.yml`)
runs `scripts/validate-data.py` as an early-warning signal only; it
does not block the deploy.

## Data files

All site data lives in `data/*.json` as flat JSON arrays:

- `data/races-upcoming.json` — upcoming races, hand-curated by the
  maintainer. There is **no automatic date window** — the file may
  hold races at any horizon. The maintainer decides what's in it.
  Past races are not auto-pruned.
- `data/clubs.json` — Houston-area running clubs.
- `data/race_reports.json` — race news / recap markdown.

The data contract is enforced by `scripts/validate-data.py`. If you
extend the model (new field, new canonical distance, new surface),
update the validator in the same change.

## Hard rules

1. **Always run the validator after editing `data/*.json`:**
   `python3 scripts/validate-data.py`. A PostToolUse hook in
   `.claude/settings.json` runs it automatically and blocks on
   failure — don't try to bypass it.
2. **Do not introduce a build step, bundler, framework, package
   manager, or `node_modules`.** Vanilla HTML/CSS/JS only.
3. **Do not auto-prune races by date.** The maintainer manages the
   contents of `races-upcoming.json` directly.
4. **Do not invent data.** When updating races, every field must come
   from a verifiable source (typically a research artifact produced
   by `prompts/upcoming-races-research.md` against claude.ai). Use
   `null` rather than guessing coordinates, start times, etc.
5. **Distances and surfaces are a closed vocabulary.** See
   `CANONICAL_DISTANCES` and `CANONICAL_SURFACES` in
   `scripts/validate-data.py`. Adding a new value requires updating
   the validator and confirming the frontend handles it.
6. **Lat/long must fall inside the Houston bbox** defined in the
   validator. If a race is outside it, either the bbox needs widening
   (with justification) or the race is out of scope.
7. **Push = deploy.** Treat `master` as production. Confirm before
   pushing. Never force-push.

## Workflows

### Automated race discovery (pipeline)

Run `/races-discovery START_DATE NUM_WEEKS` (e.g. `/races-discovery 2026-06-01 5`)
from Claude Code. This launches `scripts/run_discovery.sh` in a detached tmux
session — Claude Code stays free immediately. Per week the pipeline:

1. Fetches from RunSignUp API (`scripts/fetch-runsignup-window.py`)
2. Merges RunSignUp results into `data/races-upcoming.json` (auto, no approval)
3. Runs Claude Code web search for non-RunSignUp sources (`prompts/run_discovery.md`)
4. Merges web results (auto)
5. Enriches affiliate tokens (`scripts/enrich-runsignup.py`)
6. Logs newly added races to `logs/races-added-session-N.jsonl`

Cooldown is 2 hours between weeks. A macOS notification fires on completion.

- `/races-status` — check progress (weeks done/failed, ETA, current activity)
- `/races-log session N` — review races added in session N; say "remove X" to back out

### Refreshing race data (manual)

1. Maintainer runs `prompts/upcoming-races-research.md` in claude.ai
   with web search on, sets the `DATE WINDOW:` line to the desired
   range, and downloads the resulting JSON artifact.
2. Maintainer points Claude Code at the downloaded file and asks for
   a diff against `data/races-upcoming.json`.
3. Claude Code: validate the new file, compute an upsert-by-id diff
   (adds / updates / removes), surface the summary, and **wait for
   confirmation** before applying — especially for deletes.
4. Apply, run the validator, commit. Do not push without being asked.

### Refreshing clubs data

Run `/clubs-discovery` from Claude Code. A background research agent sweeps
HARRA, FFP, RunSignUp, Meetup, and suburb-specific searches, then writes a
proposed JSON to `~/Downloads/clubs-research-YYYY-MM.json`. When done, the
diff is presented (new clubs, URL updates) and you confirm before anything is
written. Validator runs automatically; commit and push on approval.

- `/clubs-status` — check progress of the background research agent

### Editing site code

- Pages and JS live in repo root and `assets/js/`. Read before
  editing. Match existing style.
- No new dependencies. If something seems to need a library, ask
  first.

## What not to do

- Don't add docstrings, comments, or type annotations to code you
  didn't change.
- Don't refactor adjacent code "while you're in there."
- Don't add error handling for cases that can't happen — `fetch()` of
  a static JSON file on the same origin is not a network boundary
  worth defending against.
- Don't generate PRs, commits, or pushes unless explicitly asked.
- Don't create README files or extra docs unless asked.

## Useful files at a glance

| File | Purpose |
|---|---|
| `index.html`, `race.html`, `clubs.html`, `reports.html`, `report.html`, `about.html` | Pages |
| `assets/js/*.js` | Per-page client logic; `common.js` is shared |
| `assets/css/styles.css` | All site CSS |
| `data/*.json` | All site data |
| `scripts/validate-data.py` | Data contract validator (source of truth for the schema) |
| `scripts/merge-races.py` | Diff/merge race research artifacts into `races-upcoming.json` |
| `scripts/merge-clubs.py` | Diff/merge clubs research artifacts into `clubs.json` |
| `scripts/run_discovery.sh` | Automated multi-week race discovery pipeline (tmux) |
| `scripts/fetch-runsignup-window.py` | RunSignUp API fetch for a date window |
| `scripts/log-new-races.py` | Appends newly added races to per-session JSONL log |
| `scripts/discovery-status.py` | Pipeline status reporter (reads discovery logs) |
| `scripts/enrich-runsignup.py` | Adds affiliate tokens to RunSignUp registration URLs |
| `prompts/upcoming-races-research.md` | Manual claude.ai research prompt for race refreshes |
| `prompts/run_discovery.md` | Per-week Claude Code research prompt (used by pipeline) |
| `prompts/clubs-research.md` | Claude Code research prompt for clubs discovery |
| `.claude/commands/` | Claude Code skill definitions (`/races-discovery`, `/races-status`, `/races-log`, `/clubs-discovery`, `/clubs-status`) |
| `.github/workflows/validate.yml` | CI early-warning runner |
| `.claude/settings.json` | Claude Code hooks (auto-validate on data edits) |
| `.githooks/pre-commit` | Tracked git pre-commit validator hook |
