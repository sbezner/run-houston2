# CLAUDE.md

Context for Claude Code sessions working in `sbezner/run-houston2`.

## What this repo is

A community race-discovery guide for runners in Houston, Texas, hosted on GitHub Pages.

- **Vanilla HTML/CSS/JS.** No framework, no bundler, no build step, no backend.
- **Data in flat JSON.** Every page loads JSON from `data/` via `fetch()` and queries it client-side with [AlaSQL](https://github.com/AlaSQL/alasql) (loaded from a CDN).
- **Deploy = `git push origin master`.** GitHub Pages auto-rebuilds from `master`. No deploy script to run.
- **CI is an early-warning signal, not a gate.** `.github/workflows/validate.yml` runs JSON syntax, JS syntax, and `scripts/validate-data.py` on every push. A failing CI run does **not** block the Pages deploy — it just turns the commit red and emails the maintainer.

See `README.md` for the high-level architecture and `prompts/README.md` for the human-in-the-loop data refresh philosophy.

## Repo layout

```
.
├── index.html                  Upcoming race calendar (list + map view)
├── race.html                   Single race detail (?id=...)
├── clubs.html                  Houston-area running clubs (list + map view)
├── reports.html                Race news & recaps listing
├── report.html                 Single race recap (?id=...)
├── about.html                  About the project
├── 404.html                    Custom 404 page
├── assets/
│   ├── css/styles.css
│   └── js/                     common.js + per-page scripts
├── data/
│   ├── races-upcoming.json     Rolling ~next-90-days race list (THE primary refresh target)
│   ├── clubs.json              Houston-area running clubs (hand-edited, rarely changes)
│   └── race_reports.json       Race recaps / news, markdown content (hand-written)
├── prompts/
│   ├── README.md               Explains the research-prompt philosophy
│   └── upcoming-races-research.md  Prompt to paste into claude.ai for data refreshes
├── scripts/
│   └── validate-data.py        Data contract validator (run on every change)
├── .github/workflows/
│   └── validate.yml            CI that runs validate-data.py on push to master
├── CNAME                       For the eventual runhouston.app domain
├── README.md
├── todo.md
└── CLAUDE.md                   This file
```

## The most common task: refresh `data/races-upcoming.json`

Almost every Claude Code session on this repo exists to do one thing: **merge a new batch of race JSON into `data/races-upcoming.json`**. The JSON comes from running `prompts/upcoming-races-research.md` against `claude.ai` with web search enabled, and the user hands it off to Claude Code.

### How the JSON reaches you

The user will either:

**(a) Paste the JSON array directly into chat.** This is the most common path — the user copies the JSON artifact from claude.ai and pastes it into a message.

**(b) Tell you a file path on the sandbox filesystem** where they've placed the file.

**Important:** Claude Code runs in an isolated sandbox. **It cannot read the user's local Downloads folder** or any path on their laptop (e.g. `/Users/me/Downloads/...`). If the user references such a path, politely tell them to either paste the contents inline or copy the file into the repo working directory / `/tmp` on the sandbox first.

### Runbook: "merge this JSON into races-upcoming.json"

Follow these steps in order. Ask the user before deviating.

1. **Acquire the new data.** Save the incoming JSON array to `/tmp/incoming-refresh.json` (if pasted) or read it from the path the user provided. Confirm it's a non-empty JSON array of race objects.

2. **Identify the date window.** Look at the min and max `date` field across all incoming records. Tell the user the window you're about to merge (e.g. "incoming blob covers 2026-08-15 through 2026-10-31"). If they specified dates in their message and they don't match, stop and ask.

3. **Smell-test the shape.** For each incoming record, check:
   - `id` present, non-empty string, unique within the incoming blob
   - `name`, `date` (YYYY-MM-DD), `distance` (non-empty array), `surface`, `kid_run` all present
   - Every `distance` value is in the canonical vocab (see Schema Reference below)
   - `surface` is one of `{road, trail, track, virtual, other}`
   - `latitude` and `longitude` are either both `null` or both numbers inside the Houston bbox: lat `(28.5, 30.85)`, lng `(-96.55, -94.0)`. If a coord is outside the bbox, flag it — it's usually a lat/lng swap or a race that's not actually local.
   - `start_time` is HH:MM or null
   - `official_website_url` / `source_url` are non-empty strings or null
   - `description` is a non-empty string

   If anything fails, list the failures to the user and ask whether to fix, drop, or abort.

4. **Compute the upsert-by-id diff** against the current `data/races-upcoming.json`:
   - **Adds** — ids in incoming but not in current.
   - **Updates** — ids in both. Show which fields differ. Prefer new (incoming) values.
   - **Removes** — ids in current but not in incoming. **Do NOT delete automatically.** If the incoming date window doesn't overlap the removed race's date, a delete is probably wrong (the old race is from an earlier window and should stay until its date passes). Ask the user: "Incoming data doesn't cover these N races — should I leave them in place, or drop them?" Default to leaving them.

5. **Present the summary.** One-line-per-change summary like: `ADD 28 races, UPDATE 3, REMOVE 0 (45 existing races outside incoming window — leaving in place)`. List any data-quality concerns from step 3 that haven't been resolved.

6. **Wait for explicit approval** before writing to disk. Don't proceed on silence or a vague response.

7. **Apply the merge.** Write the merged array to `data/races-upcoming.json`. Sort by `date` ascending, then by `name` alphabetically within the same date. Preserve existing field order within each record so diffs read cleanly.

8. **Validate.** Run `python3 scripts/validate-data.py` from the repo root. If it fails, do NOT commit — report the failures and either fix them (if trivial and obvious) or ask the user.

9. **Commit.** Create ONE commit with a descriptive message like:
   ```
   Refresh races-upcoming.json: add 28 races for Aug-Oct 2026

   - Added 28 new races (2026-08-15 through 2026-10-31)
   - Updated 3 existing records with corrected URLs
   - Left 45 earlier-window races in place
   ```
   Stage only the files you actually changed. Don't `git add -A`. Don't amend a previous commit.

10. **Push.** Use `git push -u origin <branch>`. Use whatever branch the session instructions specify. **Never force-push. Never push to master without explicit user instruction.** Retry up to 4 times with exponential backoff (2s/4s/8s/16s) only on network errors; stop and ask on any other failure.

11. **Confirm CI.** After pushing, the `validate` workflow runs in ~30s. Tell the user to check GitHub Actions, or use the GitHub MCP tools (`mcp__github__*`) to look it up if they ask.

### Edge cases

- **"The file is in my Downloads folder."** You can't read it. Ask the user to paste the contents or copy the file to a sandbox-accessible path.
- **Duplicate id inside the incoming blob.** Error out. Don't pick one silently.
- **id collides with an existing record.** That's an update, not a conflict. Show field diffs and upsert. Incoming data is newer.
- **A distance value not in the canonical vocab (e.g. "5 Mile").** Flag it. Don't silently rewrite. Either (a) convert to the closest canonical value with user approval, or (b) extend the vocab in `scripts/validate-data.py` + the per-page JS filters — but that's a separate conversation beyond the data refresh.
- **Coordinates slightly outside the Houston bbox.** If it's a real race the user wants in-scope, the fix is to widen the bbox in `scripts/validate-data.py` as a separate commit. Don't do this silently during a data refresh.
- **A race with a date in the past.** Don't include it. The file is forward-looking; past races fall off.
- **Incoming date window is narrower than current file's window.** Fine. Only upsert the overlap; don't delete entries outside the incoming window.

## Things to never do without explicit permission

- Add a backend, framework, bundler, or build step.
- Add a GitHub Action that auto-refreshes data (the maintainer explicitly vetoed this — see `prompts/README.md`).
- Push to `master` if the session is scoped to a feature branch. Respect the branch specified in session instructions.
- Force-push, hard-reset, or use destructive git operations.
- Delete entries from `data/races-upcoming.json` without confirmation, even if they look stale.
- Amend a previous commit. Always create a new one.
- Use `git add -A` or `git add .` — stage specific files by name.
- Skip hooks with `--no-verify`.
- Open a PR unless the user explicitly asks.
- Comment on GitHub issues/PRs unless genuinely necessary.
- Run a WebSearch-based research pass inside Claude Code. The user prefers claude.ai output for race research — it produces better data than in-session web searches.
- Edit `data/race_reports.json` content generatively. Race reports are first-person human writing.

## Things that are encouraged

- **Read `scripts/validate-data.py` first** if you're uncertain about the data contract. It's the single source of truth (~230 lines).
- **Re-run the validator after every write** to `data/`. It catches bbox errors, distance typos, duplicate ids, etc.
- **Use `Read` / `Grep` / `Glob` tools** for file operations, not `cat` / `grep` / `find`.
- **Use the GitHub MCP tools** (prefixed `mcp__github__`) for GitHub operations. You do NOT have `gh` CLI.
- **Refer to records by id**, not array index, when talking to the user.
- **Keep commit messages descriptive** — the git log is part of the review trail for the human-in-the-loop data process.

## Schema reference: `data/races-upcoming.json`

A single race object (all fields shown):

```json
{
  "id": "bellaire-trolley-run-2026",
  "name": "Bellaire Trolley Run",
  "date": "2026-04-11",
  "start_time": "07:30",
  "tz": "America/Chicago",
  "address": "7008 South Rice Ave",
  "city": "Bellaire",
  "state": "TX",
  "zip": "77401",
  "latitude": 29.7099,
  "longitude": -95.4577,
  "distance": ["1 Mile", "5K"],
  "surface": "road",
  "kid_run": false,
  "official_website_url": "https://runsignup.com/Race/TX/Bellaire/BellaireTrolleyRun",
  "source_url": "https://runsignup.com/Race/TX/Bellaire/BellaireTrolleyRun",
  "description": "The 30th Annual Bellaire Trolley Run starts and finishes at Bellaire City Hall."
}
```

**Required fields:** `id`, `name`, `date`, `distance`, `surface`, `kid_run`

**Canonical distance vocab:** `1 Mile`, `5K`, `10K`, `15K`, `10 Mile`, `Half Marathon`, `Marathon`, `50K`, `50 Mile`, `100K`, `100 Mile`, `Ultra`, `Kids`

**Canonical surface vocab:** `road`, `trail`, `track`, `virtual`, `other`

**Houston bounding box:** latitude `(28.5, 30.85)`, longitude `(-96.55, -94.0)`

Field order within a record should stay consistent with the existing file so diffs read cleanly.

## Schema reference: `data/clubs.json`

Rarely touched by Claude Code. Hand-edited by the maintainer. See `scripts/validate-data.py` `validate_club()` for the full contract. Required: `id`, `club_name`. Optional: `website_url`, `latitude`/`longitude` (both or neither).

## Schema reference: `data/race_reports.json`

Rarely touched by Claude Code. First-person human content. See `scripts/validate-data.py` `validate_report()`. Required: `id`, `title`, `content_md`. Optional: `race_date` (YYYY-MM-DD or null).

## Local verification

```bash
# Validate data contract
python3 scripts/validate-data.py

# Run a local server (required because fetch() won't work with file:// URLs)
python3 -m http.server 8000
# then open http://localhost:8000
```

## When in doubt

Ask the user. This repo is small and the maintainer is happy to clarify scope. A brief "before I apply this, do you want X or Y?" question is always better than guessing and having to revert.
