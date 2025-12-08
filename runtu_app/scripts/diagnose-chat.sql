-- ============================================
-- Diagnóstico de Chat - Fase 3
-- ============================================
-- Ejecutar estas queries en Supabase SQL Editor
-- para diagnosticar problemas con el chat y RAG.
-- ============================================

-- ============================================
-- 1. ESTADO GENERAL
-- ============================================

-- Conteo de tablas principales
SELECT
  'businesses' as tabla, COUNT(*) as registros FROM businesses
UNION ALL
SELECT 'uploads', COUNT(*) FROM uploads
UNION ALL
SELECT 'knowledge_chunks', COUNT(*) FROM knowledge_chunks
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL
SELECT 'messages', COUNT(*) FROM messages;

-- ============================================
-- 2. CONVERSACIONES
-- ============================================

-- Conversaciones por business
SELECT
  b.name as business_name,
  COUNT(c.id) as total_conversations,
  COUNT(CASE WHEN c.created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
  COUNT(CASE WHEN c.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_7d
FROM businesses b
LEFT JOIN conversations c ON b.id = c.business_id
GROUP BY b.id, b.name
ORDER BY total_conversations DESC;

-- Conversaciones sin título (posible bug)
SELECT
  c.id,
  c.created_at,
  b.name as business_name,
  (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count
FROM conversations c
JOIN businesses b ON c.business_id = b.id
WHERE c.title IS NULL OR c.title = ''
ORDER BY c.created_at DESC
LIMIT 20;

-- Conversaciones más activas
SELECT
  c.id,
  c.title,
  b.name as business_name,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_message_at
FROM conversations c
JOIN businesses b ON c.business_id = b.id
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY c.id, c.title, b.name
ORDER BY message_count DESC
LIMIT 20;

-- ============================================
-- 3. MENSAJES
-- ============================================

-- Mensajes recientes
SELECT
  m.role,
  LEFT(m.content, 80) as preview,
  m.created_at,
  c.title as conversation_title
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
ORDER BY m.created_at DESC
LIMIT 30;

-- Distribución de mensajes por rol
SELECT
  role,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM messages
GROUP BY role;

-- Mensajes con fuentes (sources no vacío)
SELECT
  COUNT(*) as total_messages,
  COUNT(CASE WHEN sources IS NOT NULL AND sources::text != '[]' AND sources::text != 'null' THEN 1 END) as with_sources,
  ROUND(100.0 * COUNT(CASE WHEN sources IS NOT NULL AND sources::text != '[]' AND sources::text != 'null' THEN 1 END) / NULLIF(COUNT(*), 0), 2) as percentage_with_sources
FROM messages
WHERE role = 'assistant';

-- Mensajes largos (posible truncamiento)
SELECT
  id,
  LEFT(content, 50) as preview,
  LENGTH(content) as char_count,
  created_at
FROM messages
WHERE LENGTH(content) > 2000
ORDER BY char_count DESC
LIMIT 10;

-- ============================================
-- 4. KNOWLEDGE CHUNKS (RAG)
-- ============================================

-- Chunks por business
SELECT
  b.name as business_name,
  COUNT(kc.id) as total_chunks,
  SUM(kc.token_count) as total_tokens,
  AVG(kc.token_count) as avg_tokens_per_chunk
FROM businesses b
LEFT JOIN knowledge_chunks kc ON b.id = kc.business_id
GROUP BY b.id, b.name
ORDER BY total_chunks DESC;

-- Chunks por upload
SELECT
  u.original_name,
  b.name as business_name,
  COUNT(kc.id) as chunks,
  SUM(kc.token_count) as total_tokens,
  u.status as upload_status
FROM uploads u
JOIN businesses b ON u.business_id = b.id
LEFT JOIN knowledge_chunks kc ON u.id = kc.upload_id
GROUP BY u.id, u.original_name, b.name, u.status
ORDER BY chunks DESC
LIMIT 20;

-- Chunks sin embeddings (problema!)
SELECT
  COUNT(*) as chunks_without_embedding
FROM knowledge_chunks
WHERE embedding IS NULL;

-- Chunks más recientes
SELECT
  LEFT(content, 100) as preview,
  token_count,
  metadata->>'source' as source,
  created_at
FROM knowledge_chunks
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 5. UPLOADS Y PROCESAMIENTO
-- ============================================

-- Status de uploads
SELECT
  status,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM uploads
GROUP BY status
ORDER BY total DESC;

-- Uploads sin chunks (posible problema de procesamiento)
SELECT
  u.id,
  u.original_name,
  u.status,
  u.created_at,
  b.name as business_name
FROM uploads u
JOIN businesses b ON u.business_id = b.id
LEFT JOIN knowledge_chunks kc ON u.id = kc.upload_id
WHERE kc.id IS NULL AND u.status = 'completed'
ORDER BY u.created_at DESC
LIMIT 20;

-- Uploads recientes y su procesamiento
SELECT
  u.original_name,
  u.status,
  u.row_count,
  u.column_count,
  COUNT(kc.id) as chunks_generated,
  u.created_at
FROM uploads u
LEFT JOIN knowledge_chunks kc ON u.id = kc.upload_id
WHERE u.created_at > NOW() - INTERVAL '7 days'
GROUP BY u.id
ORDER BY u.created_at DESC;

-- ============================================
-- 6. ERRORES Y ANOMALÍAS
-- ============================================

-- Conversaciones vacías (sin mensajes)
SELECT
  c.id,
  c.title,
  c.created_at
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE m.id IS NULL
ORDER BY c.created_at DESC
LIMIT 20;

-- Mensajes huérfanos (sin conversación - no debería existir)
SELECT COUNT(*) as orphan_messages
FROM messages m
LEFT JOIN conversations c ON m.conversation_id = c.id
WHERE c.id IS NULL;

-- Chunks huérfanos (sin upload - no debería existir)
SELECT COUNT(*) as orphan_chunks
FROM knowledge_chunks kc
LEFT JOIN uploads u ON kc.upload_id = u.id
WHERE u.id IS NULL;

-- ============================================
-- 7. PERFORMANCE
-- ============================================

-- Tamaño de tablas
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('messages', 'conversations', 'knowledge_chunks', 'uploads', 'businesses')
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

-- Índices existentes
SELECT
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('messages', 'conversations', 'knowledge_chunks')
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- ============================================
-- 8. QUERIES ÚTILES PARA DEBUGGING
-- ============================================

-- Ver una conversación completa
-- Reemplazar 'CONVERSATION_ID' con el ID real
/*
SELECT
  m.role,
  m.content,
  m.sources,
  m.created_at
FROM messages m
WHERE m.conversation_id = 'CONVERSATION_ID'
ORDER BY m.created_at;
*/

-- Ver chunks de un upload específico
-- Reemplazar 'UPLOAD_ID' con el ID real
/*
SELECT
  chunk_index,
  LEFT(content, 200) as preview,
  token_count,
  metadata
FROM knowledge_chunks
WHERE upload_id = 'UPLOAD_ID'
ORDER BY chunk_index;
*/

-- Buscar en contenido de chunks (sin vector search)
-- Reemplazar 'término' con lo que busques
/*
SELECT
  id,
  LEFT(content, 200) as preview,
  metadata->>'source' as source
FROM knowledge_chunks
WHERE content ILIKE '%término%'
LIMIT 10;
*/

-- ============================================
-- 9. LIMPIEZA (CUIDADO - DESTRUCTIVO)
-- ============================================

-- Eliminar conversaciones vacías
/*
DELETE FROM conversations c
WHERE NOT EXISTS (
  SELECT 1 FROM messages m WHERE m.conversation_id = c.id
);
*/

-- Eliminar chunks huérfanos
/*
DELETE FROM knowledge_chunks kc
WHERE NOT EXISTS (
  SELECT 1 FROM uploads u WHERE u.id = kc.upload_id
);
*/
