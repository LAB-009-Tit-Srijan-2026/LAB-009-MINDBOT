import asyncio
import os
import logging
import re
from typing import Tuple, List

logger = logging.getLogger(__name__)

def _extract_video_id(url: str) -> str:
    """Extract YouTube video ID using regex to avoid network calls."""
    patterns = [
        r'(?:v=|/v/|youtu\.be/|/embed/|/shorts/)([A-Za-z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    # Fallback if regex fails, try a simple split
    if "youtu.be/" in url:
        return url.split("youtu.be/")[1].split("?")[0]
    return "unknown_id"

async def get_youtube_transcript(url: str) -> Tuple[List[dict], str]:
    """
    Fetch YouTube transcript using audio-based transcription via Deepgram.
    This is the most robust method for cloud servers.
    """
    video_id = _extract_video_id(url)
    
    try:
        logger.info("[%s] Starting audio-based transcription pipeline for: %s", video_id, url)
        
        from services.yt_dlp_service import download_youtube_audio
        from services.transcription import transcribe_audio
        
        # 1. Download audio (using rotating proxies and mobile user-agent)
        audio_path = await download_youtube_audio(url)
        
        try:
            # 2. Transcribe with Deepgram
            with open(audio_path, "rb") as f:
                audio_bytes = f.read()
            
            transcript_data = await transcribe_audio(audio_bytes, "audio/wav")
            utterances = transcript_data.get("results", {}).get("utterances", [])
            
            if not utterances:
                # Some deepgram versions return results in a different structure
                # Check for alternatives
                results = transcript_data.get("results", {})
                channels = results.get("channels", [])
                if channels:
                    alternatives = channels[0].get("alternatives", [])
                    if alternatives:
                        utterances = alternatives[0].get("utterances", [])
            
            logger.info("[%s] Successfully transcribed %d utterances via Deepgram.", video_id, len(utterances))
            return utterances, video_id
            
        finally:
            # 3. Always cleanup
            if os.path.exists(audio_path):
                os.remove(audio_path)
                logger.info("[%s] Cleaned up temporary audio file.", video_id)

    except Exception as e:
        logger.error("[%s] YouTube ingestion failed: %s", video_id, e)
        # Provide a more user-friendly error message for bot detection
        if "confirm you're not a bot" in str(e):
             raise RuntimeError("YouTube is blocking our server. Please try again in a few minutes or upload the video file directly.")
        raise RuntimeError(f"Could not retrieve transcript via any method. Error: {e}")
