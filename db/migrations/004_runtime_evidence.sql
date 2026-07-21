\set ON_ERROR_STOP on

CREATE TABLE IF NOT EXISTS runtu.deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES runtu.organizations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES runtu.agents(id) ON DELETE CASCADE,
  agent_version_id uuid NOT NULL REFERENCES runtu.agent_versions(id),
  channel text NOT NULL CHECK (channel IN ('LAB', 'WEB_APP')),
  state text NOT NULL DEFAULT 'ACTIVE' CHECK (state IN ('ACTIVE', 'PAUSED')),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, agent_id, channel)
);

CREATE TABLE IF NOT EXISTS runtu.runtime_runs (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES runtu.organizations(id) ON DELETE CASCADE,
  deployment_id uuid NOT NULL REFERENCES runtu.deployments(id),
  agent_version_id uuid NOT NULL REFERENCES runtu.agent_versions(id),
  actor_user_id text NOT NULL,
  source_type text NOT NULL DEFAULT 'real' CHECK (source_type = 'real'),
  input_source text NOT NULL CHECK (input_source IN ('example', 'personal_anonymized')),
  status text NOT NULL CHECK (status IN ('SUCCEEDED', 'FAILED')),
  model text NOT NULL,
  latency_ms integer NOT NULL CHECK (latency_ms >= 0),
  input_tokens integer,
  output_tokens integer,
  warnings_count integer NOT NULL DEFAULT 0 CHECK (warnings_count >= 0),
  output_valid boolean NOT NULL,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runtu.run_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES runtu.organizations(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES runtu.runtime_runs(id) ON DELETE CASCADE,
  actor_user_id text NOT NULL,
  rating text NOT NULL CHECK (rating IN ('CORRECT', 'INCORRECT')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, actor_user_id)
);

CREATE INDEX IF NOT EXISTS deployments_org_idx ON runtu.deployments(organization_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS runtime_runs_org_idx ON runtu.runtime_runs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS run_feedback_run_idx ON runtu.run_feedback(run_id, created_at DESC);

ALTER TABLE runtu.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtu.runtime_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtu.run_feedback ENABLE ROW LEVEL SECURITY;

INSERT INTO runtu.deployments (organization_id, agent_id, agent_version_id, channel, state, created_by)
SELECT radiography.organization_id, version_row.agent_id, radiography.built_version_id,
  'LAB', 'ACTIVE', coalesce(radiography.approved_by, radiography.created_by)
FROM runtu.radiographies radiography
JOIN runtu.agent_versions version_row ON version_row.id = radiography.built_version_id
WHERE radiography.status = 'BUILT'
ON CONFLICT (organization_id, agent_id, channel) DO UPDATE SET
  agent_version_id = excluded.agent_version_id, updated_at = now();

DROP POLICY IF EXISTS deployments_member_read ON runtu.deployments;
CREATE POLICY deployments_member_read ON runtu.deployments FOR SELECT TO runtu_app
USING (runtu.is_active_member(organization_id));
DROP POLICY IF EXISTS runtime_runs_member_read ON runtu.runtime_runs;
CREATE POLICY runtime_runs_member_read ON runtu.runtime_runs FOR SELECT TO runtu_app
USING (runtu.is_active_member(organization_id));
DROP POLICY IF EXISTS run_feedback_member_read ON runtu.run_feedback;
CREATE POLICY run_feedback_member_read ON runtu.run_feedback FOR SELECT TO runtu_app
USING (runtu.is_active_member(organization_id));

CREATE OR REPLACE FUNCTION runtu.activate_lab_candidate(target_organization_id uuid, target_version_id uuid)
RETURNS SETOF runtu.deployments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = runtu, pg_temp AS $$
DECLARE
  authenticated_user text := runtu.current_user_id();
  target_agent_id uuid;
  deployment_row runtu.deployments%ROWTYPE;
BEGIN
  IF NOT runtu.is_organization_owner(target_organization_id) THEN
    RAISE EXCEPTION 'owner_required' USING ERRCODE = '42501';
  END IF;
  SELECT version_row.agent_id INTO target_agent_id FROM runtu.agent_versions version_row
  WHERE version_row.id = target_version_id AND version_row.organization_id = target_organization_id
    AND version_row.immutable AND version_row.state IN ('CANDIDATE', 'LIVE');
  IF target_agent_id IS NULL THEN
    RAISE EXCEPTION 'version_not_approved' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO runtu.deployments (organization_id, agent_id, agent_version_id, channel, created_by)
  VALUES (target_organization_id, target_agent_id, target_version_id, 'LAB', authenticated_user)
  ON CONFLICT (organization_id, agent_id, channel) DO UPDATE SET
    agent_version_id = excluded.agent_version_id, state = 'ACTIVE', updated_at = now()
  RETURNING * INTO deployment_row;

  INSERT INTO runtu.audit_events (organization_id, actor_user_id, event_type, event_data)
  VALUES (target_organization_id, authenticated_user, 'deployment.lab_activated',
    jsonb_build_object('deployment_id', deployment_row.id, 'version_id', target_version_id));
  RETURN NEXT deployment_row;
END;
$$;

CREATE OR REPLACE FUNCTION runtu.authorize_agent_run(target_organization_id uuid, target_version_id uuid)
RETURNS TABLE (
  deployment_id uuid, agent_version_id uuid, version text, checksum_sha256 text,
  instructions text, output_schema jsonb, manifest jsonb,
  eval_report_id text, eval_source_type text, eval_cases integer, eval_passed integer,
  eval_evidence jsonb, remaining_quota integer
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = runtu, pg_temp AS $$
DECLARE
  authenticated_user text := runtu.current_user_id();
  target_deployment runtu.deployments%ROWTYPE;
  quota_remaining integer;
BEGIN
  IF NOT runtu.is_active_member(target_organization_id) THEN
    RAISE EXCEPTION 'organization_access_denied' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO target_deployment FROM runtu.deployments deployment_row
  WHERE deployment_row.organization_id = target_organization_id
    AND deployment_row.agent_version_id = target_version_id AND deployment_row.channel = 'LAB';
  IF target_deployment.id IS NULL THEN
    RAISE EXCEPTION 'version_not_active' USING ERRCODE = 'P0002';
  END IF;
  IF target_deployment.state = 'PAUSED' THEN
    RAISE EXCEPTION 'deployment_paused' USING ERRCODE = '55000';
  END IF;

  UPDATE runtu.organization_quotas quota SET runs_used = quota.runs_used + 1, updated_at = now()
  WHERE quota.organization_id = target_organization_id AND quota.runs_used < quota.monthly_run_limit
  RETURNING quota.monthly_run_limit - quota.runs_used INTO quota_remaining;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'quota_exhausted' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO runtu.audit_events (organization_id, actor_user_id, event_type, event_data)
  VALUES (target_organization_id, authenticated_user, 'agent.run_authorized',
    jsonb_build_object('deployment_id', target_deployment.id, 'version_id', target_version_id, 'remaining_quota', quota_remaining));

  RETURN QUERY
  SELECT target_deployment.id, version_row.id, version_row.version, version_row.checksum_sha256,
    version_row.instructions, version_row.output_schema, version_row.manifest,
    evaluation.report_id, evaluation.source_type, evaluation.cases, evaluation.passed,
    evaluation.evidence, quota_remaining
  FROM runtu.agent_versions version_row
  LEFT JOIN LATERAL (
    SELECT eval.* FROM runtu.eval_runs eval WHERE eval.agent_version_id = version_row.id
    ORDER BY eval.created_at DESC LIMIT 1
  ) evaluation ON true
  WHERE version_row.id = target_version_id AND version_row.organization_id = target_organization_id
    AND version_row.immutable AND version_row.state IN ('CANDIDATE', 'LIVE');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'version_not_approved' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION runtu.record_agent_run(
  target_organization_id uuid, target_deployment_id uuid, target_version_id uuid,
  target_run_id uuid, target_input_source text, target_status text, target_model text,
  target_latency_ms integer, target_input_tokens integer, target_output_tokens integer,
  target_warnings_count integer, target_output_valid boolean, target_error_code text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = runtu, pg_temp AS $$
DECLARE authenticated_user text := runtu.current_user_id();
BEGIN
  IF NOT runtu.is_active_member(target_organization_id) OR NOT EXISTS (
    SELECT 1 FROM runtu.deployments deployment_row
    WHERE deployment_row.id = target_deployment_id AND deployment_row.organization_id = target_organization_id
      AND deployment_row.agent_version_id = target_version_id
  ) THEN
    RAISE EXCEPTION 'organization_access_denied' USING ERRCODE = '42501';
  END IF;
  INSERT INTO runtu.runtime_runs (
    id, organization_id, deployment_id, agent_version_id, actor_user_id, input_source,
    status, model, latency_ms, input_tokens, output_tokens, warnings_count, output_valid, error_code
  ) VALUES (
    target_run_id, target_organization_id, target_deployment_id, target_version_id, authenticated_user,
    target_input_source, target_status, left(target_model, 120), greatest(target_latency_ms, 0),
    target_input_tokens, target_output_tokens, greatest(target_warnings_count, 0), target_output_valid,
    left(target_error_code, 120)
  ) ON CONFLICT (id) DO NOTHING;
  RETURN target_run_id;
END;
$$;

CREATE OR REPLACE FUNCTION runtu.submit_run_feedback(
  target_organization_id uuid, target_run_id uuid, target_rating text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = runtu, pg_temp AS $$
DECLARE authenticated_user text := runtu.current_user_id(); feedback_id uuid;
BEGIN
  IF target_rating NOT IN ('CORRECT', 'INCORRECT') OR NOT EXISTS (
    SELECT 1 FROM runtu.runtime_runs run_row
    WHERE run_row.id = target_run_id AND run_row.organization_id = target_organization_id
      AND runtu.is_active_member(run_row.organization_id)
  ) THEN
    RAISE EXCEPTION 'feedback_not_allowed' USING ERRCODE = '42501';
  END IF;
  INSERT INTO runtu.run_feedback (organization_id, run_id, actor_user_id, rating)
  VALUES (target_organization_id, target_run_id, authenticated_user, target_rating)
  ON CONFLICT (run_id, actor_user_id) DO UPDATE SET rating = excluded.rating, created_at = now()
  RETURNING id INTO feedback_id;
  INSERT INTO runtu.audit_events (organization_id, actor_user_id, event_type, event_data)
  VALUES (target_organization_id, authenticated_user, 'agent.run_feedback',
    jsonb_build_object('run_id', target_run_id, 'rating', target_rating));
  RETURN feedback_id;
END;
$$;

REVOKE ALL ON FUNCTION runtu.activate_lab_candidate(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION runtu.authorize_agent_run(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION runtu.record_agent_run(uuid, uuid, uuid, uuid, text, text, text, integer, integer, integer, integer, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION runtu.submit_run_feedback(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION runtu.activate_lab_candidate(uuid, uuid) TO runtu_app;
GRANT EXECUTE ON FUNCTION runtu.authorize_agent_run(uuid, uuid) TO runtu_app;
GRANT EXECUTE ON FUNCTION runtu.record_agent_run(uuid, uuid, uuid, uuid, text, text, text, integer, integer, integer, integer, boolean, text) TO runtu_app;
GRANT EXECUTE ON FUNCTION runtu.submit_run_feedback(uuid, uuid, text) TO runtu_app;
GRANT SELECT ON runtu.deployments, runtu.runtime_runs, runtu.run_feedback TO runtu_app;
