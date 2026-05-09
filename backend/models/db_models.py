"""
models/db_models.py — (Optional) Relational database model definitions.
Expand these when moving from mock Supabase to a live PostgreSQL schema.
"""

from pydantic import BaseModel, Field
from datetime import datetime


class VideoRecord(BaseModel):
    """Represents a video row in the relational database."""
    id: str
    filename: str
    status: str = "processing"
    chunk_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ChatSession(BaseModel):
    """Represents a chat session tied to a video."""
    session_id: str
    video_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
