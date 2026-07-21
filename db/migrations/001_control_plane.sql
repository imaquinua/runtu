\set ON_ERROR_STOP on

SELECT format(
  'CREATE ROLE runtu_app LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT',
  :'role_password'
)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'runtu_app')
\gexec

SELECT format(
  'ALTER ROLE runtu_app WITH LOGIN PASSWORD %L',
  :'role_password'
)
\gexec

ALTER ROLE runtu_app SET row_security = on;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS runtu;
REVOKE ALL ON SCHEMA runtu FROM PUBLIC;
GRANT USAGE ON SCHEMA runtu TO runtu_app;

CREATE OR REPLACE FUNCTION runtu.current_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub';
$$;

CREATE TABLE IF NOT EXISTS runtu.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  slug text NOT NULL UNIQUE,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runtu.memberships (
  organization_id uuid NOT NULL REFERENCES runtu.organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('OWNER', 'REVIEWER')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INVITED', 'SUSPENDED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS runtu.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES runtu.organizations(id) ON DELETE CASCADE,
  actor_user_id text NOT NULL,
  event_type text NOT NULL,
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runtu.organization_quotas (
  organization_id uuid PRIMARY KEY REFERENCES runtu.organizations(id) ON DELETE CASCADE,
  monthly_run_limit integer NOT NULL DEFAULT 50 CHECK (monthly_run_limit BETWEEN 0 AND 100000),
  runs_used integer NOT NULL DEFAULT 0 CHECK (runs_used >= 0),
  period_started_at timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runtu.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES runtu.organizations(id) ON DELETE CASCADE,
  public_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('RADIOGRAPHY')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 600),
  field_schema jsonb NOT NULL,
  consent_version text NOT NULL,
  consent_copy text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED')),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runtu.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES runtu.organizations(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES runtu.forms(id) ON DELETE CASCADE,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  consent_given boolean NOT NULL CHECK (consent_given),
  consent_version text NOT NULL,
  consent_copy text NOT NULL,
  consent_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'direct',
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS forms_org_created_idx ON runtu.forms(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS form_submissions_form_created_idx ON runtu.form_submissions(form_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS memberships_user_id_idx ON runtu.memberships(user_id);
CREATE INDEX IF NOT EXISTS audit_events_org_created_idx ON runtu.audit_events(organization_id, created_at DESC);

ALTER TABLE runtu.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtu.organizations NO FORCE ROW LEVEL SECURITY;
ALTER TABLE runtu.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtu.memberships NO FORCE ROW LEVEL SECURITY;
ALTER TABLE runtu.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtu.audit_events NO FORCE ROW LEVEL SECURITY;
ALTER TABLE runtu.organization_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtu.organization_quotas NO FORCE ROW LEVEL SECURITY;
ALTER TABLE runtu.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtu.forms NO FORCE ROW LEVEL SECURITY;
ALTER TABLE runtu.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtu.form_submissions NO FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION runtu.is_active_member(target_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = runtu, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM runtu.memberships
    WHERE organization_id = target_organization_id
      AND user_id = runtu.current_user_id()
      AND status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION runtu.is_organization_owner(target_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = runtu, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM runtu.memberships
    WHERE organization_id = target_organization_id
      AND user_id = runtu.current_user_id()
      AND role = 'OWNER'
      AND status = 'ACTIVE'
  );
$$;

DROP POLICY IF EXISTS organizations_member_read ON runtu.organizations;
CREATE POLICY organizations_member_read ON runtu.organizations
FOR SELECT TO runtu_app
USING (runtu.is_active_member(id));

DROP POLICY IF EXISTS memberships_scoped_read ON runtu.memberships;
CREATE POLICY memberships_scoped_read ON runtu.memberships
FOR SELECT TO runtu_app
USING (
  user_id = runtu.current_user_id()
  OR runtu.is_organization_owner(organization_id)
);

DROP POLICY IF EXISTS audit_events_member_read ON runtu.audit_events;
CREATE POLICY audit_events_member_read ON runtu.audit_events
FOR SELECT TO runtu_app
USING (runtu.is_active_member(organization_id));

DROP POLICY IF EXISTS organization_quotas_member_read ON runtu.organization_quotas;
CREATE POLICY organization_quotas_member_read ON runtu.organization_quotas
FOR SELECT TO runtu_app
USING (runtu.is_active_member(organization_id));

DROP POLICY IF EXISTS forms_member_read ON runtu.forms;
CREATE POLICY forms_member_read ON runtu.forms
FOR SELECT TO runtu_app
USING (runtu.is_active_member(organization_id));

DROP POLICY IF EXISTS form_submissions_member_read ON runtu.form_submissions;
CREATE POLICY form_submissions_member_read ON runtu.form_submissions
FOR SELECT TO runtu_app
USING (runtu.is_active_member(organization_id));

CREATE OR REPLACE FUNCTION runtu.bootstrap_personal_organization(requested_name text DEFAULT NULL)
RETURNS TABLE (id uuid, name text, slug text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = runtu, pg_temp
AS $$
DECLARE
  authenticated_user text := runtu.current_user_id();
  bootstrapped_id uuid;
  organization_name text;
BEGIN
  IF authenticated_user IS NULL THEN
    RAISE EXCEPTION 'authenticated_user_required' USING ERRCODE = '42501';
  END IF;

  SELECT m.organization_id, o.name
  INTO bootstrapped_id, organization_name
  FROM runtu.memberships m
  JOIN runtu.organizations o ON o.id = m.organization_id
  WHERE m.user_id = authenticated_user AND m.status = 'ACTIVE'
  ORDER BY m.created_at
  LIMIT 1;

  IF bootstrapped_id IS NULL THEN
    bootstrapped_id := gen_random_uuid();
    organization_name := left(coalesce(nullif(trim(requested_name), ''), 'Mi organización'), 100);

    INSERT INTO runtu.organizations (id, name, slug, created_by)
    VALUES (bootstrapped_id, organization_name, 'org-' || substr(md5(bootstrapped_id::text), 1, 12), authenticated_user);

    INSERT INTO runtu.memberships (organization_id, user_id, role)
    VALUES (bootstrapped_id, authenticated_user, 'OWNER');

    INSERT INTO runtu.audit_events (organization_id, actor_user_id, event_type)
    VALUES (bootstrapped_id, authenticated_user, 'organization.created');

    INSERT INTO runtu.organization_quotas (organization_id)
    VALUES (bootstrapped_id);
  END IF;

  RETURN QUERY
  SELECT o.id, o.name, o.slug, m.role
  FROM runtu.organizations o
  JOIN runtu.memberships m ON m.organization_id = o.id
  WHERE o.id = bootstrapped_id AND m.user_id = authenticated_user;
END;
$$;

CREATE OR REPLACE FUNCTION runtu.add_reviewer_fixture(target_organization_id uuid, reviewer_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = runtu, pg_temp
AS $$
DECLARE
  authenticated_user text := runtu.current_user_id();
BEGIN
  IF NOT runtu.is_organization_owner(target_organization_id) THEN
    RAISE EXCEPTION 'owner_required' USING ERRCODE = '42501';
  END IF;
  IF nullif(trim(reviewer_user_id), '') IS NULL THEN
    RAISE EXCEPTION 'reviewer_user_required' USING ERRCODE = '22023';
  END IF;

  INSERT INTO runtu.memberships (organization_id, user_id, role)
  VALUES (target_organization_id, reviewer_user_id, 'REVIEWER')
  ON CONFLICT (organization_id, user_id)
  DO UPDATE SET role = 'REVIEWER', status = 'ACTIVE';

  INSERT INTO runtu.audit_events (organization_id, actor_user_id, event_type, event_data)
  VALUES (target_organization_id, authenticated_user, 'membership.reviewer_added', jsonb_build_object('subject_user_id', reviewer_user_id));
END;
$$;

CREATE OR REPLACE FUNCTION runtu.consume_run_quota(target_organization_id uuid)
RETURNS TABLE (runs_used integer, monthly_run_limit integer, remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = runtu, pg_temp
AS $$
DECLARE
  authenticated_user text := runtu.current_user_id();
BEGIN
  IF NOT runtu.is_active_member(target_organization_id) THEN
    RAISE EXCEPTION 'organization_access_denied' USING ERRCODE = '42501';
  END IF;

  UPDATE runtu.organization_quotas quota
  SET runs_used = quota.runs_used + 1, updated_at = now()
  WHERE quota.organization_id = target_organization_id
    AND quota.runs_used < quota.monthly_run_limit
  RETURNING quota.runs_used, quota.monthly_run_limit, quota.monthly_run_limit - quota.runs_used
  INTO runs_used, monthly_run_limit, remaining;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'quota_exhausted' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO runtu.audit_events (organization_id, actor_user_id, event_type, event_data)
  VALUES (target_organization_id, authenticated_user, 'quota.run_consumed', jsonb_build_object('remaining', remaining));

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION runtu.create_radiography_form(target_organization_id uuid, requested_title text DEFAULT NULL)
RETURNS TABLE (id uuid, public_id uuid, title text, status text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = runtu, pg_temp
AS $$
DECLARE
  authenticated_user text := runtu.current_user_id();
  created_form_id uuid := gen_random_uuid();
BEGIN
  IF NOT runtu.is_organization_owner(target_organization_id) THEN
    RAISE EXCEPTION 'owner_required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO runtu.forms (
    id, organization_id, kind, title, description, field_schema,
    consent_version, consent_copy, created_by
  ) VALUES (
    created_form_id,
    target_organization_id,
    'RADIOGRAPHY',
    left(coalesce(nullif(trim(requested_title), ''), 'Radiografía de un nuevo agente'), 120),
    'Cuéntanos qué trabajo debería asumir el agente, para quién trabaja y dónde debe detenerse.',
    '[{"id":"contact_email","label":"Tu correo","type":"email","required":true,"maxLength":254},{"id":"desired_result","label":"¿Qué resultado esperas recibir?","type":"textarea","required":true,"maxLength":1200},{"id":"primary_user","label":"¿Quién usará este agente?","type":"text","required":true,"maxLength":200},{"id":"boundaries","label":"¿Qué nunca debería decidir o hacer solo?","type":"textarea","required":true,"maxLength":1200}]'::jsonb,
    'radiography-v1-2026-07-21',
    'Acepto que Runtu trate estas respuestas y mi correo para evaluar esta idea de agente y contactar conmigo sobre el resultado.',
    authenticated_user
  );

  INSERT INTO runtu.audit_events (organization_id, actor_user_id, event_type, event_data)
  VALUES (target_organization_id, authenticated_user, 'form.created', jsonb_build_object('form_id', created_form_id, 'kind', 'RADIOGRAPHY'));

  RETURN QUERY
  SELECT form_row.id, form_row.public_id, form_row.title, form_row.status, form_row.created_at
  FROM runtu.forms form_row WHERE form_row.id = created_form_id;
END;
$$;

CREATE OR REPLACE FUNCTION runtu.get_public_form(requested_public_id uuid)
RETURNS TABLE (
  public_id uuid, title text, description text, field_schema jsonb,
  consent_version text, consent_copy text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = runtu, pg_temp
AS $$
  SELECT form_row.public_id, form_row.title, form_row.description, form_row.field_schema,
         form_row.consent_version, form_row.consent_copy
  FROM runtu.forms form_row
  WHERE form_row.public_id = requested_public_id AND form_row.status = 'ACTIVE';
$$;

CREATE OR REPLACE FUNCTION runtu.submit_public_form(
  requested_public_id uuid,
  submitted_payload jsonb,
  accepted_consent boolean,
  submitted_source text DEFAULT 'direct'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = runtu, pg_temp
AS $$
DECLARE
  form_row runtu.forms%ROWTYPE;
  submission_id uuid := gen_random_uuid();
BEGIN
  SELECT * INTO form_row FROM runtu.forms
  WHERE public_id = requested_public_id AND status = 'ACTIVE';

  IF form_row.id IS NULL THEN
    RAISE EXCEPTION 'form_not_available' USING ERRCODE = 'P0002';
  END IF;
  IF accepted_consent IS NOT TRUE THEN
    RAISE EXCEPTION 'consent_required' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(submitted_payload) <> 'object' OR octet_length(submitted_payload::text) > 20000 THEN
    RAISE EXCEPTION 'invalid_payload' USING ERRCODE = '22023';
  END IF;

  INSERT INTO runtu.form_submissions (
    id, organization_id, form_id, payload, consent_given,
    consent_version, consent_copy, source
  ) VALUES (
    submission_id, form_row.organization_id, form_row.id, submitted_payload, true,
    form_row.consent_version, form_row.consent_copy, left(coalesce(nullif(trim(submitted_source), ''), 'direct'), 120)
  );

  INSERT INTO runtu.audit_events (organization_id, actor_user_id, event_type, event_data)
  VALUES (form_row.organization_id, 'public:' || submission_id::text, 'form.submitted', jsonb_build_object('form_id', form_row.id, 'submission_id', submission_id));

  RETURN submission_id;
END;
$$;

REVOKE ALL ON FUNCTION runtu.current_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION runtu.is_active_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION runtu.is_organization_owner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION runtu.bootstrap_personal_organization(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION runtu.add_reviewer_fixture(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION runtu.consume_run_quota(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION runtu.create_radiography_form(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION runtu.get_public_form(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION runtu.submit_public_form(uuid, jsonb, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION runtu.current_user_id() TO runtu_app;
GRANT EXECUTE ON FUNCTION runtu.is_active_member(uuid) TO runtu_app;
GRANT EXECUTE ON FUNCTION runtu.is_organization_owner(uuid) TO runtu_app;
GRANT EXECUTE ON FUNCTION runtu.bootstrap_personal_organization(text) TO runtu_app;
GRANT EXECUTE ON FUNCTION runtu.add_reviewer_fixture(uuid, text) TO runtu_app;
GRANT EXECUTE ON FUNCTION runtu.consume_run_quota(uuid) TO runtu_app;
GRANT EXECUTE ON FUNCTION runtu.create_radiography_form(uuid, text) TO runtu_app;
GRANT EXECUTE ON FUNCTION runtu.get_public_form(uuid) TO runtu_app;
GRANT EXECUTE ON FUNCTION runtu.submit_public_form(uuid, jsonb, boolean, text) TO runtu_app;
GRANT SELECT ON runtu.organizations, runtu.memberships, runtu.audit_events, runtu.organization_quotas, runtu.forms, runtu.form_submissions TO runtu_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA runtu TO runtu_app;
