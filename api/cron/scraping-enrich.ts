import { createSupabaseAdmin } from "../../src/lib/scraping/supabase-server";
import { enrichBatch } from "../../src/lib/scraping/enrich";
import { json } from "../../src/lib/scraping/auth-helper";

export default async function handler(req: Request): Promise<Response> {
  // Auth: CRON_SECRET o Vercel cron header
  const auth = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1" || req.headers.get("x-vercel-cron");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}` && !isVercelCron) {
    return json({ error: "No autorizado" }, 401);
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return json({ error: "GEMINI_API_KEY no configurado" }, 500);

  try {
    const admin = createSupabaseAdmin();
    const updated = await enrichBatch(admin, geminiKey);
    return json({ ok: true, updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error en enrich";
    console.error("[cron/enrich] error:", msg);
    return json({ error: msg }, 500);
  }
}
