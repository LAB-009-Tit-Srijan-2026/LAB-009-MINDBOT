"""
core/config.py — Centralized configuration via Pydantic BaseSettings.
All API keys and service parameters are loaded from environment variables.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from .env file or environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # ── Deepgram (Audio Transcription) ──
    DEEPGRAM_API_KEY: str

    # ── Voyage AI (Vector Embeddings) ──
    VOYAGE_API_KEY: str

    # ── Pinecone (Vector Database) ──
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str = "lms-vectors"

    # ── Supabase / PostgreSQL ──
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # ── Gemini (Generation LLM) ──
    GEMINI_API_KEY: str

    # ── Custom Auth SMTP & Security ──
    SMTP_SERVER: str
    SMTP_PORT: int
    SMTP_USERNAME: str
    SMTP_PASSWORD: str
    JWT_SECRET: str
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "https://api.athex.xyz/api/v1/auth/google/callback"
    HTTPS_PROXY: str = ""


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings singleton."""
    return Settings()
