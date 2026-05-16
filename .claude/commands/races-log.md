---
description: Review races added during discovery runs by session. Use to interrogate new races and back out unwanted ones.
---

# /races-log — Review New Races from Discovery

Show races added during discovery runs, optionally filtered by session.

## Usage

- `/races-log` — list available sessions and show the most recent
- `/races-log session N` — show all races added in session N

## What you do

### Step 1 — Find available session files

```
ls -t logs/races-added-session-*.jsonl 2>/dev/null
```

If none exist: "No race discovery sessions have been logged yet. Run `/races-discovery START_DATE NUM_WEEKS` first."

### Step 2 — Determine which session to show

- If the user specified "session N", read `logs/races-added-session-N.jsonl`
- Otherwise read the most recently modified session file (first result from `ls -t`)
- List all available sessions so the user knows what else they can view

### Step 3 — Parse and display

Read the JSONL file (one JSON object per line). Group by week and display:

```
Session N
  Week 2026-06-01 to 2026-06-07  (12 races)
    2026-06-06  Memorial Park 5K           5K · road · Houston      [runsignup]
    2026-06-07  Brazos Bend Trail Run       10K, 25K · trail · Needville  [web]
    ...
  Week 2026-06-08 to 2026-06-14  (8 races)
    ...

Total: N races added across N weeks
```

### Step 4 — Offer backout

After displaying, say:
"To remove any of these races, tell me which ones (by name or ID) and I'll delete them from data/races-upcoming.json and commit."

## Backing out races

When the user asks to remove specific races (by name, ID, or description like "all kids runs" or "the Galveston ones"):

1. Read `data/races-upcoming.json`
2. Identify matching entries
3. Confirm which specific records will be removed before deleting
4. Remove them from the JSON array
5. Run the validator: `python3 scripts/validate-data.py`
6. Commit:
   ```
   git add data/races-upcoming.json
   git commit -m "Races: remove [names] from session N discovery"
   ```
7. Report what was removed and the new total race count.
