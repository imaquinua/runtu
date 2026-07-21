import { requireUser } from './_lib/auth.js';
import { claimQuery, database } from './_lib/database.js';
import { huevo0Payload, payloadChecksum, definitionChecksum } from './_agent/package.js';
import { buildRadiographyDefinition } from './_agent/radiography.js';

const UUID = /^[0-9a-f-]{36}$/i;

function validOrganizationId(value) {
  return typeof value === 'string' && UUID.test(value);
}

function readOrganizationId(req) {
  return req.method === 'GET' ? req.query?.organizationId : req.body?.organizationId;
}

async function latestRadiography(sql, userId, organizationId) {
  const [, rows] = await sql.transaction((transaction) => [
    claimQuery(transaction, userId),
    transaction`
      select radiography.*, version_row.version as built_version,
             version_row.state as built_state, version_row.checksum_sha256
      from runtu.radiographies radiography
      left join runtu.agent_versions version_row on version_row.id = radiography.built_version_id
      where radiography.organization_id = ${organizationId} and radiography.agent_slug = 'minuta-comite'
      order by radiography.revision desc limit 1
    `,
  ]);
  return rows[0] || null;
}

function mapError(error) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('owner_required')) return [403, 'owner_required'];
  if (message.includes('radiography_incomplete') || message.includes('invalid_built_definition')) return [400, 'radiography_incomplete'];
  if (message.includes('radiography_not_found') || message.includes('base_agent_required')) return [404, 'radiography_not_found'];
  if (message.includes('version_checksum_conflict')) return [409, 'version_checksum_conflict'];
  return [500, 'radiography_unavailable'];
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'PUT', 'POST'].includes(req.method)) return res.status(405).json({ error: 'method_not_allowed' });
  const user = await requireUser(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  const organizationId = readOrganizationId(req);
  if (!validOrganizationId(organizationId)) return res.status(400).json({ error: 'organization_required' });

  try {
    const sql = database();
    if (req.method === 'GET') {
      return res.status(200).json({ radiography: await latestRadiography(sql, user.id, organizationId) });
    }

    if (req.method === 'PUT') {
      const { agentName, primaryUser, desiredResult, teamContext } = req.body || {};
      if (![agentName, primaryUser, desiredResult, teamContext].every((value) => typeof value === 'string')) {
        return res.status(400).json({ error: 'radiography_incomplete' });
      }
      const [, rows] = await sql.transaction((transaction) => [
        claimQuery(transaction, user.id),
        transaction`select * from runtu.save_radiography(${organizationId}, ${agentName}, ${primaryUser}, ${desiredResult}, ${teamContext})`,
      ]);
      return res.status(200).json({ radiography: rows[0] });
    }

    let radiography = await latestRadiography(sql, user.id, organizationId);
    if (!radiography) return res.status(404).json({ error: 'radiography_not_found' });
    if (radiography.status === 'BUILT') return res.status(200).json({ radiography });

    const canonical = huevo0Payload();
    const definition = buildRadiographyDefinition(radiography);
    const checksum = definitionChecksum(definition);
    const [, , rows] = await sql.transaction((transaction) => [
      claimQuery(transaction, user.id),
      transaction`
        select * from runtu.import_huevo0(
          ${organizationId}, ${JSON.stringify(canonical.manifest)}::jsonb,
          ${canonical.instructions}, ${JSON.stringify(canonical.output_schema)}::jsonb,
          ${payloadChecksum(canonical)}, ${JSON.stringify(canonical.evaluation)}::jsonb
        )
      `,
      transaction`
        select * from runtu.build_radiography_version(
          ${organizationId}, ${radiography.id}, ${JSON.stringify(definition.manifest)}::jsonb,
          ${definition.instructions}, ${JSON.stringify(definition.output_schema)}::jsonb, ${checksum}
        )
      `,
    ]);
    radiography = await latestRadiography(sql, user.id, organizationId);
    return res.status(201).json({ radiography, version: rows[0] });
  } catch (error) {
    const [status, code] = mapError(error);
    console.error('Radiography error', error instanceof Error ? error.message : String(error));
    return res.status(status).json({ error: code });
  }
}
