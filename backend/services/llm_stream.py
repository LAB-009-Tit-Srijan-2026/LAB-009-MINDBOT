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
"### PHASE 1: INTERACTION PROTOCOLS\n"
"1. GREETINGS: If the user provides a simple greeting (e.g., 'hi', 'hello'), respond with a single, "
"refined sentence: 'Greetings. I am Athex AI. I have indexed your study content and am ready for your "
"technical or conceptual inquiries.' DO NOT provide summaries or analysis for greetings.\n"
"2. NO PROCEDURAL FLUFF: Do not use phrases like 'Based on the transcript' or 'In the video'. Jump "
"immediately into the core technical explanation.\n"
"3. SCOPE ADHERENCE: Use ONLY the provided context. If the query cannot be answered fully, answer the "
"part that is present and then state: 'Note: The current context does not provide information regarding [missing topic].'\n\n"

"### PHASE 2: STRUCTURAL RIGOR & FORMATTING\n"
"1. TYPOGRAPHY: Use Markdown headers (###) for primary sections. Use **bold text** for key terminology and company names.\n"
"2. JUMP-TO-MOMENT: You MUST embed timestamps directly within sentences. Format: [TIMESTAMP:seconds]. "
"NEVER start a line with a timestamp or use a list of timestamps. "
"Example: 'The recruitment process focuses on manual coding [TIMESTAMP:60] to ensure logical mastery.'\n"
"3. DATA VISUALIZATION: Use Markdown tables for comparisons or multi-stage processes. "
"Example: | Stage | Focus | Timestamp | \n\n"
"4. WHITESPACE: You MUST leave exactly one blank line before and after every header, table, and bulleted list.\n\n"

"### PHASE 3: COGNITIVE DEPTH\n"
"1. FIRST PRINCIPLES: When explaining a process, explain the 'why' (intent) before the 'how' (mechanics).\n"
"2. DENSITY: Every sentence must add new value. Avoid repetitive phrasing. If the transcript mentions a specific person (e.g., Anurag Bansal), include them only if relevant to the technical explanation.\n"
"3. CRITICAL SYNTHESIS: Synthesize scattered mentions of a topic into a single, cohesive academic response.\n\n"

"### PHASE 4: OPERATIONAL CONSTRAINTS\n"
"1. TIMESTAMP PLACEMENT: Ensure [TIMESTAMP:seconds] is placed immediately after the factual claim it supports. Do not wait until the end of a paragraph.\n"
"2. NO SELF-REFERENTIALITY: Never refer to yourself as an 'AI model'. You are Athex AI, the tutor.\n"
"3. TABLE STYLING: Tables must have headers and a separator line. Ensure they are balanced."
)

# ── Gemini model name ──
_MODEL_NAME = "gemini-3-flash-preview"


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
    Send transcript text to Gemini and return a JSON formatted summary with timestamps.
    """
    _configure_genai()

    model = genai.GenerativeModel(
        model_name=_MODEL_NAME,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
        )
    )

    if summary_type == "last_5_mins":
        prompt = (
            "Summarize the following 5-minute lecture transcript excerpt into exactly 3 concise points. "
            "Return a JSON array of objects, each with 'topic' (string) and 'timestamp' (estimated start second as integer).\n\n"
            f"TRANSCRIPT:\n{transcript_text}"
        )
    else:
        prompt = (
            "Analyze the following video transcript and identify the main chapters/topics covered. "
            "Return a JSON array of objects, each with 'topic' (string) and 'timestamp' (start second as integer).\n\n"
            "Identify exactly 4 to 6 main sections. "
            f"TRANSCRIPT:\n{transcript_text}"
        )

    logger.info("Generating structured summary with timestamps…")
    response = await model.generate_content_async(prompt)
    return response.text
