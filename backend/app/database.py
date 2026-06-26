"""Database engine, session factory, and declarative base.

SQLite is used as the temporary V1 database. Because SQLAlchemy abstracts the
backend, moving to Postgres later only requires changing DATABASE_URL.
"""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

# check_same_thread is a SQLite-only flag; it is required because FastAPI may
# access the connection from different threads.
_connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)

engine = create_engine(settings.database_url, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """(Re)create all tables. Called on application startup.

    The V1 database is temporary (PL-7): when ``reset_db_on_startup`` is set, all
    tables are dropped and recreated on startup so the schema always matches the
    code and no migration tooling is needed. Data does not survive a restart.
    """
    # Import models so they are registered on the metadata before create_all.
    from app import models  # noqa: F401

    if settings.reset_db_on_startup:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
