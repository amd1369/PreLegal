"""Application configuration.

Values can be overridden via environment variables or a backend/.env file
(see .env.example). Paths default to the repository layout so the backend works
out of the box with the start/stop scripts.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/config.py -> backend/ -> repository root
BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    """Runtime settings for the PreLegal backend."""

    app_name: str = "PreLegal API"
    app_version: str = "0.1.0"

    # SQLite lives inside backend/ by default and is gitignored. It is the
    # "temporary database" foundation; swap DATABASE_URL to move to Postgres.
    database_url: str = f"sqlite:///{BACKEND_DIR / 'prelegal.db'}"

    # Where the Common Paper templates and catalog live.
    templates_dir: Path = REPO_ROOT / "templates"
    catalog_path: Path = REPO_ROOT / "catalog.json"

    # Origins allowed to call the API (the Next.js dev server).
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # OpenRouter configuration for the AI chat (PL-5).
    # OPENROUTER_API_KEY is read from the environment or backend/.env.
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    chat_model: str = "openai/gpt-oss-120b:free"
    chat_max_tokens: int = 4096

    # Authentication (PL-7). JWT_SECRET should be overridden in any real
    # deployment; the default only exists so the preview app runs out of the box.
    jwt_secret: str = "dev-only-change-me-prelegal-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # one week

    # The temporary database is reset on startup so the schema always matches
    # the code and no migration tooling is needed (PL-7). Set to False to keep
    # data across restarts.
    reset_db_on_startup: bool = True

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
