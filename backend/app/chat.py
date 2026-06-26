"""Conversational legal-document drafting backed by an LLM via OpenRouter.

Originally NDA-only (PL-5); PL-6 generalizes it to every Common Paper agreement
we have a template for. The assistant first works out which document type the
user wants — offering the closest supported one if they ask for something we
can't generate — then collects that document's cover-page key terms and the
signing parties through natural conversation.

We expose a single ``update_document`` tool whose input mirrors the generic
``DocumentData`` model: the chosen document type, a list of key-term values, and
the parties. Whenever the model learns something it calls the tool, and we merge
the result into the document that drives the live preview and PDF.

The model is reached through OpenRouter's OpenAI-compatible API, so the
``openai`` SDK is pointed at OpenRouter's base URL.
"""

from __future__ import annotations

import json

from openai import OpenAI

from app.config import settings
from app.documents import list_documents, load_document_def
from app.schemas import DocumentData, FieldValue, Party

_PARTY_PROPERTIES = {
    "role": {
        "type": "string",
        "description": "The party's role in this agreement (e.g. 'Provider', "
        "'Customer', 'Party 1').",
    },
    "company": {"type": "string", "description": "The party's legal company name."},
    "name": {"type": "string", "description": "The signatory's full name."},
    "title": {"type": "string", "description": "The signatory's job title."},
    "noticeAddress": {
        "type": "string",
        "description": "Email or postal address used for legal notices.",
    },
}


def _update_tool() -> dict:
    """Build the update_document tool, enumerating the supported document ids."""
    return {
        "type": "function",
        "function": {
            "name": "update_document",
            "description": (
                "Record what you have learned about the agreement: which document "
                "type the user wants, the cover-page key-term values, and the "
                "parties. Only include what you have new, concrete values for; "
                "omit anything still unknown. Call this whenever the user picks a "
                "document type or provides or revises a detail."
            ),
            "parameters": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "documentType": {
                        "type": "string",
                        "enum": [d.id for d in list_documents()],
                        "description": (
                            "The id of the agreement the user wants to create. Only "
                            "set this once you are confident which supported "
                            "document fits."
                        ),
                    },
                    "fields": {
                        "type": "array",
                        "description": "Cover-page key terms and their values.",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "key": {
                                    "type": "string",
                                    "description": "The key term's name, e.g. 'Purpose'.",
                                },
                                "value": {
                                    "type": "string",
                                    "description": "The value, in plain language.",
                                },
                            },
                            "required": ["key", "value"],
                        },
                    },
                    "parties": {
                        "type": "array",
                        "description": "The signing parties.",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": _PARTY_PROPERTIES,
                        },
                    },
                },
            },
        },
    }


SYSTEM_PROMPT = """\
You are PreLegal's friendly assistant. You help a user create a legal agreement \
by drafting from a fixed catalog of Common Paper templates.

You can ONLY create these document types:
{catalog}

How to work:
1. If you don't yet know which document the user wants, find out. If their need \
maps to one of the supported types above, select it by calling update_document \
with that documentType. If they ask for a document we do NOT support (e.g. an \
employment contract, a lease, a will), briefly explain that you can't generate \
that one, then suggest the closest supported document from the list and ask if \
they'd like to use it.
2. Once the document type is set, guide the user through the details: gather, \
through natural back-and-forth, the cover-page key terms and the signing \
parties for that document.

Guidelines:
- Be warm, concise, and conversational. Ask about one or two things at a time; \
don't interrogate the user with a long list.
- Whenever the user gives or revises a detail, call update_document to record \
it. Use the document's own key-term names as field keys. Compose values in \
plain language (e.g. an MNDA Term of "Expires 2 years from the Effective Date").
- Accept natural language (e.g. "three years", "next Monday" -> resolve to an \
ISO date; a company name implies a party).
- Don't invent details the user hasn't provided. Optional terms can be skipped.
- When the essential details are filled, let the user know the agreement is \
ready to preview and download, and offer to adjust anything.
- Reply with the message to show the user only — keep it short and free of \
internal reasoning.\
"""


def _catalog_text() -> str:
    return "\n".join(f"- {d.name} (id: {d.id}): {d.description}" for d in list_documents())


def _active_context(data: DocumentData) -> str:
    """Extra system context describing the chosen document, if any."""
    definition = load_document_def(data.document_type) if data.document_type else None
    if definition is None:
        return ""
    keys = ", ".join(f.key for f in definition.fields) or "(none)"
    roles = ", ".join(definition.party_roles)
    return (
        f"\n\nThe user is creating: {definition.name} (id: {definition.id}).\n"
        f"Its cover-page key terms to collect: {keys}.\n"
        f"Its parties: {roles}.\n"
        "The document so far (JSON):\n"
        + json.dumps(data.model_dump(by_alias=True), indent=2)
    )


def _merge(data: DocumentData, tool_input: dict) -> DocumentData:
    """Merge a partial update from the model into the current document."""
    doc_type = tool_input.get("documentType")
    if doc_type and doc_type != data.document_type:
        # Switching document types resets the type-specific content.
        data = DocumentData(document_type=doc_type)

    if isinstance(tool_input.get("fields"), list):
        by_key = {f.key.lower(): f for f in data.fields}
        for item in tool_input["fields"]:
            if not isinstance(item, dict) or not item.get("key"):
                continue
            by_key[item["key"].lower()] = FieldValue(
                key=item["key"], value=item.get("value", "")
            )
        data.fields = list(by_key.values())

    if isinstance(tool_input.get("parties"), list):
        parties = list(data.parties)
        by_role = {p.role.lower(): i for i, p in enumerate(parties) if p.role}
        for item in tool_input["parties"]:
            if not isinstance(item, dict):
                continue
            incoming = Party.model_validate(item)
            idx = by_role.get(incoming.role.lower()) if incoming.role else None
            if idx is None:
                parties.append(incoming)
                if incoming.role:
                    by_role[incoming.role.lower()] = len(parties) - 1
            else:
                merged = parties[idx].model_dump()
                merged.update(
                    {k: v for k, v in incoming.model_dump().items() if v}
                )
                parties[idx] = Party.model_validate(merged)
        data.parties = parties

    return data


def _tool_result(data: DocumentData) -> str:
    """Feed the model back what remains to collect for the active document."""
    definition = load_document_def(data.document_type) if data.document_type else None
    if definition is None:
        return "Recorded."
    filled = {f.key.lower() for f in data.fields if f.value.strip()}
    remaining = [f.key for f in definition.fields if f.key.lower() not in filled]
    return json.dumps(
        {
            "documentType": definition.id,
            "remainingFields": remaining,
            "expectedParties": definition.party_roles,
            "partiesSoFar": [p.role for p in data.parties if p.role],
        }
    )


def run_chat(messages: list, data: DocumentData) -> tuple[str, DocumentData]:
    """Run one assistant turn: returns the reply text and the updated document.

    Raises openai.OpenAIError on API failure and ValueError if the API key is
    not configured.
    """
    if not settings.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY is not configured")

    client = OpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        default_headers={"X-Title": "PreLegal"},
    )

    system = SYSTEM_PROMPT.format(catalog=_catalog_text()) + _active_context(data)
    tool = _update_tool()

    api_messages: list[dict] = [{"role": "system", "content": system}]
    api_messages += [{"role": m.role, "content": m.content} for m in messages]
    reply_parts: list[str] = []

    # Agentic loop: apply each update_document call and continue until done.
    for _ in range(10):  # generous safety bound on tool round-trips
        response = client.chat.completions.create(
            model=settings.chat_model,
            max_tokens=settings.chat_max_tokens,
            messages=api_messages,
            tools=[tool],
        )
        message = response.choices[0].message

        if message.content:
            reply_parts.append(message.content)

        if not message.tool_calls:
            break

        api_messages.append(
            {
                "role": "assistant",
                "content": message.content or "",
                "tool_calls": [
                    {
                        "id": call.id,
                        "type": "function",
                        "function": {
                            "name": call.function.name,
                            "arguments": call.function.arguments,
                        },
                    }
                    for call in message.tool_calls
                ],
            }
        )
        for call in message.tool_calls:
            if call.function.name == "update_document":
                try:
                    args = json.loads(call.function.arguments or "{}")
                except json.JSONDecodeError:
                    args = {}
                data = _merge(data, args)
                result = _tool_result(data)
            else:
                result = "Recorded."
            api_messages.append(
                {"role": "tool", "tool_call_id": call.id, "content": result}
            )

    reply = "\n\n".join(part.strip() for part in reply_parts if part.strip())
    return reply, data
