---
description: Run the end-to-end clubs discovery pipeline — research Houston running clubs, diff against current data, confirm, apply, commit, and push.
---

# /clubs-discovery — Houston Running Clubs Discovery Pipeline

Run the end-to-end clubs discovery pipeline: research → diff → confirm → apply → commit → push.

## What you do immediately

1. Tell the user: "Clubs discovery starting — spawning background research agent. You can keep working; I'll surface the diff when it's done. Check progress anytime with `/clubs-status`."
2. Spawn a background agent using the Agent tool with `run_in_background: true` and the full prompt below.
3. When the background agent returns, go to **Step 2**.

---

## Background agent prompt (pass this verbatim)

You are running the Houston Running Clubs discovery pipeline for the Run Houston website.

Your job:
1. Research Houston-area running clubs using web search
2. Log your progress to `logs/clubs-discovery.log`
3. Produce a proposed update JSON at `~/Downloads/clubs-research-YYYY-MM.json` (use today's actual year and month)
4. Return a plain-text summary of what you found

**Repo:** `/Users/user/Projects/run-houston2`
**Live data:** `data/clubs.json` (read this first — it's the current list you're updating)

### Logging

Write timestamped progress lines to `logs/clubs-discovery.log` (append, don't overwrite) using this format:
```
[HH:MM:SS] message
```

Log at minimum:
- Start: "Starting clubs discovery"
- After reading live data: "Read N existing clubs"
- Before each major search: "Searching: <source name>"
- After each search: "Found N clubs so far (N new candidates)"
- When writing output: "Writing proposed JSON to <path>"
- On completion: "Done — N new clubs, N URL updates, N total proposed"

### Output schema

Write a JSON array to `~/Downloads/clubs-research-YYYY-MM.json`. Each object must have exactly these fields:

```json
{
  "id": "slug-lowercase-hyphenated",
  "club_name": "Full Official Club Name",
  "location": "Neighborhood, Houston  OR  SuburbName",
  "website_url": "https://..." or null,
  "description": "1-2 factual sentences.",
  "latitude": 29.7604 or null,
  "longitude": -95.3698 or null
}
```

Rules:
- `id`: lowercase, hyphenated, no punctuation. Do NOT append a year (clubs are persistent).
- `website_url`: prefer official domain over Meetup/RunSignUp/runclubnearme listings. Use `null` only if no web presence found. Never use runclubnearme.com as a URL.
- Lat/lng: must fall inside Houston bbox (lat 28.5–30.85, lng -96.55 to -94.0). Use `null` if location is unclear.
- Include ALL existing clubs (re-emit the full list, not just changes). The merge script handles the diff.

### Research instructions

**Step 1 — Read the live file**
Read `data/clubs.json`. Note all existing club ids, names, and current URLs (especially any that are `null` or point to runclubnearme.com — these are priority verification targets).

**Step 2 — Required searches** (log each one before running)
1. `harra.org` — Houston Area Road Runners Association member club list
2. `ffprunningclubs.org` — FFP Running Clubs Houston affiliate list
3. `runsignup.com` Houston clubs/organizations
4. `meetup.com` Houston running groups
5. "Houston running club 2024 2025" general search
6. "Sugar Land running club"
7. "The Woodlands running club"
8. "Katy running club"
9. "Pearland running club"
10. "Galveston running club"
11. "League City running club" + "Friendswood running club"
12. "Houston trail running club"
13. "Houston women running club" + "Houston Black running club"
14. "Houston beer run club"

**Step 3 — Verify existing clubs with null or stale URLs**
For any existing club where `website_url` is null or points to runclubnearme.com, do a targeted search to find their real URL.

**Step 4 — Compile output**
- Re-emit ALL existing clubs (with any URL or description corrections)
- Add any new clubs found
- For lat/lng: if you know the club's meeting venue (park, brewery, store), geocode it. Otherwise null.

### Coverage check
A complete Houston sweep finds 35–55 clubs. If your output has fewer than 35, search more before writing the file.

---

## Step 2: When the background agent returns

Read the summary the background agent returned. Then:

1. Run the dry-run merge to show the diff:
   ```
   python3 scripts/merge-clubs.py ~/Downloads/clubs-research-YYYY-MM.json
   ```
   (Replace YYYY-MM with the actual filename from the agent's summary.)

2. Present the diff to the user: new clubs, URL updates, possible removals.

3. Ask: "Apply these changes? (yes / yes but skip removals / no)"

4. On confirmation:
   - Run: `python3 scripts/merge-clubs.py ~/Downloads/clubs-research-YYYY-MM.json --apply`
   - Validator runs automatically inside merge-clubs.py
   - If validator passes, commit and push:
     ```
     git add data/clubs.json
     git commit -m "Clubs: discovery refresh YYYY-MM"
     git push origin master
     ```

5. Report: "Done — clubs.json updated and pushed. Live at runhouston.app."
