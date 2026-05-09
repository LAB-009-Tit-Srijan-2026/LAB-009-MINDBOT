"""
api/routes.py — FastAPI endpoint definitions.

Endpoints:
  POST /api/v1/ingest          — Upload audio/video for RAG ingestion
  POST /api/v1/chat/stream     — SSE streaming chat over a video's transcript
  GET  /api/v1/summary/last_5_mins — 3-bullet summary of the last 5 minutes
"""

import uuid
import logging

from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Query
from fastapi.responses import StreamingResponse

from models.schemas import ChatRequest, IngestResponse
from services.transcription import transcribe_audio, create_semantic_chunks
from services.vector_store import embed_chunks_and_upsert, search_similar_chunks
from services.llm_stream import stream_chat_response, generate_summary

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["v1"])


# ────────────────────────────────────────────────────────────────────
#  Background pipeline used by the /ingest endpoint
# ────────────────────────────────────────────────────────────────────

async def _run_ingestion_pipeline(
    audio_bytes: bytes,
    video_id: str,
    mimetype: str,
) -> None:
    """
    Full async pipeline:
      Deepgram transcription → Semantic chunking → Voyage-4-Large embedding → Pinecone upsert
    """
    try:
        logger.info("[%s] Starting ingestion pipeline…", video_id)

        # Step 1 — Transcribe
        transcript_data = await transcribe_audio(audio_bytes, mimetype)

        # Step 2 — Extract utterances and chunk
        utterances = transcript_data.get("results", {}).get("utterances", [])
        if not utterances:
            logger.error("[%s] Deepgram returned no utterances.", video_id)
            return

        chunks = create_semantic_chunks(utterances, video_id)

        # Step 3 — Embed and upsert
        upserted = await embed_chunks_and_upsert(chunks)

        logger.info("[%s] Pipeline complete. %d vectors upserted.", video_id, upserted)

    except Exception:
        logger.exception("[%s] Ingestion pipeline failed.", video_id)


# ────────────────────────────────────────────────────────────────────
#  POST /api/v1/ingest
# ────────────────────────────────────────────────────────────────────

@router.post("/ingest", response_model=IngestResponse, status_code=202)
async def ingest_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Audio or video file to ingest."),
):
    """
    Accept an audio/video upload and kick off the RAG ingestion pipeline
    as a background task.  Returns 202 Accepted immediately.
    """
    video_id = str(uuid.uuid4())
    audio_bytes = await file.read()
    mimetype = file.content_type or "audio/wav"

    logger.info(
        "Received upload '%s' (%s, %d bytes). Assigned video_id=%s",
        file.filename, mimetype, len(audio_bytes), video_id,
    )

    background_tasks.add_task(
        _run_ingestion_pipeline,
        audio_bytes,
        video_id,
        mimetype,
    )

    return IngestResponse(video_id=video_id, status="processing")


# ────────────────────────────────────────────────────────────────────
#  POST /api/v1/chat/stream
# ────────────────────────────────────────────────────────────────────

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Retrieve relevant transcript chunks for the user's query, then
    stream a Gemini-powered answer as Server-Sent Events.
    """
    logger.info(
        "Chat request — session=%s, video=%s, query='%s'",
        request.session_id, request.video_id, request.query[:80],
    )

    # Step 1 — Retrieve context via asymmetric search (voyage-4-lite)
    context_chunks = await search_similar_chunks(
        query=request.query,
        video_id=request.video_id,
        top_k=3,
    )

    if not context_chunks:
        logger.warning("No matching chunks found for video %s.", request.video_id)

    # Step 2 — Return SSE stream
    return StreamingResponse(
        stream_chat_response(request.query, context_chunks),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ────────────────────────────────────────────────────────────────────
#  GET /api/v1/summary/last_5_mins
# ────────────────────────────────────────────────────────────────────

@router.get("/summary/last_5_mins")
async def get_summary(
    video_id: str = Query(..., description="Target video ID."),
    current_time: float = Query(..., ge=0, description="Current playback position in seconds."),
):
    """
    Generate a 3-bullet-point summary of the last 5 minutes of a video's
    transcript.  Currently uses a mock transcript (Supabase fetch TBD).
    """
    start_time = max(0, current_time - 300)

    logger.info(
        "Summary request — video=%s, range=%.0fs–%.0fs",
        video_id, start_time, current_time,
    )

    # ── Mock transcript (replace with Supabase query when ready) ──
    mock_transcript = (
        f"From {start_time:.0f}s to {current_time:.0f}s: "
        "The instructor discussed the fundamentals of machine learning, "
        "covering supervised learning techniques including linear regression "
        "and decision trees. The lecture then transitioned into unsupervised "
        "learning methods, specifically k-means clustering and dimensionality "
        "reduction using PCA. Key examples included applying these techniques "
        "to real-world datasets for predictive analytics and pattern recognition. "
        "The session concluded with a brief overview of model evaluation metrics "
        "such as accuracy, precision, recall, and F1 score."
    )

    summary = await generate_summary(mock_transcript)

    return {
        "video_id": video_id,
        "time_range": {
            "start": start_time,
            "end": current_time,
        },
        "summary": summary,
    }
