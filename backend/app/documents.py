"""Parse the Common Paper templates into renderable document definitions (PL-6).

Every Common Paper template has the same shape: a Cover Page of fillable "key
terms" plus fixed Standard Terms. In the markdown, the fillable terms are tagged
with ``<span class="..._link">Term</span>`` markers and the legal body is a
nested numbered list whose section/subsection titles are ``<span
class="header_2/3">`` spans. We turn each template into a ``DocumentDef``:

- ``fields`` — the distinct key terms to collect (party roles excluded), which
  drive both the chat and the cover page.
- ``party_roles`` — the party names the document uses (Provider, Customer, ...).
- ``sections`` — the Standard Terms flattened into ``{heading, body, indent}``
  blocks, generalizing the NDA's old hand-written STANDARD_TERMS list.

This keeps the renderer fully generic: any current or future template renders
with no per-document code.
"""

from __future__ import annotations

import json
import re
from functools import lru_cache

from app.config import settings
from app.schemas import (
    DocumentDef,
    DocumentField,
    DocumentSection,
    DocumentSummary,
)

# Companion files that are not standalone, selectable agreements.
_EXCLUDED_TEMPLATES = {"Mutual-NDA-coverpage.md"}

# Span classes Common Paper uses to mark a fillable key term on the Cover Page.
_KEYTERM_RE = re.compile(
    r'<span class="(?:coverpage_link|orderform_link|keyterms_link|businessterms_link)"[^>]*>'
    r"(.*?)</span>"
)
# Section/subsection title spans.
_HEADER_RE = re.compile(r'<span class="header_[23]"[^>]*>(.*?)</span>')
# Any remaining span — stripped to its inner text.
_ANY_SPAN_RE = re.compile(r"<span[^>]*>(.*?)</span>")
_LINK_RE = re.compile(r"\[([^\]]+)\]\([^)]+\)")
_BOLD_LEAD_RE = re.compile(r"^\*\*(.+?)\*\*\.?\s*(.*)$", re.DOTALL)
_LIST_ITEM_RE = re.compile(r"^(\s*)(?:(\d+)|([a-z]))\.\s+(.*)$", re.DOTALL)

# Key terms that name a party rather than a fillable field. Matched after
# stripping possessives; compared case-insensitively.
_PARTY_TERMS = {
    "provider",
    "customer",
    "partner",
    "discloser",
    "recipient",
    "company",
    "counterparty",
}


def _strip_inline(text: str) -> str:
    """Reduce inline markup (spans, links, bold) to clean plain text."""
    text = _ANY_SPAN_RE.sub(r"\1", text)
    text = _LINK_RE.sub(r"\1", text)
    text = text.replace("**", "")
    # Drop any residual HTML tag fragments (e.g. the doubled "</span>" typo in
    # CSA.md, or a span split across lines).
    text = re.sub(r"</?[a-z][^>]*>", "", text)
    return re.sub(r"\s+", " ", text).strip()


def _normalize_term(term: str) -> str:
    """Clean a key-term label: strip markup and possessive suffixes."""
    term = _strip_inline(term)
    term = re.sub(r"[’']s$", "", term)
    return term.strip(" .,:")


def _extract_fields(markdown: str) -> tuple[list[str], list[str]]:
    """Return (cover-page field labels, party role names), order-preserving."""
    fields: list[str] = []
    parties: list[str] = []
    seen_fields: set[str] = set()
    seen_parties: set[str] = set()

    for raw in _KEYTERM_RE.findall(markdown):
        term = _normalize_term(raw)
        if not term:
            continue
        if term.lower() in _PARTY_TERMS:
            if term.lower() not in seen_parties:
                seen_parties.add(term.lower())
                parties.append(term)
        elif term.lower() not in seen_fields:
            seen_fields.add(term.lower())
            fields.append(term)

    return fields, parties


def _parse_sections(markdown: str) -> list[DocumentSection]:
    """Flatten the Standard Terms markdown into {heading, body, indent} blocks.

    Top-level numbered items (indent 0) and their direct subsections (indent 1)
    become their own blocks; deeper lettered points are folded inline into the
    nearest block's body with their labels preserved.
    """
    sections: list[DocumentSection] = []
    current: DocumentSection | None = None

    for line in markdown.splitlines():
        if not line.strip():
            continue
        if line.lstrip().startswith("#"):  # markdown headings (e.g. "# Title")
            continue

        match = _LIST_ITEM_RE.match(line)
        if not match:
            # A continuation line of the current block.
            if current is not None:
                extra = _strip_inline(line)
                if extra:
                    current.body = f"{current.body} {extra}".strip()
            continue

        indent_ws, number, letter, rest = match.groups()
        depth = len(indent_ws) // 4

        header_match = _HEADER_RE.search(rest)
        heading = _strip_inline(header_match.group(1)) if header_match else ""
        if header_match:
            rest = rest[: header_match.start()] + rest[header_match.end() :]
        elif depth == 0 and (bold := _BOLD_LEAD_RE.match(rest.strip())):
            # NDA-style "1. **Introduction**. body" sections.
            heading, rest = _strip_inline(bold.group(1)), bold.group(2)

        body = _strip_inline(rest)

        if depth <= 1:
            current = DocumentSection(heading=heading, body=body, indent=depth)
            sections.append(current)
        else:
            # Deeper point: fold into the current block, keeping its label.
            label = f"({letter})" if letter else f"{number}."
            piece = f"{label} {body}".strip()
            if current is not None:
                current.body = f"{current.body} {piece}".strip()
            else:
                current = DocumentSection(body=piece, indent=1)
                sections.append(current)

    return sections


@lru_cache
def _catalog() -> dict:
    return json.loads(settings.catalog_path.read_text(encoding="utf-8"))


def _catalog_entry(filename: str) -> dict | None:
    for entry in _catalog()["templates"]:
        if entry["filename"] == filename:
            return entry
    return None


def list_documents() -> list[DocumentSummary]:
    """The selectable agreement types (catalog minus companion files)."""
    return [
        DocumentSummary(
            id=entry["filename"], name=entry["name"], description=entry["description"]
        )
        for entry in _catalog()["templates"]
        if entry["filename"] not in _EXCLUDED_TEMPLATES
    ]


@lru_cache
def load_document_def(filename: str) -> DocumentDef | None:
    """Parse one template into a renderable definition, or None if unknown."""
    entry = _catalog_entry(filename)
    if entry is None or filename in _EXCLUDED_TEMPLATES:
        return None

    path = (settings.templates_dir / filename).resolve()
    if settings.templates_dir.resolve() not in path.parents or not path.is_file():
        return None

    markdown = path.read_text(encoding="utf-8")
    field_labels, party_roles = _extract_fields(markdown)
    sections = _parse_sections(markdown)
    if not party_roles:
        party_roles = ["Party 1", "Party 2"]

    return DocumentDef(
        id=filename,
        name=entry["name"],
        title=entry["name"],
        fields=[DocumentField(key=label) for label in field_labels],
        party_roles=party_roles,
        sections=sections,
        attribution=(
            f"{entry['name']} based on a Common Paper standard template, "
            "free to use under CC BY 4.0 "
            "(https://creativecommons.org/licenses/by/4.0/)."
        ),
    )
