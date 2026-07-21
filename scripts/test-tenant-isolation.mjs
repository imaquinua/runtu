import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const runtimeUrl = process.env.RUNTU_DATABASE_URL
  || readFileSync("/private/tmp/runtu-runtime-database-url", "utf8").trim();
const adminUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!runtimeUrl || !adminUrl) throw new Error("Faltan conexiones para la prueba.");

const runtime = neon(runtimeUrl);
const admin = neon(adminUrl);
const marker = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const userA = `test_a_${marker}`;
const userB = `test_b_${marker}`;
const reviewer = `test_reviewer_${marker}`;

function claims(sql, userId) {
  return sql`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`;
}

let organizationA;
let organizationB;
try {
  [, [organizationA]] = await runtime.transaction((sql) => [
    claims(sql, userA),
    sql`select * from runtu.bootstrap_personal_organization('Tenant de prueba A')`,
  ]);
  [, [organizationB]] = await runtime.transaction((sql) => [
    claims(sql, userB),
    sql`select * from runtu.bootstrap_personal_organization('Tenant de prueba B')`,
  ]);

  const [, visibleToA, foreignToA] = await runtime.transaction((sql) => [
    claims(sql, userA),
    sql`select id from runtu.organizations order by id`,
    sql`select id from runtu.organizations where id = ${organizationB.id}`,
  ]);
  const [, visibleToB, foreignToB] = await runtime.transaction((sql) => [
    claims(sql, userB),
    sql`select id from runtu.organizations order by id`,
    sql`select id from runtu.organizations where id = ${organizationA.id}`,
  ]);
  await runtime.transaction((sql) => [
    claims(sql, userA),
    sql`select runtu.add_reviewer_fixture(${organizationA.id}, ${reviewer})`,
  ]);
  const [, reviewerOrganizations, reviewerMembership] = await runtime.transaction((sql) => [
    claims(sql, reviewer),
    sql`select id from runtu.organizations`,
    sql`select role from runtu.memberships where organization_id = ${organizationA.id} and user_id = ${reviewer}`,
  ]);

  let reviewerEscalationBlocked = false;
  try {
    await runtime.transaction((sql) => [
      claims(sql, reviewer),
      sql`select runtu.add_reviewer_fixture(${organizationA.id}, 'forbidden_escalation')`,
    ]);
  } catch (error) {
    reviewerEscalationBlocked = error?.code === '42501';
  }

  let crossMutationBlocked = false;
  try {
    await runtime.transaction((sql) => [
      claims(sql, userA),
      sql`update runtu.organizations set name = 'No debe cambiar' where id = ${organizationB.id}`,
    ]);
  } catch (error) {
    crossMutationBlocked = error?.code === '42501';
  }

  await admin`update runtu.organization_quotas set monthly_run_limit = 1 where organization_id = ${organizationA.id}`;
  await runtime.transaction((sql) => [claims(sql, userA), sql`select * from runtu.consume_run_quota(${organizationA.id})`]);
  let quotaBlocked = false;
  try {
    await runtime.transaction((sql) => [claims(sql, userA), sql`select * from runtu.consume_run_quota(${organizationA.id})`]);
  } catch (error) {
    quotaBlocked = error?.message?.includes('quota_exhausted') || error?.code === 'P0001';
  }
  const [role] = await admin`select rolname, rolsuper, rolbypassrls from pg_roles where rolname = 'runtu_app'`;

  if (visibleToA.length !== 1 || visibleToA[0].id !== organizationA.id || foreignToA.length !== 0) {
    throw new Error("RLS permitió visibilidad cruzada para el tenant A.");
  }
  if (visibleToB.length !== 1 || visibleToB[0].id !== organizationB.id || foreignToB.length !== 0) {
    throw new Error("RLS permitió visibilidad cruzada para el tenant B.");
  }
  if (reviewerOrganizations.length !== 1 || reviewerOrganizations[0].id !== organizationA.id || reviewerMembership[0]?.role !== 'REVIEWER') {
    throw new Error("El fixture REVIEWER no quedó limitado a su organización.");
  }
  if (!reviewerEscalationBlocked) throw new Error("REVIEWER pudo elevar membresías.");
  if (!crossMutationBlocked) throw new Error("La mutación cruzada no fue rechazada.");
  if (!quotaBlocked) throw new Error("La cuota agotada no bloqueó el siguiente run.");
  if (!role || role.rolsuper || role.rolbypassrls) throw new Error("El rol runtime tiene privilegios incompatibles con RLS.");

  console.log("PASS: tenants aislados; REVIEWER sin escalamiento; mutación cruzada bloqueada; cuota efectiva; rol sin BYPASSRLS.");
} finally {
  if (organizationA || organizationB) {
    const ids = [organizationA?.id, organizationB?.id].filter(Boolean);
    await admin`delete from runtu.organizations where id = any(${ids})`;
  }
}
