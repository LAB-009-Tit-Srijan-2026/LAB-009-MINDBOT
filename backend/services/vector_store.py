"""
services/vector_store.py — Voyage AI embeddings and Pinecone vector operations.

Implements asymmetric embedding:
  • Ingestion (write): voyage-4-large  (richer document vectors)
  • Querying (read):  voyage-4-lite   (fast query vectors)

Uses Pinecone v9 IndexAsyncio for native async upsert/query.
"""

import hashlib
import logging
from typing import Any

import voyageai
from core.config import get_settings
from core.database import get_pinecone_index_async

logger = logging.getLogger(__name__)

# Maximum vectors per Pinecone upsert batch
_UPSERT_BATCH_SIZE = 100

def _adjust_dimension(vector: list[float], target_dim: int = 2048) -> list[float]:
    """Pad or truncate a vector to match the Pinecone index dimension."""
    if len(vector) > target_dim:
        return vector[:target_dim]
    elif len(vector) < target_dim:
        return vector + [0.0] * (target_dim - len(vector))
    return vector



# ────────────────────────────────────────────────────────────────────
#  1.  Embed + Upsert  (Ingestion — voyage-4-large)
# ────────────────────────────────────────────────────────────────────

async def embed_chunks_and_upsert(chunks: list[dict]) -> int:
    """
    Embed transcript chunks with voyage-4-large (document mode) and
    upsert the resulting vectors into Pinecone with temporal metadata.

    Handles Voyage rate limits by batching embeddings with delays.
    Returns the number of vectors upserted.
    """
    if not chunks:
        return 0

    import asyncio

    settings = get_settings()
    voyage_client = voyageai.AsyncClient(api_key=settings.VOYAGE_API_KEY)

    # Process in small batches to avoid rate limits (3 RPM on free tier)
    EMBED_BATCH_SIZE = 5
    all_vectors: list[dict[str, Any]] = []

    for batch_start in range(0, len(chunks), EMBED_BATCH_SIZE):
        batch_chunks = chunks[batch_start : batch_start + EMBED_BATCH_SIZE]
        batch_texts = [c["text"] for c in batch_chunks]

        logger.info("Embedding batch %d–%d of %d chunks…",
                     batch_start, batch_start + len(batch_chunks), len(chunks))

        # Retry up to 3 times on rate limit errors
        for attempt in range(3):
            try:
                embedding_response = await voyage_client.embed(
                    batch_texts,
                    model="voyage-4-large",
                    input_type="document",
                    output_dimension=2048,
                )
                break
            except Exception as e:
                if "rate" in str(e).lower() or "429" in str(e):
                    wait_time = 25 * (attempt + 1)
                    logger.warning("Rate limited, waiting %ds before retry…", wait_time)
                    await asyncio.sleep(wait_time)
                else:
                    raise
        else:
            logger.error("Failed to embed batch after 3 retries, skipping.")
            continue

        for chunk, embedding in zip(batch_chunks, embedding_response.embeddings):
            adjusted = _adjust_dimension(embedding, target_dim=2048)
            raw_id = f"{chunk['video_id']}_{chunk['start_time']:.2f}_{chunk['end_time']:.2f}"
            vector_id = hashlib.sha256(raw_id.encode()).hexdigest()[:32]

            all_vectors.append({
                "id": vector_id,
                "values": adjusted,
                "metadata": {
                    "text": chunk["text"],
                    "video_id": chunk["video_id"],
                    "start_time": chunk["start_time"],
                    "end_time": chunk["end_time"],
                },
            })

        # Delay between batches to respect rate limits
        if batch_start + EMBED_BATCH_SIZE < len(chunks):
            await asyncio.sleep(22)

    # Batch upsert to Pinecone using native async index
    index = get_pinecone_index_async()
    for i in range(0, len(all_vectors), _UPSERT_BATCH_SIZE):
        batch = all_vectors[i : i + _UPSERT_BATCH_SIZE]
        await index.upsert(vectors=batch)
        logger.info("Upserted batch %d–%d.", i, i + len(batch))

    logger.info("Upserted %d vectors for video %s.", len(all_vectors), chunks[0]["video_id"])
    return len(all_vectors)


# ────────────────────────────────────────────────────────────────────
#  2.  Embed + Search  (Query — voyage-4-lite)
# ────────────────────────────────────────────────────────────────────

async def search_similar_chunks(
    query: str,
    video_id: str,
    top_k: int = 3,
) -> list[dict]:
    """
    Embed a user query with voyage-4-lite (query mode), then search
    Pinecone filtered by video_id.  Returns the top-k matching chunks
    with text, timestamps, and similarity scores.
    """
    settings = get_settings()
    voyage_client = voyageai.AsyncClient(api_key=settings.VOYAGE_API_KEY)

    logger.info("Embedding query with voyage-4-lite: '%s'", query[:80])
    embedding_response = await voyage_client.embed(
        [query],
        model="voyage-4-lite",
        input_type="query",
        output_dimension=2048,
    )
    query_vector = _adjust_dimension(embedding_response.embeddings[0], target_dim=2048)

    # Search Pinecone using native async index
    index = get_pinecone_index_async()
    results = await index.query(
        vector=query_vector,
        top_k=top_k,
        filter={"video_id": {"$eq": video_id}},
        include_metadata=True,
    )

    matched_chunks = [
        {
            "text": match["metadata"]["text"],
            "start_time": match["metadata"]["start_time"],
            "end_time": match["metadata"]["end_time"],
            "score": match["score"],
        }
        for match in results.get("matches", [])
    ]

    logger.info(
        "Pinecone returned %d matches (top score: %.4f).",
        len(matched_chunks),
        matched_chunks[0]["score"] if matched_chunks else 0.0,
    )
    return matched_chunks
