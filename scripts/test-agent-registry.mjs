import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { huevo0Payload, payloadChecksum, scanPortablePayload } from "../api/_agent/package.js";

const runtimeUrl = process.env.RUNTU_DATABASE_URL || readFileSync('/private/tmp/runtu-runtime-database-url', 'utf8').trim();
const adminUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!runtimeUrl || !adminUrl) throw new Error('Faltan conexiones de prueba.');

const runtime = neon(runtimeUrl);
const admin = neon(adminUrl);
const marker = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const owner = `agent_owner_${marker}`;
const reviewer = `agent_reviewer_${marker}`;
const claims = (sql, userId) => sql`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`;
const payload = huevo0Payload();
const checksum = payloadChecksum(payload);

let organization;
try {
  [, [organization]] = await runtime.transaction((sql) => [claims(sql, owner), sql`select * from runtu.bootstrap_personal_organization('Agent Registry QA')`]);
  await runtime.transaction((sql) => [claims(sql, owner), sql`select runtu.add_reviewer_fixture(${organization.id}, ${reviewer})`]);

  const importQuery = (sql, userId, manifest = payload.manifest, suppliedChecksum = checksum) => [
    claims(sql, userId),
    sql`select * from runtu.import_huevo0(${organization.id}, ${JSON.stringify(manifest)}::jsonb, ${payload.instructions}, ${JSON.stringify(payload.output_schema)}::jsonb, ${suppliedChecksum}, ${JSON.stringify(payload.evaluation)}::jsonb)`,
  ];
  const [, [firstImport]] = await runtime.transaction((sql) => importQuery(sql, owner));
  const [, [secondImport]] = await runtime.transaction((sql) => importQuery(sql, owner));
  if (firstImport.version_id !== secondImport.version_id) throw new Error('La importación idempotente creó otra versión.');

  const [, reviewerRows] = await runtime.transaction((sql) => [claims(sql, reviewer), sql`select * from runtu.agent_versions where organization_id = ${organization.id}`]);
  if (reviewerRows.length !== 1) throw new Error('REVIEWER no pudo leer la versión de su organización.');

  let reviewerImportBlocked = false;
  try { await runtime.transaction((sql) => importQuery(sql, reviewer)); }
  catch (error) { reviewerImportBlocked = error?.code === '42501'; }
  if (!reviewerImportBlocked) throw new Error('REVIEWER pudo importar una versión.');

  const changedManifest = structuredClone(payload.manifest);
  changedManifest.agent.purpose += ' cambio no versionado';
  const changedChecksum = payloadChecksum({ ...payload, manifest: changedManifest });
  if (changedChecksum === checksum) throw new Error('El checksum no detectó la alteración.');

  let conflictBlocked = false;
  try { await runtime.transaction((sql) => importQuery(sql, owner, changedManifest, changedChecksum)); }
  catch (error) { conflictBlocked = error?.message?.includes('version_checksum_conflict'); }
  if (!conflictBlocked) throw new Error('La misma versión aceptó otro checksum.');

  let immutableBlocked = false;
  try { await admin`update runtu.agent_versions set state = 'LIVE' where id = ${firstImport.version_id}`; }
  catch (error) { immutableBlocked = error?.message?.includes('immutable_agent_version'); }
  if (!immutableBlocked) throw new Error('La versión congelada pudo editarse.');

  const [storedEval] = await admin`select source_type, cases, passed, evidence from runtu.eval_runs where agent_version_id = ${firstImport.version_id}`;
  if (storedEval?.source_type !== 'replay' || storedEval?.cases !== 20 || storedEval?.passed !== 20) throw new Error('La evidencia no quedó ligada a la versión.');
  if (!scanPortablePayload(payload).safe) throw new Error('El paquete canónico activó el detector de secretos.');
  if (scanPortablePayload({ ...payload, instructions: `${payload.instructions}\napi_key='sk-proj-example-secret-value-1234567890'` }).safe) {
    throw new Error('El escáner no bloqueó el secreto simulado.');
  }

  console.log(`PASS: v0.2.0 inmutable; checksum ${checksum.slice(0, 12)}…; replay 20/20 ligado; REVIEWER solo lectura; secreto simulado bloqueado.`);
} finally {
  if (organization?.id) await admin`delete from runtu.organizations where id = ${organization.id}`;
}
