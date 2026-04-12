-- ============================================
-- Migration: Summaries (Resúmenes Automáticos)
-- ============================================
-- Tabla para almacenar resúmenes periódicos generados por IA
-- que ayudan a los usuarios a entender su negocio.

-- ============================================
-- 1. TABLA PRINCIPAL
-- ============================================

CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  -- Tipo y período
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Contenido
  content TEXT NOT NULL, -- Resumen en markdown
  highlights JSONB DEFAULT '[]'::jsonb, -- Puntos clave estructurados
  metrics JSONB DEFAULT '{}'::jsonb, -- Métricas calculadas

  -- Metadata
  chunks_analyzed INTEGER DEFAULT 0,
  model_used TEXT DEFAULT 'gemini-1.5-flash',
  tokens_used INTEGER,

  -- Timestamps
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE, -- NULL si no leído

  -- Constraint: Un solo resumen por tipo y período por negocio
  UNIQUE(business_id, type, period_start),

  -- Constraint: period_end debe ser >= period_start
  CHECK (period_end >= period_start)
);

-- ============================================
-- 2. ÍNDICES
-- ============================================

-- Búsqueda por business
CREATE INDEX IF NOT EXISTS idx_summaries_business
  ON summaries(business_id);

-- Resúmenes no leídos (para notificaciones)
CREATE INDEX IF NOT EXISTS idx_summaries_unread
  ON summaries(business_id)
  WHERE read_at IS NULL;

-- Por tipo y fecha (para queries de historial)
CREATE INDEX IF NOT EXISTS idx_summaries_type_date
  ON summaries(business_id, type, period_start DESC);

-- Por fecha de generación
CREATE INDEX IF NOT EXISTS idx_summaries_generated
  ON summaries(generated_at DESC);

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios solo ven resúmenes de sus propios negocios
CREATE POLICY "Users can view own summaries" ON summaries
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Policy: Usuarios pueden insertar en sus propios negocios
CREATE POLICY "Users can insert own summaries" ON summaries
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Policy: Usuarios pueden actualizar (marcar como leído)
CREATE POLICY "Users can update own summaries" ON summaries
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Policy: Usuarios pueden eliminar sus resúmenes
CREATE POLICY "Users can delete own summaries" ON summaries
  FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 4. FUNCIONES HELPER
-- ============================================

-- Función: Obtener resúmenes no leídos
CREATE OR REPLACE FUNCTION get_unread_summaries(p_business_id UUID)
RETURNS TABLE (
  id UUID,
  type TEXT,
  period_start DATE,
  period_end DATE,
  generated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.type,
    s.period_start,
    s.period_end,
    s.generated_at
  FROM summaries s
  WHERE s.business_id = p_business_id
    AND s.read_at IS NULL
  ORDER BY s.generated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Marcar resumen como leído
CREATE OR REPLACE FUNCTION mark_summary_read(p_summary_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE summaries
  SET read_at = NOW()
  WHERE id = p_summary_id
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener el último resumen de cada tipo
CREATE OR REPLACE FUNCTION get_latest_summaries(p_business_id UUID)
RETURNS TABLE (
  id UUID,
  type TEXT,
  period_start DATE,
  period_end DATE,
  content TEXT,
  highlights JSONB,
  metrics JSONB,
  generated_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (s.type)
    s.id,
    s.type,
    s.period_start,
    s.period_end,
    s.content,
    s.highlights,
    s.metrics,
    s.generated_at,
    s.read_at
  FROM summaries s
  WHERE s.business_id = p_business_id
  ORDER BY s.type, s.period_start DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Verificar si existe resumen para un período
CREATE OR REPLACE FUNCTION summary_exists(
  p_business_id UUID,
  p_type TEXT,
  p_period_start DATE
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM summaries
    WHERE business_id = p_business_id
      AND type = p_type
      AND period_start = p_period_start
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. COMENTARIOS
-- ============================================

COMMENT ON TABLE summaries IS 'Resúmenes automáticos generados por IA para cada negocio';
COMMENT ON COLUMN summaries.type IS 'Tipo de resumen: daily, weekly, monthly';
COMMENT ON COLUMN summaries.content IS 'Resumen en formato markdown';
COMMENT ON COLUMN summaries.highlights IS 'Array de puntos clave estructurados';
COMMENT ON COLUMN summaries.metrics IS 'Métricas calculadas del período';
COMMENT ON COLUMN summaries.read_at IS 'NULL si el usuario no ha visto el resumen';
