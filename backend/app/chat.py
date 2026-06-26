"""Conversational Mutual NDA drafting backed by Claude (PL-5).

The frontend used to drive a deterministic form. Instead, the user now chats
freely with an assistant that asks about the agreement and fills in the same
NdaData fields. We expose Claude an ``update_nda`` tool whose input mirrors the
fillable fields; whenever the model learns a value it calls the tool, and we
merge the result into the document that drives the live preview and PDF.

Only the interaction changes — the document model and the generated agreement
are unchanged.
"""

from __future__ import annotations

import json

import anthropic

from app.config import settings
from app.schemas import ChatMessage, NdaData

# Each property mirrors a field on NdaData. All optional: the model sends only
# the fields it has just learned, and we merge them into the current document.
_PARTY_PROPERTIES = {
    "company": {"type": "string", "description": "The party's legal company name."},
    "name": {"type": "string", "description": "The signatory's full name."},
    "title": {"type": "string", "description": "The signatory's job title."},
    "noticeAddress": {
        "type": "string",
        "description": "Email or postal address used for legal notices.",
    },
}

UPDATE_TOOL: dict = {
    "name": "update_nda",
    "description": (
        "Record one or more fields of the Mutual NDA as you learn them from the "
        "user. Only include fields you have new, concrete values for; omit "
        "anything still unknown. Call this whenever the user provides or revises "
        "a detail."
    ),
    "input_schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "purpose": {
                "type": "string",
                "description": "Why Confidential Information is being shared.",
            },
            "effectiveDate": {
                "type": "string",
                "description": "Effective date in ISO format (YYYY-MM-DD).",
            },
            "termType": {
                "type": "string",
                "enum": ["expires", "untilTerminated"],
                "description": (
                    "'expires' if the MNDA ends after a set number of years, "
                    "'untilTerminated' if it continues until terminated."
                ),
            },
            "termYears": {
                "type": "integer",
                "description": "Years until the MNDA expires (when termType is 'expires').",
            },
            "confidentialityType": {
                "type": "string",
                "enum": ["years", "perpetuity"],
                "description": (
                    "'years' if confidentiality lasts a set number of years, "
                    "'perpetuity' if it lasts indefinitely."
                ),
            },
            "confidentialityYears": {
                "type": "integer",
                "description": "Years confidentiality lasts (when confidentialityType is 'years').",
            },
            "governingLaw": {
                "type": "string",
                "description": "U.S. state whose law governs the agreement (e.g. 'Delaware').",
            },
            "jurisdiction": {
                "type": "string",
                "description": "City/county and state for legal proceedings (e.g. 'New Castle, DE').",
            },
            "modifications": {
                "type": "string",
                "description": "Any changes to the standard terms; empty if none.",
            },
            "party1": {
                "type": "object",
                "additionalProperties": False,
                "properties": _PARTY_PROPERTIES,
                "description": "The first party to the agreement.",
            },
            "party2": {
                "type": "object",
                "additionalProperties": False,
                "properties": _PARTY_PROPERTIES,
                "description": "The second party to the agreement.",
            },
        },
    },
}

SYSTEM_PROMPT = """\
You are PreLegal's friendly assistant helping a user create a Common Paper \
Mutual Non-Disclosure Agreement (MNDA) through conversation.

Your job is to gather, through natural back-and-forth, the details needed to \
complete the agreement:
- The purpose for sharing confidential information
- The effective date
- The MNDA term (expires after N years, or continues until terminated)
- The term of confidentiality (N years, or in perpetuity)
- The governing law (a U.S. state) and jurisdiction (city/county and state)
- Any modifications to the standard terms (optional)
- For each of the two parties: company name, signatory name, signatory title, \
and a notice address (email or postal)

Guidelines:
- Be warm, concise, and conversational. Ask about one or two things at a time; \
do not interrogate the user with a long list.
- Whenever the user gives or revises a detail, call the update_nda tool to \
record it. You may call it before replying.
- Accept natural language (e.g. "three years" -> termYears 3; "next Monday" -> \
resolve to an ISO date; a company name implies which party). Confirm briefly \
when you record something.
- Do not invent details the user hasn't provided. If something is optional and \
the user wants to skip it, that's fine.
- When all the essential fields are filled, let the user know the agreement is \
ready to preview and download, and offer to adjust anything.
- Reply with the message to show the user only — keep it short and free of \
internal reasoning.
"""


def _merge(data: NdaData, tool_input: dict) -> NdaData:
    """Merge a partial update from the model into the current document."""
    current = data.model_dump(by_alias=True)
    for key, value in tool_input.items():
        if key in ("party1", "party2") and isinstance(value, dict):
            current[key] = {
                **current[key],
                **{k: v for k, v in value.items() if v is not None},
            }
        elif value is not None:
            current[key] = value
    return NdaData.model_validate(current)


def run_chat(messages: list[ChatMessage], data: NdaData) -> tuple[str, NdaData]:
    """Run one assistant turn: returns the reply text and the updated document.

    Raises anthropic.AnthropicError on API failure and ValueError if the API
    key is not configured.
    """
    if not settings.anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY is not configured")

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    system = (
        SYSTEM_PROMPT
        + "\n\nThe document so far (JSON):\n"
        + json.dumps(data.model_dump(by_alias=True), indent=2)
    )

    api_messages = [{"role": m.role, "content": m.content} for m in messages]
    reply_parts: list[str] = []

    # Agentic loop: apply each update_nda call and continue until Claude is done.
    for _ in range(10):  # generous safety bound on tool round-trips
        response = client.messages.create(
            model=settings.chat_model,
            max_tokens=settings.chat_max_tokens,
            system=system,
            tools=[UPDATE_TOOL],
            messages=api_messages,
        )

        tool_results = []
        for block in response.content:
            if block.type == "text":
                reply_parts.append(block.text)
            elif block.type == "tool_use" and block.name == "update_nda":
                data = _merge(data, block.input)
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": "Recorded.",
                    }
                )

        if response.stop_reason != "tool_use":
            break

        # Feed the tool results back so Claude can continue its reply.
        api_messages.append({"role": "assistant", "content": response.content})
        api_messages.append({"role": "user", "content": tool_results})

    reply = "\n\n".join(part.strip() for part in reply_parts if part.strip())
    return reply, data
