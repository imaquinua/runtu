-- ============================================
-- Migration: Alerts (Alertas Proactivas)
-- ============================================
-- Sistema de alertas inteligentes que detectan
-- situaciones importantes y notifican al usuario.

-- ============================================
-- 1. TABLA PRINCIPAL
-- ============================================

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  -- Tipo y prioridad
  type TEXT NOT NULL CHECK (type IN (
    'inactivity',      -- No ha subido archivos en X días
    'anomaly',         -- Cambio significativo detectado
    'reminder',        -- Vencimiento próximo
    'insight',         -- Oportunidad detectada
    'milestone',       -- Logro alcanzado
    'tip'              -- Sugerencia de uso
  )),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),

  -- Contenido
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,     -- A dónde llevar al usuario
  action_label TEXT,   -- Texto del botón

  -- Metadata adicional
  metadata JSONB DEFAULT '{}',

  -- Estado
  seen_at TIMESTAMP WITH TIME ZONE,      -- Cuando el usuario la vio
  dismissed_at TIMESTAMP WITH TIME ZONE, -- Cuando el usuario la descartó

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE   -- Algunas alertas expiran
);

-- ============================================
-- 2. ÍNDICES
-- ============================================

-- Alertas activas (no vistas, no descartadas, no expiradas)
CREATE INDEX IF NOT EXISTS idx_alerts_business_active
  ON alerts(business_id, created_at DESC)
  WHERE seen_at IS NULL AND dismissed_at IS NULL;

-- Por fecha de creación
CREATE INDEX IF NOT EXISTS idx_alerts_created
  ON alerts(created_at DESC);

-- Por business y tipo (para evitar duplicados)
CREATE INDEX IF NOT EXISTS idx_alerts_business_type
  ON alerts(business_id, type, created_at DESC);

-- Alertas no vistas para conteo rápido
CREATE INDEX IF NOT EXISTS idx_alerts_unseen
  ON alerts(business_id)
  WHERE seen_at IS NULL AND dismissed_at IS NULL;

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios ven sus propias alertas
CREATE POLICY "Users can view own alerts" ON alerts
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Policy: Usuarios pueden actualizar sus alertas (marcar vistas/descartar)
CREATE POLICY "Users can update own alerts" ON alerts
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Policy: Sistema puede insertar alertas (service role)
-- No se crea policy de INSERT para usuarios normales
-- Solo el backend con service role puede crear alertas

-- ============================================
-- 4. FUNCIONES HELPER
-- ============================================

-- Función: Obtener alertas activas
CREATE OR REPLACE FUNCTION get_active_alerts(p_business_id UUID)
RETURNS TABLE (
  id UUID,
  type TEXT,
  priority TEXT,
  title TEXT,
  message TEXT,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.type,
    a.priority,
    a.title,
    a.message,
    a.action_url,
    a.action_label,
    a.metadata,
    a.created_at
  FROM alerts a
  WHERE a.business_id = p_business_id
    AND a.dismissed_at IS NULL
    AND (a.expires_at IS NULL OR a.expires_at > NOW())
  ORDER BY
    CASE a.priority
      WHEN 'high' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 3
    END,
    a.created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Contar alertas no vistas
CREATE OR REPLACE FUNCTION get_unseen_alerts_count(p_business_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM alerts
    WHERE business_id = p_business_id
      AND seen_at IS NULL
      AND dismissed_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Limpiar alertas expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_alerts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM alerts
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Verificar si alerta similar existe (últimos 7 días)
CREATE OR REPLACE FUNCTION alert_exists_recent(
  p_business_id UUID,
  p_type TEXT,
  p_title TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM alerts
    WHERE business_id = p_business_id
      AND type = p_type
      AND title = p_title
      AND created_at > NOW() - INTERVAL '7 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. COMENTARIOS
-- ============================================

COMMENT ON TABLE alerts IS 'Alertas proactivas generadas por el sistema para notificar situaciones importantes';
COMMENT ON COLUMN alerts.type IS 'Tipo: inactivity, anomaly, reminder, insight, milestone, tip';
COMMENT ON COLUMN alerts.priority IS 'Prioridad: high, medium, low';
COMMENT ON COLUMN alerts.seen_at IS 'Timestamp cuando el usuario vio la alerta';
COMMENT ON COLUMN alerts.dismissed_at IS 'Timestamp cuando el usuario descartó la alerta';
COMMENT ON COLUMN alerts.expires_at IS 'Timestamp de expiración (NULL = no expira)';
