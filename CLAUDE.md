# CLAUDE.md

Guidance for working in this repository.

## What PreLegal is

A platform for drafting common legal agreements. Status: in progress, V1
foundation in place (PL-4). Product features are built on top of that
foundation; the only user-facing feature today is the Mutual NDA creator.

## Repository layout

```
frontend/    Next.js 16 + React 19 app (Mutual NDA creator + fake login gate)
backend/     FastAPI service + temporary SQLite database (SQLAlchemy 2.0)
templates/   Common Paper legal agreement templates (markdown)
catalog.json Index of the templates
scripts/     start.sh / stop.sh to run the full stack locally
```

## Running the stack

- `./scripts/start.sh` — bootstraps the Python venv + frontend deps on first
  run, launches uvicorn (backend, :8000) and `next dev` (frontend, :3000) in the
  background, writes logs/PIDs to `scripts/.run/` (gitignored).
- `./scripts/stop.sh` — stops both servers (recursive process-tree kill).
- Override ports with `BACKEND_PORT` / `FRONTEND_PORT`.

## Backend

- FastAPI app in `backend/app/`; entrypoint `app.main:app`. DB tables are
  created on startup (`init_db`).
- Endpoints: `GET /api/health` (verifies DB connectivity), `GET /api/templates`
  and `GET /api/templates/{filename}` (Common Paper catalog),
  `POST /api/chat` (the AI NDA assistant — see below), `/docs` for OpenAPI.
  Config in `app/config.py`, overridable via `backend/.env`.
- Temporary database is SQLite (`backend/prelegal.db`, gitignored). Swap
  `DATABASE_URL` to move to Postgres later. See `backend/README.md`.
- **AI chat (PL-5):** `app/chat.py` calls Claude (`claude-opus-4-8`) via the
  `anthropic` SDK with an `update_nda` tool that fills the NDA fields. Needs
  `ANTHROPIC_API_KEY` in `backend/.env`; `/api/chat` returns 503 if it's unset.

## Frontend

- App Router under `frontend/src/app/`; shared code in `frontend/src/lib/`,
  components in `frontend/src/components/` (shadcn-style UI in
  `components/ui/`, built on `@base-ui/react`).
- **Auth is fake and frontend-only** (no backend, no real auth per PL-4):
  `/login` stores an entered name/email in `localStorage` (`src/lib/auth.ts`);
  `AuthGuard` gates the home page; `AccountMenu` provides sign-out.
- The Mutual NDA creator is now a **freeform AI chat** (`NdaChat`): the user
  describes the agreement, `NdaChat` POSTs the conversation + current `NdaData`
  to `POST /api/chat`, and lifts the returned `data` into state. The
  `NdaPreview` (live document) and PDF download remain fully client-side and
  unchanged — only the input method changed from a form to chat.
- See `frontend/AGENTS.md`: this is Next.js 16 with breaking changes — check
  `node_modules/next/dist/docs/` before writing framework code.

## Conventions

- Branch per ticket (e.g. `pl-4-...`), commits prefixed with the Jira key
  (`PL-4: ...`), merge to `main` via PR.
- Do not commit build artifacts: `.venv/`, `*.db`, `scripts/.run/`,
  `.next/`, `node_modules/`, `backend/.env` are gitignored.
- Note: the gitignore Python `lib/` rule is anchored as `/lib/` so it does not
  hide `frontend/src/lib/`.
