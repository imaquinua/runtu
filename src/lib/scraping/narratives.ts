import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SupabaseClient } from "@supabase/supabase-js";

const SIMILARITY_THRESHOLD = 0.82;
const MIN_CLUSTER_SIZE = 3;
const SPIKE_THRESHOLD = 3.0;
const SIGNIFICANT_SENTIMENT = 0.3;

interface MentionRow {
  id: string;
  text: string;
  sentiment_score: number;
  embedding: number[];
  posted_at: string;
  platform: string;
  author: string | null;
}

interface Cluster {
  centroid: number[];
  mentions: MentionRow[];
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function avgVectors(vectors: number[][]): number[] {
  const n = vectors[0].length;
  const out = new Array(n).fill(0);
  for (const v of vectors) for (let i = 0; i < n; i++) out[i] += v[i];
  for (let i = 0; i < n; i++) out[i] /= vectors.length;
  return out;
}

/**
 * Greedy clustering sobre embeddings. Similarity > 0.82 = mismo cluster.
 */
function clusterMentions(mentions: MentionRow[]): Cluster[] {
  const clusters: Cluster[] = [];
  for (const m of mentions) {
    let assigned = false;
    for (const c of clusters) {
      if (cosineSim(m.embedding, c.centroid) > SIMILARITY_THRESHOLD) {
        c.mentions.push(m);
        c.centroid = avgVectors(c.mentions.map((mm) => mm.embedding));
        assigned = true;
        break;
      }
    }
    if (!assigned) clusters.push({ centroid: [...m.embedding], mentions: [m] });
  }
  return clusters.filter((c) => c.mentions.length >= MIN_CLUSTER_SIZE);
}

const NARRATIVE_PROMPT = `Eres analista de marca. Te paso menciones que hablan de lo mismo.

Devuelve JSON:
{
  "title": "título corto y claro (max 60 chars) en español LATAM",
  "summary": "qué están diciendo, en 1-2 frases directas (max 200 chars)"
}

Sé específico, no genérico. "Quejas por envío tardío a provincia" es mejor que "Problemas logísticos".`;

async function describeNarrative(
  geminiKey: string,
  sample: MentionRow[]
): Promise<{ title: string; summary: string }> {
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" },
  });
  const userMsg = sample
    .slice(0, 10)
    .map((m, i) => `${i + 1}. [${m.platform}] ${m.text.slice(0, 300)}`)
    .join("\n");

  try {
    const res = await model.generateContent([{ text: NARRATIVE_PROMPT }, { text: userMsg }]);
    const parsed = JSON.parse(res.response.text());
    return {
      title: String(parsed.title ?? "Narrativa").slice(0, 80),
      summary: String(parsed.summary ?? "").slice(0, 300),
    };
  } catch {
    return {
      title: sample[0]?.text.slice(0, 60) ?? "Narrativa",
      summary: `${sample.length} menciones relacionadas`,
    };
  }
}

function computeGrowthRate(mentions: MentionRow[]): number {
  const now = Date.now();
  const sixHoursAgo = now - 6 * 60 * 60 * 1000;
  const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
  const recent = mentions.filter((m) => new Date(m.posted_at).getTime() > sixHoursAgo).length;
  const previous = mentions.filter((m) => {
    const t = new Date(m.posted_at).getTime();
    return t > twelveHoursAgo && t <= sixHoursAgo;
  }).length;
  if (previous === 0) return recent > 0 ? recent : 1;
  return recent / previous;
}

/**
 * Cluster las menciones de un job, genera narrativas con Gemini,
 * y crea alertas si hay spikes.
 */
export async function clusterNarratives(
  supabase: SupabaseClient,
  geminiKey: string,
  jobId: string,
  windowHours = 24
): Promise<{ narrativesCreated: number; alertsCreated: number }> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  const { data: mentions, error } = await supabase
    .from("scraping_mentions")
    .select("id, text, sentiment_score, embedding, posted_at, platform, author")
    .eq("job_id", jobId)
    .not("embedding", "is", null)
    .gte("posted_at", since);

  if (error) throw error;
  if (!mentions || mentions.length < MIN_CLUSTER_SIZE) {
    return { narrativesCreated: 0, alertsCreated: 0 };
  }

  // El embedding viene como string de pgvector, parsearlo
  const parsed: MentionRow[] = mentions.map((m) => ({
    ...m,
    embedding: typeof m.embedding === "string"
      ? JSON.parse(m.embedding.replace(/^\[/, "[").replace(/\]$/, "]"))
      : m.embedding,
  }));

  const clusters = clusterMentions(parsed);
  let narrativesCreated = 0;
  let alertsCreated = 0;

  // Info del job para alertas
  const { data: jobRow } = await supabase
    .from("scraping_jobs")
    .select("business_id, query")
    .eq("id", jobId)
    .single();

  for (const cluster of clusters) {
    const { title, summary } = await describeNarrative(geminiKey, cluster.mentions);
    const avgSentiment = cluster.mentions.reduce((s, m) => s + (m.sentiment_score ?? 0), 0) / cluster.mentions.length;
    const growthRate = computeGrowthRate(cluster.mentions);
    const startedAt = cluster.mentions.reduce((min, m) => (m.posted_at < min ? m.posted_at : min), cluster.mentions[0].posted_at);
    const lastSeenAt = cluster.mentions.reduce((max, m) => (m.posted_at > max ? m.posted_at : max), cluster.mentions[0].posted_at);

    const { data: inserted } = await supabase
      .from("scraping_narratives")
      .insert({
        job_id: jobId,
        title,
        summary,
        sentiment_score: avgSentiment,
        mention_count: cluster.mentions.length,
        growth_rate: growthRate,
        started_at: startedAt,
        last_seen_at: lastSeenAt,
        centroid_embedding: JSON.stringify(cluster.centroid),
        sample_mention_ids: cluster.mentions.slice(0, 5).map((m) => m.id),
      })
      .select("id")
      .single();

    if (inserted) narrativesCreated++;

    // Spike → alerta
    if (
      jobRow &&
      growthRate > SPIKE_THRESHOLD &&
      Math.abs(avgSentiment) > SIGNIFICANT_SENTIMENT &&
      cluster.mentions.length >= 5
    ) {
      const isNegative = avgSentiment < 0;
      await supabase.from("alerts").insert({
        business_id: jobRow.business_id,
        type: isNegative ? "anomaly" : "insight",
        severity: growthRate > 5 ? "high" : "medium",
        title: isNegative ? `🚨 Spike negativo: ${title}` : `📈 Tendencia positiva: ${title}`,
        message: `${summary} — ${cluster.mentions.length} menciones, creciendo ${growthRate.toFixed(1)}x en 6h.`,
        source: "scraping_narrative",
        source_id: inserted?.id,
        metadata: { query: jobRow.query, growth_rate: growthRate, sentiment_score: avgSentiment },
      });
      alertsCreated++;
    }
  }

  return { narrativesCreated, alertsCreated };
}
