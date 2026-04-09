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

### Refreshing race data

1. Maintainer runs `prompts/upcoming-races-research.md` in claude.ai
   with web search on, sets the `DATE WINDOW:` line to the desired
   range, and downloads the resulting JSON artifact.
2. Maintainer points Claude Code at the downloaded file and asks for
   a diff against `data/races-upcoming.json`.
3. Claude Code: validate the new file, compute an upsert-by-id diff
   (adds / updates / removes), surface the summary, and **wait for
   confirmation** before applying — especially for deletes.
4. Apply, run the validator, commit. Do not push without being asked.

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
| `prompts/upcoming-races-research.md` | The claude.ai research prompt for race refreshes |
| `.github/workflows/validate.yml` | CI early-warning runner |
| `.claude/settings.json` | Claude Code hooks (auto-validate on data edits) |
| `.githooks/pre-commit` | Tracked git pre-commit validator hook |
