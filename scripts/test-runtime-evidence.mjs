import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { buildRadiographyDefinition } from '../api/_agent/radiography.js';
import { definitionChecksum, huevo0Payload, payloadChecksum } from '../api/_agent/package.js';

const runtimeUrl = process.env.RUNTU_DATABASE_URL || readFileSync('/private/tmp/runtu-runtime-database-url', 'utf8').trim();
const adminUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!runtimeUrl || !adminUrl) throw new Error('Faltan conexiones de prueba.');
const runtime = neon(runtimeUrl);
const admin = neon(adminUrl);
const marker = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const owner = `runtime_owner_${marker}`;
const reviewer = `runtime_reviewer_${marker}`;
const outsider = `runtime_outsider_${marker}`;
const claims = (sql, userId) => sql`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`;
const canonical = huevo0Payload();
let organization;

try {
  [, [organization]] = await runtime.transaction((sql) => [claims(sql, owner), sql`select * from runtu.bootstrap_personal_organization('Runtime QA')`]);
  await runtime.transaction((sql) => [claims(sql, owner), sql`select runtu.add_reviewer_fixture(${organization.id}, ${reviewer})`]);
  const [, [radiography]] = await runtime.transaction((sql) => [
    claims(sql, owner),
    sql`select * from runtu.save_radiography(${organization.id}, 'Minuta QA dinámica', 'Comité QA', 'cerrar el comité con decisiones verificables', 'prueba sintética sin datos personales')`,
  ]);
  await runtime.transaction((sql) => [
    claims(sql, owner),
    sql`select * from runtu.import_huevo0(${organization.id}, ${JSON.stringify(canonical.manifest)}::jsonb, ${canonical.instructions}, ${JSON.stringify(canonical.output_schema)}::jsonb, ${payloadChecksum(canonical)}, ${JSON.stringify(canonical.evaluation)}::jsonb)`,
  ]);
  const definition = buildRadiographyDefinition(radiography);
  if (definition.output_schema.properties.agent_version.enum[0] !== '0.4.0' || !definition.instructions.includes('agent_version igual a 0.4.0')
    || !definition.output_schema.required.includes('projects') || !definition.output_schema.required.includes('tasks')) {
    throw new Error('La definición construida conserva la versión del baseline.');
  }
  const checksum = definitionChecksum(definition);
  const [, [built]] = await runtime.transaction((sql) => [
    claims(sql, owner),
    sql`select * from runtu.build_radiography_version(${organization.id}, ${radiography.id}, ${JSON.stringify(definition.manifest)}::jsonb, ${definition.instructions}, ${JSON.stringify(definition.output_schema)}::jsonb, ${checksum})`,
  ]);
  const [, [deployment]] = await runtime.transaction((sql) => [claims(sql, owner), sql`select * from runtu.activate_lab_candidate(${organization.id}, ${built.version_id})`]);

  const [, [authorized]] = await runtime.transaction((sql) => [claims(sql, reviewer), sql`select * from runtu.authorize_agent_run(${organization.id}, ${built.version_id})`]);
  if (authorized.version !== '0.4.0' || authorized.checksum_sha256 !== checksum || authorized.eval_report_id !== null) {
    throw new Error('La autorización no quedó ligada a la candidata exacta.');
  }
  const [baseline] = await admin`select id from runtu.agent_versions where organization_id = ${organization.id} and version = '0.2.0'`;
  let wrongVersionBlocked = false;
  try { await runtime.transaction((sql) => [claims(sql, reviewer), sql`select * from runtu.authorize_agent_run(${organization.id}, ${baseline.id})`]); }
  catch (error) { wrongVersionBlocked = error?.message?.includes('version_not_active'); }
  if (!wrongVersionBlocked) throw new Error('El runtime aceptó una versión distinta al deployment.');

  await admin`update runtu.deployments set state = 'PAUSED' where id = ${deployment.id}`;
  let pausedBlocked = false;
  try { await runtime.transaction((sql) => [claims(sql, reviewer), sql`select * from runtu.authorize_agent_run(${organization.id}, ${built.version_id})`]); }
  catch (error) { pausedBlocked = error?.message?.includes('deployment_paused'); }
  if (!pausedBlocked) throw new Error('El deployment pausado pudo ejecutar.');
  await admin`update runtu.deployments set state = 'ACTIVE' where id = ${deployment.id}`;

  await admin`update runtu.organization_quotas set runs_used = monthly_run_limit where organization_id = ${organization.id}`;
  let quotaBlocked = false;
  try { await runtime.transaction((sql) => [claims(sql, reviewer), sql`select * from runtu.authorize_agent_run(${organization.id}, ${built.version_id})`]); }
  catch (error) { quotaBlocked = error?.message?.includes('quota_exhausted'); }
  if (!quotaBlocked) throw new Error('La cuota agotada pudo ejecutar.');
  await admin`update runtu.organization_quotas set runs_used = 1 where organization_id = ${organization.id}`;

  const runId = randomUUID();
  await runtime.transaction((sql) => [
    claims(sql, reviewer),
    sql`select runtu.record_agent_run(${organization.id}, ${deployment.id}, ${built.version_id}, ${runId}, 'example', 'SUCCEEDED', 'gpt-5.6-luna', 1250, 321, 210, 0, true, ${null})`,
  ]);
  const [run] = await admin`select * from runtu.runtime_runs where id = ${runId}`;
  if (run?.source_type !== 'real' || run?.agent_version_id !== built.version_id || !run?.output_valid) throw new Error('El run no quedó atribuible a la versión.');
  const contentColumns = await admin`
    select column_name from information_schema.columns
    where table_schema = 'runtu' and table_name = 'runtime_runs'
      and column_name in ('notes', 'input', 'output', 'content', 'prompt', 'response')
  `;
  if (contentColumns.length) throw new Error('runtime_runs permite persistir contenido.');

  await runtime.transaction((sql) => [claims(sql, reviewer), sql`select runtu.submit_run_feedback(${organization.id}, ${runId}, 'CORRECT')`]);
  await runtime.transaction((sql) => [claims(sql, reviewer), sql`select runtu.submit_run_feedback(${organization.id}, ${runId}, 'INCORRECT')`]);
  const feedbackRows = await admin`select rating from runtu.run_feedback where run_id = ${runId}`;
  if (feedbackRows.length !== 1 || feedbackRows[0].rating !== 'INCORRECT') throw new Error('El feedback no fue idempotente.');
  let outsiderBlocked = false;
  try { await runtime.transaction((sql) => [claims(sql, outsider), sql`select runtu.submit_run_feedback(${organization.id}, ${runId}, 'CORRECT')`]); }
  catch (error) { outsiderBlocked = error?.message?.includes('feedback_not_allowed'); }
  if (!outsiderBlocked) throw new Error('Un usuario ajeno pudo registrar feedback.');

  console.log(`PASS: deployment ${deployment.id.slice(0, 8)}… → v0.4.0; proyectos/tareas versionados; sesión/versión/pausa/cuota; run real sin contenido; feedback aislado.`);
} finally {
  if (organization?.id) await admin`delete from runtu.organizations where id = ${organization.id}`;
}
