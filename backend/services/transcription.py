"""
services/transcription.py — Deepgram audio transcription and semantic chunking.

Handles:
  1. Sending audio buffers to Deepgram Nova-2 (sync SDK wrapped in asyncio.to_thread)
     with word-level timestamps.
  2. Grouping utterances into ~45-second semantic chunks via a sliding-window approach.
"""

import asyncio
import logging
from deepgram import DeepgramClient
from core.config import get_settings

logger = logging.getLogger(__name__)


# ────────────────────────────────────────────────────────────────────
#  1.  Deepgram Transcription
# ────────────────────────────────────────────────────────────────────

async def transcribe_audio(audio_buffer: bytes, mimetype: str = "audio/wav") -> dict:
    """
    Send an audio/video buffer to Deepgram and return the full transcript
    response as a dictionary including word-level timestamps.

    Uses the Nova-2 model with utterances and punctuation enabled.
    Deepgram SDK v7 uses client.listen.v1.media.transcribe_file().
    """
    settings = get_settings()
    client = DeepgramClient(api_key=settings.DEEPGRAM_API_KEY)

    logger.info("Sending %d bytes (%s) to Deepgram for transcription…", len(audio_buffer), mimetype)

    # Deepgram SDK v7: client.listen.v1.media.transcribe_file() is synchronous
    def _transcribe():
        response = client.listen.v1.media.transcribe_file(
            request=audio_buffer,
            model="nova-2",
            utterances=True,
            punctuate=True,
            smart_format=True,
        )
        return response

    response = await asyncio.to_thread(_transcribe)

    # Convert to dict — response is a Pydantic-like model
    if hasattr(response, "to_dict"):
        result = response.to_dict()
    elif hasattr(response, "model_dump"):
        result = response.model_dump()
    else:
        result = dict(response)

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
