"""Pydantic response schemas for the API."""

from __future__ import annotations

from pydantic import BaseModel


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
