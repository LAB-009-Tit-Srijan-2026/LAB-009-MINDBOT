"""
services/youtube.py — YouTube transcript extraction via youtube-transcript-api.

Fetches official captions/auto-generated subtitles directly from YouTube.
No audio download or external transcription service needed for YouTube videos.
Supports any language and translates to English if needed.
"""

import asyncio
import re
import logging
from typing import Tuple, List

from youtube_transcript_api import YouTubeTranscriptApi

logger = logging.getLogger(__name__)


def _extract_video_id(url: str) -> str:
    """Extract YouTube video ID from any YouTube URL format."""
    patterns = [
        r'(?:v=|/v/|youtu\.be/|/embed/|/shorts/)([A-Za-z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError(f"Could not extract video ID from URL: {url}")


def _fetch_transcript_sync(video_id: str) -> List[dict]:
    """
    Fetch YouTube transcript using the v1.2+ API.
    Tries English first, then any available language (with translation to English if possible).
    Returns list of dicts: [{'text': '...', 'start': float, 'duration': float}, ...]
    """
    ytt = YouTubeTranscriptApi()

    # First, try to fetch English directly
    try:
        result = ytt.fetch(video_id, languages=['en', 'en-US', 'en-GB'])
        snippets = list(result)
        logger.info("[%s] Got %d English transcript snippets.", video_id, len(snippets))
        return [{'text': s.text, 'start': s.start, 'duration': s.duration} for s in snippets]
    except Exception as e:
        logger.info("[%s] No English transcript, trying other languages: %s", video_id, e)

    # List all available transcripts
    try:
        transcript_list = ytt.list(video_id)
    except Exception as e:
        raise RuntimeError(f"Could not list transcripts for {video_id}: {e}")

    # Try to find any generated transcript and translate to English
    try:
        generated = transcript_list.find_generated_transcript(['hi', 'es', 'fr', 'de', 'ja', 'ko', 'pt', 'ru', 'zh'])
        # Try translating to English
        try:
            translated = generated.translate('en')
            result = translated.fetch()
            snippets = list(result)
            logger.info("[%s] Got %d translated-to-English snippets.", video_id, len(snippets))
            return [{'text': s.text, 'start': s.start, 'duration': s.duration} for s in snippets]
        except Exception:
            # Use original language if translation fails
            result = generated.fetch()
            snippets = list(result)
            logger.info("[%s] Got %d snippets in original language.", video_id, len(snippets))
            return [{'text': s.text, 'start': s.start, 'duration': s.duration} for s in snippets]
    except Exception:
        pass

    # Last resort: try manually created transcript in any language
    try:
        manual = transcript_list.find_manually_created_transcript(['en', 'hi', 'es', 'fr', 'de'])
        try:
            translated = manual.translate('en')
            result = translated.fetch()
            snippets = list(result)
            return [{'text': s.text, 'start': s.start, 'duration': s.duration} for s in snippets]
        except Exception:
            result = manual.fetch()
            snippets = list(result)
            return [{'text': s.text, 'start': s.start, 'duration': s.duration} for s in snippets]
    except Exception:
        pass

    # Absolute fallback: fetch whatever is available
    try:
        result = ytt.fetch(video_id)
        snippets = list(result)
        logger.info("[%s] Got %d snippets via fallback fetch.", video_id, len(snippets))
        return [{'text': s.text, 'start': s.start, 'duration': s.duration} for s in snippets]
    except Exception as e:
        raise RuntimeError(f"Could not fetch any transcript for {video_id}: {e}")


def transcript_entries_to_utterances(entries: List[dict]) -> List[dict]:
    """
    Convert YouTube transcript entries to utterance-like dicts
    compatible with create_semantic_chunks.

    Output format: [{'transcript': '...', 'start': X, 'end': Y}, ...]
    """
    utterances = []
    for entry in entries:
        text = entry.get('text', '').strip()
        if not text:
            continue
        start = entry.get('start', 0)
        duration = entry.get('duration', 2.0)
        utterances.append({
            'transcript': text,
            'start': start,
            'end': start + duration,
        })
    return utterances


async def get_youtube_transcript(url: str) -> Tuple[List[dict], str]:
    """
    Asynchronously fetch YouTube transcript entries and video ID.
    Returns (utterances_list, youtube_video_id).
    """
    video_id = _extract_video_id(url)
    entries = await asyncio.to_thread(_fetch_transcript_sync, video_id)
    utterances = transcript_entries_to_utterances(entries)
    logger.info("[%s] Extracted %d utterances from YouTube transcript.", video_id, len(utterances))
    return utterances, video_id
