import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const runtimeUrl = process.env.RUNTU_DATABASE_URL
  || readFileSync('/private/tmp/runtu-runtime-database-url', 'utf8').trim();
const adminUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!runtimeUrl || !adminUrl) throw new Error('Faltan conexiones para la prueba.');

const runtime = neon(runtimeUrl);
const admin = neon(adminUrl);
const marker = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const owner = `workflow_owner_${marker}`;
const reviewer = `workflow_reviewer_${marker}`;
const outsider = `workflow_outsider_${marker}`;

function claims(sql, userId) {
  return sql`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`;
}

let organization;
try {
  [, [organization]] = await runtime.transaction((sql) => [
    claims(sql, owner),
    sql`select * from runtu.bootstrap_personal_organization('Workflow multiagente')`,
  ]);

  const [, templates, connectors] = await runtime.transaction((sql) => [
    claims(sql, owner),
    sql`select slug from runtu.agent_templates order by sort_order`,
    sql`select slug from runtu.connector_catalog order by slug`,
  ]);
  if (templates.length !== 4) throw new Error(`Se esperaban 4 moldes; llegaron ${templates.length}.`);
  if (!connectors.some(({ slug }) => slug === 'imaquinua-projects')) throw new Error('Falta el conector interno de proyectos.');

  await runtime.transaction((sql) => [
    claims(sql, owner),
    sql`select * from runtu.save_agent_workflow_spec(
      ${organization.id}, 'guardian-marca', 'Guardián UW', 'Equipo de marca',
      'Dejar hallazgos verificables y correcciones priorizadas.',
      'Revisión de piezas antes de publicación'
    )`,
  ]);
  const [, [savedSpec]] = await runtime.transaction((sql) => [
    claims(sql, owner),
    sql`select * from runtu.agent_workflow_specs where organization_id = ${organization.id} and template_slug = 'guardian-marca'`,
  ]);
  if (savedSpec?.status !== 'SPEC_READY') throw new Error('El contrato no quedó listo para especificación.');

  await runtime.transaction((sql) => [
    claims(sql, owner),
    sql`select runtu.add_reviewer_fixture(${organization.id}, ${reviewer})`,
  ]);
  const [, reviewerSpecs] = await runtime.transaction((sql) => [
    claims(sql, reviewer),
    sql`select id from runtu.agent_workflow_specs where organization_id = ${organization.id}`,
  ]);
  if (reviewerSpecs.length !== 1) throw new Error('REVIEWER no pudo consultar el contrato de su organización.');

  let reviewerMutationBlocked = false;
  try {
    await runtime.transaction((sql) => [
      claims(sql, reviewer),
      sql`select * from runtu.save_agent_workflow_spec(
        ${organization.id}, 'guardian-marca', 'Cambio indebido', 'Equipo',
        'Este cambio no debe guardarse en la organización.', 'Prueba'
      )`,
    ]);
  } catch (error) {
    reviewerMutationBlocked = error?.code === '42501' || error?.message?.includes('owner_required');
  }
  if (!reviewerMutationBlocked) throw new Error('REVIEWER pudo modificar el contrato.');

  await runtime.transaction((sql) => [
    claims(sql, owner),
    sql`select * from runtu.save_agent_connection_policy(
      ${organization.id}, 'coordinador-proyectos', 'imaquinua-projects', 'WRITE_APPROVED'
    )`,
  ]);
  const [, [writePolicy]] = await runtime.transaction((sql) => [
    claims(sql, owner),
    sql`select * from runtu.agent_connection_policies
      where organization_id = ${organization.id} and connector_slug = 'imaquinua-projects'`,
  ]);
  if (!writePolicy?.approval_required || writePolicy.status !== 'READY_FOR_PROVIDER') {
    throw new Error('La escritura no quedó condicionada a aprobación humana.');
  }

  let unsupportedWriteBlocked = false;
  try {
    await runtime.transaction((sql) => [
      claims(sql, owner),
      sql`select * from runtu.save_agent_connection_policy(
        ${organization.id}, 'guardian-marca', 'google-drive', 'WRITE_APPROVED'
      )`,
    ]);
  } catch (error) {
    unsupportedWriteBlocked = error?.code === '22023' || error?.message?.includes('invalid_access_mode');
  }
  if (!unsupportedWriteBlocked) throw new Error('Se permitió escritura en un conector de solo lectura.');

  const [, outsiderSpecs] = await runtime.transaction((sql) => [
    claims(sql, outsider),
    sql`select id from runtu.agent_workflow_specs where organization_id = ${organization.id}`,
  ]);
  if (outsiderSpecs.length !== 0) throw new Error('RLS expuso contratos a un usuario externo.');

  const forbiddenColumns = await admin`
    select table_name, column_name from information_schema.columns
    where table_schema = 'runtu'
      and table_name in ('agent_workflow_specs', 'agent_connection_policies')
      and lower(column_name) in ('token', 'secret', 'password', 'credential', 'credentials', 'api_key')
  `;
  if (forbiddenColumns.length) throw new Error('El workflow contiene columnas destinadas a secretos.');

  const [auditCount] = await admin`
    select count(*)::int as total from runtu.audit_events
    where organization_id = ${organization.id}
      and event_type in ('agent.workflow_spec_saved', 'agent.connection_policy_saved')
  `;
  if (auditCount.total !== 2) throw new Error(`Auditoría incompleta: ${auditCount.total} eventos.`);

  console.log('PASS: 4 moldes; contrato persistido; REVIEWER sólo lectura; RLS aislado; escritura con aprobación; secretos fuera del workflow.');
} finally {
  if (organization) await admin`delete from runtu.organizations where id = ${organization.id}`;
}
