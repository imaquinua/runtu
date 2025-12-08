-- ============================================
-- Migration: Reports Table
-- ============================================
-- Tabla para almacenar reportes generados

-- Crear tabla de reportes
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Tipo y período
  type TEXT NOT NULL CHECK (type IN ('executive', 'detailed', 'financial', 'operational', 'custom')),
  period TEXT NOT NULL CHECK (period IN ('last_week', 'last_month', 'last_quarter', 'last_year', 'custom')),
  custom_period_start TIMESTAMPTZ,
  custom_period_end TIMESTAMPTZ,

  -- Contenido
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT,

  -- Metadatos
  metrics JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}',

  -- Timestamps
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint para período custom
  CONSTRAINT valid_custom_period CHECK (
    (period != 'custom') OR
    (custom_period_start IS NOT NULL AND custom_period_end IS NOT NULL)
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reports_business_id ON reports(business_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_business_generated ON reports(business_id, generated_at DESC);

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propios reportes
CREATE POLICY "Users can view own business reports"
  ON reports FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Política: Los usuarios pueden insertar reportes para su negocio
CREATE POLICY "Users can insert own business reports"
  ON reports FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Política: Los usuarios pueden eliminar sus reportes
CREATE POLICY "Users can delete own business reports"
  ON reports FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- Función: Obtener reportes recientes
-- ============================================
CREATE OR REPLACE FUNCTION get_recent_reports(
  p_business_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  period TEXT,
  title TEXT,
  preview TEXT,
  generated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.type,
    r.period,
    r.title,
    LEFT(r.content, 200) as preview,
    r.generated_at
  FROM reports r
  WHERE r.business_id = p_business_id
  ORDER BY r.generated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Función: Limpiar reportes expirados
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_reports()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM reports
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comentarios
-- ============================================
COMMENT ON TABLE reports IS 'Reportes generados por Runtu para cada negocio';
COMMENT ON COLUMN reports.type IS 'Tipo de reporte: executive, detailed, financial, operational, custom';
COMMENT ON COLUMN reports.period IS 'Período del reporte: last_week, last_month, last_quarter, last_year, custom';
COMMENT ON COLUMN reports.content IS 'Contenido del reporte en formato Markdown';
COMMENT ON COLUMN reports.html_content IS 'Contenido renderizado en HTML (cacheado)';
COMMENT ON COLUMN reports.metrics IS 'Métricas extraídas del reporte en formato JSON';
COMMENT ON COLUMN reports.config IS 'Configuración usada para generar el reporte';
