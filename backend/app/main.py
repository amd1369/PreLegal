"""PreLegal FastAPI application.

Provides authentication, the AI drafting chat, the document catalog, and saved
drafts, backed by a temporary SQLite database that is reset on startup (PL-7).
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import auth, chat, documents, drafts, health, templates


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on startup.
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(drafts.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/")
def root() -> dict[str, str]:
    return {"app": settings.app_name, "docs": "/docs", "health": "/api/health"}
