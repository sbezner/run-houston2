---
description: Check the status of the running race discovery pipeline — which weeks are done, which failed, race count, and ETA.
---

# /races-status — Race Discovery Status

Check progress of the background race discovery pipeline.

## What you do

1. Run the status script:
   ```
   python3 scripts/discovery-status.py
   ```

2. Also show the current session ID:
   ```
   cat logs/races-discovery-session 2>/dev/null || echo "No sessions yet"
   ```

3. Print the output concisely. This is a status check, not a full report.

If neither log file exists yet, say: "No discovery session has been run yet. Use `/races-discovery START_DATE NUM_WEEKS` to start one."
