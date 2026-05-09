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
    "You are an AI teaching assistant for an LMS video platform. "
    "The user has already uploaded a video or YouTube link — you NEVER need to ask them for a transcript or any content. "
    "You will be given transcript context chunks extracted from their video. "
    "Answer ONLY using those context chunks. "
    "When referencing a concept, append the exact start timestamp formatted as [TIMESTAMP:145] where 145 is seconds. "
    "If the context is empty or says 'No transcript available', tell the user: "
    "'The video is still being processed. Please wait a moment and try again.' "
    "NEVER ask the user to provide a transcript, text, or any content. "
    "Do not hallucinate information not present in the context."
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
    history: list[dict] = None,
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
    if not context_chunks:
        yield "data: The video is still being processed. Please wait a moment and try again.\n\n"
        yield "data: [DONE]\n\n"
        return

    context_lines: list[str] = []
    for i, chunk in enumerate(context_chunks, 1):
        context_lines.append(
            f"[Chunk {i} | start_time={chunk['start_time']:.1f}s | "
            f"end_time={chunk['end_time']:.1f}s]\n{chunk['text']}"
        )

    context_block = "\n\n---\n\n".join(context_lines)

    # ── Format history for Gemini ──
    gemini_history = []
    if history:
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg["content"]]})

    chat = model.start_chat(history=gemini_history)

    prompt = (
        f"TRANSCRIPT CONTEXT:\n{context_block}\n\n"
        f"STUDENT QUESTION: {query}\n\n"
        "Provide a clear, helpful answer using ONLY the transcript context above. "
        "Reference timestamps using [TIMESTAMP:X] format where X is the start_time in seconds."
    )

    logger.info("Streaming Gemini response for query: '%s' with %d history msgs", query[:80], len(gemini_history))

    response = await chat.send_message_async(prompt, stream=True)

    async for chunk in response:
        if chunk.text:
            yield f"data: {chunk.text}\n\n"

    yield "data: [DONE]\n\n"
    logger.info("SSE stream complete.")


# ────────────────────────────────────────────────────────────────────
#  2.  Summary Generation  (non-streaming)
# ────────────────────────────────────────────────────────────────────

async def generate_summary(transcript_text: str, summary_type: str = "topic") -> str:
    """
    Send transcript text to Gemini and return a formatted summary based on the type.
    """
    _configure_genai()

    model = genai.GenerativeModel(model_name=_MODEL_NAME)

    if summary_type == "last_5_mins":
        prompt = (
            "Summarize the following 5-minute lecture transcript excerpt into "
            "exactly 3 concise bullet points. Each bullet should capture "
            "a distinct key concept or takeaway.\n\n"
            f"TRANSCRIPT:\n{transcript_text}\n\n"
            "FORMAT:\n• Point 1\n• Point 2\n• Point 3"
        )
    else:
        prompt = (
            "Analyze the following video transcript and identify the main topics covered. "
            "Return exactly 3 to 5 concise bullet points detailing the core subjects discussed.\n\n"
            f"TRANSCRIPT:\n{transcript_text}\n\n"
            "FORMAT:\n• Topic 1\n• Topic 2\n• Topic 3"
        )

    logger.info("Generating 3-bullet summary…")
    response = await model.generate_content_async(prompt)
    return response.text
