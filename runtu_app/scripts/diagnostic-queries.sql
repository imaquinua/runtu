-- ============================================
-- Runtu RAG Diagnostic Queries
-- ============================================
-- Use these queries in Supabase SQL Editor to diagnose
-- and monitor the vector memory system.
--
-- Run these periodically to ensure health of the system.
-- ============================================


-- ============================================
-- 1. BASIC HEALTH CHECKS
-- ============================================

-- 1.1 Verify pgvector extension is enabled
SELECT
  extname,
  extversion
FROM pg_extension
WHERE extname = 'vector';

-- 1.2 Check knowledge_chunks table exists and row count
SELECT
  relname as table_name,
  n_live_tup as row_count,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
FROM pg_stat_user_tables
WHERE relname = 'knowledge_chunks';

-- 1.3 Verify the HNSW index exists
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'knowledge_chunks'
  AND indexdef LIKE '%hnsw%';


-- ============================================
-- 2. DATA INTEGRITY CHECKS
-- ============================================

-- 2.1 Count chunks by business
SELECT
  b.name as business_name,
  b.id as business_id,
  COUNT(kc.id) as chunk_count,
  SUM(kc.token_count) as total_tokens
FROM businesses b
LEFT JOIN knowledge_chunks kc ON b.id = kc.business_id
GROUP BY b.id, b.name
ORDER BY chunk_count DESC;

-- 2.2 Count chunks by type
SELECT
  chunk_type,
  COUNT(*) as count,
  ROUND(AVG(token_count)) as avg_tokens,
  SUM(token_count) as total_tokens
FROM knowledge_chunks
GROUP BY chunk_type
ORDER BY count DESC;

-- 2.3 Find chunks without embeddings (BAD - should be 0)
SELECT
  id,
  business_id,
  chunk_type,
  LEFT(content, 100) as content_preview,
  created_at
FROM knowledge_chunks
WHERE embedding IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 2.4 Verify embedding dimensions (should be 768)
SELECT
  vector_dims(embedding) as embedding_dims,
  COUNT(*) as chunk_count
FROM knowledge_chunks
WHERE embedding IS NOT NULL
GROUP BY vector_dims(embedding);

-- 2.5 Find orphan chunks (no associated upload)
SELECT
  kc.id,
  kc.business_id,
  kc.source_context,
  kc.created_at
FROM knowledge_chunks kc
LEFT JOIN uploads u ON kc.upload_id = u.id
WHERE kc.upload_id IS NOT NULL
  AND u.id IS NULL;

-- 2.6 Check for duplicate chunks
SELECT
  business_id,
  content,
  COUNT(*) as duplicate_count
FROM knowledge_chunks
GROUP BY business_id, content
HAVING COUNT(*) > 1
LIMIT 20;


-- ============================================
-- 3. SEARCH FUNCTIONALITY TESTS
-- ============================================

-- 3.1 Test match_knowledge function (replace with actual values)
-- SELECT * FROM match_knowledge(
--   '<<EMBEDDING_VECTOR_768_DIMS>>',  -- Replace with actual embedding
--   '<<BUSINESS_ID_UUID>>',            -- Replace with actual business ID
--   0.5,                               -- Threshold
--   10                                 -- Limit
-- );

-- 3.2 Test text search functionality
SELECT
  id,
  chunk_type,
  LEFT(content, 100) as content_preview,
  ts_rank(to_tsvector('spanish', content), plainto_tsquery('spanish', 'ventas')) as relevance
FROM knowledge_chunks
WHERE to_tsvector('spanish', content) @@ plainto_tsquery('spanish', 'ventas')
ORDER BY relevance DESC
LIMIT 5;

-- 3.3 Verify RLS is working (should return 0 if not logged in as that user)
-- Run this as different users to verify isolation
SELECT COUNT(*) FROM knowledge_chunks;


-- ============================================
-- 4. PERFORMANCE DIAGNOSTICS
-- ============================================

-- 4.1 Check index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'knowledge_chunks';

-- 4.2 Check table bloat
SELECT
  schemaname,
  relname,
  n_live_tup,
  n_dead_tup,
  ROUND(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_tup_percent
FROM pg_stat_user_tables
WHERE relname = 'knowledge_chunks';

-- 4.3 Check for slow queries (if pg_stat_statements is enabled)
-- SELECT
--   query,
--   calls,
--   mean_time,
--   max_time,
--   total_time
-- FROM pg_stat_statements
-- WHERE query LIKE '%knowledge_chunks%'
-- ORDER BY total_time DESC
-- LIMIT 10;

-- 4.4 Analyze table statistics freshness
SELECT
  schemaname,
  relname,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'knowledge_chunks';


-- ============================================
-- 5. STORAGE ANALYSIS
-- ============================================

-- 5.1 Table and index sizes
SELECT
  pg_size_pretty(pg_table_size('knowledge_chunks')) as table_size,
  pg_size_pretty(pg_indexes_size('knowledge_chunks')) as indexes_size,
  pg_size_pretty(pg_total_relation_size('knowledge_chunks')) as total_size;

-- 5.2 Chunks per day (growth trend)
SELECT
  DATE(created_at) as date,
  COUNT(*) as chunks_created,
  SUM(token_count) as tokens_added
FROM knowledge_chunks
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 5.3 Average chunk size
SELECT
  chunk_type,
  ROUND(AVG(LENGTH(content))) as avg_content_length,
  ROUND(AVG(token_count)) as avg_tokens,
  MIN(token_count) as min_tokens,
  MAX(token_count) as max_tokens
FROM knowledge_chunks
GROUP BY chunk_type;


-- ============================================
-- 6. UPLOAD PROCESSING STATUS
-- ============================================

-- 6.1 Recent uploads and their chunk counts
SELECT
  u.id,
  u.filename,
  u.file_type,
  u.processing_status,
  u.created_at,
  COUNT(kc.id) as chunk_count,
  SUM(kc.token_count) as total_tokens
FROM uploads u
LEFT JOIN knowledge_chunks kc ON u.id = kc.upload_id
WHERE u.created_at > NOW() - INTERVAL '7 days'
GROUP BY u.id, u.filename, u.file_type, u.processing_status, u.created_at
ORDER BY u.created_at DESC;

-- 6.2 Failed uploads
SELECT
  id,
  filename,
  file_type,
  processing_status,
  error_message,
  created_at
FROM uploads
WHERE processing_status = 'failed'
ORDER BY created_at DESC
LIMIT 10;

-- 6.3 Pending uploads (should process quickly)
SELECT
  id,
  filename,
  file_type,
  processing_status,
  created_at,
  NOW() - created_at as time_pending
FROM uploads
WHERE processing_status = 'pending'
ORDER BY created_at ASC;


-- ============================================
-- 7. SECURITY CHECKS
-- ============================================

-- 7.1 Verify RLS is enabled
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'knowledge_chunks';

-- 7.2 List RLS policies
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'knowledge_chunks';


-- ============================================
-- 8. MAINTENANCE QUERIES
-- ============================================

-- 8.1 Reindex the HNSW index (run if search is slow)
-- REINDEX INDEX knowledge_chunks_embedding_idx;

-- 8.2 Vacuum and analyze the table (run periodically)
-- VACUUM ANALYZE knowledge_chunks;

-- 8.3 Delete old test data (BE CAREFUL)
-- DELETE FROM knowledge_chunks
-- WHERE business_id IN (
--   SELECT id FROM businesses WHERE name LIKE 'TEST_%'
-- );


-- ============================================
-- 9. SAMPLE QUERIES FOR DEBUGGING
-- ============================================

-- 9.1 Get random sample of chunks
SELECT
  id,
  chunk_type,
  source_context,
  LEFT(content, 200) as content_preview,
  token_count,
  created_at
FROM knowledge_chunks
ORDER BY RANDOM()
LIMIT 5;

-- 9.2 Find chunks containing specific text
SELECT
  id,
  chunk_type,
  source_context,
  LEFT(content, 200) as content_preview
FROM knowledge_chunks
WHERE content ILIKE '%ventas%'
LIMIT 10;

-- 9.3 Get metadata examples
SELECT
  id,
  chunk_type,
  metadata
FROM knowledge_chunks
WHERE metadata IS NOT NULL
  AND metadata != '{}'::jsonb
LIMIT 5;


-- ============================================
-- 10. SUMMARY REPORT
-- ============================================

-- 10.1 Overall system health summary
WITH stats AS (
  SELECT
    COUNT(*) as total_chunks,
    COUNT(DISTINCT business_id) as total_businesses,
    SUM(token_count) as total_tokens,
    COUNT(*) FILTER (WHERE embedding IS NULL) as chunks_without_embedding,
    COUNT(DISTINCT chunk_type) as chunk_types,
    MIN(created_at) as oldest_chunk,
    MAX(created_at) as newest_chunk
  FROM knowledge_chunks
)
SELECT
  total_chunks,
  total_businesses,
  total_tokens,
  chunks_without_embedding,
  chunk_types,
  oldest_chunk,
  newest_chunk,
  CASE
    WHEN chunks_without_embedding = 0 THEN 'HEALTHY'
    ELSE 'WARNING: Chunks without embeddings'
  END as embedding_status
FROM stats;
