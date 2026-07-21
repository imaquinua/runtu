import { neon } from "@neondatabase/serverless";

let client;

export function database() {
  if (!process.env.DATABASE_URL) throw new Error("database_not_configured");
  client ??= neon(process.env.DATABASE_URL);
  return client;
}

export function claimQuery(sql, userId) {
  return sql`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`;
}

export async function consumeRunQuota(userId, organizationId) {
  const sql = database();
  const [, quota] = await sql.transaction((transaction) => [
    claimQuery(transaction, userId),
    transaction`select * from runtu.consume_run_quota(${organizationId})`,
  ]);
  return quota[0];
}
