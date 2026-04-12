#!/bin/bash
# run_recaps.sh — automated race recap pipeline in a tmux session
# Usage: ./run_recaps.sh START_DATE NUM_WEEKS
# Example: ./run_recaps.sh 2026-04-11 8
#
# Launches a detachable tmux session called "recaps".
#   - Detach: Ctrl+B, D
#   - Reattach: tmux attach -t recaps
#   - Status: tmux ls
#   - Stop: tmux kill-session -t recaps
#
# If Claude Code fails, waits 4 hours and retries once.
# If retry fails, logs the error and moves to the next week.
# Progress is logged to .recaps-progress.log.

set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 START_DATE NUM_WEEKS"
    echo "Example: $0 2026-04-11 8"
    echo ""
    echo "  Detach:  Ctrl+B, D"
    echo "  Attach:  tmux attach -t recaps"
    echo "  Stop:    tmux kill-session -t recaps"
    exit 1
fi

START_DATE="$1"
NUM_WEEKS="$2"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SESSION_NAME="recaps"

if ! command -v tmux &> /dev/null; then
    echo "tmux not installed. Run: brew install tmux"
    exit 1
fi

tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

WORKER="$REPO_DIR/.recaps-worker.sh"
cat > "$WORKER" << 'WORKER_EOF'
#!/bin/bash

REPO_DIR="REPO_DIR_PLACEHOLDER"
INSTRUCTIONS_FILE="$REPO_DIR/prompts/run_recaps.md"
DATABASE_FILE="data/race_reports.json"
COOLDOWN=1200          # 20 min between weeks
RETRY_WAIT=14400       # 4 hours before retry
PROGRESS_LOG="$REPO_DIR/.recaps-progress.log"
START_DATE="START_DATE_PLACEHOLDER"
NUM_WEEKS="NUM_WEEKS_PLACEHOLDER"

cd "$REPO_DIR"
caffeinate -i -w $$ &

echo "================================================"
echo "Run Houston — Race Recaps"
echo "Starting: $START_DATE for $NUM_WEEKS weeks"
echo "Detach: Ctrl+B, D | Reattach: tmux attach -t recaps"
echo "Stop: tmux kill-session -t recaps"
echo "================================================"

CURRENT_EPOCH=$(date -j -f "%Y-%m-%d" "$START_DATE" "+%s")
END_EPOCH=$((CURRENT_EPOCH + (NUM_WEEKS * 604800)))

run_claude() {
    local WEEK_START="$1"
    local WEEK_END="$2"
    local PROMPT="DATE WINDOW: $WEEK_START to $WEEK_END. Refer to @$DATABASE_FILE to avoid duplicates.

$(cat "$INSTRUCTIONS_FILE")"
    claude -p "$PROMPT" --yes
}

WEEK_NUM=0
FAILED_WEEKS=""
while [ "$CURRENT_EPOCH" -le "$END_EPOCH" ]; do
    WEEK_NUM=$((WEEK_NUM + 1))
    WEEK_START=$(date -r "$CURRENT_EPOCH" "+%Y-%m-%d")
    WEEK_END_EPOCH=$((CURRENT_EPOCH + 604799))
    WEEK_END=$(date -r "$WEEK_END_EPOCH" "+%Y-%m-%d")

    echo ""
    echo "================================================"
    echo "Week $WEEK_NUM: $WEEK_START to $WEEK_END"
    echo "$(date '+%Y-%m-%d %H:%M:%S')"
    echo "================================================"

    if run_claude "$WEEK_START" "$WEEK_END"; then
        echo "  Claude Code succeeded."
    else
        echo ""
        echo "  Claude Code FAILED. Waiting 4 hours before retry..."
        echo "  $(date '+%Y-%m-%d %H:%M:%S') — will retry at $(date -r $(($(date +%s) + RETRY_WAIT)) '+%H:%M:%S')"
        sleep $RETRY_WAIT

        echo "  Retrying Claude Code..."
        if run_claude "$WEEK_START" "$WEEK_END"; then
            echo "  Retry succeeded."
        else
            echo "  Retry FAILED. Skipping week $WEEK_START and moving on."
            FAILED_WEEKS="$FAILED_WEEKS $WEEK_START"
            echo "$(date '+%Y-%m-%d %H:%M:%S') FAILED: $WEEK_START to $WEEK_END" >> "$PROGRESS_LOG"
        fi
    fi

    echo ""
    echo "Week $WEEK_NUM ($WEEK_START) done at $(date '+%H:%M:%S')."
    echo "$(date '+%Y-%m-%d %H:%M:%S') OK: $WEEK_START to $WEEK_END" >> "$PROGRESS_LOG"

    CURRENT_EPOCH=$((CURRENT_EPOCH + 604800))

    if [ "$CURRENT_EPOCH" -le "$END_EPOCH" ]; then
        echo "Resting for 20 mins..."
        sleep $COOLDOWN
    fi
done

echo ""
echo "================================================"
echo "Recaps complete! $WEEK_NUM weeks processed."
echo "Finished at $(date '+%Y-%m-%d %H:%M:%S')"
if [ -n "$FAILED_WEEKS" ]; then
    echo ""
    echo "FAILED WEEKS (Claude Code errors):$FAILED_WEEKS"
    echo "Re-run these manually or retry the script for those dates."
fi
echo "================================================"
echo ""
echo "Next steps:"
echo "  Check ~/Downloads/ for recaps-*.json files"
echo "  Merge into data/race_reports.json when ready"
WORKER_EOF

sed -i '' "s|REPO_DIR_PLACEHOLDER|$REPO_DIR|g" "$WORKER"
sed -i '' "s|START_DATE_PLACEHOLDER|$START_DATE|g" "$WORKER"
sed -i '' "s|NUM_WEEKS_PLACEHOLDER|$NUM_WEEKS|g" "$WORKER"

chmod +x "$WORKER"

tmux new-session -d -s "$SESSION_NAME" "bash $WORKER"

echo "================================================"
echo "Recaps session launched in tmux!"
echo ""
echo "  Attach:  tmux attach -t $SESSION_NAME"
echo "  Detach:  Ctrl+B, D"
echo "  Status:  tmux ls"
echo "  Stop:    tmux kill-session -t $SESSION_NAME"
echo "================================================"

tmux attach -t "$SESSION_NAME"
