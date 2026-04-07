# Run Houston

A community race-discovery guide for runners in Houston, Texas.
Vanilla HTML/CSS/JS, no build step, hosted on GitHub Pages.

- **Live (preview):** https://sbezner.github.io/run-houston2/
- **Live (eventual):** https://runhouston.app

## Architecture

- Static HTML/CSS/JS &mdash; no framework, no bundler.
- All data lives in flat JSON files under [`data/`](./data).
- Pages load JSON via `fetch()` and query it client-side with [AlaSQL](https://github.com/AlaSQL/alasql) (loaded from a CDN).
- Data is curated by AI agents through GitHub Actions (cron + Anthropic API with web search). There is no admin UI &mdash; data is managed entirely through prompts and pull requests.
- Hosted on GitHub Pages from the `main` branch root.

## Project layout

```
.
├── index.html                  # Upcoming race calendar (this PR)
├── assets/
│   ├── css/styles.css
│   └── js/app.js
├── data/
│   └── races-upcoming.json     # Races in the next 90 days
├── .nojekyll                   # Disable Jekyll on GitHub Pages
└── README.md
```

Pages still to come: `race.html`, `clubs.html`, `reports.html`, `report.html`,
plus `data/races-2026.json`, `data/clubs.json`, and `data/race_reports.json`.

## Editing data

All race, club, and report data lives in `data/*.json`. To add or update an
entry, edit the JSON file directly and commit. Once the AI workflows are wired
up, automated runs will open pull requests with refreshed data on a schedule.

## Running locally

The site is fully static. Any local file server will do:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Plain `file://` won't work because `fetch()` blocks local file URLs.)

## Deploying

Push to `main`. GitHub Pages must be enabled in the repo settings:

> Settings &rarr; Pages &rarr; Build and deployment &rarr; Source: **Deploy from a branch** &rarr; Branch: `main` / `(root)`
