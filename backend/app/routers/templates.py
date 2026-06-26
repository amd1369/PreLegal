"""Read-only access to the Common Paper template catalog.

The current frontend reads templates client-side; these endpoints expose the
same catalog through the backend so future, backend-driven features can reuse
it without changing the product yet.
"""

from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.schemas import CatalogResponse, TemplateContent

router = APIRouter(prefix="/templates", tags=["templates"])


def _load_catalog() -> CatalogResponse:
    try:
        raw = settings.catalog_path.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Catalog file not found")
    return CatalogResponse.model_validate(json.loads(raw))


@router.get("", response_model=CatalogResponse)
def list_templates() -> CatalogResponse:
    """Return the catalog of available legal agreement templates."""
    return _load_catalog()


@router.get("/{filename}", response_model=TemplateContent)
def get_template(filename: str) -> TemplateContent:
    """Return the raw markdown content of a single template."""
    catalog = _load_catalog()
    known = {t.filename for t in catalog.templates}
    if filename not in known:
        raise HTTPException(status_code=404, detail="Unknown template")

    # Resolve safely within the templates directory to prevent traversal.
    path = (settings.templates_dir / filename).resolve()
    if settings.templates_dir.resolve() not in path.parents:
        raise HTTPException(status_code=400, detail="Invalid template path")

    try:
        content = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Template file not found")

    return TemplateContent(filename=filename, content=content)
