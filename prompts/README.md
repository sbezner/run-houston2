# Prompts

This directory holds the **research prompts** that keep `data/*.json` fresh.

There is no GitHub Action, no cron, no API key in this repo. Data updates are
deliberately manual and human-in-the-loop:

```
┌──────────────────────────┐    1. copy prompt    ┌──────────────────┐
│ prompts/*.md             │ ───────────────────► │ claude.ai        │
│ (this directory)         │                      │ (web search ON)  │
└──────────────────────────┘                      └──────────────────┘
                                                          │
                                                          │ 2. research
                                                          │    + JSON
                                                          ▼
┌──────────────────────────┐    4. update file   ┌──────────────────┐
│ data/*.json              │ ◄─────────────────── │ Claude Code      │
│ (committed to repo)      │  3. paste JSON in   │ (this repo)      │
└──────────────────────────┘                     └──────────────────┘
```

## Why this instead of a GitHub Action?

- **Race data isn't a high-frequency feed.** New races appear maybe once or twice a week. A weekly manual run is fine.
- **Cron + secrets is brittle.** Rate limits, expired tokens, scraping changes, malformed AI output, and silent failures are all things you'd be debugging at 11pm. None of that exists if a human is in the loop.
- **Review before commit, every time.** Each JSON refresh becomes a normal git commit you can read, edit, or revert. There's no surprise CI commit at 3am.
- **It's actually faster.** ~10 minutes of human attention per week, including the review pass.

## Workflow

1. **Pick a prompt** from this directory based on what you want to refresh.
2. **Open [claude.ai](https://claude.ai)** in a fresh conversation. Toggle on **Web Search** in the composer.
3. **Copy the entire prompt body** (everything from the first paragraph onward — the file's "How to use this" section is just for you, not for Claude) and paste it as your message. Send.
4. **Wait** for the research to finish. Expect 3–8 minutes for races; less for clubs.
5. **Copy the JSON output** — everything from the opening `[` through the matching closing `]`, before the `## Research notes` section.
6. **In Claude Code** (in this repo), tell Claude to update the corresponding JSON file. Something like:

   > Update `data/races-upcoming.json` with the JSON below. Validate it, diff it against the current file, and call out anything suspicious before committing.
   >
   > ```json
   > [ ...paste here... ]
   > ```

   Claude Code will:
   - Parse and validate the pasted JSON.
   - Spot-check field types, the date window, and obviously bad coordinates.
   - Write the JSON to a temp file (e.g. `/tmp/new-upcoming.json`) and run
     `node scripts/refresh-upcoming-races.js /tmp/new-upcoming.json`.
     The script diffs the new file against the current
     `data/races-upcoming.json`, moves any ids that "fell off" into the
     appropriate `data/races-YYYY.json` archive, then overwrites
     `data/races-upcoming.json`. This keeps `race.html?id=...` URLs alive
     forever even after a race has happened.
   - Show you the resulting diff of both the upcoming file and any archive
     file that changed.
   - Commit the result on a clean commit so it's easy to revert.

   If you're editing `data/races-upcoming.json` by hand (e.g. fixing a typo
   in an existing race), you don't need the script — it's only for the
   weekly bulk refresh where races leave the upcoming window.

## Available prompts

| File | Refreshes | Suggested cadence |
|---|---|---|
| [`upcoming-races-research.md`](./upcoming-races-research.md) | `data/races-upcoming.json` (next 90 days of races) | Weekly |

More to come (clubs, race reports). For now, clubs change rarely enough that
hand-editing `data/clubs.json` is fine, and race reports are first-person and
shouldn't be AI-generated anyway.

## Editing the prompts

Treat these prompts as code: edit them in this repo, commit changes with a
message explaining what improved, and re-run them after meaningful edits to
make sure they still produce well-formed JSON.

If you discover the prompt is missing races, including bad data, or doing
weird things with edge cases, the fix is to **improve the prompt** and commit
that improvement, not to manually edit the resulting JSON forever.
