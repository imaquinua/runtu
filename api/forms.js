import { requireUser } from "./_lib/auth.js";
import { claimQuery, database } from "./_lib/database.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: "method_not_allowed" });

  const user = await requireUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const organizationId = req.method === 'GET' ? req.query?.organizationId : req.body?.organizationId;
  if (typeof organizationId !== 'string' || !/^[0-9a-f-]{36}$/i.test(organizationId)) {
    return res.status(400).json({ error: "organization_required" });
  }

  try {
    const sql = database();
    if (req.method === 'POST') {
      const title = typeof req.body?.title === 'string' ? req.body.title.slice(0, 120) : null;
      const [, forms] = await sql.transaction((transaction) => [
        claimQuery(transaction, user.id),
        transaction`select * from runtu.create_radiography_form(${organizationId}, ${title})`,
      ]);
      return res.status(201).json({ form: forms[0] });
    }

    const [, forms] = await sql.transaction((transaction) => [
      claimQuery(transaction, user.id),
      transaction`
        select form_row.id, form_row.public_id, form_row.title, form_row.status,
               form_row.created_at, count(submission.id)::int as submissions
        from runtu.forms form_row
        left join runtu.form_submissions submission on submission.form_id = form_row.id
        where form_row.organization_id = ${organizationId}
        group by form_row.id
        order by form_row.created_at desc
      `,
    ]);
    return res.status(200).json({ forms });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    console.error("Forms control error", message);
    return res.status(message.includes('owner_required') ? 403 : 500).json({ error: message.includes('owner_required') ? 'owner_required' : 'forms_unavailable' });
  }
}

