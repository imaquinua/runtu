import { requireUser } from './_lib/auth.js';
import { claimQuery, database } from './_lib/database.js';

const UUID = /^[0-9a-f-]{36}$/i;
const SECRET_FIELDS = new Set(['token', 'secret', 'apiKey', 'api_key', 'password', 'credential', 'credentials']);

export function hasSecretField(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, nested]) => SECRET_FIELDS.has(key) || hasSecretField(nested));
}

function mapError(error) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('owner_required')) return [403, 'owner_required'];
  if (message.includes('template_not_found')) return [404, 'template_not_found'];
  if (message.includes('connector_not_found')) return [404, 'connector_not_found'];
  if (message.includes('workflow_spec_incomplete') || message.includes('invalid_access_mode')) return [400, 'workflow_invalid'];
  return [500, 'workflow_unavailable'];
}

async function readWorkflow(sql, userId, organizationId, templateSlug) {
  const [, templates, connectors, specs, policies] = await sql.transaction((transaction) => [
    claimQuery(transaction, userId),
    transaction`select * from runtu.agent_templates order by sort_order, slug`,
    transaction`select * from runtu.connector_catalog order by name`,
    templateSlug
      ? transaction`select * from runtu.agent_workflow_specs where organization_id = ${organizationId} and template_slug = ${templateSlug}`
      : transaction`select * from runtu.agent_workflow_specs where organization_id = ${organizationId}`,
    templateSlug
      ? transaction`select * from runtu.agent_connection_policies where organization_id = ${organizationId} and template_slug = ${templateSlug}`
      : transaction`select * from runtu.agent_connection_policies where organization_id = ${organizationId}`,
  ]);
  return { templates, connectors, specs, policies };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'PUT'].includes(req.method)) return res.status(405).json({ error: 'method_not_allowed' });
  const user = await requireUser(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  if (hasSecretField(req.body)) return res.status(400).json({ error: 'credentials_not_accepted' });

  const organizationId = req.method === 'GET' ? req.query?.organizationId : req.body?.organizationId;
  const templateSlug = req.method === 'GET' ? req.query?.templateSlug : req.body?.templateSlug;
  if (typeof organizationId !== 'string' || !UUID.test(organizationId)) return res.status(400).json({ error: 'organization_required' });
  if (templateSlug != null && (typeof templateSlug !== 'string' || !/^[a-z0-9-]{3,80}$/.test(templateSlug))) {
    return res.status(400).json({ error: 'template_required' });
  }

  try {
    const sql = database();
    if (req.method === 'PUT') {
      if (req.body?.action === 'save_spec') {
        const { agentName, primaryUser, desiredResult, operatingContext } = req.body;
        if (![agentName, primaryUser, desiredResult, operatingContext].every((value) => typeof value === 'string')) {
          return res.status(400).json({ error: 'workflow_spec_incomplete' });
        }
        await sql.transaction((transaction) => [
          claimQuery(transaction, user.id),
          transaction`select * from runtu.save_agent_workflow_spec(${organizationId}, ${templateSlug}, ${agentName}, ${primaryUser}, ${desiredResult}, ${operatingContext})`,
        ]);
      } else if (req.body?.action === 'save_connection') {
        const { connectorSlug, accessMode } = req.body;
        if (typeof connectorSlug !== 'string' || typeof accessMode !== 'string') return res.status(400).json({ error: 'connection_incomplete' });
        await sql.transaction((transaction) => [
          claimQuery(transaction, user.id),
          transaction`select * from runtu.save_agent_connection_policy(${organizationId}, ${templateSlug}, ${connectorSlug}, ${accessMode})`,
        ]);
      } else {
        return res.status(400).json({ error: 'action_required' });
      }
    }
    return res.status(200).json(await readWorkflow(sql, user.id, organizationId, templateSlug));
  } catch (error) {
    const [status, code] = mapError(error);
    console.error('Workflow error', error instanceof Error ? error.message : String(error));
    return res.status(status).json({ error: code });
  }
}
