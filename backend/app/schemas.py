"""Pydantic response schemas for the API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict
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
# Mutual NDA chat (PL-5)
#
# These mirror the frontend NdaData model (frontend/src/lib/nda.ts). Fields use
# camelCase aliases so the JSON shape matches the frontend byte-for-byte.
# ---------------------------------------------------------------------------


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Party(CamelModel):
    name: str = ""
    title: str = ""
    company: str = ""
    notice_address: str = ""


class NdaData(CamelModel):
    purpose: str = ""
    effective_date: str = ""
    term_type: Literal["expires", "untilTerminated"] = "expires"
    term_years: int = 1
    confidentiality_type: Literal["years", "perpetuity"] = "years"
    confidentiality_years: int = 1
    governing_law: str = ""
    jurisdiction: str = ""
    modifications: str = ""
    party1: Party = Party()
    party2: Party = Party()


class ChatMessage(CamelModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(CamelModel):
    messages: list[ChatMessage]
    data: NdaData


class ChatResponse(CamelModel):
    reply: str
    data: NdaData
