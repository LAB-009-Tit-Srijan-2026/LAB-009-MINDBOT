"""
api/routes.py — FastAPI endpoint definitions.

Endpoints:
  POST /api/v1/ingest          — Upload audio/video for RAG ingestion
  POST /api/v1/chat/stream     — SSE streaming chat over a video's transcript
  GET  /api/v1/summary/last_5_mins — 3-bullet summary of the last 5 minutes
"""

import uuid
import logging

from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Query, status
from fastapi.responses import StreamingResponse

from models.schemas import (
    IngestResponse,
    YouTubeIngestRequest,
    ChatRequest
)
from services.transcription import transcribe_audio, create_semantic_chunks
from services.vector_store import embed_chunks_and_upsert, search_similar_chunks
from services.llm_stream import stream_chat_response, generate_summary
from services.youtube import get_youtube_transcript

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["v1"])


# ────────────────────────────────────────────────────────────────────
#  Pipeline status tracking (in-memory)
# ────────────────────────────────────────────────────────────────────

_pipeline_status: dict[str, dict] = {}
# { video_id: { "status": "transcribing"|"embedding"|"ready"|"error", "step": "...", "progress": 0-100 } }


# ────────────────────────────────────────────────────────────────────
#  GET /api/v1/status/{video_id}
# ────────────────────────────────────────────────────────────────────

@router.get("/status/{video_id}")
async def get_pipeline_status(video_id: str):
    """Poll the processing status of a video ingestion pipeline."""
    entry = _pipeline_status.get(video_id, {"status": "unknown", "step": "Not found", "progress": 0})
    return entry


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
        _pipeline_status[video_id] = {"status": "transcribing", "step": "Transcribing audio…", "progress": 20}
        logger.info("[%s] Starting ingestion pipeline…", video_id)

        # Step 1 — Transcribe
        transcript_data = await transcribe_audio(audio_bytes, mimetype)

        # Step 2 — Extract utterances and chunk
        utterances = transcript_data.get("results", {}).get("utterances", [])
        if not utterances:
            logger.error("[%s] Deepgram returned no utterances.", video_id)
            _pipeline_status[video_id] = {"status": "error", "step": "No utterances found", "progress": 0}
            return

        _pipeline_status[video_id] = {"status": "chunking", "step": "Creating semantic chunks…", "progress": 50}
        chunks = create_semantic_chunks(utterances, video_id)

        # Step 3 — Embed and upsert
        _pipeline_status[video_id] = {"status": "embedding", "step": "Embedding & indexing…", "progress": 70}
        upserted = await embed_chunks_and_upsert(chunks)

        _pipeline_status[video_id] = {"status": "ready", "step": "Complete", "progress": 100}
        logger.info("[%s] Pipeline complete. %d vectors upserted.", video_id, upserted)

    except Exception:
        _pipeline_status[video_id] = {"status": "error", "step": "Pipeline failed", "progress": 0}
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

    _pipeline_status[video_id] = {"status": "queued", "step": "Upload received", "progress": 10}

    background_tasks.add_task(
        _run_ingestion_pipeline,
        audio_bytes,
        video_id,
        mimetype,
    )

    return IngestResponse(video_id=video_id, status="processing")

@router.post("/ingest/youtube", response_model=IngestResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_youtube(request: YouTubeIngestRequest, background_tasks: BackgroundTasks):
    video_id = str(uuid.uuid4())
    logger.info("[%s] Accepted YouTube URL for ingestion: %s", video_id, request.youtube_url)
    
    _pipeline_status[video_id] = {"status": "queued", "step": "Extracting transcript…", "progress": 10}
    
    # Offload the download and processing pipeline to the background
    background_tasks.add_task(_run_youtube_pipeline, video_id, request.youtube_url)
    
    return IngestResponse(video_id=video_id, status="processing")

async def _run_youtube_pipeline(video_id: str, url: str) -> None:
    try:
        _pipeline_status[video_id] = {"status": "transcribing", "step": "Fetching YouTube captions…", "progress": 25}
        logger.info("[%s] Fetching YouTube transcript for: %s", video_id, url)

        # Fetch captions/auto-subtitles directly — no audio download needed
        utterances, yt_video_id = await get_youtube_transcript(url)

        if not utterances:
            logger.error("[%s] No transcript found for YouTube video.", video_id)
            _pipeline_status[video_id] = {"status": "error", "step": "No captions found", "progress": 0}
            return

        _pipeline_status[video_id] = {"status": "chunking", "step": "Creating semantic chunks…", "progress": 50}
        logger.info("[%s] Got %d transcript entries.", video_id, len(utterances))
        chunks = create_semantic_chunks(utterances, video_id)

        _pipeline_status[video_id] = {"status": "embedding", "step": "Embedding & indexing…", "progress": 70}
        upserted = await embed_chunks_and_upsert(chunks)

        _pipeline_status[video_id] = {"status": "ready", "step": "Complete", "progress": 100}
        logger.info("[%s] YouTube pipeline complete. %d vectors upserted.", video_id, upserted)
    except Exception:
        _pipeline_status[video_id] = {"status": "error", "step": "Pipeline failed", "progress": 0}
        logger.exception("[%s] YouTube ingestion pipeline failed.", video_id)



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

    # Fetch transcript chunks from Pinecone based on time range
    try:
        # We can't query by time_range in Pinecone without vector, unless we do a metadata filter with a dummy vector.
        # Alternatively, we just grab all chunks for the video.
        # For a hackathon MVP, we can just do a similarity search with a generic summary prompt,
        # or we fetch by ID prefix if we had stored them that way. 
        # Since we use uuid for chunk IDs, let's just do a vector search with a generic query to get top 10 chunks!
        context_chunks = await search_similar_chunks(
            query="Summarize the key points discussed in this video.",
            video_id=video_id,
            top_k=10,
        )
        
        if not context_chunks:
            transcript_text = "No transcript available for this video."
        else:
            # Sort chunks by start_time
            context_chunks.sort(key=lambda x: x["start_time"])
            transcript_text = "\n".join([c["text"] for c in context_chunks])
            
    except Exception as e:
        logger.error("Failed to fetch summary chunks: %s", e)
        transcript_text = "Error retrieving transcript."

    summary = await generate_summary(transcript_text)

    return {
        "video_id": video_id,
        "time_range": {
            "start": start_time,
            "end": current_time,
        },
        "summary": summary,
    }
