\set ON_ERROR_STOP on

CREATE TABLE IF NOT EXISTS runtu.agent_templates (
  slug text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('TRANSFORMER', 'CONSULTANT', 'PREPARER', 'OPERATOR')),
  description text NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  maturity text NOT NULL CHECK (maturity IN ('CANDIDATE', 'SPEC_READY', 'PLANNED')),
  input_label text NOT NULL,
  output_label text NOT NULL,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggested_connectors jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 100,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runtu.connector_catalog (
  slug text PRIMARY KEY,
  name text NOT NULL,
  provider_type text NOT NULL CHECK (provider_type IN ('INTERNAL_API', 'OAUTH_API', 'REMOTE_MCP')),
  description text NOT NULL,
  write_capable boolean NOT NULL DEFAULT false,
  configuration_status text NOT NULL CHECK (configuration_status IN ('DESIGN_READY', 'PROVIDER_REQUIRED')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runtu.agent_workflow_specs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES runtu.organizations(id) ON DELETE CASCADE,
  template_slug text NOT NULL REFERENCES runtu.agent_templates(slug),
  agent_name text NOT NULL CHECK (char_length(agent_name) BETWEEN 3 AND 100),
  primary_user text NOT NULL CHECK (char_length(primary_user) BETWEEN 3 AND 200),
  desired_result text NOT NULL CHECK (char_length(desired_result) BETWEEN 10 AND 1200),
  operating_context text NOT NULL CHECK (char_length(operating_context) BETWEEN 3 AND 600),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SPEC_READY')),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, template_slug)
);

CREATE TABLE IF NOT EXISTS runtu.agent_connection_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES runtu.organizations(id) ON DELETE CASCADE,
  template_slug text NOT NULL REFERENCES runtu.agent_templates(slug),
  connector_slug text NOT NULL REFERENCES runtu.connector_catalog(slug),
  access_mode text NOT NULL CHECK (access_mode IN ('DISCONNECTED', 'READ_ONLY', 'PROPOSE', 'WRITE_APPROVED')),
  approval_required boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'READY_FOR_PROVIDER')),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, template_slug, connector_slug)
);

INSERT INTO runtu.connector_catalog (slug, name, provider_type, description, write_capable, configuration_status)
VALUES
  ('imaquinua-projects', 'Proyectos Imaquinua', 'INTERNAL_API', 'Consulta proyectos y prepara tareas dentro del ecosistema Imaquinua.', true, 'DESIGN_READY'),
  ('google-drive', 'Google Drive', 'OAUTH_API', 'Lee documentos autorizados para aportar contexto verificable.', false, 'PROVIDER_REQUIRED'),
  ('google-calendar', 'Google Calendar', 'OAUTH_API', 'Consulta disponibilidad y, con aprobación, prepara eventos.', true, 'PROVIDER_REQUIRED'),
  ('slack', 'Slack', 'OAUTH_API', 'Lee canales autorizados y prepara mensajes antes de enviarlos.', true, 'PROVIDER_REQUIRED')
ON CONFLICT (slug) DO UPDATE SET
  name = excluded.name, provider_type = excluded.provider_type, description = excluded.description,
  write_capable = excluded.write_capable, configuration_status = excluded.configuration_status, updated_at = now();

INSERT INTO runtu.agent_templates (
  slug, name, category, description, risk_level, maturity, input_label, output_label,
  capabilities, suggested_connectors, sort_order
)
VALUES
  ('minuta-comite', 'Minuta y Coordinación', 'PREPARER', 'Convierte conversaciones en decisiones, proyectos y tareas revisables.', 'low', 'CANDIDATE', 'Notas o dictado', 'Minuta, proyectos y tareas', '["structure","project_extraction","task_extraction"]', '["imaquinua-projects","google-calendar","slack"]', 10),
  ('guardian-marca', 'Guardián de Marca', 'CONSULTANT', 'Revisa piezas y recomendaciones contra criterios y fuentes de marca.', 'medium', 'SPEC_READY', 'Pieza, texto y contexto', 'Hallazgos, evidencia y correcciones', '["brand_review","source_grounding","risk_flags"]', '["google-drive"]', 20),
  ('prediagnostico-e3', 'Pre-diagnóstico E³', 'TRANSFORMER', 'Ordena señales del negocio en hipótesis y preguntas para diagnóstico.', 'medium', 'SPEC_READY', 'Respuestas y contexto', 'Hipótesis, brechas y siguiente conversación', '["diagnostic_structure","evidence_gaps"]', '[]', 30),
  ('coordinador-proyectos', 'Coordinador de Proyectos', 'OPERATOR', 'Consulta proyectos, prepara tareas y solicita aprobación antes de escribir.', 'high', 'PLANNED', 'Objetivo, equipo y restricciones', 'Plan, responsables, tareas y cambios aprobables', '["project_read","task_proposal","approved_write"]', '["imaquinua-projects","google-calendar","slack"]', 40)
ON CONFLICT (slug) DO UPDATE SET
  name = excluded.name, category = excluded.category, description = excluded.description,
  risk_level = excluded.risk_level, maturity = excluded.maturity, input_label = excluded.input_label,
  output_label = excluded.output_label, capabilities = excluded.capabilities,
  suggested_connectors = excluded.suggested_connectors, sort_order = excluded.sort_order, updated_at = now();

ALTER TABLE runtu.agent_workflow_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtu.agent_connection_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_workflow_specs_member_read ON runtu.agent_workflow_specs;
CREATE POLICY agent_workflow_specs_member_read ON runtu.agent_workflow_specs FOR SELECT TO runtu_app
USING (runtu.is_active_member(organization_id));

DROP POLICY IF EXISTS agent_connection_policies_member_read ON runtu.agent_connection_policies;
CREATE POLICY agent_connection_policies_member_read ON runtu.agent_connection_policies FOR SELECT TO runtu_app
USING (runtu.is_active_member(organization_id));

CREATE OR REPLACE FUNCTION runtu.save_agent_workflow_spec(
  target_organization_id uuid,
  target_template_slug text,
  requested_agent_name text,
  requested_primary_user text,
  requested_desired_result text,
  requested_operating_context text
)
RETURNS SETOF runtu.agent_workflow_specs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = runtu, pg_temp AS $$
DECLARE
  authenticated_user text := runtu.current_user_id();
  saved_row runtu.agent_workflow_specs%ROWTYPE;
BEGIN
  IF NOT runtu.is_organization_owner(target_organization_id) THEN
    RAISE EXCEPTION 'owner_required' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM runtu.agent_templates WHERE slug = target_template_slug) THEN
    RAISE EXCEPTION 'template_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF char_length(trim(requested_agent_name)) NOT BETWEEN 3 AND 100
    OR char_length(trim(requested_primary_user)) NOT BETWEEN 3 AND 200
    OR char_length(trim(requested_desired_result)) NOT BETWEEN 10 AND 1200
    OR char_length(trim(requested_operating_context)) NOT BETWEEN 3 AND 600 THEN
    RAISE EXCEPTION 'workflow_spec_incomplete' USING ERRCODE = '22023';
  END IF;

  INSERT INTO runtu.agent_workflow_specs (
    organization_id, template_slug, agent_name, primary_user, desired_result,
    operating_context, status, created_by
  ) VALUES (
    target_organization_id, target_template_slug, trim(requested_agent_name),
    trim(requested_primary_user), trim(requested_desired_result),
    trim(requested_operating_context), 'SPEC_READY', authenticated_user
  ) ON CONFLICT (organization_id, template_slug) DO UPDATE SET
    agent_name = excluded.agent_name, primary_user = excluded.primary_user,
    desired_result = excluded.desired_result, operating_context = excluded.operating_context,
    status = 'SPEC_READY', updated_at = now()
  RETURNING * INTO saved_row;

  INSERT INTO runtu.audit_events (organization_id, actor_user_id, event_type, event_data)
  VALUES (target_organization_id, authenticated_user, 'agent.workflow_spec_saved',
    jsonb_build_object('template_slug', target_template_slug, 'spec_id', saved_row.id));
  RETURN NEXT saved_row;
END;
$$;

CREATE OR REPLACE FUNCTION runtu.save_agent_connection_policy(
  target_organization_id uuid,
  target_template_slug text,
  target_connector_slug text,
  requested_access_mode text
)
RETURNS SETOF runtu.agent_connection_policies
LANGUAGE plpgsql SECURITY DEFINER SET search_path = runtu, pg_temp AS $$
DECLARE
  authenticated_user text := runtu.current_user_id();
  connector_can_write boolean;
  saved_row runtu.agent_connection_policies%ROWTYPE;
  must_approve boolean;
BEGIN
  IF NOT runtu.is_organization_owner(target_organization_id) THEN
    RAISE EXCEPTION 'owner_required' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM runtu.agent_templates WHERE slug = target_template_slug) THEN
    RAISE EXCEPTION 'template_not_found' USING ERRCODE = 'P0002';
  END IF;
  SELECT write_capable INTO connector_can_write FROM runtu.connector_catalog WHERE slug = target_connector_slug;
  IF connector_can_write IS NULL THEN
    RAISE EXCEPTION 'connector_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF requested_access_mode NOT IN ('DISCONNECTED', 'READ_ONLY', 'PROPOSE', 'WRITE_APPROVED')
    OR (requested_access_mode = 'WRITE_APPROVED' AND NOT connector_can_write) THEN
    RAISE EXCEPTION 'invalid_access_mode' USING ERRCODE = '22023';
  END IF;

  must_approve := requested_access_mode IN ('PROPOSE', 'WRITE_APPROVED');
  INSERT INTO runtu.agent_connection_policies (
    organization_id, template_slug, connector_slug, access_mode,
    approval_required, status, created_by
  ) VALUES (
    target_organization_id, target_template_slug, target_connector_slug, requested_access_mode,
    must_approve, CASE WHEN requested_access_mode = 'DISCONNECTED' THEN 'DRAFT' ELSE 'READY_FOR_PROVIDER' END,
    authenticated_user
  ) ON CONFLICT (organization_id, template_slug, connector_slug) DO UPDATE SET
    access_mode = excluded.access_mode, approval_required = excluded.approval_required,
    status = excluded.status, updated_at = now()
  RETURNING * INTO saved_row;

  INSERT INTO runtu.audit_events (organization_id, actor_user_id, event_type, event_data)
  VALUES (target_organization_id, authenticated_user, 'agent.connection_policy_saved',
    jsonb_build_object('template_slug', target_template_slug, 'connector_slug', target_connector_slug,
      'access_mode', requested_access_mode, 'approval_required', must_approve));
  RETURN NEXT saved_row;
END;
$$;

REVOKE ALL ON FUNCTION runtu.save_agent_workflow_spec(uuid, text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION runtu.save_agent_connection_policy(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION runtu.save_agent_workflow_spec(uuid, text, text, text, text, text) TO runtu_app;
GRANT EXECUTE ON FUNCTION runtu.save_agent_connection_policy(uuid, text, text, text) TO runtu_app;
GRANT SELECT ON runtu.agent_templates, runtu.connector_catalog, runtu.agent_workflow_specs, runtu.agent_connection_policies TO runtu_app;
