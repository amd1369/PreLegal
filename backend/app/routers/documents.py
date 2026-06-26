"""Document definitions for the drafting UI (PL-6).

The frontend renders the live preview and PDF entirely client-side, so it needs
each agreement's parsed structure: its title, the cover-page fields, the party
roles, and the Standard Terms sections. These endpoints expose that, derived
from the Common Paper templates by ``app.documents``.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.documents import list_documents, load_document_def
from app.schemas import DocumentDef, DocumentSummary

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=list[DocumentSummary])
def list_document_types() -> list[DocumentSummary]:
    """Return the selectable agreement types."""
    return list_documents()


@router.get("/{document_id}", response_model=DocumentDef)
def get_document_type(document_id: str) -> DocumentDef:
    """Return one agreement's parsed definition (fields, parties, sections)."""
    definition = load_document_def(document_id)
    if definition is None:
        raise HTTPException(status_code=404, detail="Unknown document type")
    return definition
