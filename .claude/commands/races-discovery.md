---
description: Launch the Houston race discovery pipeline — fetches RunSignUp API races and searches non-RunSignUp sources week by week in a background tmux session.
---

# /races-discovery — Houston Race Discovery Pipeline

Launch or resume the race discovery pipeline in a background tmux session.

## Usage

`/races-discovery START_DATE NUM_WEEKS`
Example: `/races-discovery 2026-06-01 5`

If no arguments are provided, check `logs/discovery-progress.log` to suggest a reasonable resume point, then ask the user.

## What you do

1. Parse START_DATE and NUM_WEEKS from the command args. If missing, ask the user.

2. Check if a discovery session is already running:
   ```
   tmux ls 2>/dev/null | grep discovery
   ```
   If one is running, warn the user and ask if they want to kill it first before proceeding.

3. Launch the pipeline:
   ```
   bash scripts/run_discovery.sh START_DATE NUM_WEEKS
   ```
   This starts a detached tmux session named "discovery" and returns immediately. Your Claude Code session stays free.

4. Read the new session ID:
   ```
   cat logs/races-discovery-session
   ```

5. Tell the user:
   - "Session N started — running in the background."
   - The date range covered (list the weeks: Week 1: June 1–7, Week 2: June 8–14, etc.)
   - Estimated time (~2.25 hours per week including cooldown, so N weeks ≈ X hours total)
   - "You'll get a macOS notification when it's done."
   - Commands to check in: `/races-status` and `/races-log session N`
   - Optional: `tmux attach -t discovery` to watch live output
   - Optional: `touch pause-discovery` to pause between weeks, `tmux kill-session -t discovery` to stop
