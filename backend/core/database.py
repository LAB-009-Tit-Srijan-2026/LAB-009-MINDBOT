"""
core/database.py — Client initialization for Pinecone and Supabase.
Uses lazy singletons to avoid import-time side effects.
Pinecone v9 uses IndexAsyncio for native async operations.
"""

import logging
from pinecone import Pinecone
from supabase import create_client, Client as SupabaseClient
from core.config import get_settings

logger = logging.getLogger(__name__)

# ── Module-level singletons (lazily initialized) ──
_pinecone_client: Pinecone | None = None
_pinecone_index = None
_pinecone_index_async = None
_supabase_client: SupabaseClient | None = None


def get_pinecone_index():
    """Return a cached synchronous Pinecone index handle."""
    global _pinecone_client, _pinecone_index
    if _pinecone_index is None:
        settings = get_settings()
        _pinecone_client = Pinecone(api_key=settings.PINECONE_API_KEY)
        _pinecone_index = _pinecone_client.Index(settings.PINECONE_INDEX_NAME)
        logger.info("Pinecone sync index '%s' connected.", settings.PINECONE_INDEX_NAME)
    return _pinecone_index


def get_pinecone_index_async():
    """Return a cached async Pinecone index handle (Pinecone v9+)."""
    global _pinecone_client, _pinecone_index_async
    if _pinecone_index_async is None:
        settings = get_settings()
        if _pinecone_client is None:
            _pinecone_client = Pinecone(api_key=settings.PINECONE_API_KEY)
        host = _pinecone_client.describe_index(settings.PINECONE_INDEX_NAME).host
        _pinecone_index_async = _pinecone_client.IndexAsyncio(host=host)
        logger.info("Pinecone async index '%s' connected.", settings.PINECONE_INDEX_NAME)
    return _pinecone_index_async


def get_supabase_client() -> SupabaseClient:
    """Return a cached Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        settings = get_settings()
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        logger.info("Supabase client connected.")
    return _supabase_client
