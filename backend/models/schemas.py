"""
models/schemas.py — Pydantic models for all API request/response payloads.
"""

from pydantic import BaseModel, Field


# ── API Responses ──

class IngestResponse(BaseModel):
    """Returned by POST /api/v1/ingest."""
    video_id: str = Field(..., description="Unique identifier assigned to the ingested video.")
    status: str = Field(default="processing", description="Current pipeline status.")


# ── API Requests ──

class YouTubeIngestRequest(BaseModel):
    """Body for POST /api/v1/ingest/youtube."""
    youtube_url: str = Field(..., description="The YouTube URL to ingest.")


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message content")

class ChatRequest(BaseModel):
    """Body for POST /api/v1/chat/stream."""
    session_id: str = Field(..., description="Client-side session identifier.")
    video_id: str = Field(..., description="Target video to query against.")
    query: str = Field(..., min_length=1, description="The student's question.")
    history: list[ChatMessage] = Field(default=[], description="Previous conversation messages in this session.")


class SummaryRequest(BaseModel):
    """Query params model for GET /api/v1/summary."""
    video_id: str = Field(..., description="Target video ID.")
    summary_type: str = Field("topic", description="'topic' or 'last_5_mins'")
    current_time: float = Field(0, ge=0, description="Current playback position in seconds.")


# ── Internal Data Models ──

class ChunkMetadata(BaseModel):
    """Metadata attached to each transcript chunk stored in Pinecone."""
    video_id: str
    start_time: float = Field(..., description="Chunk start time in seconds.")
    end_time: float = Field(..., description="Chunk end time in seconds.")


class TranscriptChunk(BaseModel):
    """A single semantically-chunked transcript block."""
    text: str
    start_time: float
    end_time: float
    video_id: str
