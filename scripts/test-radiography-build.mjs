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
const owner = `radiography_owner_${marker}`;
const reviewer = `radiography_reviewer_${marker}`;
const claims = (sql, userId) => sql`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`;
const canonical = huevo0Payload();
let organization;

const save = (sql, userId, fields) => [
  claims(sql, userId),
  sql`select * from runtu.save_radiography(${organization.id}, ${fields.agentName}, ${fields.primaryUser}, ${fields.desiredResult}, ${fields.teamContext})`,
];

const fields = {
  agentName: 'Minuta del comité comercial',
  primaryUser: 'Gerencia y líderes de frente',
  desiredResult: 'cerrar cada reunión con decisiones completas y un único grano semanal',
  teamContext: 'comité comercial semanal de Imaquinua',
};

try {
  [, [organization]] = await runtime.transaction((sql) => [claims(sql, owner), sql`select * from runtu.bootstrap_personal_organization('Radiography QA')`]);
  await runtime.transaction((sql) => [claims(sql, owner), sql`select runtu.add_reviewer_fixture(${organization.id}, ${reviewer})`]);

  let incompleteBlocked = false;
  try { await runtime.transaction((sql) => save(sql, owner, { ...fields, desiredResult: 'corto' })); }
  catch (error) { incompleteBlocked = error?.message?.includes('radiography_incomplete'); }
  if (!incompleteBlocked) throw new Error('Se aceptó una Radiografía incompleta.');

  let reviewerSaveBlocked = false;
  try { await runtime.transaction((sql) => save(sql, reviewer, fields)); }
  catch (error) { reviewerSaveBlocked = error?.code === '42501'; }
  if (!reviewerSaveBlocked) throw new Error('REVIEWER pudo guardar la Radiografía.');

  const [, [firstSave]] = await runtime.transaction((sql) => save(sql, owner, fields));
  const [, [secondSave]] = await runtime.transaction((sql) => save(sql, owner, { ...fields, teamContext: `${fields.teamContext} y mensual` }));
  if (firstSave.id !== secondSave.id || secondSave.revision !== 1) throw new Error('Guardar dos veces creó dos borradores.');

  const [, reviewerRows] = await runtime.transaction((sql) => [claims(sql, reviewer), sql`select * from runtu.radiographies where organization_id = ${organization.id}`]);
  if (reviewerRows.length !== 1) throw new Error('REVIEWER no pudo inspeccionar la Radiografía.');

  await runtime.transaction((sql) => [
    claims(sql, owner),
    sql`select * from runtu.import_huevo0(${organization.id}, ${JSON.stringify(canonical.manifest)}::jsonb, ${canonical.instructions}, ${JSON.stringify(canonical.output_schema)}::jsonb, ${payloadChecksum(canonical)}, ${JSON.stringify(canonical.evaluation)}::jsonb)`,
  ]);
  const definition = buildRadiographyDefinition(secondSave);
  const checksum = definitionChecksum(definition);
  const build = (sql, userId, manifest = definition.manifest) => [
    claims(sql, userId),
    sql`select * from runtu.build_radiography_version(${organization.id}, ${secondSave.id}, ${JSON.stringify(manifest)}::jsonb, ${definition.instructions}, ${JSON.stringify(definition.output_schema)}::jsonb, ${checksum})`,
  ];

  let reviewerBuildBlocked = false;
  try { await runtime.transaction((sql) => build(sql, reviewer)); }
  catch (error) { reviewerBuildBlocked = error?.code === '42501'; }
  if (!reviewerBuildBlocked) throw new Error('REVIEWER pudo construir una versión.');

  const tampered = structuredClone(definition.manifest);
  tampered.policy.prohibited_actions = ['send_messages'];
  let limitsBlocked = false;
  try { await runtime.transaction((sql) => build(sql, owner, tampered)); }
  catch (error) { limitsBlocked = error?.message?.includes('invalid_built_definition'); }
  if (!limitsBlocked) throw new Error('La construcción aceptó límites manipulados.');

  const [, [firstBuild]] = await runtime.transaction((sql) => build(sql, owner));
  const [, [secondBuild]] = await runtime.transaction((sql) => build(sql, owner));
  if (firstBuild.version_id !== secondBuild.version_id || firstBuild.version !== '0.3.0') throw new Error('El doble submit creó otra versión.');

  const [builtRow] = await admin`select status, approved_by, approved_at from runtu.radiographies where id = ${secondSave.id}`;
  if (builtRow?.status !== 'BUILT' || builtRow?.approved_by !== owner || !builtRow?.approved_at) throw new Error('La aprobación no quedó atribuida.');
  const versions = await admin`select version, checksum_scope, immutable from runtu.agent_versions where organization_id = ${organization.id} order by version`;
  if (versions.length !== 2 || versions[1]?.version !== '0.3.0' || versions[1]?.checksum_scope !== 'definition' || !versions[1]?.immutable) {
    throw new Error('La versión candidata no quedó congelada junto al baseline.');
  }
  const [, [newDraft]] = await runtime.transaction((sql) => save(sql, owner, { ...fields, agentName: 'Minuta comercial mejorada' }));
  if (newDraft.revision !== 2 || newDraft.id === secondSave.id) throw new Error('Editar tras construir alteró la Radiografía aprobada.');

  console.log(`PASS: Radiografía r1 → v0.3.0 ${checksum.slice(0, 12)}…; límites fijos; aprobación atribuida; doble submit idempotente; r2 separada.`);
} finally {
  if (organization?.id) await admin`delete from runtu.organizations where id = ${organization.id}`;
}
