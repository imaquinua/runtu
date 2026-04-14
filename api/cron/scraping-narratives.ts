import { createSupabaseAdmin } from "../../src/lib/scraping/supabase-server";
import { clusterNarratives } from "../../src/lib/scraping/narratives";
import { json } from "../../src/lib/scraping/auth-helper";

export default async function handler(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1" || req.headers.get("x-vercel-cron");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}` && !isVercelCron) {
    return json({ error: "No autorizado" }, 401);
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return json({ error: "GEMINI_API_KEY no configurado" }, 500);

  try {
    const admin = createSupabaseAdmin();

    // Limpia narrativas viejas (> 7 días sin actividad) para evitar acumulación
    await admin
      .from("scraping_narratives")
      .delete()
      .lt("last_seen_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Para cada job activo, corre clustering
    const { data: jobs } = await admin
      .from("scraping_jobs")
      .select("id")
      .eq("status", "active");

    let totalNarratives = 0;
    let totalAlerts = 0;
    for (const job of jobs ?? []) {
      try {
        const { narrativesCreated, alertsCreated } = await clusterNarratives(admin, geminiKey, job.id);
        totalNarratives += narrativesCreated;
        totalAlerts += alertsCreated;
      } catch (err) {
        console.error(`[narratives] job ${job.id} failed:`, err);
      }
    }

    return json({ ok: true, narratives: totalNarratives, alerts: totalAlerts, jobs: jobs?.length ?? 0 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error en narratives";
    return json({ error: msg }, 500);
  }
}
