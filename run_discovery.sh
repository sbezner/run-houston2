#!/bin/bash
# run_discovery.sh — automated race discovery pipeline in a tmux session
# Usage: ./run_discovery.sh START_DATE NUM_WEEKS
# Example: ./run_discovery.sh 2026-06-01 4
#
# Launches a detachable tmux session called "discovery".
#   - Detach: Ctrl+B, D
#   - Reattach: tmux attach -t discovery
#   - Status: tmux ls
#   - Stop: tmux kill-session -t discovery
#
# If Claude Code fails (rate limit, credits, crash), waits 4 hours
# and retries once. If it fails again, logs the error and moves to
# the next week. Progress is logged to .discovery-progress.log.

set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 START_DATE NUM_WEEKS"
    echo "Example: $0 2026-06-01 4"
    echo ""
    echo "  Detach:  Ctrl+B, D"
    echo "  Attach:  tmux attach -t discovery"
    echo "  Stop:    tmux kill-session -t discovery"
    exit 1
fi

START_DATE="$1"
NUM_WEEKS="$2"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SESSION_NAME="discovery"

if ! command -v tmux &> /dev/null; then
    echo "tmux not installed. Run: brew install tmux"
    exit 1
fi

tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

WORKER="$REPO_DIR/.discovery-worker.sh"
cat > "$WORKER" << 'WORKER_EOF'
#!/bin/bash

REPO_DIR="REPO_DIR_PLACEHOLDER"
INSTRUCTIONS_FILE="$REPO_DIR/prompts/run_discovery.md"
DOWNLOADS_DIR="$HOME/Downloads"
COOLDOWN=3600          # 60 min between weeks (Pro plan rate limit buffer)
RETRY_WAIT=14400       # 4 hours before retry
PROGRESS_LOG="$REPO_DIR/discovery-progress.log"
START_DATE="START_DATE_PLACEHOLDER"
NUM_WEEKS="NUM_WEEKS_PLACEHOLDER"

cd "$REPO_DIR"
caffeinate -i -w $$ &

LOG_FILE="$REPO_DIR/discovery-run.log"

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
    echo "$msg"
    echo "$msg" >> "$LOG_FILE"
}

log "================================================"
log "Run Houston — Race Discovery"
log "Starting: $START_DATE for $NUM_WEEKS weeks"
log "Log file: $LOG_FILE"
log "Detach: Ctrl+B, D | Reattach: tmux attach -t discovery"
log "Stop: tmux kill-session -t discovery"
log "================================================"

CURRENT_EPOCH=$(date -j -f "%Y-%m-%d" "$START_DATE" "+%s")
END_EPOCH=$((CURRENT_EPOCH + (NUM_WEEKS * 604800)))

run_claude() {
    local WEEK_START="$1"
    local WEEK_END="$2"
    local PROMPT="DATE WINDOW: $WEEK_START to $WEEK_END

$(cat "$INSTRUCTIONS_FILE")"
    claude -p "$PROMPT" --permission-mode auto
}

WEEK_NUM=0
FAILED_WEEKS=""
while [ "$CURRENT_EPOCH" -le "$END_EPOCH" ]; do
    WEEK_NUM=$((WEEK_NUM + 1))
    WEEK_START=$(date -r "$CURRENT_EPOCH" "+%Y-%m-%d")
    WEEK_END_EPOCH=$((CURRENT_EPOCH + 604799))
    WEEK_END=$(date -r "$WEEK_END_EPOCH" "+%Y-%m-%d")
    RSU_FILE="$DOWNLOADS_DIR/rsu-${WEEK_START}-to-${WEEK_END}.json"
    CLAUDE_FILE="$DOWNLOADS_DIR/races-${WEEK_START}-to-${WEEK_END}.json"

    log ""
    log "================================================"
    log "Week $WEEK_NUM: $WEEK_START to $WEEK_END"
    log "================================================"

    # --- Step 1: RunSignUp API ---
    log "Step 1: Fetching from RunSignUp API..."
    RSU_OUT=$(python3 "$REPO_DIR/scripts/fetch-runsignup-window.py" "$WEEK_START" "$WEEK_END" "$RSU_FILE" 2>&1) || RSU_OUT="RunSignUp API failed"
    log "  $RSU_OUT"

    # --- Step 2: Merge RunSignUp races ---
    if [ -f "$RSU_FILE" ]; then
        log "Step 2: Merging RunSignUp races..."
        RSU_MERGE=$(python3 "$REPO_DIR/scripts/merge-races.py" "$RSU_FILE" --apply 2>&1 | grep -E "Adds:|Real updates:|Wrote" || echo "  No changes")
        log "  $RSU_MERGE"
    fi

    # --- Step 3: Claude Code with retry ---
    log "Step 3: Claude Code searching non-RunSignUp sources..."
    if run_claude "$WEEK_START" "$WEEK_END"; then
        log "  Claude Code succeeded."
    else
        log "  Claude Code FAILED. Waiting 4 hours before retry..."
        sleep $RETRY_WAIT

        log "  Retrying Claude Code..."
        if run_claude "$WEEK_START" "$WEEK_END"; then
            log "  Retry succeeded."
        else
            log "  Retry FAILED. Skipping week $WEEK_START."
            FAILED_WEEKS="$FAILED_WEEKS $WEEK_START"
            echo "$(date '+%Y-%m-%d %H:%M:%S') FAILED: $WEEK_START to $WEEK_END" >> "$PROGRESS_LOG"
        fi
    fi

    # --- Step 4: Merge Claude's findings ---
    if [ -f "$CLAUDE_FILE" ]; then
        log "Step 4: Merging Claude's findings..."
        CLAUDE_MERGE=$(python3 "$REPO_DIR/scripts/merge-races.py" "$CLAUDE_FILE" --apply 2>&1 | grep -E "Adds:|Real updates:|Wrote" || echo "  No changes")
        log "  $CLAUDE_MERGE"
    else
        log "Step 4: No Claude output file found for this week."
    fi

    # --- Step 5: Affiliate tokens ---
    log "Step 5: Adding affiliate tokens..."
    ENRICHED=$(python3 "$REPO_DIR/scripts/enrich-runsignup.py" --step1 --apply 2>&1 | grep "URL(s) to update" || echo "0 URLs enriched")
    log "  $ENRICHED"

    # --- Summary for this week ---
    TOTAL=$(python3 -c "import json; print(len(json.load(open('data/races-upcoming.json'))))")
    log ""
    log "WEEK $WEEK_NUM COMPLETE: $WEEK_START to $WEEK_END | Total races: $TOTAL"
    echo "$(date '+%Y-%m-%d %H:%M:%S') OK: $WEEK_START to $WEEK_END (total: $TOTAL)" >> "$PROGRESS_LOG"

    CURRENT_EPOCH=$((CURRENT_EPOCH + 604800))

    if [ "$CURRENT_EPOCH" -le "$END_EPOCH" ]; then
        log "Resting for 20 mins before next week..."
        sleep $COOLDOWN
    fi
done

log ""
log "================================================"
log "Discovery complete! $WEEK_NUM weeks processed."
FINAL_TOTAL=$(python3 -c "import json; print(len(json.load(open('data/races-upcoming.json'))))")
log "Final race count: $FINAL_TOTAL"
if [ -n "$FAILED_WEEKS" ]; then
    log ""
    log "FAILED WEEKS:$FAILED_WEEKS"
    log "Re-run these manually or retry the script for those dates."
fi
log "================================================"
log "Log saved to: $LOG_FILE"
log ""
log "Next steps:"
log "  git diff data/races-upcoming.json"
log "  git add -A && git commit"
WORKER_EOF

# Replace placeholders
sed -i '' "s|REPO_DIR_PLACEHOLDER|$REPO_DIR|g" "$WORKER"
sed -i '' "s|START_DATE_PLACEHOLDER|$START_DATE|g" "$WORKER"
sed -i '' "s|NUM_WEEKS_PLACEHOLDER|$NUM_WEEKS|g" "$WORKER"

chmod +x "$WORKER"

tmux new-session -d -s "$SESSION_NAME" "bash $WORKER"

echo "================================================"
echo "Discovery session launched in tmux!"
echo ""
echo "  Attach:  tmux attach -t $SESSION_NAME"
echo "  Detach:  Ctrl+B, D"
echo "  Status:  tmux ls"
echo "  Stop:    tmux kill-session -t $SESSION_NAME"
echo "================================================"

tmux attach -t "$SESSION_NAME"
