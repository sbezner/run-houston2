#!/bin/bash
# reports_discovery.sh — automated race report pipeline in a tmux session.
# Walks BACKWARD from START_DATE one week at a time, producing reports
# on races that already happened. Modeled on run_discovery.sh.
#
# Usage: ./scripts/reports_discovery.sh START_DATE NUM_WEEKS_BACK [--fresh]
# Example: ./scripts/reports_discovery.sh 2026-04-17 4
#   Processes 5 windows (today + 4 weeks back), each window is the
#   7 days ENDING on the iteration date:
#     iter 0: 2026-04-10 to 2026-04-17
#     iter 1: 2026-04-03 to 2026-04-10
#     iter 2: 2026-03-27 to 2026-04-03
#     iter 3: 2026-03-20 to 2026-03-27
#     iter 4: 2026-03-13 to 2026-03-20
#
# NUM_WEEKS_BACK accepts either form: "4" or "-4" (sign is stripped).
# Use --fresh to ignore previous progress and start over.
#
# Per week:
#   1. Invoke Claude Code with prompts/reports_discovery.md
#   2. Merge ~/Downloads/reports_discovery-{start}-to-{end}.json into
#      data/race_reports.json via scripts/merge-reports.py --apply
#   3. If data/race_reports.json changed, auto-commit + push to origin
#
# tmux session "reports_discovery" — same controls as run_discovery.sh:
#   Detach:  Ctrl+B, D
#   Attach:  tmux attach -t reports_discovery
#   Status:  tmux ls
#   Stop:    tmux kill-session -t reports_discovery
#   Pause:   touch pause-reports_discovery
#   Resume:  rm pause-reports_discovery
#
# Logs:
#   logs/reports_discovery-run.log       Full timestamped output
#   logs/reports_discovery-progress.log  One line per week (OK/FAILED)

set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 START_DATE NUM_WEEKS_BACK [--fresh]"
    echo ""
    echo "Examples:"
    echo "  $0 2026-04-17 4           Resume (skips completed weeks)"
    echo "  $0 2026-04-17 -4          Same — sign is stripped"
    echo "  $0 2026-04-17 4 --fresh   Start over (clears logs first)"
    echo ""
    echo "Controls:"
    echo "  Detach:  Ctrl+B, D"
    echo "  Attach:  tmux attach -t reports_discovery"
    echo "  Stop:    tmux kill-session -t reports_discovery"
    echo "  Pause:   touch pause-reports_discovery"
    echo "  Resume:  rm pause-reports_discovery"
    echo ""
    echo "Logs:"
    echo "  logs/reports_discovery-run.log         Full timestamped output"
    echo "  logs/reports_discovery-progress.log    One line per week (OK/FAILED)"
    exit 1
fi

START_DATE="$1"
# Strip leading dash so "4" and "-4" both work.
NUM_WEEKS="${2#-}"
FRESH="$3"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SESSION_NAME="reports_discovery"

if ! [[ "$NUM_WEEKS" =~ ^[0-9]+$ ]]; then
    echo "NUM_WEEKS_BACK must be an integer (got: $2)"
    exit 1
fi

if [ "$FRESH" = "--fresh" ]; then
    rm -f "$REPO_DIR/logs/reports_discovery-progress.log"
    rm -f "$REPO_DIR/logs/reports_discovery-run.log"
    echo "Fresh start — cleared progress and run logs."
fi

mkdir -p "$REPO_DIR/logs"

if ! command -v tmux &> /dev/null; then
    echo "tmux not installed. Run: brew install tmux"
    exit 1
fi

tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

WORKER="$REPO_DIR/.reports_discovery-worker.sh"
cat > "$WORKER" << 'WORKER_EOF'
#!/bin/bash

REPO_DIR="REPO_DIR_PLACEHOLDER"
INSTRUCTIONS_FILE="$REPO_DIR/prompts/reports_discovery.md"
DOWNLOADS_DIR="$HOME/Downloads"
COOLDOWN=7200          # 2 hours between weeks
RETRY_WAIT=14400       # 4 hours before retry
LOW_YIELD_FLOOR=2      # matches the 7-day floor in prompts/reports_discovery.md
PROGRESS_LOG="$REPO_DIR/logs/reports_discovery-progress.log"
LOG_FILE="$REPO_DIR/logs/reports_discovery-run.log"
DATA_FILE="data/race_reports.json"
START_DATE="START_DATE_PLACEHOLDER"
NUM_WEEKS="NUM_WEEKS_PLACEHOLDER"

cd "$REPO_DIR"
caffeinate -i -w $$ &

log() {
    local msg="[$(date '+%Y-%m-%d %I:%M:%S %p')] $*"
    echo "$msg"
    echo "$msg" >> "$LOG_FILE"
}

# Iteration date moves backward each week. Iteration i covers the 7 days
# ENDING on iter_date (i.e. WEEK_START = iter_date - 7, WEEK_END = iter_date).
ITER_EPOCH=$(date -j -f "%Y-%m-%d" "$START_DATE" "+%s")
TOTAL_WINDOWS=$((NUM_WEEKS + 1))

log "================================================"
log "Run Houston — Reports Discovery"
log "Starting: $START_DATE walking back $NUM_WEEKS weeks ($TOTAL_WINDOWS windows total)"
log "Log file: $LOG_FILE"
log "Detach: Ctrl+B, D | Reattach: tmux attach -t reports_discovery"
log "Stop: tmux kill-session -t reports_discovery"
log "================================================"

run_claude() {
    local WEEK_START="$1"
    local WEEK_END="$2"
    local PROMPT="DATE WINDOW: $WEEK_START to $WEEK_END

$(cat "$INSTRUCTIONS_FILE")"
    claude -p "$PROMPT" --permission-mode auto
}

already_done() {
    local week_start="$1"
    local week_end="$2"
    if [ -f "$PROGRESS_LOG" ]; then
        grep -q "OK: $week_start to $week_end" "$PROGRESS_LOG"
        return $?
    fi
    return 1
}

auto_commit_push() {
    local WEEK_START="$1"
    local WEEK_END="$2"
    if git diff --quiet "$DATA_FILE"; then
        log "  No changes to $DATA_FILE — nothing to commit."
        return 0
    fi
    git add "$DATA_FILE"
    if git commit -m "Reports: $WEEK_START to $WEEK_END

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>" >> "$LOG_FILE" 2>&1; then
        log "  Committed report changes for $WEEK_START to $WEEK_END."
    else
        log "  Commit failed (see log)."
        return 1
    fi
    if git push origin master >> "$LOG_FILE" 2>&1; then
        log "  Pushed to origin/master."
    else
        log "  Push failed (see log) — commit is local."
        return 1
    fi
    return 0
}

PAUSE_FILE="$REPO_DIR/pause-reports_discovery"

WEEK_NUM=0
SKIPPED=0
FAILED_WEEKS=""
while [ "$WEEK_NUM" -lt "$TOTAL_WINDOWS" ]; do
    if [ -f "$PAUSE_FILE" ]; then
        log "PAUSED — found pause-reports_discovery file. Waiting..."
        log "  Remove it to resume: rm pause-reports_discovery"
        while [ -f "$PAUSE_FILE" ]; do
            sleep 30
        done
        log "RESUMED — pause-reports_discovery file removed. Continuing..."
    fi

    WEEK_NUM=$((WEEK_NUM + 1))
    WEEK_END=$(date -r "$ITER_EPOCH" "+%Y-%m-%d")
    WEEK_START_EPOCH=$((ITER_EPOCH - 604800))
    WEEK_START=$(date -r "$WEEK_START_EPOCH" "+%Y-%m-%d")

    if already_done "$WEEK_START" "$WEEK_END"; then
        log "Week $WEEK_NUM/$TOTAL_WINDOWS: $WEEK_START to $WEEK_END — already done, skipping."
        SKIPPED=$((SKIPPED + 1))
        ITER_EPOCH=$((ITER_EPOCH - 604800))
        continue
    fi

    REPORT_FILE="$DOWNLOADS_DIR/reports_discovery-${WEEK_START}-to-${WEEK_END}.json"

    log ""
    log "================================================"
    log "Week $WEEK_NUM/$TOTAL_WINDOWS: $WEEK_START to $WEEK_END"
    log "================================================"

    # --- Step 1: Claude Code (with one retry) ---
    CLAUDE_OK=true
    log "Step 1: Claude Code researching reports..."
    if run_claude "$WEEK_START" "$WEEK_END"; then
        log "  Claude Code succeeded."
    else
        log "  Claude Code FAILED. Waiting 4 hours before retry..."
        sleep $RETRY_WAIT

        log "  Retrying Claude Code..."
        if run_claude "$WEEK_START" "$WEEK_END"; then
            log "  Retry succeeded."
        else
            log "  Retry FAILED. Skipping week $WEEK_START to $WEEK_END."
            CLAUDE_OK=false
            FAILED_WEEKS="$FAILED_WEEKS $WEEK_START"
            echo "$(date '+%Y-%m-%d %I:%M:%S %p') FAILED: $WEEK_START to $WEEK_END" >> "$PROGRESS_LOG"
        fi
    fi

    # --- Step 2: Merge into race_reports.json ---
    REPORT_COUNT=0
    if [ -f "$REPORT_FILE" ]; then
        log "Step 2: Merging reports via merge-reports.py..."
        MERGE_OUT=$(python3 "$REPO_DIR/scripts/merge-reports.py" "$REPORT_FILE" --apply 2>&1 | grep -E "Adds:|Real updates:|Wrote|FAIL" || echo "  No changes")
        log "  $MERGE_OUT"
        REPORT_COUNT=$(python3 -c "import json; print(len(json.load(open('$REPORT_FILE'))))" 2>/dev/null || echo 0)
    else
        log "Step 2: No report output file at $REPORT_FILE — nothing to merge."
    fi

    # --- Step 2b: Low-yield warning ---
    # The prompt's 7-day floor is 2 reports. A week below the floor is
    # usually Claude giving up early, not a genuinely empty week.
    if [ "$REPORT_COUNT" -lt "$LOW_YIELD_FLOOR" ]; then
        WARN_MSG="WARN: $WEEK_START to $WEEK_END low yield (N=$REPORT_COUNT < floor=$LOW_YIELD_FLOOR)"
        log "  $WARN_MSG"
        echo "$(date '+%Y-%m-%d %I:%M:%S %p') $WARN_MSG" >> "$PROGRESS_LOG"
    fi

    # --- Step 3: Auto-commit + push ---
    log "Step 3: Auto-commit + push if changed..."
    auto_commit_push "$WEEK_START" "$WEEK_END"

    # --- Summary for this week ---
    TOTAL=$(python3 -c "import json; print(len(json.load(open('data/race_reports.json'))))")
    log ""
    if [ "$CLAUDE_OK" = true ]; then
        log "WEEK $WEEK_NUM COMPLETE: $WEEK_START to $WEEK_END | Total reports: $TOTAL"
        echo "$(date '+%Y-%m-%d %I:%M:%S %p') OK: $WEEK_START to $WEEK_END (total: $TOTAL)" >> "$PROGRESS_LOG"
    else
        log "WEEK $WEEK_NUM PARTIAL (Claude failed): $WEEK_START to $WEEK_END | Total reports: $TOTAL"
    fi

    # Step the iteration date back one week.
    ITER_EPOCH=$((ITER_EPOCH - 604800))

    if [ "$WEEK_NUM" -lt "$TOTAL_WINDOWS" ]; then
        log "Resting for 2 hours before next week..."
        sleep $COOLDOWN
    fi
done

log ""
log "================================================"
log "Reports discovery complete! $WEEK_NUM weeks total, $SKIPPED skipped (already done), $((WEEK_NUM - SKIPPED)) processed."
FINAL_TOTAL=$(python3 -c "import json; print(len(json.load(open('data/race_reports.json'))))")
log "Final report count: $FINAL_TOTAL"
if [ -n "$FAILED_WEEKS" ]; then
    log ""
    log "FAILED WEEKS:$FAILED_WEEKS"
    log "Re-run these manually or retry the script for those dates."
fi
log "================================================"
log "Log saved to: $LOG_FILE"
WORKER_EOF

# Replace placeholders
sed -i '' "s|REPO_DIR_PLACEHOLDER|$REPO_DIR|g" "$WORKER"
sed -i '' "s|START_DATE_PLACEHOLDER|$START_DATE|g" "$WORKER"
sed -i '' "s|NUM_WEEKS_PLACEHOLDER|$NUM_WEEKS|g" "$WORKER"

chmod +x "$WORKER"

tmux new-session -d -s "$SESSION_NAME" "bash $WORKER"

echo "================================================"
echo "Reports discovery session launched in tmux!"
echo ""
echo "  Attach:  tmux attach -t $SESSION_NAME"
echo "  Detach:  Ctrl+B, D"
echo "  Status:  tmux ls"
echo "  Stop:    tmux kill-session -t $SESSION_NAME"
echo "================================================"

tmux attach -t "$SESSION_NAME"
