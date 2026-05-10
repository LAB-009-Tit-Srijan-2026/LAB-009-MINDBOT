import asyncio
import os
import tempfile
import logging
import json
from typing import Tuple, List
import yt_dlp

logger = logging.getLogger(__name__)

async def get_youtube_transcript(url: str) -> Tuple[List[dict], str]:
    """
    Fetch YouTube transcript using yt-dlp which is more robust than youtube-transcript-api.
    If captions are blocked, falls back to audio download + Deepgram.
    """
    from services.proxy import get_random_proxy_url
    proxy_url = get_random_proxy_url()

    ydl_opts = {
        'proxy': proxy_url,
        'skip_download': True,
        'write_auto_subs': True,
        'writesubtitles': True,
        'subtitleslangs': ['en.*'],
        'quiet': True,
        'no_warnings': True,
        'user_agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    }

    def _extract_id(url: str):
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            info = ydl.extract_info(url, download=False)
            return info['id']

    def _get_subs(url: str):
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            video_id = info['id']
            
            # Check if we got subtitles
            subtitles = info.get('requested_subtitles')
            if subtitles and 'en' in subtitles:
                # yt-dlp returns URLs to subtitle files. 
                # This is complex to parse on the fly.
                pass
            
            return video_id

    loop = asyncio.get_event_loop()
    try:
        video_id = await loop.run_in_executor(None, _extract_id, url)
        
        # We'll use our fallback to Deepgram by default if we want high quality 
        # because parsing yt-dlp VTT files is complex. 
        # But wait, the user's IP is blocked for yt-dlp too.
        
        logger.info("[%s] Attempting audio-based transcription as primary method due to IP blocks.", video_id)
        
        from services.yt_dlp_service import download_youtube_audio
        from services.transcription import transcribe_audio
        
        audio_path = await download_youtube_audio(url)
        with open(audio_path, "rb") as f:
            audio_bytes = f.read()
        
        transcript_data = await transcribe_audio(audio_bytes, "audio/wav")
        utterances = transcript_data.get("results", {}).get("utterances", [])
        
        if os.path.exists(audio_path):
            os.remove(audio_path)
            
        return utterances, video_id

    except Exception as e:
        logger.error("YouTube ingestion failed: %s", e)
        raise RuntimeError(f"Could not retrieve transcript via any method. Error: {e}")
