import { authenticateRequest, json } from "../../src/lib/scraping/auth-helper";
import { runJob } from "../../src/lib/scraping/orchestrator";
import type { ScrapingJobType, ScrapingPlatform } from "../../src/lib/scraping/types";
import { SUPPORTED_PLATFORMS } from "../../src/lib/scraping/actors";

export default async function handler(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if ("error" in auth) return json({ error: auth.error }, auth.status);
  const { businessId, admin } = auth;

  const url = new URL(req.url);
  const jobId = url.searchParams.get("id");

  // ===== GET =====
  if (req.method === "GET") {
    if (jobId) {
      // Detalle + mentions + narratives
      const { data: job } = await admin
        .from("scraping_jobs")
        .select("*")
        .eq("id", jobId)
        .eq("business_id", businessId)
        .single();
      if (!job) return json({ error: "Job no encontrado" }, 404);

      const [mentionsRes, narrativesRes, runsRes] = await Promise.all([
        admin
          .from("scraping_mentions")
          .select("id, platform, author, text, url, engagement, posted_at, sentiment, sentiment_score, topics")
          .eq("job_id", jobId)
          .order("posted_at", { ascending: false, nullsFirst: false })
          .limit(100),
        admin
          .from("scraping_narratives")
          .select("*")
          .eq("job_id", jobId)
          .order("growth_rate", { ascending: false })
          .limit(20),
        admin
          .from("scraping_runs")
          .select("id, platform, status, started_at, finished_at, items_count, error")
          .eq("job_id", jobId)
          .order("started_at", { ascending: false })
          .limit(10),
      ]);

      return json({
        job,
        mentions: mentionsRes.data ?? [],
        narratives: narrativesRes.data ?? [],
        runs: runsRes.data ?? [],
      });
    }

    // Lista
    const { data } = await admin
      .from("scraping_jobs")
      .select("*, scraping_mentions(count), scraping_narratives(count)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    return json({ jobs: data ?? [] });
  }

  // ===== POST =====
  if (req.method === "POST") {
    let body: { query?: string; type?: ScrapingJobType; platforms?: ScrapingPlatform[]; schedule?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "JSON inválido" }, 400);
    }

    const query = body.query?.trim();
    const type = body.type;
    const platforms = body.platforms ?? [];
    const schedule = body.schedule ?? "manual";

    if (!query) return json({ error: "Query requerido" }, 400);
    if (!type || !["hashtag", "account", "keyword"].includes(type)) return json({ error: "Type inválido" }, 400);
    if (!platforms.length) return json({ error: "Selecciona al menos una plataforma" }, 400);
    for (const p of platforms) {
      if (!SUPPORTED_PLATFORMS.includes(p)) return json({ error: `Plataforma no soportada: ${p}` }, 400);
    }

    const { data: job, error } = await admin
      .from("scraping_jobs")
      .insert({
        business_id: businessId,
        query,
        type,
        platforms,
        schedule,
        status: "active",
      })
      .select("*")
      .single();

    if (error || !job) return json({ error: error?.message ?? "Error creando job" }, 500);

    // Dispara el primer run en background (sin await para responder rápido)
    const apifyToken = process.env.APIFY_TOKEN;
    if (apifyToken) {
      const webhookSecret = process.env.APIFY_WEBHOOK_SECRET;
      const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
      const proto = req.headers.get("x-forwarded-proto") ?? "https";
      const webhookUrl = host ? `${proto}://${host}/api/scraping/webhook` : undefined;

      runJob(job, { supabase: admin, apifyToken, webhookUrl, webhookSecret }).catch((err) => {
        console.error("[jobs POST] runJob error:", err);
      });
    }

    return json({ job }, 201);
  }

  // ===== PATCH =====
  if (req.method === "PATCH") {
    if (!jobId) return json({ error: "id requerido" }, 400);
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    if (body.status && ["active", "paused"].includes(body.status)) patch.status = body.status;
    if (body.schedule && ["manual", "hourly", "daily"].includes(body.schedule)) patch.schedule = body.schedule;

    const { data, error } = await admin
      .from("scraping_jobs")
      .update(patch)
      .eq("id", jobId)
      .eq("business_id", businessId)
      .select("*")
      .single();

    if (error || !data) return json({ error: error?.message ?? "No se pudo actualizar" }, 500);
    return json({ job: data });
  }

  // ===== DELETE =====
  if (req.method === "DELETE") {
    if (!jobId) return json({ error: "id requerido" }, 400);
    const { error } = await admin
      .from("scraping_jobs")
      .delete()
      .eq("id", jobId)
      .eq("business_id", businessId);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: "Método no permitido" }, 405);
}
