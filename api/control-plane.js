import { requireUser } from "./_lib/auth.js";
import { claimQuery, database } from "./_lib/database.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: "method_not_allowed" });

  const user = await requireUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  try {
    const sql = database();
    if (req.method === "POST") {
      const requestedName = typeof req.body?.name === "string" ? req.body.name.slice(0, 100) : "Mi organización";
      const [, organizations] = await sql.transaction((transaction) => [
        claimQuery(transaction, user.id),
        transaction`select * from runtu.bootstrap_personal_organization(${requestedName})`,
      ]);
      return res.status(200).json({ organization: organizations[0] });
    }

    const [, organizations, memberships] = await sql.transaction((transaction) => [
      claimQuery(transaction, user.id),
      transaction`select id, name, slug, created_at from runtu.organizations order by created_at`,
      transaction`select organization_id, user_id, role, status from runtu.memberships order by created_at`,
    ]);
    return res.status(200).json({ organizations, memberships });
  } catch (error) {
    console.error("Control plane error", error instanceof Error ? error.message : String(error));
    return res.status(error?.message === "database_not_configured" ? 503 : 500).json({ error: "control_plane_unavailable" });
  }
}

