import { requireUser } from "./_lib/auth.js";
import { claimQuery, database } from "./_lib/database.js";
import { huevo0Payload, payloadChecksum } from "./_agent/package.js";

const UUID = /^[0-9a-f-]{36}$/i;

async function listAgents(sql, userId, organizationId) {
  const [, rows] = await sql.transaction((transaction) => [
    claimQuery(transaction, userId),
    transaction`
      select agent.id, agent.slug, agent.name, agent.purpose, agent.risk_level, agent.status,
             version_row.id as version_id, version_row.version, version_row.state,
             version_row.checksum_sha256, version_row.checksum_scope, version_row.immutable,
             version_row.manifest, version_row.output_schema, version_row.created_at,
             eval.report_id, eval.source_type, eval.model, eval.cases, eval.passed,
             eval.pass_rate, eval.schema_pass_rate, eval.policy_pass_rate,
             eval.latency_p95_ms, eval.estimated_cost_usd
      from runtu.agents agent
      join runtu.agent_versions version_row on version_row.agent_id = agent.id
      left join runtu.eval_runs eval on eval.agent_version_id = version_row.id
      where agent.organization_id = ${organizationId}
      order by version_row.created_at desc, eval.created_at desc
    `,
  ]);
  return rows;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'method_not_allowed' });
  const user = await requireUser(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const organizationId = req.method === 'GET' ? req.query?.organizationId : req.body?.organizationId;
  if (typeof organizationId !== 'string' || !UUID.test(organizationId)) return res.status(400).json({ error: 'organization_required' });

  try {
    const sql = database();
    if (req.method === 'POST') {
      const payload = huevo0Payload();
      await sql.transaction((transaction) => [
        claimQuery(transaction, user.id),
        transaction`
          select * from runtu.import_huevo0(
            ${organizationId}, ${JSON.stringify(payload.manifest)}::jsonb,
            ${payload.instructions}, ${JSON.stringify(payload.output_schema)}::jsonb,
            ${payloadChecksum(payload)}, ${JSON.stringify(payload.evaluation)}::jsonb
          )
        `,
      ]);
    }
    return res.status(200).json({ agents: await listAgents(sql, user.id, organizationId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    console.error('Agent registry error', message);
    return res.status(message.includes('owner_required') ? 403 : message.includes('version_checksum_conflict') ? 409 : 500)
      .json({ error: message.includes('owner_required') ? 'owner_required' : message.includes('version_checksum_conflict') ? 'version_checksum_conflict' : 'registry_unavailable' });
  }
}
