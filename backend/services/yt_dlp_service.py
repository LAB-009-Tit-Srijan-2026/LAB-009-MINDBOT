import asyncio
import os
import tempfile
import logging
import yt_dlp

logger = logging.getLogger(__name__)

async def download_youtube_audio(url: str) -> str:
    """
    Download audio from a YouTube URL and return the path to the temporary file.
    The caller is responsible for deleting the file.
    """
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(tempfile.gettempdir(), '%(id)s.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'extractor_args': {
            'youtube': {
                'player_client': ['mweb', 'android', 'web'],
                'skip': ['hls', 'dash']
            }
        }
    }

    def _download():
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            return ydl.prepare_filename(info)

    # Run in a thread to avoid blocking the event loop
    loop = asyncio.get_event_loop()
    file_path = await loop.run_in_executor(None, _download)
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Could not find downloaded audio file at {file_path}")
            
    logger.info("Downloaded YouTube audio to: %s", file_path)
    return file_path
