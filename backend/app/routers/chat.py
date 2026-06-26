"""Conversational Mutual NDA endpoint (PL-5)."""

from __future__ import annotations

import logging

import anthropic
from fastapi import APIRouter, HTTPException

from app.chat import run_chat
from app.schemas import ChatRequest, ChatResponse

logger = logging.getLogger("app.chat")

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    """Advance the NDA conversation by one assistant turn.

    Takes the conversation so far plus the current document and returns the
    assistant's reply and the (possibly updated) document.
    """
    try:
        reply, data = run_chat(request.messages, request.data)
    except ValueError:
        # API key not configured.
        raise HTTPException(
            status_code=503,
            detail="The chat assistant is not configured (missing ANTHROPIC_API_KEY).",
        )
    except (anthropic.AuthenticationError, anthropic.PermissionDeniedError) as exc:
        # The key is present but rejected by Anthropic (invalid/expired/no access).
        logger.error("Anthropic rejected the API key: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="The chat assistant's API key is invalid. Check ANTHROPIC_API_KEY.",
        )
    except anthropic.AnthropicError as exc:
        logger.exception("Anthropic API call failed: %s", exc)
        raise HTTPException(
            status_code=502, detail="The chat assistant is temporarily unavailable."
        )

    return ChatResponse(reply=reply, data=data)
