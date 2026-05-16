---
description: Check the status of a running clubs discovery background agent by reading the progress log.
---

# /clubs-status — Check clubs discovery progress

Read `logs/clubs-discovery.log` and report the current state of the background discovery agent.

## What you do

1. Read `logs/clubs-discovery.log`.
2. If the file does not exist or is empty: "No clubs discovery has been run yet. Use `/clubs-discovery` to start one."
3. Otherwise, report:
   - When it started
   - The last few log lines (what it's doing right now)
   - Whether it has completed (look for a "Done —" line)
   - If complete: what it found (N new clubs, N URL updates) and what to do next (run `/clubs-discovery` again to apply — the background agent already finished, but the main session needs to present the diff)

Keep the response short — this is a status check, not a full report.
