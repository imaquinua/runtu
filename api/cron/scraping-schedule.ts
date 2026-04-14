import { createSupabaseAdmin } from "../../src/lib/scraping/supabase-server";
import { runJob } from "../../src/lib/scraping/orchestrator";
import { json } from "../../src/lib/scraping/auth-helper";
import type { ScrapingJob } from "../../src/lib/scraping/types";

export default async function handler(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1" || req.headers.get("x-vercel-cron");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}` && !isVercelCron) {
    return json({ error: "No autorizado" }, 401);
  }

  const apifyToken = process.env.APIFY_TOKEN;
  if (!apifyToken) return json({ error: "APIFY_TOKEN no configurado" }, 500);

  const admin = createSupabaseAdmin();

  // Jobs listos para correr (next_run_at pasado y status=active)
  const { data: jobs } = await admin
    .from("scraping_jobs")
    .select("*")
    .eq("status", "active")
    .lte("next_run_at", new Date().toISOString())
    .neq("schedule", "manual")
    .limit(10);

  const webhookSecret = process.env.APIFY_WEBHOOK_SECRET;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const webhookUrl = host ? `${proto}://${host}/api/scraping/webhook` : undefined;

  let launched = 0;
  const errors: string[] = [];
  for (const job of jobs ?? []) {
    try {
      const { runs } = await runJob(job as ScrapingJob, {
        supabase: admin,
        apifyToken,
        webhookUrl,
        webhookSecret,
      });
      launched += runs;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error";
      errors.push(`${job.id}: ${msg}`);
    }
  }

  return json({ ok: true, launched, errors, checked: jobs?.length ?? 0 });
}
