"""
main.py — FastAPI application entry point for Axion.

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
    logger.info("🚀 Axion backend starting…")
    yield
    logger.info("👋 Axion backend shutting down.")


# ── Application ──
app = FastAPI(
    title="Axion — LMS Video Companion",
    description=(
        "AI-Powered Retrieval-Augmented Generation backend for educational "
        "video analysis.  Transcribe → Chunk → Embed → Retrieve → Stream."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS — allow all origins (hackathon) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount API routes ──
app.include_router(router)


# ── Health check ──
@app.get("/health", tags=["system"])
async def health_check():
    """Liveness probe."""
    return {"status": "healthy", "service": "project-omega", "version": "1.0.0"}


# ── Run with: uvicorn main:app --reload ──
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
