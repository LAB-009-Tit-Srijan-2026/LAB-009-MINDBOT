import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"
SAMPLE_AUDIO_URL = "https://dpgr.am/spacewalk.wav"

async def main():
    print("Starting End-to-End Test for Project Omega\n")
    
    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        # 1. Download sample audio
        print("1. Downloading sample audio...")
        audio_response = await client.get(SAMPLE_AUDIO_URL)
        audio_response.raise_for_status()
        audio_bytes = audio_response.content
        print(f"   Downloaded {len(audio_bytes)} bytes.\n")
        
        # 2. Ingest the audio
        print("2. Ingesting audio to /ingest...")
        files = {"file": ("preamble.wav", audio_bytes, "audio/wav")}
        ingest_res = await client.post(f"{BASE_URL}/ingest", files=files)
        ingest_res.raise_for_status()
        ingest_data = ingest_res.json()
        video_id = ingest_data["video_id"]
        print(f"   Ingest Response: {ingest_data}")
        print(f"   Video ID: {video_id}")
        
        # 3. Wait for background task (Deepgram -> Chunker -> Voyage -> Pinecone)
        print("\n3. Waiting 15 seconds for background ingestion to complete...")
        await asyncio.sleep(15)
        print("   Done waiting.\n")
        
        # 4. Test Chat Stream (RAG)
        print("4. Testing Chat Stream (/chat/stream)...")
        chat_req = {
            "session_id": "test-session-123",
            "video_id": video_id,
            "query": "What is this audio about? Mention the preamble."
        }
        
        print(f"   Query: '{chat_req['query']}'")
        print("   Response Stream:")
        print("   --------------------------------------------------")
        
        async with client.stream("POST", f"{BASE_URL}/chat/stream", json=chat_req) as stream_res:
            stream_res.raise_for_status()
            async for line in stream_res.aiter_lines():
                if line.startswith("data: "):
                    token = line[6:]
                    if token == "[DONE]":
                        break
                    # Print token without newline to simulate streaming
                    print(token, end="", flush=True)
        
        print("\n   --------------------------------------------------\n")
        
        # 5. Test Summary Endpoint
        print("5. Testing Summary Endpoint (/summary/last_5_mins)...")
        summary_res = await client.get(f"{BASE_URL}/summary/last_5_mins", params={"video_id": video_id, "current_time": 300})
        summary_res.raise_for_status()
        summary_data = summary_res.json()
        print("   Summary JSON:")
        print(json.dumps(summary_data, indent=2))
        print("\nEnd-to-End Test Complete!")

if __name__ == "__main__":
    asyncio.run(main())
