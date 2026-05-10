"""
api/routes.py — FastAPI endpoint definitions.

Endpoints:
  POST /api/v1/ingest          — Upload audio/video for RAG ingestion
  POST /api/v1/chat/stream     — SSE streaming chat over a video's transcript
  GET  /api/v1/summary/last_5_mins — 3-bullet summary of the last 5 minutes
"""

import uuid
import json
import logging

from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Query, status, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse, FileResponse
from fpdf import FPDF
import io

from models.schemas import (
    IngestResponse,
    YouTubeIngestRequest,
    ChatRequest
)
from services.transcription import transcribe_audio, create_semantic_chunks
from services.vector_store import embed_chunks_and_upsert, search_similar_chunks, fetch_video_chunks
from services.llm_stream import stream_chat_response, generate_summary
from services.youtube import get_youtube_transcript
from core.database import get_db
from api.dependencies import get_current_user
import aiosqlite

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
    user_id: str,
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
        upserted = await embed_chunks_and_upsert(chunks, user_id)

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
    user: dict = Depends(get_current_user)
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
        user.id,
    )

    # Persist project metadata
    async with aiosqlite.connect("axion.db") as db:
        await db.execute(
            "INSERT INTO projects (id, user_id, title) VALUES (?, ?, ?)",
            (video_id, user.id, file.filename)
        )
        await db.commit()

    return IngestResponse(video_id=video_id, status="processing")

@router.post("/ingest/youtube", response_model=IngestResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_youtube(
    request: YouTubeIngestRequest, 
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    video_id = str(uuid.uuid4())
    logger.info("[%s] Accepted YouTube URL for ingestion: %s", video_id, request.youtube_url)
    
    _pipeline_status[video_id] = {"status": "queued", "step": "Extracting transcript…", "progress": 10}
    
    # Offload the download and processing pipeline to the background
    background_tasks.add_task(_run_youtube_pipeline, video_id, request.youtube_url, user.id)
    
    # Persist project metadata
    async with aiosqlite.connect("axion.db") as db:
        await db.execute(
            "INSERT INTO projects (id, user_id, title, yt_url) VALUES (?, ?, ?, ?)",
            (video_id, user.id, "YouTube Video", request.youtube_url)
        )
        await db.commit()

    return IngestResponse(video_id=video_id, status="processing")

async def _run_youtube_pipeline(video_id: str, url: str, user_id: str) -> None:
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
        upserted = await embed_chunks_and_upsert(chunks, user_id)

        _pipeline_status[video_id] = {"status": "ready", "step": "Complete", "progress": 100}
        logger.info("[%s] YouTube pipeline complete. %d vectors upserted.", video_id, upserted)
    except Exception:
        _pipeline_status[video_id] = {"status": "error", "step": "Pipeline failed", "progress": 0}
        logger.exception("[%s] YouTube ingestion pipeline failed.", video_id)



# ────────────────────────────────────────────────────────────────────
#  POST /api/v1/chat/stream
# ────────────────────────────────────────────────────────────────────

@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    user: dict = Depends(get_current_user)
):
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
        user_id=user.id,
        top_k=8,
    )

    if not context_chunks:
        logger.warning("No matching chunks found for video %s.", request.video_id)

    history_dicts = [{"role": msg.role, "content": msg.content} for msg in request.history]

    # Step 2 — Return SSE stream
    return StreamingResponse(
        stream_chat_response(request.query, context_chunks, history_dicts),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ────────────────────────────────────────────────────────────────────
#  GET /api/v1/summary
# ────────────────────────────────────────────────────────────────────

@router.get("/summary")
async def get_summary(
    video_id: str = Query(..., description="Target video ID."),
    summary_type: str = Query("topic", description="'topic' or 'last_5_mins'"),
    current_time: float = Query(0, ge=0, description="Current playback position in seconds."),
    user: dict = Depends(get_current_user)
):
    """
    Generate a dynamic summary based on the requested summary_type.
    """
    logger.info("Summary request — video=%s, type=%s, current_time=%.0f", video_id, summary_type, current_time)

    try:
        if summary_type == "last_5_mins":
            # Ensure we always fetch at least some context (min 5 min window)
            window_end = max(300, current_time)
            window_start = max(0, window_end - 300)
            
            context_chunks = await fetch_video_chunks(
                video_id=video_id,
                user_id=user.id,
                limit=15,
                time_range=(window_start, window_end)
            )
        else:
            # Topic Overview: generic fetch to get a broad sample of the video
            context_chunks = await fetch_video_chunks(
                video_id=video_id,
                user_id=user.id,
                limit=20
            )
        
        if not context_chunks:
            transcript_text = "No transcript available for this video."
        else:
            # Sort chunks chronologically
            context_chunks.sort(key=lambda x: x["start_time"])
            transcript_text = "\n".join([c["text"] for c in context_chunks])
            
    except Exception as e:
        logger.error("Failed to fetch summary chunks: %s", e)
        transcript_text = "Error retrieving transcript."

    summary_raw = await generate_summary(transcript_text, summary_type)
    
    try:
        # Try to parse as JSON if structured summary
        summary_data = json.loads(summary_raw)
    except:
        summary_data = summary_raw

    return {
        "video_id": video_id,
        "summary_type": summary_type,
        "time_range": {
            "start": max(0, current_time - 300) if summary_type == "last_5_mins" else 0,
            "end": current_time,
        },
        "content": summary_data
    }

# ────────────────────────────────────────────────────────────────────
#  GET /api/v1/study-material
# ────────────────────────────────────────────────────────────────────

from services.llm_structured import generate_structured_content

@router.get("/study-material")
async def get_study_material(
    video_id: str = Query(..., description="Target video ID."),
    material_type: str = Query(..., description="'notes', 'quiz', 'flashcards', or 'mock_test'"),
    user: dict = Depends(get_current_user)
):
    """
    Generate structured study material from the video transcript.
    """
    logger.info("Study material request — video=%s, type=%s", video_id, material_type)

    try:
        # Fetch chunks without calling Voyage AI (to avoid rate limits)
        context_chunks = await fetch_video_chunks(
            video_id=video_id,
            user_id=user.id,
            limit=50
        )
        
        if not context_chunks:
            # Check if processing is actually done or if it failed
            status_entry = _pipeline_status.get(video_id)
            if status_entry and status_entry.get("status") == "error":
                raise HTTPException(
                    status_code=404, 
                    detail=f"Study material cannot be generated because the video processing failed: {status_entry.get('step')}"
                )
            elif status_entry and status_entry.get("status") != "ready":
                raise HTTPException(
                    status_code=202, 
                    detail="Video is still being processed. Please try again in a moment."
                )
            else:
                raise HTTPException(status_code=404, detail="No transcript available for this video.")
            
        # Sort chronologically
        context_chunks.sort(key=lambda x: x["start_time"])
        transcript_text = "\n".join([c["text"] for c in context_chunks])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to fetch chunks for study material: %s", e)
        raise HTTPException(status_code=500, detail=f"Error retrieving transcript context: {str(e)}")

    try:
        # Generate structured JSON
        json_str = await generate_structured_content(transcript_text, material_type)
        # Parse it to ensure it's valid JSON before returning
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        logger.error("LLM failed to return valid JSON: %s\nOutput: %s", e, json_str)
        raise HTTPException(status_code=500, detail="Failed to generate valid structured content.")
    except Exception as e:
        logger.error("Failed to generate study material: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate study material.")

# ────────────────────────────────────────────────────────────────────
#  SESSIONS / HISTORY
# ────────────────────────────────────────────────────────────────────

@router.get("/projects")
async def list_projects(user: dict = Depends(get_current_user)):
    """List all projects for the current user."""
    async with aiosqlite.connect("axion.db") as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, title, yt_url, created_at FROM projects WHERE user_id = ? ORDER BY created_at DESC",
            (user.id,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

@router.get("/chat/history")
async def get_chat_history(
    video_id: str = Query(..., description="Target video ID."),
    user: dict = Depends(get_current_user)
):
    """Retrieve chat history for a specific project."""
    async with aiosqlite.connect("axion.db") as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT role, content, created_at FROM messages WHERE project_id = ? AND user_id = ? ORDER BY created_at ASC",
            (video_id, user.id)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

class SaveMessageRequest(ChatRequest):
    role: str
    content: str

@router.post("/chat/message")
async def save_chat_message(
    video_id: str,
    role: str,
    content: str,
    user: dict = Depends(get_current_user)
):
    """Save a single chat message to history."""
    async with aiosqlite.connect("axion.db") as db:
        await db.execute(
            "INSERT INTO messages (project_id, user_id, role, content) VALUES (?, ?, ?, ?)",
            (video_id, user.id, role, content)
        )
        await db.commit()
    return {"status": "saved"}
@router.get("/export/pdf")
async def export_pdf(
    video_id: str = Query(...),
    user: dict = Depends(get_current_user),
):
    """
    Export generated notes as a PDF.
    """
    try:
        # 1. Fetch chunks for context
        context_chunks = await fetch_video_chunks(video_id=video_id, user_id=user.id, limit=100)
        if not context_chunks:
            raise HTTPException(status_code=404, detail="No content found for this session.")
        
        context_chunks.sort(key=lambda x: x["start_time"])
        transcript_text = "\n".join([c["text"] for c in context_chunks])

        # 2. Generate content (using existing logic)
        from services.llm_structured import generate_structured_content
        content = await generate_structured_content(transcript_text, "notes")

        # 3. Create PDF with better character handling
        class PDF(FPDF):
            def header(self):
                self.set_font('helvetica', 'B', 15)
                self.cell(0, 10, 'Athex - Study Notes', border=False, ln=True, align='C')
                self.set_draw_color(0, 255, 128)
                self.line(10, 22, 200, 22)
                self.ln(12)

            def footer(self):
                self.set_y(-15)
                self.set_font('helvetica', 'I', 8)
                self.set_text_color(150)
                self.cell(0, 10, f'Generated by Athex AI - Page {self.page_no()}', 0, 0, 'C')

        pdf = PDF()
        pdf.add_page()
        pdf.set_font("helvetica", size=11)
        
        # Helper to clean text for Latin-1 FPDF
        def clean_text(t):
            # Replace common problematic characters
            t = t.replace('’', "'").replace('‘', "'").replace('—', "-").replace('–', "-")
            t = t.replace('“', '"').replace('”', '"').replace('•', '*')
            # Force encode to latin-1 and ignore what's left
            return t.encode('latin-1', 'replace').decode('latin-1').replace('?', '')

        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                pdf.ln(4)
                continue

            if line.startswith('# '):
                pdf.set_font("helvetica", 'B', 20)
                pdf.set_text_color(0, 0, 0)
                pdf.multi_cell(0, 12, clean_text(line[2:]))
                pdf.ln(4)
            elif line.startswith('## '):
                pdf.set_font("helvetica", 'B', 16)
                pdf.set_text_color(40, 40, 40)
                pdf.multi_cell(0, 10, clean_text(line[3:]))
                pdf.ln(2)
            elif line.startswith('### '):
                pdf.set_font("helvetica", 'B', 13)
                pdf.set_text_color(60, 60, 60)
                pdf.multi_cell(0, 8, clean_text(line[4:]))
                pdf.ln(1)
            elif line.startswith('- ') or line.startswith('* '):
                pdf.set_font("helvetica", size=11)
                pdf.set_text_color(80, 80, 80)
                # Bullet point indentation
                current_x = pdf.get_x()
                pdf.set_x(current_x + 5)
                pdf.multi_cell(0, 6, f"• {clean_text(line[2:])}")
                pdf.set_x(current_x)
        # 4. Stream PDF response
        from fastapi.responses import StreamingResponse
        import io
        
        # Get PDF data as bytes
        pdf_out = pdf.output(dest='S')
        if isinstance(pdf_out, (bytearray, str)):
            # If it's a string (old fpdf), encode it. If bytearray, convert to bytes.
            if isinstance(pdf_out, str):
                pdf_out = pdf_out.encode('latin-1')
            else:
                pdf_out = bytes(pdf_out)
        
        return StreamingResponse(
            io.BytesIO(pdf_out),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Athex_Notes_{video_id[:8]}.pdf"
            }
        )

    except Exception as e:
        logger.exception("PDF export failed")
        raise HTTPException(status_code=500, detail=str(e))
