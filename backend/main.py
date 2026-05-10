"""
main.py — FastAPI application entry point for Athex.

Configures:
  • CORS middleware (all origins — hackathon mode)
  • Structured logging
  • API v1 router
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from api.auth import router as auth_router
from core.database import init_db

# ── Logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(name)s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("omega")


# ── Lifespan (startup / shutdown hooks) ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Athex backend starting…")
    await init_db()
    yield
    logger.info("👋 Athex backend shutting down.")


# ── Application ──
app = FastAPI(
    title="Athex — LMS Video Companion",
    description=(
        "AI-Powered Retrieval-Augmented Generation backend for educational "
        "video analysis.  Transcribe → Chunk → Embed → Retrieve → Stream."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── Allowed origins ──
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://athex.xyz",
    "https://app.athex.xyz",
]

# ── CORS Middleware ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount API routes ──
app.include_router(router)
app.include_router(auth_router)


# ── Health check ──
@app.get("/health", tags=["system"])
async def health_check():
    """Liveness probe."""
    return {"status": "healthy", "service": "project-omega", "version": "1.0.0"}


# ── Run with: uvicorn main:app --reload ──
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
