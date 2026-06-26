"""Pydantic response schemas for the API."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    database: str


class TemplateSummary(BaseModel):
    name: str
    description: str
    filename: str


class CatalogResponse(BaseModel):
    source: str
    license: str
    templates: list[TemplateSummary]


class TemplateContent(BaseModel):
    filename: str
    content: str


# ---------------------------------------------------------------------------
# Document drafting chat (PL-5 NDA → PL-6 all document types)
#
# The model is generic: a chosen document type plus a dynamic list of cover-page
# key-term values and the signing parties. These mirror the frontend types in
# frontend/src/lib/document.ts; camelCase aliases keep the JSON shape identical.
# ---------------------------------------------------------------------------


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Party(CamelModel):
    """A signing party. ``role`` names the party in the agreement (e.g.
    "Provider", "Customer", "Party 1")."""

    role: str = ""
    company: str = ""
    name: str = ""
    title: str = ""
    notice_address: str = ""


class FieldValue(CamelModel):
    """A filled-in cover-page key term, e.g. {key: "Purpose", value: "..."}."""

    key: str
    value: str = ""


class DocumentData(CamelModel):
    document_type: str = ""  # template id (filename); "" until the AI picks one
    fields: list[FieldValue] = []
    parties: list[Party] = []


# --- Document definitions (the parsed templates the renderer draws from) ----


class DocumentSummary(CamelModel):
    """A selectable document type in the catalog."""

    id: str  # template filename, e.g. "CSA.md"
    name: str
    description: str


class DocumentField(CamelModel):
    """A cover-page key term a document expects the user to fill in."""

    key: str


class DocumentSection(CamelModel):
    """A block of the Standard Terms, generalizing the old NDA STANDARD_TERMS."""

    heading: str = ""
    body: str = ""
    indent: int = 0


class DocumentDef(CamelModel):
    id: str
    name: str
    title: str
    fields: list[DocumentField]
    party_roles: list[str]
    sections: list[DocumentSection]
    attribution: str


# --- Chat wire types --------------------------------------------------------


class ChatMessage(CamelModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(CamelModel):
    messages: list[ChatMessage]
    data: DocumentData


class ChatResponse(CamelModel):
    reply: str
    data: DocumentData


# ---------------------------------------------------------------------------
# Authentication & saved drafts (PL-7)
# ---------------------------------------------------------------------------


class SignupRequest(CamelModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(default="", max_length=255)


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class UserResponse(CamelModel):
    id: int
    email: EmailStr
    name: str


class AuthResponse(CamelModel):
    token: str
    user: UserResponse


class DraftCreate(CamelModel):
    template: str = ""
    title: str = ""
    data: DocumentData = DocumentData()
    messages: list[ChatMessage] = []


class DraftUpdate(CamelModel):
    title: str = ""
    data: DocumentData = DocumentData()
    messages: list[ChatMessage] = []


class DraftSummary(CamelModel):
    """A row in the user's document history."""

    id: int
    template: str
    title: str
    created_at: datetime
    updated_at: datetime


class DraftDetail(CamelModel):
    """A full draft, enough to restore the editor session."""

    id: int
    template: str
    title: str
    data: DocumentData
    messages: list[ChatMessage]
    created_at: datetime
    updated_at: datetime
