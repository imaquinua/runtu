-- Runtu 2.0 — Social Scraping
-- Requiere extensión pgvector (Supabase la incluye por defecto)

CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================================================
-- TABLA: scraping_jobs — "intenciones" del usuario (un query por plataformas)
-- =========================================================================
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hashtag', 'account', 'keyword')),
  platforms TEXT[] NOT NULL,
  schedule TEXT NOT NULL DEFAULT 'manual' CHECK (schedule IN ('manual', 'hourly', 'daily')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'error')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  apify_actor_ids JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraping_jobs_business ON scraping_jobs(business_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_next_run ON scraping_jobs(next_run_at) WHERE status = 'active';

ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios ven sus scraping jobs" ON scraping_jobs
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- =========================================================================
-- TABLA: scraping_runs — cada ejecución de un actor de Apify
-- =========================================================================
CREATE TABLE IF NOT EXISTS scraping_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scraping_jobs(id) ON DELETE CASCADE NOT NULL,
  apify_run_id TEXT UNIQUE,
  actor_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'succeeded', 'failed', 'timed-out')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  items_count INTEGER DEFAULT 0,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_scraping_runs_job ON scraping_runs(job_id);
CREATE INDEX IF NOT EXISTS idx_scraping_runs_apify ON scraping_runs(apify_run_id);

ALTER TABLE scraping_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios ven sus scraping runs" ON scraping_runs
  FOR ALL USING (
    job_id IN (
      SELECT sj.id FROM scraping_jobs sj
      JOIN businesses b ON sj.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- =========================================================================
-- TABLA: scraping_mentions — menciones normalizadas + enriquecidas
-- =========================================================================
CREATE TABLE IF NOT EXISTS scraping_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scraping_jobs(id) ON DELETE CASCADE NOT NULL,
  run_id UUID REFERENCES scraping_runs(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  external_id TEXT NOT NULL,
  author TEXT,
  text TEXT,
  url TEXT,
  engagement JSONB DEFAULT '{}'::jsonb,
  posted_at TIMESTAMPTZ,
  raw JSONB,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score NUMERIC,
  topics TEXT[],
  embedding vector(768),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, external_id)
);

CREATE INDEX IF NOT EXISTS idx_mentions_job_posted ON scraping_mentions(job_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_unprocessed ON scraping_mentions(created_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mentions_sentiment ON scraping_mentions(job_id, sentiment) WHERE sentiment IS NOT NULL;

ALTER TABLE scraping_mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios ven sus menciones" ON scraping_mentions
  FOR ALL USING (
    job_id IN (
      SELECT sj.id FROM scraping_jobs sj
      JOIN businesses b ON sj.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- =========================================================================
-- TABLA: scraping_narratives — clusters de menciones (el diferenciador)
-- =========================================================================
CREATE TABLE IF NOT EXISTS scraping_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scraping_jobs(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  sentiment_score NUMERIC,
  mention_count INTEGER DEFAULT 0,
  growth_rate NUMERIC DEFAULT 1.0,
  started_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  centroid_embedding vector(768),
  sample_mention_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_narratives_job ON scraping_narratives(job_id, growth_rate DESC);
CREATE INDEX IF NOT EXISTS idx_narratives_recent ON scraping_narratives(last_seen_at DESC);

ALTER TABLE scraping_narratives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios ven sus narrativas" ON scraping_narratives
  FOR ALL USING (
    job_id IN (
      SELECT sj.id FROM scraping_jobs sj
      JOIN businesses b ON sj.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- =========================================================================
-- TABLA: alerts — alertas del sistema (narrativas en spike, etc.)
-- =========================================================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('insight', 'anomaly', 'trend', 'recommendation')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('high', 'medium', 'low')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT,
  source_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_business ON alerts(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alerts(business_id) WHERE read_at IS NULL AND dismissed_at IS NULL;

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios ven sus alertas" ON alerts
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- =========================================================================
-- FUNCIÓN: cosine distance helper (pgvector built-in pero alias útil)
-- =========================================================================
-- ya existe: <-> para cosine distance, 1 - (a <=> b) para similarity
