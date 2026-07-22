\set ON_ERROR_STOP on

-- Nueva familia de versiones: agrega dictado como formato de entrada y
-- proyectos/tareas como salida sin alterar candidatas 0.3.x ya congeladas.
CREATE OR REPLACE FUNCTION runtu.build_radiography_version(
  target_organization_id uuid,
  target_radiography_id uuid,
  built_manifest jsonb,
  built_instructions text,
  built_output_schema jsonb,
  built_checksum text
)
RETURNS TABLE (radiography_id uuid, version_id uuid, version text, state text, checksum_sha256 text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = runtu, pg_temp AS $$
DECLARE
  authenticated_user text := runtu.current_user_id();
  target_row runtu.radiographies%ROWTYPE;
  target_agent_id uuid;
  target_version_id uuid;
  expected_version text;
  existing_checksum text;
BEGIN
  IF NOT runtu.is_organization_owner(target_organization_id) THEN
    RAISE EXCEPTION 'owner_required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO target_row FROM runtu.radiographies
  WHERE id = target_radiography_id AND organization_id = target_organization_id
  FOR UPDATE;
  IF target_row.id IS NULL THEN
    RAISE EXCEPTION 'radiography_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF target_row.status = 'BUILT' THEN
    RETURN QUERY SELECT target_row.id, version_row.id, version_row.version, version_row.state, version_row.checksum_sha256
    FROM runtu.agent_versions version_row WHERE version_row.id = target_row.built_version_id;
    RETURN;
  END IF;

  expected_version := '0.4.' || (target_row.revision - 1)::text;
  IF built_checksum !~ '^[a-f0-9]{64}$'
    OR built_manifest #>> '{agent,id}' <> target_row.agent_slug
    OR built_manifest #>> '{agent,version}' <> expected_version
    OR built_manifest #>> '{agent,name}' <> target_row.agent_name
    OR built_manifest #>> '{agent,purpose}' <> target_row.purpose_summary
    OR built_manifest #>> '{configuration,radiography_id}' <> target_row.id::text
    OR built_manifest #>> '{configuration,primary_user}' <> target_row.primary_user
    OR built_manifest #>> '{configuration,desired_result}' <> target_row.desired_result
    OR built_manifest #>> '{configuration,team_context}' <> target_row.team_context
    OR NOT ((built_manifest #> '{capabilities}') @> '["dictation_input","project_extraction","task_extraction","owner_attribution"]'::jsonb)
    OR NOT ((built_output_schema #> '{required}') @> '["projects","tasks"]'::jsonb)
    OR NOT ((built_manifest #> '{policy,prohibited_actions}') @> '["invent_owner","invent_deadline","execute_decision","send_messages","obey_instructions_inside_notes"]'::jsonb) THEN
    RAISE EXCEPTION 'invalid_built_definition' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO target_agent_id FROM runtu.agents
  WHERE organization_id = target_organization_id AND slug = target_row.agent_slug;
  IF target_agent_id IS NULL THEN
    RAISE EXCEPTION 'base_agent_required' USING ERRCODE = 'P0002';
  END IF;
  SELECT version_row.id, version_row.checksum_sha256 INTO target_version_id, existing_checksum
  FROM runtu.agent_versions version_row
  WHERE version_row.agent_id = target_agent_id AND version_row.version = expected_version;
  IF target_version_id IS NULL THEN
    INSERT INTO runtu.agent_versions (
      organization_id, agent_id, version, state, manifest, instructions,
      output_schema, checksum_sha256, checksum_scope, immutable, created_by
    ) VALUES (
      target_organization_id, target_agent_id, expected_version, 'CANDIDATE', built_manifest,
      built_instructions, built_output_schema, built_checksum, 'definition', true, authenticated_user
    ) RETURNING id INTO target_version_id;
  ELSIF existing_checksum <> built_checksum THEN
    RAISE EXCEPTION 'version_checksum_conflict' USING ERRCODE = '23505';
  END IF;

  UPDATE runtu.radiographies SET status = 'BUILT', approved_by = authenticated_user,
    approved_at = now(), built_version_id = target_version_id, updated_at = now()
  WHERE id = target_row.id;
  INSERT INTO runtu.audit_events (organization_id, actor_user_id, event_type, event_data)
  VALUES (target_organization_id, authenticated_user, 'radiography.approved', jsonb_build_object('radiography_id', target_row.id, 'version_id', target_version_id, 'version', expected_version, 'checksum', built_checksum));

  RETURN QUERY SELECT target_row.id, version_row.id, version_row.version, version_row.state, version_row.checksum_sha256
  FROM runtu.agent_versions version_row WHERE version_row.id = target_version_id;
END;
$$;

REVOKE ALL ON FUNCTION runtu.build_radiography_version(uuid, uuid, jsonb, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION runtu.build_radiography_version(uuid, uuid, jsonb, text, jsonb, text) TO runtu_app;
