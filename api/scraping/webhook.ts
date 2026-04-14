import { createSupabaseAdmin } from "../../src/lib/scraping/supabase-server";
import { ingestRun } from "../../src/lib/scraping/orchestrator";
import { json } from "../../src/lib/scraping/auth-helper";

/**
 * Endpoint que recibe webhooks de Apify cuando un run termina.
 * Apify envía POST con el evento + resource (run metadata).
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  // Verifica secret
  const secret = req.headers.get("x-apify-webhook-secret");
  const expected = process.env.APIFY_WEBHOOK_SECRET;
  if (expected && secret !== expected) return json({ error: "Secret inválido" }, 401);

  let payload: {
    eventType?: string;
    eventData?: { actorRunId?: string };
    resource?: { id?: string; defaultDatasetId?: string; status?: string };
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const runId = payload.resource?.id ?? payload.eventData?.actorRunId;
  const datasetId = payload.resource?.defaultDatasetId;
  const status = payload.resource?.status;

  if (!runId) return json({ error: "Sin runId" }, 400);

  const apifyToken = process.env.APIFY_TOKEN;
  if (!apifyToken) return json({ error: "APIFY_TOKEN no configurado" }, 500);

  const admin = createSupabaseAdmin();

  // Si el run falló, actualiza status y termina
  if (status !== "SUCCEEDED" || !datasetId) {
    await admin
      .from("scraping_runs")
      .update({
        status: status === "TIMED-OUT" ? "timed-out" : "failed",
        finished_at: new Date().toISOString(),
        error: `Apify status: ${status}`,
      })
      .eq("apify_run_id", runId);
    return json({ ok: true, status });
  }

  try {
    const { inserted, skipped } = await ingestRun(runId, datasetId, { supabase: admin, apifyToken });
    return json({ ok: true, inserted, skipped });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error en ingest";
    console.error("[webhook] error:", msg);
    return json({ error: msg }, 500);
  }
}
