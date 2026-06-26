"""Conversational legal-document drafting endpoint (PL-5 NDA → PL-6 all types)."""

from __future__ import annotations

import logging

import openai
from fastapi import APIRouter, HTTPException

from app.chat import run_chat
from app.schemas import ChatRequest, ChatResponse

logger = logging.getLogger("app.chat")

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    """Advance the drafting conversation by one assistant turn.

    Takes the conversation so far plus the current document and returns the
    assistant's reply and the (possibly updated) document.
    """
    try:
        reply, data = run_chat(request.messages, request.data)
    except ValueError:
        # API key not configured.
        raise HTTPException(
            status_code=503,
            detail="The chat assistant is not configured (missing OPENROUTER_API_KEY).",
        )
    except (openai.AuthenticationError, openai.PermissionDeniedError) as exc:
        # The key is present but rejected by OpenRouter (invalid/expired/no access).
        logger.error("OpenRouter rejected the API key: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="The chat assistant's API key is invalid. Check OPENROUTER_API_KEY.",
        )
    except openai.OpenAIError as exc:
        logger.exception("OpenRouter API call failed: %s", exc)
        raise HTTPException(
            status_code=502, detail="The chat assistant is temporarily unavailable."
        )

    return ChatResponse(reply=reply, data=data)
