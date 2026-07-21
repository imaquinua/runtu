import { requireUser } from './_lib/auth.js';
import { claimQuery, database } from './_lib/database.js';

const UUID = /^[0-9a-f-]{36}$/i;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const user = await requireUser(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  const { organizationId, runId, rating } = req.body || {};
  if (typeof organizationId !== 'string' || !UUID.test(organizationId) || typeof runId !== 'string' || !UUID.test(runId) || !['CORRECT', 'INCORRECT'].includes(rating)) {
    return res.status(400).json({ error: 'invalid_feedback' });
  }
  try {
    const sql = database();
    const [, rows] = await sql.transaction((transaction) => [
      claimQuery(transaction, user.id),
      transaction`select runtu.submit_run_feedback(${organizationId}, ${runId}, ${rating}) as id`,
    ]);
    return res.status(200).json({ feedback: { id: rows[0].id, runId, rating } });
  } catch (error) {
    console.error('Run feedback error', error instanceof Error ? error.message : String(error));
    return res.status(403).json({ error: 'feedback_not_allowed' });
  }
}
