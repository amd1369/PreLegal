# PreLegal

A platform for drafting common legal agreements.

## 🚧 Project Status: In Progress

This project is currently under active development and is **not yet complete**.
Work is ongoing, and the project is expected to be completed by **2026-07-02**.

## Architecture

PreLegal is a full-stack application. The V1 foundation is in place; product
features are being built on top of it.

```
PreLegal/
  frontend/    Next.js app (Mutual NDA creator + fake login gate)
  backend/     FastAPI service + SQLite database
  templates/   Common Paper legal agreement templates (markdown)
  catalog.json Index of available templates
  scripts/     start.sh / stop.sh to run the stack locally
```

- **Frontend** — Next.js 16 + React 19 + Tailwind. The Mutual NDA creator is a
  **freeform AI chat**: describe your agreement in plain language and the live
  preview fills in as you go, then download the PDF (rendered client-side). A
  **fake login screen** gates the app: there is no real authentication yet —
  enter a name to get in.
- **Backend** — FastAPI exposing a health check, the template catalog, and an
  **AI chat endpoint** (`POST /api/chat`, powered by an LLM via OpenRouter) that
  drives the NDA conversation, backed by a **temporary SQLite database** via
  SQLAlchemy. See [backend/README.md](backend/README.md).

## Getting started

Requirements: Node.js 18+, Python 3.10+.

The AI chat needs an OpenRouter API key. Copy `backend/.env.example` to
`backend/.env` and set `OPENROUTER_API_KEY` (get one at
https://openrouter.ai/keys). Without it, the app runs but `/api/chat`
returns a clear "not configured" error.

Start both servers (bootstraps the Python venv and frontend deps on first run):

```bash
./scripts/start.sh
```

- Frontend → http://localhost:3000
- Backend → http://localhost:8000 (interactive docs at `/docs`)

Stop both servers:

```bash
./scripts/stop.sh
```

Ports can be overridden, e.g. `BACKEND_PORT=8001 FRONTEND_PORT=3001 ./scripts/start.sh`.
Logs are written to `scripts/.run/`.

## Templates

The legal agreement templates under `templates/` come from
[Common Paper](https://github.com/CommonPaper) and are free to use under
CC BY 4.0. See `catalog.json` for the full list.
