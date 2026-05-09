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

    Returns the number of vectors upserted.
    """
    if not chunks:
        return 0

    settings = get_settings()
    voyage_client = voyageai.AsyncClient(api_key=settings.VOYAGE_API_KEY)

    texts = [chunk["text"] for chunk in chunks]

    logger.info("Embedding %d chunks with voyage-4-large…", len(texts))
    embedding_response = await voyage_client.embed(
        texts,
        model="voyage-4-large",
        input_type="document",
        output_dimension=2048,
    )

    # Build Pinecone-ready vector tuples
    vectors: list[dict[str, Any]] = []
    for chunk, embedding in zip(chunks, embedding_response.embeddings):
        adjusted_embedding = _adjust_dimension(embedding, target_dim=2048)
        
        # Deterministic ID from content coordinates
        raw_id = f"{chunk['video_id']}_{chunk['start_time']:.2f}_{chunk['end_time']:.2f}"
        vector_id = hashlib.sha256(raw_id.encode()).hexdigest()[:32]

        vectors.append({
            "id": vector_id,
            "values": adjusted_embedding,
            "metadata": {
                "text": chunk["text"],
                "video_id": chunk["video_id"],
                "start_time": chunk["start_time"],
                "end_time": chunk["end_time"],
            },
        })

    # Batch upsert to Pinecone using native async index
    index = get_pinecone_index_async()
    for i in range(0, len(vectors), _UPSERT_BATCH_SIZE):
        batch = vectors[i : i + _UPSERT_BATCH_SIZE]
        await index.upsert(vectors=batch)
        logger.info("Upserted batch %d–%d.", i, i + len(batch))

    logger.info("Upserted %d vectors for video %s.", len(vectors), chunks[0]["video_id"])
    return len(vectors)


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
