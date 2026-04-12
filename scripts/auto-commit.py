#!/usr/bin/env python3
"""
auto-commit.py — commit and push races-upcoming.json if it has changes.

Usage: python3 scripts/auto-commit.py

Designed to be called by run_discovery.sh after each week completes
so the live site stays up to date during unattended runs.
"""

import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DATA_FILE = "data/races-upcoming.json"


def run(cmd):
    result = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True)
    return result.returncode, result.stdout.strip(), result.stderr.strip()


def main():
    # Check if there are changes to commit
    rc, out, _ = run(["git", "diff", "--quiet", DATA_FILE])
    if rc == 0:
        print("No changes to commit.")
        return

    # Stage, commit, push
    run(["git", "add", DATA_FILE])

    rc, out, err = run([
        "git", "commit", "-m",
        "Auto-commit: discovery pipeline update\n\n"
        "Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
    ])
    if rc != 0:
        print(f"Commit failed: {err}")
        sys.exit(1)
    print(f"Committed: {out.splitlines()[0]}")

    rc, out, err = run(["git", "push", "origin", "master"])
    if rc != 0:
        print(f"Push failed: {err}")
        sys.exit(1)
    print("Pushed to origin/master.")


if __name__ == "__main__":
    main()
