# PreLegal Backend

FastAPI service for PreLegal: a small API plus a temporary SQLite database, and
the AI chat that drives the Mutual NDA assistant (PL-5).

## Stack

- **FastAPI** — web framework
- **SQLAlchemy 2.0** — ORM
- **SQLite** — temporary database (`backend/prelegal.db`, gitignored). Swap
  `DATABASE_URL` to move to Postgres later.
- **Anthropic SDK** — Claude (`claude-opus-4-8`) powers the `/api/chat` NDA
  assistant. Requires `ANTHROPIC_API_KEY`.

## Layout

```
backend/
  app/
    main.py          # App, CORS, router mounts, DB init on startup
    config.py        # Settings (DB URL, template paths, CORS origins)
    database.py      # Engine, session factory, Base, get_db dependency
    models.py        # ORM models (Document)
    schemas.py       # Pydantic models (responses + NdaData / chat)
    chat.py          # Claude-backed NDA conversation (update_nda tool loop)
    routers/
      health.py      # GET /api/health
      templates.py   # GET /api/templates, GET /api/templates/{filename}
      chat.py        # POST /api/chat
  requirements.txt
  .env.example
```

## Endpoints

| Method | Path                       | Description                                  |
| ------ | -------------------------- | -------------------------------------------- |
| GET    | `/api/health`              | Liveness + database connectivity check       |
| GET    | `/api/templates`           | Common Paper template catalog                |
| GET    | `/api/templates/{file}`    | Raw markdown for a single template           |
| POST   | `/api/chat`                | Advance the NDA conversation one turn (Claude) |
| GET    | `/docs`                    | Interactive OpenAPI docs                      |

`POST /api/chat` takes the conversation so far plus the current document and
returns `{ reply, data }` — the assistant's message and the updated NDA fields.
It returns 503 if `ANTHROPIC_API_KEY` is not set.

## Running

From the repo root, `scripts/start.sh` boots the backend and frontend together.
To run the backend on its own:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Configuration can be overridden with environment variables or a `backend/.env`
file (see `.env.example`).
