"""ORM models.

PL-7 introduces real multi-user support: a ``User`` table for registration/login
and a ``Document`` table that persists each user's drafted agreements (their
document data plus the chat transcript) so they can return to them later. The
database is temporary and reset on startup (see ``init_db``).
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    """A registered user of the platform."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(
        String(320), unique=True, index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    documents: Mapped[list["Document"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Document(Base):
    """A legal document a user has drafted on the platform.

    Stores the generic document data (``DocumentData`` as JSON) and the chat
    transcript so a draft can be fully restored when reopened.
    """

    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # The catalog template this document is based on, e.g. "Mutual-NDA.md".
    template: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    # Serialized DocumentData (document type, fields, parties) as a JSON string.
    data: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    # Serialized chat transcript (list of {role, content}) as a JSON string.
    messages: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="documents")
