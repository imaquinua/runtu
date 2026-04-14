/**
 * Cliente minimalista de Apify usando fetch nativo (compatible Edge y Node).
 * Docs: https://docs.apify.com/api/v2
 */

const APIFY_BASE = "https://api.apify.com/v2";

export interface ApifyRunStartResponse {
  id: string;
  actId: string;
  status: string;
  defaultDatasetId: string;
  startedAt: string;
}

export interface ApifyDatasetItem {
  [key: string]: unknown;
}

export interface StartRunOptions {
  actorId: string;
  input: Record<string, unknown>;
  webhookUrl?: string;
  webhookSecret?: string;
  timeoutSecs?: number;
}

/**
 * Lanza un run de un actor. Devuelve el runId + datasetId para fetch posterior.
 */
export async function startActorRun(token: string, opts: StartRunOptions): Promise<ApifyRunStartResponse> {
  const webhooks = opts.webhookUrl
    ? [
        {
          eventTypes: ["ACTOR.RUN.SUCCEEDED", "ACTOR.RUN.FAILED", "ACTOR.RUN.TIMED_OUT"],
          requestUrl: opts.webhookUrl,
          headersTemplate: opts.webhookSecret
            ? JSON.stringify({ "X-Apify-Webhook-Secret": opts.webhookSecret })
            : undefined,
          payloadTemplate: JSON.stringify({
            userId: "{{userId}}",
            createdAt: "{{createdAt}}",
            eventType: "{{eventType}}",
            eventData: "{{eventData}}",
            resource: "{{resource}}",
          }),
        },
      ]
    : undefined;

  const qs = webhooks ? `?webhooks=${encodeURIComponent(btoa(JSON.stringify(webhooks)))}` : "";
  const url = `${APIFY_BASE}/acts/${encodeURIComponent(opts.actorId)}/runs${qs}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...opts.input,
      timeoutSecs: opts.timeoutSecs ?? 180,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Apify startActorRun failed (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.data as ApifyRunStartResponse;
}

/**
 * Lee items del dataset de un run completado.
 */
export async function fetchDatasetItems(token: string, datasetId: string, limit = 100): Promise<ApifyDatasetItem[]> {
  const res = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items?limit=${limit}&format=json&clean=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Apify fetchDatasetItems failed: ${res.status}`);
  return res.json();
}

/**
 * Consulta el estado de un run (por si el webhook no llegó).
 */
export async function getRunStatus(token: string, runId: string) {
  const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Apify getRunStatus failed: ${res.status}`);
  const data = await res.json();
  return data.data as {
    id: string;
    status: string;
    defaultDatasetId: string;
    finishedAt: string | null;
    stats: { outputBodyLen?: number; resurrectCount?: number };
  };
}
