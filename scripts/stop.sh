#!/usr/bin/env bash
#
# Stop the PreLegal stack started by start.sh. Reads the recorded PIDs and
# terminates each process tree (dev servers spawn children), then removes the
# PID files.
#
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$REPO_ROOT/scripts/.run"

# Recursively terminate a process and all of its descendants. macOS has no
# setsid, so we walk the tree with pgrep instead of killing a process group.
kill_tree() {
  local pid="$1"
  local child
  for child in $(pgrep -P "$pid" 2>/dev/null); do
    kill_tree "$child"
  done
  kill "$pid" 2>/dev/null || true
}

stop_service() {
  # stop_service <name> <pidfile>
  local name="$1" pidfile="$2"
  if [ ! -f "$pidfile" ]; then
    echo "$name: not running (no PID file)."
    return
  fi

  local pid
  pid="$(cat "$pidfile")"
  if kill -0 "$pid" 2>/dev/null; then
    echo "Stopping $name (PID $pid)..."
    kill_tree "$pid"
    # Give it a moment, then force-kill anything still alive.
    for _ in 1 2 3 4 5; do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.5
    done
    kill -9 "$pid" 2>/dev/null || true
  else
    echo "$name: process $pid not running."
  fi
  rm -f "$pidfile"
}

stop_service "backend" "$RUN_DIR/backend.pid"
stop_service "frontend" "$RUN_DIR/frontend.pid"

echo "Done."
