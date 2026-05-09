"""
core/database.py — Client initialization for Pinecone and Supabase.
Uses lazy singletons to avoid import-time side effects.
Pinecone v9 uses IndexAsyncio for native async operations.
"""

import logging
from pinecone import Pinecone

from core.config import get_settings

logger = logging.getLogger(__name__)

# ── Module-level singletons (lazily initialized) ──
_pinecone_client: Pinecone | None = None
_pinecone_index = None
_pinecone_index_async = None


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


import aiosqlite

DB_PATH = "axion.db"

async def init_db():
    """Initialize SQLite database tables for custom authentication."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS otps (
                email TEXT PRIMARY KEY,
                otp_code TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL
            )
        ''')
        await db.commit()
    logger.info("SQLite database initialized at %s.", DB_PATH)

async def get_db():
    """Dependency to get a SQLite DB connection."""
    async with aiosqlite.connect(DB_PATH) as db:
        yield db
