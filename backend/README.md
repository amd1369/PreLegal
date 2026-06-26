# PreLegal Backend

FastAPI service for PreLegal: a small API plus a temporary SQLite database, and
the AI chat that drafts any Common Paper agreement (PL-5 NDA → PL-6 all types).

## Stack

- **FastAPI** — web framework
- **SQLAlchemy 2.0** — ORM
- **SQLite** — temporary database (`backend/prelegal.db`, gitignored). Swap
  `DATABASE_URL` to move to Postgres later.
- **OpenAI SDK → OpenRouter** — an LLM via OpenRouter's OpenAI-compatible API
  powers the `/api/chat` drafting assistant. Model is `CHAT_MODEL` (default
  `openai/gpt-oss-120b:free`). Requires `OPENROUTER_API_KEY`.

## Layout

```
backend/
  app/
    main.py          # App, CORS, router mounts, DB init on startup
    config.py        # Settings (DB URL, template paths, CORS origins)
    database.py      # Engine, session factory, Base, get_db dependency
    models.py        # ORM models (Document)
    schemas.py       # Pydantic models (responses + DocumentData / chat)
    documents.py     # Parse Common Paper templates into DocumentDefs (PL-6)
    chat.py          # OpenRouter-backed drafting conversation (update_document tool loop)
    routers/
      health.py      # GET /api/health
      templates.py   # GET /api/templates, GET /api/templates/{filename}
      documents.py   # GET /api/documents, GET /api/documents/{id}
      chat.py        # POST /api/chat
  requirements.txt
  .env.example
```

## Endpoints

| Method | Path                       | Description                                  |
| ------ | -------------------------- | -------------------------------------------- |
| GET    | `/api/health`              | Liveness + database connectivity check       |
| GET    | `/api/templates`           | Raw Common Paper template catalog            |
| GET    | `/api/templates/{file}`    | Raw markdown for a single template           |
| GET    | `/api/documents`           | Selectable agreement types                    |
| GET    | `/api/documents/{id}`      | Parsed document definition (fields, sections) |
| POST   | `/api/chat`                | Advance the drafting conversation one turn (OpenRouter) |
| GET    | `/docs`                    | Interactive OpenAPI docs                      |

`POST /api/chat` takes the conversation so far plus the current document and
returns `{ reply, data }` — the assistant's message and the updated document
(its type, cover-page fields, and parties). It returns 503 if
`OPENROUTER_API_KEY` is not set, or 502 if OpenRouter rejects the key.

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
