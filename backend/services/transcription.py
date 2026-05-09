"""
services/transcription.py — Deepgram audio transcription and semantic chunking.

Handles:
  1. Sending a YouTube/audio URL directly to Deepgram (URL-based transcription).
  2. Sending raw audio buffers for file-based uploads.
  3. Grouping utterances into ~45-second semantic chunks via a sliding-window approach.
"""

import logging
import httpx

from core.config import get_settings

logger = logging.getLogger(__name__)


# ────────────────────────────────────────────────────────────────────
#  1a. Deepgram Transcription — from a public URL (YouTube-friendly)
# ────────────────────────────────────────────────────────────────────

async def transcribe_from_url(audio_url: str) -> dict:
    """
    Tell Deepgram to fetch and transcribe audio from a public URL.
    This avoids upload timeouts entirely — ideal for YouTube audio streams.
    """
    settings = get_settings()
    logger.info("Requesting Deepgram to transcribe URL: %s", audio_url[:80])

    api_url = (
        "https://api.deepgram.com/v1/listen"
        "?model=nova-2&punctuate=true&smart_format=true&utterances=true"
    )
    headers = {
        "Authorization": f"Token {settings.DEEPGRAM_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {"url": audio_url}

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(api_url, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()

    utterance_count = len(result.get("results", {}).get("utterances", []))
    logger.info("Deepgram returned %d utterances from URL.", utterance_count)
    return result


# ────────────────────────────────────────────────────────────────────
#  1b. Deepgram Transcription — raw bytes upload (file uploads)
# ────────────────────────────────────────────────────────────────────

async def transcribe_audio(audio_buffer: bytes, mimetype: str = "audio/wav") -> dict:
    """
    Send an audio/video buffer to Deepgram and return the full transcript.
    Used for local file uploads.
    """
    settings = get_settings()
    logger.info("Sending %d bytes (%s) to Deepgram for transcription…", len(audio_buffer), mimetype)

    url = (
        "https://api.deepgram.com/v1/listen"
        "?model=nova-2&punctuate=true&smart_format=true&utterances=true"
    )
    headers = {
        "Authorization": f"Token {settings.DEEPGRAM_API_KEY}",
        "Content-Type": mimetype,
    }

    async with httpx.AsyncClient(timeout=600.0) as client:
        response = await client.post(url, headers=headers, content=audio_buffer)
        response.raise_for_status()
        result = response.json()

    utterance_count = len(result.get("results", {}).get("utterances", []))
    logger.info("Deepgram returned %d utterances.", utterance_count)
    return result


# ────────────────────────────────────────────────────────────────────
#  2.  Semantic Chunker  (sliding-window, ~45-second blocks)
# ────────────────────────────────────────────────────────────────────

def create_semantic_chunks(
    utterances: list[dict],
    video_id: str,
    window_seconds: float = 45.0,
    overlap_seconds: float = 5.0,
) -> list[dict]:
    """
    Group Deepgram utterances into ~45-second semantic blocks.

    Each block is a dict:
        {"text": "…", "start_time": X, "end_time": Y, "video_id": "…"}

    A sliding-window overlap of `overlap_seconds` ensures no context is
    lost at chunk boundaries.
    """
    if not utterances:
        logger.warning("No utterances to chunk.")
        return []

    chunks: list[dict] = []
    current_texts: list[str] = []
    chunk_start: float | None = None
    chunk_end: float = 0.0

    for utt in utterances:
        utt_start: float = utt["start"]
        utt_end: float = utt["end"]
        utt_text: str = utt["transcript"]

        # Initialize first chunk
        if chunk_start is None:
            chunk_start = utt_start

        # If this utterance pushes the window past the threshold, finalize
        if current_texts and (utt_end - chunk_start) > window_seconds:
            chunks.append({
                "text": " ".join(current_texts),
                "start_time": chunk_start,
                "end_time": chunk_end,
                "video_id": video_id,
            })

            # Sliding window: start the next chunk with overlap
            overlap_start = max(chunk_end - overlap_seconds, chunk_start)
            overlap_texts = []
            for prev_utt in utterances:
                if prev_utt["start"] >= overlap_start and prev_utt["end"] <= chunk_end:
                    overlap_texts.append(prev_utt["transcript"])

            current_texts = overlap_texts + [utt_text]
            chunk_start = overlap_start if overlap_texts else utt_start
            chunk_end = utt_end
        else:
            current_texts.append(utt_text)
            chunk_end = utt_end

    # Flush remaining utterances
    if current_texts and chunk_start is not None:
        chunks.append({
            "text": " ".join(current_texts),
            "start_time": chunk_start,
            "end_time": chunk_end,
            "video_id": video_id,
        })

    logger.info(
        "Created %d semantic chunks (window=%.0fs, overlap=%.0fs) for video %s.",
        len(chunks), window_seconds, overlap_seconds, video_id,
    )
    return chunks
