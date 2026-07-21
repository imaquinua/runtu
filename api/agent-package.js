import { requireUser } from "./_lib/auth.js";
import { claimQuery, database } from "./_lib/database.js";
import { definitionChecksum, payloadChecksum, portableInventory, scanPortablePayload } from "./_agent/package.js";

const UUID = /^[0-9a-f-]{36}$/i;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const user = await requireUser(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });

  const organizationId = req.query?.organizationId;
  const versionId = req.query?.versionId;
  if (typeof organizationId !== 'string' || !UUID.test(organizationId) || typeof versionId !== 'string' || !UUID.test(versionId)) {
    return res.status(404).json({ error: 'package_not_available' });
  }

  try {
    const sql = database();
    const [, rows] = await sql.transaction((transaction) => [
      claimQuery(transaction, user.id),
      transaction`
        select version_row.manifest, version_row.instructions, version_row.output_schema,
               version_row.checksum_sha256, version_row.checksum_scope, eval.evidence
        from runtu.agent_versions version_row
        join runtu.eval_runs eval on eval.agent_version_id = version_row.id
        where version_row.id = ${versionId} and version_row.organization_id = ${organizationId}
        order by eval.created_at desc limit 1
      `,
    ]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'package_not_available' });

    const payload = { manifest: row.manifest, instructions: row.instructions, output_schema: row.output_schema, evaluation: row.evidence };
    const calculatedChecksum = row.checksum_scope === 'definition' ? definitionChecksum(payload) : payloadChecksum(payload);
    if (calculatedChecksum !== row.checksum_sha256) return res.status(409).json({ error: 'checksum_mismatch' });
    const scan = scanPortablePayload(payload);
    if (!scan.safe) return res.status(409).json({ error: 'package_contains_secret_pattern' });

    const bundle = {
      schema_version: 'runtu.portable-agent/v1',
      generated_at: new Date().toISOString(),
      checksum_sha256: calculatedChecksum,
      secret_scan: scan,
      inventory: portableInventory(payload),
      payload,
    };
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${row.manifest.agent.id}-${row.manifest.agent.version}.runtu.json"`);
    return res.status(200).send(JSON.stringify(bundle, null, 2));
  } catch (error) {
    console.error('Agent package error', error instanceof Error ? error.message : String(error));
    return res.status(500).json({ error: 'package_unavailable' });
  }
}
