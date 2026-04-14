import type { SupabaseClient } from "@supabase/supabase-js";
import { startActorRun, fetchDatasetItems } from "./apify";
import { getActorForPlatform } from "./actors";
import { normalize, dedupe } from "./normalize";
import type { ScrapingPlatform, ScrapingJob, ScrapingJobType, NormalizedMention } from "./types";

interface RunJobOptions {
  supabase: SupabaseClient;
  apifyToken: string;
  webhookUrl?: string;
  webhookSecret?: string;
}

/**
 * Lanza un job: por cada plataforma, lanza un actor de Apify y registra el run.
 */
export async function runJob(job: ScrapingJob, opts: RunJobOptions): Promise<{ runs: number; errors: string[] }> {
  const errors: string[] = [];
  let runs = 0;

  for (const platform of job.platforms) {
    const actor = getActorForPlatform(platform, job.query, job.type);
    if (!actor) { errors.push(`Plataforma no soportada: ${platform}`); continue; }

    try {
      const apifyRun = await startActorRun(opts.apifyToken, {
        actorId: actor.actorId,
        input: actor.input,
        webhookUrl: opts.webhookUrl,
        webhookSecret: opts.webhookSecret,
      });

      await opts.supabase.from("scraping_runs").insert({
        job_id: job.id,
        apify_run_id: apifyRun.id,
        actor_id: actor.actorId,
        platform,
        status: "running",
      });

      runs++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      errors.push(`${platform}: ${msg}`);
      await opts.supabase.from("scraping_runs").insert({
        job_id: job.id,
        actor_id: actor.actorId,
        platform,
        status: "failed",
        error: msg,
        finished_at: new Date().toISOString(),
      });
    }
  }

  const nextRun = job.schedule === "hourly"
    ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
    : job.schedule === "daily"
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : null;

  await opts.supabase
    .from("scraping_jobs")
    .update({
      last_run_at: new Date().toISOString(),
      next_run_at: nextRun,
      status: runs > 0 ? "active" : "error",
    })
    .eq("id", job.id);

  return { runs, errors };
}

/**
 * Ingesta los items de un run de Apify completado (llamado desde webhook).
 */
export async function ingestRun(
  apifyRunId: string,
  datasetId: string,
  opts: { supabase: SupabaseClient; apifyToken: string }
): Promise<{ inserted: number; skipped: number }> {
  // Busca el run en la BD
  const { data: run } = await opts.supabase
    .from("scraping_runs")
    .select("id, job_id, platform")
    .eq("apify_run_id", apifyRunId)
    .single();

  if (!run) throw new Error(`No se encontró run ${apifyRunId} en la BD`);

  // Trae items del dataset
  const items = await fetchDatasetItems(opts.apifyToken, datasetId, 100);

  // Normaliza
  const normalized: Array<NormalizedMention & { platform: ScrapingPlatform }> = [];
  for (const item of items) {
    const n = normalize(run.platform as ScrapingPlatform, item as Record<string, unknown>);
    if (n) normalized.push({ ...n, platform: run.platform as ScrapingPlatform });
  }

  const unique = dedupe(normalized);
  let inserted = 0;
  let skipped = 0;

  // Inserta en bulk, ignorando duplicados (onConflict)
  if (unique.length > 0) {
    const rows = unique.map((m) => ({
      job_id: run.job_id,
      run_id: run.id,
      platform: m.platform,
      external_id: m.external_id,
      author: m.author,
      text: m.text,
      url: m.url,
      engagement: m.engagement,
      posted_at: m.posted_at,
      raw: m.raw,
    }));

    const { data, error } = await opts.supabase
      .from("scraping_mentions")
      .upsert(rows, { onConflict: "platform,external_id", ignoreDuplicates: true })
      .select("id");

    if (error) throw error;
    inserted = data?.length ?? 0;
    skipped = unique.length - inserted;
  }

  // Actualiza el run como succeeded
  await opts.supabase
    .from("scraping_runs")
    .update({
      status: "succeeded",
      finished_at: new Date().toISOString(),
      items_count: inserted,
    })
    .eq("id", run.id);

  return { inserted, skipped };
}
