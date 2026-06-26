"""Saved-draft CRUD for a user's document history (PL-7).

Each draft persists a user's ``DocumentData`` plus the chat transcript as JSON,
so a drafting session can be listed in the user's history and fully restored
when reopened. All routes are scoped to the authenticated user.
"""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Document, User
from app.schemas import (
    DocumentData,
    DraftCreate,
    DraftDetail,
    DraftSummary,
    DraftUpdate,
)

router = APIRouter(prefix="/drafts", tags=["drafts"])


def _to_detail(doc: Document) -> DraftDetail:
    return DraftDetail(
        id=doc.id,
        template=doc.template,
        title=doc.title,
        data=DocumentData.model_validate_json(doc.data),
        messages=json.loads(doc.messages),
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


def _get_owned(draft_id: int, user: User, db: Session) -> Document:
    doc = db.get(Document, draft_id)
    if doc is None or doc.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")
    return doc


@router.get("", response_model=list[DraftSummary])
def list_drafts(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[DraftSummary]:
    """List the user's drafts, most recently updated first."""
    docs = db.scalars(
        select(Document)
        .where(Document.user_id == user.id)
        .order_by(Document.updated_at.desc())
    ).all()
    return [
        DraftSummary(
            id=d.id,
            template=d.template,
            title=d.title,
            created_at=d.created_at,
            updated_at=d.updated_at,
        )
        for d in docs
    ]


@router.post("", response_model=DraftDetail, status_code=status.HTTP_201_CREATED)
def create_draft(
    request: DraftCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DraftDetail:
    """Create a new draft for the user."""
    doc = Document(
        user_id=user.id,
        template=request.template,
        title=request.title,
        data=request.data.model_dump_json(by_alias=True),
        messages=_dump_messages(request.messages),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _to_detail(doc)


@router.get("/{draft_id}", response_model=DraftDetail)
def get_draft(
    draft_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DraftDetail:
    """Return a single draft, fully restoring the editor session."""
    return _to_detail(_get_owned(draft_id, user, db))


@router.put("/{draft_id}", response_model=DraftDetail)
def update_draft(
    draft_id: int,
    request: DraftUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DraftDetail:
    """Update a draft's title, document data, and transcript."""
    doc = _get_owned(draft_id, user, db)
    doc.title = request.title
    doc.template = request.data.document_type or doc.template
    doc.data = request.data.model_dump_json(by_alias=True)
    doc.messages = _dump_messages(request.messages)
    db.commit()
    db.refresh(doc)
    return _to_detail(doc)


@router.delete("/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_draft(
    draft_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Delete a draft."""
    doc = _get_owned(draft_id, user, db)
    db.delete(doc)
    db.commit()


def _dump_messages(messages: list) -> str:
    return json.dumps([m.model_dump(by_alias=True) for m in messages])
