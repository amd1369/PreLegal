# PreLegal Backend

FastAPI service that forms the V1 foundation: a small API plus a temporary
SQLite database. Product features remain client-side for now (see PL-4); this
layer exists so future, backend-driven work has a place to live.

## Stack

- **FastAPI** — web framework
- **SQLAlchemy 2.0** — ORM
- **SQLite** — temporary database (`backend/prelegal.db`, gitignored). Swap
  `DATABASE_URL` to move to Postgres later.

## Layout

```
backend/
  app/
    main.py          # App, CORS, router mounts, DB init on startup
    config.py        # Settings (DB URL, template paths, CORS origins)
    database.py      # Engine, session factory, Base, get_db dependency
    models.py        # ORM models (Document)
    schemas.py       # Pydantic response models
    routers/
      health.py      # GET /api/health
      templates.py   # GET /api/templates, GET /api/templates/{filename}
  requirements.txt
  .env.example
```

## Endpoints

| Method | Path                       | Description                                  |
| ------ | -------------------------- | -------------------------------------------- |
| GET    | `/api/health`              | Liveness + database connectivity check       |
| GET    | `/api/templates`           | Common Paper template catalog                |
| GET    | `/api/templates/{file}`    | Raw markdown for a single template           |
| GET    | `/docs`                    | Interactive OpenAPI docs                      |

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
