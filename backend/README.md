# PreLegal Backend

FastAPI service for PreLegal: authentication, the AI drafting chat, the document
catalog, and per-user saved drafts, backed by a temporary SQLite database that is
reset on startup (PL-5 NDA → PL-6 all types → PL-7 multi-user).

## Stack

- **FastAPI** — web framework
- **SQLAlchemy 2.0** — ORM
- **SQLite** — temporary database (`backend/prelegal.db`, gitignored), dropped
  and recreated on startup. Swap `DATABASE_URL` to move to Postgres later.
- **bcrypt + PyJWT** — password hashing and stateless JWT sessions (PL-7).
- **OpenAI SDK → OpenRouter** — an LLM via OpenRouter's OpenAI-compatible API
  powers the `/api/chat` drafting assistant. Model is `CHAT_MODEL` (default
  `openai/gpt-oss-120b:free`). Requires `OPENROUTER_API_KEY`.

## Layout

```
backend/
  app/
    main.py          # App, CORS, router mounts, DB init on startup
    config.py        # Settings (DB URL, JWT, CORS, OpenRouter)
    database.py      # Engine, session factory, Base, get_db, init_db (reset on startup)
    models.py        # ORM models (User, Document)
    schemas.py       # Pydantic models (auth, drafts, DocumentData / chat)
    auth.py          # Password hashing, JWTs, get_current_user dependency (PL-7)
    documents.py     # Parse Common Paper templates into DocumentDefs (PL-6)
    chat.py          # OpenRouter-backed drafting conversation (update_document tool loop)
    routers/
      health.py      # GET /api/health
      auth.py        # POST /api/auth/signup|login, GET /api/auth/me
      templates.py   # GET /api/templates, GET /api/templates/{filename}
      documents.py   # GET /api/documents, GET /api/documents/{id}
      drafts.py      # CRUD /api/drafts (per-user saved documents)
      chat.py        # POST /api/chat
  requirements.txt
  .env.example
```

## Endpoints

| Method | Path                       | Description                                  |
| ------ | -------------------------- | -------------------------------------------- |
| GET    | `/api/health`              | Liveness + database connectivity check       |
| POST   | `/api/auth/signup`         | Register (email + password) → JWT + user     |
| POST   | `/api/auth/login`          | Sign in → JWT + user                          |
| GET    | `/api/auth/me`             | The authenticated user (Bearer token)        |
| GET    | `/api/templates`           | Raw Common Paper template catalog            |
| GET    | `/api/templates/{file}`    | Raw markdown for a single template           |
| GET    | `/api/documents`           | Selectable agreement types                    |
| GET    | `/api/documents/{id}`      | Parsed document definition (fields, sections) |
| GET/POST | `/api/drafts`            | List / create the user's saved drafts        |
| GET/PUT/DELETE | `/api/drafts/{id}` | Read / update / delete one saved draft       |
| POST   | `/api/chat`                | Advance the drafting conversation one turn (OpenRouter) |
| GET    | `/docs`                    | Interactive OpenAPI docs                      |

Auth: `/api/auth/*` issue and consume a stateless JWT (HS256, signed with
`JWT_SECRET`). All `/api/drafts` routes require an `Authorization: Bearer <token>`
header and are scoped to the authenticated user.

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
