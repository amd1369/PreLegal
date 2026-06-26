"""ORM models.

These establish the database foundation for V1. The product features are not
wired to the backend yet (per PL-4), but the schema is in place so future work
can persist generated agreements without further plumbing.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Document(Base):
    """A legal document drafted on the platform.

    Foundation table only — not populated by the current client-side NDA
    creator. It exists to verify DB connectivity and to seed future work.
    """

    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # The catalog template this document is based on, e.g. "Mutual-NDA.md".
    template: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    # Serialized form data / generated content (JSON string) for future use.
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
