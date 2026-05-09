"""
services/llm_stream.py — Gemini Flash-Lite RAG generation with SSE streaming.

Handles:
  1. Prompt assembly from retrieved transcript chunks.
  2. Async streaming via Gemini's generate_content_async (SSE format).
  3. Non-streaming summary generation for the /summary endpoint.
"""

import logging
from typing import AsyncGenerator

import google.generativeai as genai
from core.config import get_settings

logger = logging.getLogger(__name__)

# ── System prompt injected into every RAG call ──
SYSTEM_PROMPT = (
    "You are an AI teaching assistant. "
    "Use ONLY the provided transcript context. "
    "Every chunk has a start_time. When referencing a concept, "
    "append the exact start timestamp formatted as [TIMESTAMP:145]. "
    "Do not hallucinate."
)

# ── Gemini model name ──
_MODEL_NAME = "gemini-3.1-flash-lite-preview"


def _configure_genai() -> None:
    """Configure the Google GenAI SDK with the API key (idempotent)."""
    settings = get_settings()
    genai.configure(api_key=settings.GEMINI_API_KEY)


# ────────────────────────────────────────────────────────────────────
#  1.  SSE Chat Streaming
# ────────────────────────────────────────────────────────────────────

async def stream_chat_response(
    query: str,
    context_chunks: list[dict],
) -> AsyncGenerator[str, None]:
    """
    Async generator that yields SSE-formatted tokens from Gemini Flash-Lite.

    Each yield is a string: `data: <token>\n\n`
    The stream terminates with `data: [DONE]\n\n`.
    """
    _configure_genai()

    model = genai.GenerativeModel(
        model_name=_MODEL_NAME,
        system_instruction=SYSTEM_PROMPT,
    )

    # ── Build context block from retrieved chunks ──
    context_lines: list[str] = []
    for i, chunk in enumerate(context_chunks, 1):
        context_lines.append(
            f"[Chunk {i} | start_time={chunk['start_time']:.1f}s | "
            f"end_time={chunk['end_time']:.1f}s]\n{chunk['text']}"
        )

    context_block = "\n\n---\n\n".join(context_lines)

    prompt = (
        f"TRANSCRIPT CONTEXT:\n{context_block}\n\n"
        f"STUDENT QUESTION: {query}\n\n"
        "Provide a clear, helpful answer using ONLY the transcript context above. "
        "Reference timestamps using [TIMESTAMP:X] format where X is the start_time in seconds."
    )

    logger.info("Streaming Gemini response for query: '%s'", query[:80])

    response = await model.generate_content_async(prompt, stream=True)

    async for chunk in response:
        if chunk.text:
            yield f"data: {chunk.text}\n\n"

    yield "data: [DONE]\n\n"
    logger.info("SSE stream complete.")


# ────────────────────────────────────────────────────────────────────
#  2.  Summary Generation  (non-streaming)
# ────────────────────────────────────────────────────────────────────

async def generate_summary(transcript_text: str) -> str:
    """
    Send transcript text to Gemini and return a 3-bullet-point summary.
    """
    _configure_genai()

    model = genai.GenerativeModel(model_name=_MODEL_NAME)

    prompt = (
        "Summarize the following lecture transcript excerpt into "
        "exactly 3 concise bullet points. Each bullet should capture "
        "a distinct key concept or takeaway.\n\n"
        f"TRANSCRIPT:\n{transcript_text}\n\n"
        "FORMAT:\n• Point 1\n• Point 2\n• Point 3"
    )

    logger.info("Generating 3-bullet summary…")
    response = await model.generate_content_async(prompt)
    return response.text
