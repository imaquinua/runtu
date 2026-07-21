import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const runtimeUrl = process.env.RUNTU_DATABASE_URL || readFileSync('/private/tmp/runtu-runtime-database-url', 'utf8').trim();
const adminUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!runtimeUrl || !adminUrl) throw new Error('Faltan conexiones de prueba.');

const runtime = neon(runtimeUrl);
const admin = neon(adminUrl);
const marker = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const ownerA = `form_owner_a_${marker}`;
const ownerB = `form_owner_b_${marker}`;
const reviewerA = `form_reviewer_a_${marker}`;
const claims = (sql, userId) => sql`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`;

let organizationA;
let organizationB;
try {
  [, [organizationA]] = await runtime.transaction((sql) => [claims(sql, ownerA), sql`select * from runtu.bootstrap_personal_organization('Form Tenant A')`]);
  [, [organizationB]] = await runtime.transaction((sql) => [claims(sql, ownerB), sql`select * from runtu.bootstrap_personal_organization('Form Tenant B')`]);
  await runtime.transaction((sql) => [claims(sql, ownerA), sql`select runtu.add_reviewer_fixture(${organizationA.id}, ${reviewerA})`]);

  const [, [createdForm]] = await runtime.transaction((sql) => [
    claims(sql, ownerA),
    sql`select * from runtu.create_radiography_form(${organizationA.id}, 'Radiografía QA')`,
  ]);
  const [publicForm] = await runtime`select * from runtu.get_public_form(${createdForm.public_id})`;
  if (!publicForm || publicForm.field_schema.length !== 4) throw new Error('El formulario público no devolvió su contrato.');

  let consentBlocked = false;
  try {
    await runtime`select runtu.submit_public_form(${createdForm.public_id}, ${JSON.stringify({ contact_email: 'qa@example.com' })}::jsonb, false, 'qa')`;
  } catch (error) { consentBlocked = error?.message?.includes('consent_required'); }
  if (!consentBlocked) throw new Error('Una respuesta sin opt-in fue aceptada.');

  await runtime`select runtu.submit_public_form(${createdForm.public_id}, ${JSON.stringify({ contact_email: 'qa@example.com', desired_result: 'Ordenar una reunión', primary_user: 'Comité', boundaries: 'No enviar correos' })}::jsonb, true, 'whatsapp')`;

  const [, submissionsA] = await runtime.transaction((sql) => [claims(sql, ownerA), sql`select * from runtu.form_submissions where form_id = ${createdForm.id}`]);
  const [, submissionsB] = await runtime.transaction((sql) => [claims(sql, ownerB), sql`select * from runtu.form_submissions where form_id = ${createdForm.id}`]);
  if (submissionsA.length !== 1 || submissionsA[0].consent_given !== true || submissionsA[0].source !== 'whatsapp') throw new Error('El OWNER no recibió evidencia completa.');
  if (submissionsB.length !== 0) throw new Error('El tenant B pudo leer respuestas del tenant A.');

  let reviewerCreateBlocked = false;
  try {
    await runtime.transaction((sql) => [claims(sql, reviewerA), sql`select * from runtu.create_radiography_form(${organizationA.id}, 'No permitido')`]);
  } catch (error) { reviewerCreateBlocked = error?.code === '42501'; }
  if (!reviewerCreateBlocked) throw new Error('REVIEWER pudo crear un formulario de OWNER.');

  console.log('PASS: formulario autónomo, opt-in obligatorio, WhatsApp atribuido, OWNER/REVIEWER y tenants aislados.');
} finally {
  const ids = [organizationA?.id, organizationB?.id].filter(Boolean);
  if (ids.length) await admin`delete from runtu.organizations where id = any(${ids})`;
}
