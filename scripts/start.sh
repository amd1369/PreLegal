#!/usr/bin/env bash
#
# Start the PreLegal stack (FastAPI backend + Next.js frontend) for local dev.
# Bootstraps the Python venv and frontend deps on first run, launches both
# servers in the background, and records their PIDs so stop.sh can tear them
# down. Logs are written to scripts/.run/.
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$REPO_ROOT/scripts/.run"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

mkdir -p "$RUN_DIR"

is_running() {
  # is_running <pidfile>
  [ -f "$1" ] && kill -0 "$(cat "$1")" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Backend
# ---------------------------------------------------------------------------
if is_running "$RUN_DIR/backend.pid"; then
  echo "Backend already running (PID $(cat "$RUN_DIR/backend.pid"))."
else
  echo "Setting up backend..."
  if [ ! -d "$BACKEND_DIR/.venv" ]; then
    python3 -m venv "$BACKEND_DIR/.venv"
  fi
  # shellcheck disable=SC1091
  source "$BACKEND_DIR/.venv/bin/activate"
  pip install --quiet --upgrade pip
  pip install --quiet -r "$BACKEND_DIR/requirements.txt"

  echo "Starting backend on http://localhost:$BACKEND_PORT ..."
  ( cd "$BACKEND_DIR" && exec uvicorn app.main:app \
      --host 0.0.0.0 --port "$BACKEND_PORT" --reload ) \
      >"$RUN_DIR/backend.log" 2>&1 &
  echo $! >"$RUN_DIR/backend.pid"
  deactivate
fi

# ---------------------------------------------------------------------------
# Frontend
# ---------------------------------------------------------------------------
if is_running "$RUN_DIR/frontend.pid"; then
  echo "Frontend already running (PID $(cat "$RUN_DIR/frontend.pid"))."
else
  echo "Setting up frontend..."
  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    ( cd "$FRONTEND_DIR" && npm install )
  fi

  echo "Starting frontend on http://localhost:$FRONTEND_PORT ..."
  ( cd "$FRONTEND_DIR" && exec npm run dev -- --port "$FRONTEND_PORT" ) \
      >"$RUN_DIR/frontend.log" 2>&1 &
  echo $! >"$RUN_DIR/frontend.pid"
fi

echo ""
echo "PreLegal is starting up:"
echo "  Frontend → http://localhost:$FRONTEND_PORT"
echo "  Backend  → http://localhost:$BACKEND_PORT (docs at /docs)"
echo "  Logs     → $RUN_DIR/{backend,frontend}.log"
echo ""
echo "Run scripts/stop.sh to stop both servers."
