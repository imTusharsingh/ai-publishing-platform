-- HNSW indexes for pgvector similarity search (Plan Sprint 14)

CREATE INDEX IF NOT EXISTS "article_embeddings_title_embedding_hnsw_idx"
ON "article_embeddings" USING hnsw ("title_embedding" vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "article_embeddings_summary_embedding_hnsw_idx"
ON "article_embeddings" USING hnsw ("summary_embedding" vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "article_embeddings_content_embedding_hnsw_idx"
ON "article_embeddings" USING hnsw ("content_embedding" vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "canonical_topics_embedding_hnsw_idx"
ON "canonical_topics" USING hnsw ("embedding" vector_cosine_ops);
