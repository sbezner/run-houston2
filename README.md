# Run Houston

A community race-discovery guide for runners in Houston, Texas.
Vanilla HTML/CSS/JS, no build step, hosted on GitHub Pages.

- **Live (preview):** https://sbezner.github.io/run-houston2/
- **Live (eventual):** https://runhouston.app

## Architecture

- Static HTML/CSS/JS &mdash; no framework, no bundler.
- All data lives in flat JSON files under [`data/`](./data).
- Pages load JSON via `fetch()` and query it client-side with [AlaSQL](https://github.com/AlaSQL/alasql) (loaded from a CDN).
- Data is refreshed by hand-running research prompts in [`prompts/`](./prompts) against [claude.ai](https://claude.ai) with web search, then asking Claude Code to update the JSON files. There is no admin UI, no cron, and no GitHub Action &mdash; just a human and a weekly prompt. See [`prompts/README.md`](./prompts/README.md).
- Hosted on GitHub Pages from the `master` branch root.

## Project layout

```
.
├── index.html                  # Upcoming race calendar (list + map view)
├── race.html                   # Single race detail (?id=...)
├── clubs.html                  # Houston-area running clubs (list + map view)
├── reports.html                # Race news & recaps listing
├── report.html                 # Single race recap (?id=...)
├── about.html                  # About the project
├── assets/
│   ├── css/styles.css
│   └── js/                     # common.js + per-page scripts
├── data/
│   ├── races-upcoming.json     # Races in the next 90 days (rolling window)
│   ├── clubs.json              # Houston-area running clubs
│   └── race_reports.json       # Race news & recap content (markdown)
├── prompts/                    # Research prompts for refreshing data
│   ├── README.md
│   └── upcoming-races-research.md
├── .nojekyll                   # Disable Jekyll on GitHub Pages
└── README.md
```

`data/races-upcoming.json` is a rolling window: it only holds races in
roughly the next 90 days, and the weekly research prompt overwrites it
each time it runs. Races that have already happened fall off the list
and their `race.html?id=...` URLs will stop resolving — that's a known
and accepted trade-off for keeping the data model simple.

## Editing data

All race, club, and report data lives in `data/*.json`. There are two ways to
update it:

1. **By hand.** Open the JSON file in your editor, make the change, commit. Fine
   for one-off fixes and for clubs (which change rarely).
2. **Via a research prompt.** Open a prompt from [`prompts/`](./prompts) in
   [claude.ai](https://claude.ai) with web search enabled, copy the JSON it
   produces, and ask Claude Code in this repo to apply it. Suggested cadence is
   weekly for the upcoming-races prompt. See [`prompts/README.md`](./prompts/README.md)
   for the full workflow.

## Running locally

The site is fully static. Any local file server will do:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Plain `file://` won't work because `fetch()` blocks local file URLs.)

## Deploying

Push to `master`. GitHub Pages must be enabled in the repo settings:

> Settings &rarr; Pages &rarr; Build and deployment &rarr; Source: **Deploy from a branch** &rarr; Branch: `master` / `(root)`
