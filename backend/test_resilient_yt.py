import yt_dlp

url = 'https://www.youtube.com/watch?v=xsNoDp__StQ'
opts = {
    'format': 'bestaudio/best',
    'user_agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    'extractor_args': {
        'youtube': {
            'player_client': ['ios', 'web']
        }
    }
}

try:
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
        print(f"SUCCESS: {info['title']}")
except Exception as e:
    print(f"FAILED: {e}")
