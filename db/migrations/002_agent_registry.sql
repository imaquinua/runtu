\set ON_ERROR_STOP on

CREATE TABLE IF NOT EXISTS runtu.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES runtu.organizations(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  purpose text NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  status text NOT NULL CHECK (status IN ('DRAFT', 'SPEC_READY', 'BUILDING', 'EVALUATING', 'CANDIDATE', 'LIVE', 'PAUSED')),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE TABLE IF NOT EXISTS runtu.agent_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES runtu.organizations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES runtu.agents(id) ON DELETE CASCADE,
  version text NOT NULL,
  state text NOT NULL CHECK (state IN ('DRAFT', 'SPEC_READY', 'BUILDING', 'EVALUATING', 'CANDIDATE', 'LIVE', 'PAUSED')),
  manifest jsonb NOT NULL,
  instructions text NOT NULL,
  output_schema jsonb NOT NULL,
  checksum_sha256 text NOT NULL CHECK (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  immutable boolean NOT NULL DEFAULT false,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, version)
);

CREATE TABLE IF NOT EXISTS runtu.eval_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES runtu.organizations(id) ON DELETE CASCADE,
  agent_version_id uuid NOT NULL REFERENCES runtu.agent_versions(id) ON DELETE CASCADE,
  report_id text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('real', 'replay')),
  source_report text,
  model text NOT NULL,
  cases integer NOT NULL,
  passed integer NOT NULL,
  pass_rate numeric(6,5) NOT NULL,
  schema_pass_rate numeric(6,5) NOT NULL,
  policy_pass_rate numeric(6,5) NOT NULL,
  latency_p95_ms integer,
  estimated_cost_usd numeric(12,8),
  executed_at timestamptz NOT NULL,
  evidence jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_version_id, report_id)
);

CREATE INDEX IF NOT EXISTS agents_org_created_idx ON runtu.agents(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_versions_agent_created_idx ON runtu.agent_versions(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS eval_runs_version_created_idx ON runtu.eval_runs(agent_version_id, created_at DESC);

ALTER TABLE runtu.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtu.agent_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtu.eval_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agents_member_read ON runtu.agents;
CREATE POLICY agents_member_read ON runtu.agents FOR SELECT TO runtu_app
USING (runtu.is_active_member(organization_id));
DROP POLICY IF EXISTS agent_versions_member_read ON runtu.agent_versions;
CREATE POLICY agent_versions_member_read ON runtu.agent_versions FOR SELECT TO runtu_app
USING (runtu.is_active_member(organization_id));
DROP POLICY IF EXISTS eval_runs_member_read ON runtu.eval_runs;
CREATE POLICY eval_runs_member_read ON runtu.eval_runs FOR SELECT TO runtu_app
USING (runtu.is_active_member(organization_id));

CREATE OR REPLACE FUNCTION runtu.prevent_immutable_agent_version_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.immutable THEN
    RAISE EXCEPTION 'immutable_agent_version' USING ERRCODE = '55000';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS protect_immutable_agent_version ON runtu.agent_versions;
CREATE TRIGGER protect_immutable_agent_version
BEFORE UPDATE ON runtu.agent_versions
FOR EACH ROW EXECUTE FUNCTION runtu.prevent_immutable_agent_version_mutation();

CREATE OR REPLACE FUNCTION runtu.import_huevo0(
  target_organization_id uuid,
  imported_manifest jsonb,
  imported_instructions text,
  imported_output_schema jsonb,
  imported_checksum text,
  imported_evidence jsonb
)
RETURNS TABLE (agent_id uuid, version_id uuid, version text, state text, checksum_sha256 text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = runtu, pg_temp AS $$
DECLARE
  authenticated_user text := runtu.current_user_id();
  target_agent_id uuid;
  target_version_id uuid;
  existing_checksum text;
  version_created boolean := false;
BEGIN
  IF NOT runtu.is_organization_owner(target_organization_id) THEN
    RAISE EXCEPTION 'owner_required' USING ERRCODE = '42501';
  END IF;
  IF imported_checksum !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'invalid_checksum' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO target_agent_id FROM runtu.agents
  WHERE organization_id = target_organization_id AND slug = imported_manifest #>> '{agent,id}';
  IF target_agent_id IS NULL THEN
    INSERT INTO runtu.agents (organization_id, slug, name, purpose, risk_level, status, created_by)
    VALUES (target_organization_id, imported_manifest #>> '{agent,id}', imported_manifest #>> '{agent,name}',
            imported_manifest #>> '{agent,purpose}', imported_manifest #>> '{agent,risk_level}', 'CANDIDATE', authenticated_user)
    RETURNING id INTO target_agent_id;
  END IF;

  SELECT version_row.id, version_row.checksum_sha256 INTO target_version_id, existing_checksum
  FROM runtu.agent_versions version_row
  WHERE version_row.agent_id = target_agent_id
    AND version_row.version = imported_manifest #>> '{agent,version}';

  IF target_version_id IS NULL THEN
    INSERT INTO runtu.agent_versions (
      organization_id, agent_id, version, state, manifest, instructions,
      output_schema, checksum_sha256, immutable, created_by
    ) VALUES (
      target_organization_id, target_agent_id, imported_manifest #>> '{agent,version}', 'CANDIDATE',
      imported_manifest, imported_instructions, imported_output_schema, imported_checksum, true, authenticated_user
    ) RETURNING id INTO target_version_id;
    version_created := true;
  ELSIF existing_checksum <> imported_checksum THEN
    RAISE EXCEPTION 'version_checksum_conflict' USING ERRCODE = '23505';
  END IF;

  INSERT INTO runtu.eval_runs (
    organization_id, agent_version_id, report_id, source_type, source_report, model,
    cases, passed, pass_rate, schema_pass_rate, policy_pass_rate,
    latency_p95_ms, estimated_cost_usd, executed_at, evidence
  ) VALUES (
    target_organization_id, target_version_id, imported_evidence->>'report_id', imported_evidence->>'source_type',
    imported_evidence->>'replay_of', imported_evidence->>'model', (imported_evidence->>'cases')::integer,
    (imported_evidence->>'passed')::integer, (imported_evidence->>'pass_rate')::numeric,
    (imported_evidence->>'schema_pass_rate')::numeric, (imported_evidence->>'policy_pass_rate')::numeric,
    (imported_evidence->>'latency_p95_ms')::integer, (imported_evidence->>'total_estimated_cost_usd')::numeric,
    '2026-07-21T16:43:53.242Z'::timestamptz, imported_evidence
  ) ON CONFLICT (agent_version_id, report_id) DO NOTHING;

  IF version_created THEN
    INSERT INTO runtu.audit_events (organization_id, actor_user_id, event_type, event_data)
    VALUES (target_organization_id, authenticated_user, 'agent.version_imported',
            jsonb_build_object('agent_id', target_agent_id, 'version_id', target_version_id, 'checksum', imported_checksum));
  END IF;

  RETURN QUERY SELECT target_agent_id, target_version_id,
    imported_manifest #>> '{agent,version}', 'CANDIDATE'::text, imported_checksum;
END;
$$;

REVOKE ALL ON FUNCTION runtu.import_huevo0(uuid, jsonb, text, jsonb, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION runtu.import_huevo0(uuid, jsonb, text, jsonb, text, jsonb) TO runtu_app;
GRANT SELECT ON runtu.agents, runtu.agent_versions, runtu.eval_runs TO runtu_app;
