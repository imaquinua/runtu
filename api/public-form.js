import { database } from "./_lib/database.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function cleanPayload(fields, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('invalid_payload');
  const clean = {};
  for (const field of fields) {
    const value = typeof payload[field.id] === 'string' ? payload[field.id].trim() : '';
    if (field.required && !value) throw new Error(`required:${field.id}`);
    if (value.length > field.maxLength) throw new Error(`too_long:${field.id}`);
    if (field.type === 'email' && value && !EMAIL.test(value)) throw new Error(`invalid_email:${field.id}`);
    clean[field.id] = value;
  }
  return clean;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: "method_not_allowed" });

  const publicId = req.method === 'GET' ? req.query?.id : req.body?.id;
  if (typeof publicId !== 'string' || !UUID.test(publicId)) return res.status(404).json({ error: "form_not_available" });

  try {
    const sql = database();
    const [form] = await sql`select * from runtu.get_public_form(${publicId})`;
    if (!form) return res.status(404).json({ error: "form_not_available" });
    if (req.method === 'GET') return res.status(200).json({ form });

    if (req.body?.consent !== true) return res.status(422).json({ error: "consent_required" });
    const payload = cleanPayload(form.field_schema, req.body?.payload);
    const source = typeof req.body?.source === 'string' ? req.body.source.slice(0, 120) : 'direct';
    const [result] = await sql`
      select runtu.submit_public_form(
        ${publicId}, ${JSON.stringify(payload)}::jsonb, true, ${source}
      ) as submission_id
    `;
    return res.status(201).json({ ok: true, submissionId: result.submission_id });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('required:') || message.startsWith('too_long:') || message.startsWith('invalid_email:') || message === 'invalid_payload') {
      return res.status(400).json({ error: message });
    }
    console.error("Public form error", message);
    return res.status(500).json({ error: "form_unavailable" });
  }
}
