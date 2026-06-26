# CLAUDE.md

Guidance for working in this repository.

## What PreLegal is

A platform for drafting common legal agreements. Status: in progress. The V1
foundation shipped (PL-4), the Mutual NDA creator became an AI chat backed by
OpenRouter (PL-5), that chat now drafts **every** Common Paper agreement in the
catalog (PL-6), and the app is now **multi-user** (PL-7): real email/password
accounts, each user's drafts saved and reopenable, a professional SaaS UI, and a
"draft, not legal advice" disclaimer throughout. The AI picks the document type
from the conversation, offers the closest supported type when asked for one we
don't have, and guides the user through filling it in.

## Repository layout

```
frontend/    Next.js 16 + React 19 app (agreement creator chat + fake login gate)
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

- FastAPI app in `backend/app/`; entrypoint `app.main:app`. The temporary DB is
  **dropped and recreated on startup** (`init_db`, `reset_db_on_startup`), so the
  schema always matches the code and data does not survive a restart (PL-7).
- Endpoints: `GET /api/health`, `POST /api/auth/signup|login` + `GET /api/auth/me`
  (PL-7), `GET /api/templates[/{filename}]` (raw catalog + markdown),
  `GET /api/documents[/{id}]` (parsed, renderable document definitions),
  `GET/POST /api/drafts` + `GET/PUT/DELETE /api/drafts/{id}` (per-user saved
  drafts, PL-7), `POST /api/chat` (the AI drafting assistant), `/docs` for
  OpenAPI. Config in `app/config.py`, overridable via `backend/.env`.
- Temporary database is SQLite (`backend/prelegal.db`, gitignored). Swap
  `DATABASE_URL` to move to Postgres later. See `backend/README.md`.
- **Auth (PL-7):** `app/auth.py` hashes passwords with **bcrypt** and issues
  stateless **JWTs** (PyJWT, HS256, signed with `JWT_SECRET`). `get_current_user`
  resolves the `Authorization: Bearer` token to a `User`; all `/api/drafts`
  routes require it and are scoped to that user. Models: `User` and `Document`
  (a saved draft holding the `DocumentData` JSON + chat transcript).
- **Document definitions (PL-6):** `app/documents.py` parses each Common Paper
  template into a `DocumentDef` — its `title`, cover-page `fields` (the
  `<span class="..._link">` key terms), `partyRoles`, and `sections` (the
  Standard Terms flattened into `{heading, body, indent}` blocks). This is what
  makes the renderer generic: any current or future template works with no
  per-document code. Served by the `documents` router.
- **AI chat (PL-5 → PL-6):** `app/chat.py` calls an LLM through **OpenRouter**
  (its OpenAI-compatible API, via the `openai` SDK) with a single generic
  `update_document` tool that sets the chosen `documentType` (enum of catalog
  ids), the cover-page `fields`, and the `parties`. The prompt carries the
  catalog so the AI selects a supported type or offers the closest match, then
  collects that document's key terms. Model is `CHAT_MODEL` (default
  `openai/gpt-oss-120b:free`). Needs `OPENROUTER_API_KEY` in `backend/.env`;
  `/api/chat` returns 503 if unset, 502 if the key is rejected.

## Frontend

- App Router under `frontend/src/app/`; shared code in `frontend/src/lib/`,
  components in `frontend/src/components/` (shadcn-style UI in
  `components/ui/`, built on `@base-ui/react`).
- **Auth is real (PL-7):** `/signup` and `/login` call the backend; the returned
  JWT + user are stored in `localStorage` (`src/lib/auth.ts`). `authFetch` adds
  the Bearer token and redirects to `/login` on a 401. `AuthGuard` gates the app
  pages; `AccountMenu` shows the user and signs out.
- The agreement creator (`/`) is a **freeform AI chat** (`DocumentChat`): the
  user describes the agreement, `DocumentChat` POSTs the conversation + current
  generic `DocumentData` (`documentType`, `fields`, `parties` — see
  `src/lib/document.ts`) to `POST /api/chat`, and lifts the returned `data` into
  state. When `documentType` is set, `page.tsx` fetches that document's
  `DocumentDef`; `DocumentPreview` (live document) and `DocumentPdf` (PDF
  download) render generically from `def` + `data`, fully client-side.
- **Saved drafts (PL-7):** `page.tsx` auto-saves the document + chat transcript
  per conversation (single-flight saver in `src/lib/drafts.ts`); `/documents`
  lists the user's drafts and reopening via `/?draft={id}` rehydrates the editor.
- **Polish & disclaimer (PL-7):** an indigo/slate brand (tokens in
  `globals.css`), shared `AppHeader`, branded `AuthShell`, and a
  `DraftDisclaimer` shown in-app, on the preview, and in the PDF.
- See `frontend/AGENTS.md`: this is Next.js 16 with breaking changes — check
  `node_modules/next/dist/docs/` before writing framework code. Note: client
  pages reading `useSearchParams` (e.g. `/`) must be wrapped in `<Suspense>`.

## Conventions

- Branch per ticket (e.g. `pl-4-...`), commits prefixed with the Jira key
  (`PL-4: ...`), merge to `main` via PR.
- Do not commit build artifacts: `.venv/`, `*.db`, `scripts/.run/`,
  `.next/`, `node_modules/`, `backend/.env` are gitignored.
- Note: the gitignore Python `lib/` rule is anchored as `/lib/` so it does not
  hide `frontend/src/lib/`.
