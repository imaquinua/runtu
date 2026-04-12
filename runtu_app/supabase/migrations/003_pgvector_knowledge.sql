-- ============================================
-- RUNTU - pgvector y Knowledge Chunks
-- ============================================
-- Este script configura la búsqueda semántica:
-- 1. Extensión pgvector
-- 2. Tabla knowledge_chunks con embeddings
-- 3. Función match_knowledge para búsqueda
-- 4. Función get_business_stats para dashboard
-- 5. RLS para seguridad
--
-- INSTRUCCIONES:
-- 1. Ve a tu dashboard de Supabase
-- 2. Ve a "SQL Editor"
-- 3. Copia y pega todo este código
-- 4. Haz clic en "Run"
-- ============================================

-- ============================================
-- 1. HABILITAR EXTENSIÓN VECTOR
-- ============================================
-- pgvector permite almacenar y buscar embeddings
-- Esto es necesario para búsqueda semántica con OpenAI

CREATE EXTENSION IF NOT EXISTS vector;

-- Verificar que se habilitó correctamente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE EXCEPTION 'La extensión vector no se pudo habilitar. Contacta soporte de Supabase.';
  END IF;
END $$;

-- ============================================
-- 2. TABLA: knowledge_chunks
-- ============================================
-- Almacena fragmentos de conocimiento extraídos de archivos
-- Cada chunk tiene un embedding para búsqueda semántica

CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    upload_id UUID REFERENCES public.uploads(id) ON DELETE SET NULL,

    -- Contenido
    content TEXT NOT NULL,
    embedding VECTOR(768), -- Dimensión para Gemini text-embedding-004

    -- Clasificación
    chunk_type TEXT NOT NULL DEFAULT 'document'
        CHECK (chunk_type IN (
            'document',           -- PDF, Word, etc.
            'spreadsheet',        -- Excel, CSV
            'image_analysis',     -- Descripción de imagen
            'audio_transcript',   -- Transcripción de audio
            'video_analysis',     -- Análisis de video
            'manual_note'         -- Nota agregada manualmente
        )),

    -- Contexto y metadata
    source_context TEXT,          -- Ej: "ventas_julio.xlsx - Hoja 1, Fila 15"
    metadata JSONB DEFAULT '{}',  -- Datos flexibles: página, timestamps, etc.
    tokens_count INTEGER DEFAULT 0, -- Para control de ventana de contexto

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentarios de documentación
COMMENT ON TABLE public.knowledge_chunks IS 'Fragmentos de conocimiento con embeddings para búsqueda semántica';
COMMENT ON COLUMN public.knowledge_chunks.business_id IS 'Negocio dueño de este conocimiento';
COMMENT ON COLUMN public.knowledge_chunks.upload_id IS 'Archivo de origen (NULL si es conocimiento manual)';
COMMENT ON COLUMN public.knowledge_chunks.content IS 'Texto del fragmento de conocimiento';
COMMENT ON COLUMN public.knowledge_chunks.embedding IS 'Vector de 768 dimensiones (Gemini text-embedding-004)';
COMMENT ON COLUMN public.knowledge_chunks.chunk_type IS 'Tipo de fuente: document, spreadsheet, image_analysis, audio_transcript, video_analysis, manual_note';
COMMENT ON COLUMN public.knowledge_chunks.source_context IS 'Descripción legible del origen del chunk';
COMMENT ON COLUMN public.knowledge_chunks.metadata IS 'Datos adicionales: página, timestamps de audio/video, coordenadas de imagen, etc.';
COMMENT ON COLUMN public.knowledge_chunks.tokens_count IS 'Número de tokens para control de contexto del LLM';

-- ============================================
-- 3. ÍNDICES
-- ============================================

-- Índice IVFFlat para búsqueda de vectores eficiente
-- lists = sqrt(n) donde n es número esperado de filas
-- Empezamos con 100, ajustar cuando crezca la data
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
ON public.knowledge_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índice para filtrar por negocio (consultas más frecuentes)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_business_id
ON public.knowledge_chunks(business_id);

-- Índice para filtrar por tipo de chunk
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_type
ON public.knowledge_chunks(chunk_type);

-- Índice para ordenar por fecha de creación
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_created_at
ON public.knowledge_chunks(created_at DESC);

-- Índice compuesto para consultas comunes (business + tipo)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_business_type
ON public.knowledge_chunks(business_id, chunk_type);

-- Índice para búsqueda por upload_id (ver chunks de un archivo)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_upload_id
ON public.knowledge_chunks(upload_id)
WHERE upload_id IS NOT NULL;

-- ============================================
-- 4. TRIGGER: updated_at automático
-- ============================================

-- Reusar la función existente o crearla si no existe
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para knowledge_chunks
DROP TRIGGER IF EXISTS update_knowledge_chunks_updated_at ON public.knowledge_chunks;
CREATE TRIGGER update_knowledge_chunks_updated_at
    BEFORE UPDATE ON public.knowledge_chunks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================
-- Los usuarios solo pueden acceder a chunks de SU negocio

-- Habilitar RLS
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own knowledge" ON public.knowledge_chunks;
DROP POLICY IF EXISTS "Users can insert own knowledge" ON public.knowledge_chunks;
DROP POLICY IF EXISTS "Users can update own knowledge" ON public.knowledge_chunks;
DROP POLICY IF EXISTS "Users can delete own knowledge" ON public.knowledge_chunks;

-- Función helper para obtener business_id del usuario actual
-- (puede que ya exista de la migración anterior)
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS UUID AS $$
  SELECT id FROM public.businesses WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- SELECT: Ver chunks de tu negocio
CREATE POLICY "Users can view own knowledge"
    ON public.knowledge_chunks
    FOR SELECT
    USING (business_id = public.get_user_business_id());

-- INSERT: Agregar chunks a tu negocio
CREATE POLICY "Users can insert own knowledge"
    ON public.knowledge_chunks
    FOR INSERT
    WITH CHECK (business_id = public.get_user_business_id());

-- UPDATE: Modificar chunks de tu negocio
CREATE POLICY "Users can update own knowledge"
    ON public.knowledge_chunks
    FOR UPDATE
    USING (business_id = public.get_user_business_id())
    WITH CHECK (business_id = public.get_user_business_id());

-- DELETE: Eliminar chunks de tu negocio
CREATE POLICY "Users can delete own knowledge"
    ON public.knowledge_chunks
    FOR DELETE
    USING (business_id = public.get_user_business_id());

-- ============================================
-- 6. FUNCIÓN: match_knowledge
-- ============================================
-- Búsqueda semántica de chunks por similitud de embeddings
-- Usa distancia coseno (1 - distancia = similitud)

CREATE OR REPLACE FUNCTION public.match_knowledge(
    query_embedding VECTOR(768),       -- El embedding de la pregunta/búsqueda (Gemini 768d)
    match_threshold FLOAT DEFAULT 0.7,  -- Umbral mínimo de similitud (0-1)
    match_count INT DEFAULT 10,         -- Máximo de resultados
    filter_business_id UUID DEFAULT NULL, -- OBLIGATORIO: ID del negocio
    filter_chunk_types TEXT[] DEFAULT NULL -- Opcional: filtrar por tipos
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    chunk_type TEXT,
    source_context TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con permisos del creador para bypass RLS interno
SET search_path = public
AS $$
BEGIN
    -- Validación: business_id es obligatorio para seguridad
    IF filter_business_id IS NULL THEN
        RAISE EXCEPTION 'filter_business_id es obligatorio para seguridad';
    END IF;

    -- Validar que el usuario tiene acceso a este business_id
    IF NOT EXISTS (
        SELECT 1 FROM public.businesses
        WHERE id = filter_business_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'No tienes acceso a este negocio';
    END IF;

    RETURN QUERY
    SELECT
        kc.id,
        kc.content,
        kc.chunk_type,
        kc.source_context,
        kc.metadata,
        (1 - (kc.embedding <=> query_embedding))::FLOAT AS similarity
    FROM public.knowledge_chunks kc
    WHERE
        -- Filtro obligatorio por negocio
        kc.business_id = filter_business_id
        -- Solo chunks con embedding
        AND kc.embedding IS NOT NULL
        -- Filtro opcional por tipos
        AND (
            filter_chunk_types IS NULL
            OR kc.chunk_type = ANY(filter_chunk_types)
        )
        -- Filtro por umbral de similitud
        AND (1 - (kc.embedding <=> query_embedding)) >= match_threshold
    ORDER BY kc.embedding <=> query_embedding ASC -- Menor distancia = más similar
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_knowledge IS 'Búsqueda semántica de chunks por similitud de embeddings. Requiere business_id para seguridad.';

-- ============================================
-- 7. FUNCIÓN: get_business_knowledge_stats
-- ============================================
-- Estadísticas de conocimiento para el dashboard

CREATE OR REPLACE FUNCTION public.get_business_knowledge_stats(
    target_business_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_chunks BIGINT,
    total_tokens BIGINT,
    chunks_by_type JSONB,
    last_chunk_at TIMESTAMPTZ,
    has_embeddings BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_business_id UUID;
BEGIN
    -- Si no se proporciona, usar el business del usuario actual
    IF target_business_id IS NULL THEN
        v_business_id := public.get_user_business_id();
    ELSE
        -- Validar acceso
        IF NOT EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = target_business_id AND user_id = auth.uid()
        ) THEN
            RAISE EXCEPTION 'No tienes acceso a este negocio';
        END IF;
        v_business_id := target_business_id;
    END IF;

    RETURN QUERY
    SELECT
        -- Total de chunks
        COUNT(*)::BIGINT AS total_chunks,

        -- Total de tokens
        COALESCE(SUM(kc.tokens_count), 0)::BIGINT AS total_tokens,

        -- Chunks agrupados por tipo
        COALESCE(
            jsonb_object_agg(
                type_counts.chunk_type,
                type_counts.count
            ),
            '{}'::JSONB
        ) AS chunks_by_type,

        -- Fecha del último chunk
        MAX(kc.created_at) AS last_chunk_at,

        -- Si hay al menos un embedding
        bool_or(kc.embedding IS NOT NULL) AS has_embeddings

    FROM public.knowledge_chunks kc
    LEFT JOIN (
        SELECT
            chunk_type,
            COUNT(*) as count
        FROM public.knowledge_chunks
        WHERE business_id = v_business_id
        GROUP BY chunk_type
    ) type_counts ON TRUE
    WHERE kc.business_id = v_business_id;
END;
$$;

COMMENT ON FUNCTION public.get_business_knowledge_stats IS 'Estadísticas de conocimiento de un negocio para el dashboard';

-- ============================================
-- 8. FUNCIÓN: search_knowledge_simple
-- ============================================
-- Versión simplificada para buscar por texto exacto (sin embeddings)
-- Útil para búsquedas rápidas o cuando no hay embedding disponible

CREATE OR REPLACE FUNCTION public.search_knowledge_simple(
    search_query TEXT,
    target_business_id UUID DEFAULT NULL,
    result_limit INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    chunk_type TEXT,
    source_context TEXT,
    metadata JSONB,
    relevance REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_business_id UUID;
BEGIN
    -- Obtener business_id
    IF target_business_id IS NULL THEN
        v_business_id := public.get_user_business_id();
    ELSE
        IF NOT EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = target_business_id AND user_id = auth.uid()
        ) THEN
            RAISE EXCEPTION 'No tienes acceso a este negocio';
        END IF;
        v_business_id := target_business_id;
    END IF;

    RETURN QUERY
    SELECT
        kc.id,
        kc.content,
        kc.chunk_type,
        kc.source_context,
        kc.metadata,
        ts_rank(
            to_tsvector('spanish', kc.content),
            plainto_tsquery('spanish', search_query)
        ) AS relevance
    FROM public.knowledge_chunks kc
    WHERE
        kc.business_id = v_business_id
        AND to_tsvector('spanish', kc.content) @@ plainto_tsquery('spanish', search_query)
    ORDER BY relevance DESC
    LIMIT result_limit;
END;
$$;

COMMENT ON FUNCTION public.search_knowledge_simple IS 'Búsqueda full-text simple sin embeddings';

-- ============================================
-- 9. ÍNDICE PARA BÚSQUEDA FULL-TEXT
-- ============================================
-- Índice GIN para búsquedas de texto en español

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_content_fts
ON public.knowledge_chunks
USING gin(to_tsvector('spanish', content));

-- ============================================
-- 10. VERIFICACIÓN
-- ============================================

-- Verificar extensión vector
SELECT
    extname,
    extversion
FROM pg_extension
WHERE extname = 'vector';

-- Verificar tabla knowledge_chunks
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'knowledge_chunks'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar índices
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'knowledge_chunks';

-- Verificar políticas RLS
SELECT
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'knowledge_chunks';

-- Verificar funciones creadas
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('match_knowledge', 'get_business_knowledge_stats', 'search_knowledge_simple');

-- ============================================
-- ¡LISTO! pgvector está configurado.
-- ============================================
--
-- PRÓXIMOS PASOS:
-- 1. Configurar GEMINI_API_KEY en variables de entorno
-- 2. Crear endpoint o función para insertar chunks
-- 3. Integrar con el procesamiento de archivos
--
-- EJEMPLO DE USO (desde tu código):
--
-- // Insertar chunk con embedding
-- const { data, error } = await supabase
--   .from('knowledge_chunks')
--   .insert({
--     business_id: 'uuid-del-negocio',
--     upload_id: 'uuid-del-archivo', // opcional
--     content: 'Texto del chunk...',
--     embedding: [0.1, 0.2, ...], // Array de 768 floats (Gemini)
--     chunk_type: 'document',
--     source_context: 'reporte_ventas.pdf - Página 3',
--     tokens_count: 150
--   });
--
-- // Buscar chunks similares
-- const { data, error } = await supabase
--   .rpc('match_knowledge', {
--     query_embedding: [0.1, 0.2, ...], // Embedding de la pregunta (768d)
--     match_threshold: 0.7,
--     match_count: 5,
--     filter_business_id: 'uuid-del-negocio'
--   });
--
-- ============================================
